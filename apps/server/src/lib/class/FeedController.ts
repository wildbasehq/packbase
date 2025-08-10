import {HTTPError} from '@/lib/class/HTTPError'
import posthog, {distinctId} from '@/utils/posthog'
import getIDTypeDefault from '@/utils/get-id-type'
import {BulkPostLoader} from '@/lib/class/BulkPostLoader'
import prisma from '@/db/prisma'

/**
 * FeedController with integrated bulk post loading
 */
export class FeedController {
    // Cache storage
    public static readonly followingCache = new Map<string, any[] | null>()
    public static readonly packCache = new Map<string, any[] | null>()
    public static readonly homeFeedCache = new Map<string, { data: any[]; expires_after: number }>()
    public static readonly userFeedCache = new Map<string, { data: any[]; expires_after: number }>()
    public static readonly packFeedCache = new Map<string, { data: any[]; expires_after: number }>()

    // Constants
    private static readonly ITEMS_PER_PAGE = 10
    private static readonly CACHE_EXPIRY = 1000 * 60 * 5 // 5 minutes

    constructor(
        private readonly getIDType: (id: string) => Promise<number> = getIDTypeDefault,
        private readonly bulkPostLoader: BulkPostLoader = new BulkPostLoader()
    ) {
    }

    /**
     * Get feed data based on feed type and parameters
     */
    async getFeed(feedId: string, userId: string, page: number = 1): Promise<{ data: any[]; has_more: boolean }> {
        const timer = Date.now()

        // Handle universe ID
        if (feedId === 'universe') {
            feedId = '00000000-0000-0000-0000-000000000000'
        }

        try {
            let result

            // Determine feed type and process accordingly
            if (feedId === 'universe:home') {
                result = await this.getHomeFeed(userId, page)
            } else {
                const idType = feedId.startsWith('00000000') ? 1 : await this.getIDType(feedId)

                if (idType === 1) {
                    // Pack feed
                    result = await this.getPackFeed(feedId, page)
                } else {
                    // User feed (default)
                    result = await this.getUserFeed(feedId, page)
                }
            }

            // Track analytics
            this.trackFeedView(feedId, timer, page, result.data.length)

            return result
        } catch (error) {
            throw HTTPError.fromError(error, `Failed to fetch feed: ${feedId}`)
        }
    }

    /**
     * Get user's home feed using bulk loading
     */
    async getHomeFeed(userId: string, page: number): Promise<{ data: any[]; has_more: boolean }> {
        // Check cache for this page
        const cacheKey = `home:${userId}:${page}`

        try {
            // Get user's following and packs in parallel
            const [following, packs] = await Promise.all([
                this.getUserFollowing(userId),
                this.getUserPacks(userId)
            ])

            // Get IDs to filter by
            const followingIds = following.map(f => f.following_id)
            followingIds.push(userId) // Include user's own posts
            const packIds = packs.map(p => p.tenant_id)

            // Build query to get post IDs using Prisma
            const itemsPerPage = FeedController.ITEMS_PER_PAGE
            const skip = (page - 1) * itemsPerPage

            // Create where clause based on following and packs
            const whereClause: any = {
                content_type: { not: 'howling_alongside' }
            }

            if (followingIds.length > 0 || packIds.length > 0) {
                whereClause.OR = []
                
                if (followingIds.length > 0) {
                    whereClause.OR.push({ user_id: { in: followingIds } })
                }
                
                if (packIds.length > 0) {
                    whereClause.OR.push({ tenant_id: { in: packIds } })
                }
            }

            // Get paginated post IDs using Prisma
            const postIdData = await prisma.posts.findMany({
                select: { id: true, created_at: true },
                where: whereClause,
                orderBy: { created_at: 'desc' },
                skip,
                take: itemsPerPage
            })

            // Process post IDs and load full post data
            const result = await this.processPostIds(postIdData)

            // Cache the results
            FeedController.homeFeedCache.set(cacheKey, {
                data: result.data,
                expires_after: Date.now() + FeedController.CACHE_EXPIRY
            })

            return result
        } catch (error) {
            throw HTTPError.validation({
                summary: 'Error fetching home feed',
                error
            })
        }
    }

    /**
     * Get feed posts from a specific user using bulk loading
     */
    async getUserFeed(userId: string, page: number): Promise<{ data: any[]; has_more: boolean }> {
        // Check cache
        const cacheKey = `user:${userId}:${page}`

        try {
            // Get paginated post IDs for this user
            const postIdData = await prisma.posts.findMany({
                select: { id: true, created_at: true },
                where: {
                    user_id: userId,
                    content_type: { not: 'howling_alongside' }
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * FeedController.ITEMS_PER_PAGE,
                take: FeedController.ITEMS_PER_PAGE
            })

            // Process post IDs and load full post data
            const result = await this.processPostIds(postIdData)

            // Cache the result
            FeedController.userFeedCache.set(cacheKey, {
                data: result.data,
                expires_after: Date.now() + FeedController.CACHE_EXPIRY
            })

            return result
        } catch (error) {
            throw HTTPError.validation({
                summary: 'Error fetching user feed',
                error
            })
        }
    }

    /**
     * Get feed posts from a specific pack using bulk loading
     */
    async getPackFeed(packId: string, page: number): Promise<{ data: any[]; has_more: boolean }> {
        // Check cache
        const cacheKey = `pack:${packId}:${page}`

        try {
            const itemsPerPage = FeedController.ITEMS_PER_PAGE;
            
            // Get paginated post IDs for this pack using Prisma
            const postIdData = await prisma.posts.findMany({
                select: { id: true, created_at: true },
                where: {
                    content_type: { not: 'howling_alongside' },
                    ...(packId !== '00000000-0000-0000-0000-000000000000' ? { tenant_id: packId } : {})
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * itemsPerPage,
                take: itemsPerPage
            });

            // Process post IDs and load full post data
            const result = await this.processPostIds(postIdData);

            // Cache the result
            FeedController.packFeedCache.set(cacheKey, {
                data: result.data,
                expires_after: Date.now() + FeedController.CACHE_EXPIRY
            });

            return result;
        } catch (error) {
            throw HTTPError.validation({
                summary: 'Error fetching pack feed',
                error
            });
        }
    }

    /**
     * Process post IDs into full post data
     * This helper method eliminates code duplication across different feed types
     */
    private async processPostIds(postIdData: any[] | null): Promise<{ data: any[]; has_more: boolean }> {
        if (!postIdData?.length) {
            return {data: [], has_more: false}
        }

        // Extract post IDs
        const postIds = postIdData.map(post => post.id)

        // Load all posts in bulk
        const postsMap = await this.bulkPostLoader.loadPosts(postIds)

        // Maintain original order
        const posts = postIds
            .map(id => postsMap[id])
            .filter(post => post !== undefined)

        return {
            data: posts,
            has_more: posts.length === FeedController.ITEMS_PER_PAGE
        }
    }

    /**
     * Get list of users the current user is following (with caching)
     */
    private async getUserFollowing(userId: string): Promise<any[]> {
        // Check cache first
        if (FeedController.followingCache.has(userId)) {
            return FeedController.followingCache.get(userId) || []
        }

        try {
            // Fetch from database using Prisma
            const data = await prisma.profiles_followers.findMany({
                select: { following_id: true },
                where: { user_id: userId }
            })

            // Update cache
            FeedController.followingCache.set(userId, data || [])

            return data || []
        } catch (error) {
            throw HTTPError.validation({
                summary: 'Failed to fetch user following data',
                error
            })
        }
    }

    /**
     * Get list of packs the current user is a member of (with caching)
     */
    private async getUserPacks(userId: string): Promise<any[]> {
        // Check cache first
        if (FeedController.packCache.has(userId)) {
            return FeedController.packCache.get(userId) || []
        }

        try {
            // Fetch from database using Prisma
            const data = await prisma.packs_memberships.findMany({
                select: { tenant_id: true },
                where: { user_id: userId }
            })

            // Update cache
            FeedController.packCache.set(userId, data || [])

            return data || []
        } catch (error) {
            throw HTTPError.validation({
                summary: 'Failed to fetch user pack memberships',
                error
            })
        }
    }

    /**
     * Track feed view in analytics
     */
    private trackFeedView(feedId: string, startTime: number, page: number, postCount: number): void {
        posthog.capture({
            distinctId: distinctId,
            event: 'Viewed Feed',
            properties: {
                feed_id: feedId,
                fetch_time: Date.now() - startTime,
                page: Number(page),
                post_count: postCount
            },
        })
    }

    /**
     * Clear all caches related to a specific user
     */
    static clearUserCache(userId: string): void {
        FeedController.followingCache.delete(userId)
        FeedController.packCache.delete(userId);

        // Clear related feed caches
        [FeedController.homeFeedCache, FeedController.userFeedCache].forEach(cache => {
            cache.forEach((_, key) => {
                if (key.includes(userId)) {
                    cache.delete(key)
                }
            })
        })
    }

    /**
     * Clear all caches related to a specific pack
     */
    static clearPackCache(packId: string): void {
        // Clear pack feed cache
        FeedController.packFeedCache.forEach((_, key) => {
            if (key.includes(packId)) {
                FeedController.packFeedCache.delete(key)
            }
        })
    }

    /**
     * Set up cache cleanup interval
     */
    static setupCacheCleanup(interval = 30000): NodeJS.Timeout {
        return setInterval(() => {
            const now = Date.now();

            // Clean up all caches
            [
                FeedController.homeFeedCache,
                FeedController.userFeedCache,
                FeedController.packFeedCache
            ].forEach(cache => {
                cache.forEach((value, key) => {
                    if (value.expires_after < now) {
                        cache.delete(key)
                    }
                })
            })
        }, interval)
    }
}

// Initialize cache cleanup
FeedController.setupCacheCleanup(60000)