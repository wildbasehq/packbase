import clerkClient from '@/db/auth'
import Debug from 'debug'
import {LRUCache} from 'lru-cache'

const debug = Debug('vg:clerk')

// Cache for Clerk user data to prevent repeated API calls
interface ClerkUserCacheEntry {
    user: any;
    cachedAt: number;
}

export class ClerkService {
    private static instance: ClerkService
    private userCache: LRUCache<string, ClerkUserCacheEntry>

    private constructor() {
        this.userCache = new LRUCache({
            max: 5000, // Cache up to 5000 users
            ttl: 5 * 60 * 1000, // 5 minutes TTL
        })
    }

    public static getInstance(): ClerkService {
        if (!ClerkService.instance) {
            ClerkService.instance = new ClerkService()
        }
        return ClerkService.instance
    }

    /**
     * Get a Clerk user by ID with caching to prevent N+1 queries
     */
    public async getUserById(id: string): Promise<any> {
        const cached = this.userCache.get(id)
        const now = Date.now()

        // Return cached data if it's still valid
        if (cached && (now - cached.cachedAt) < (5 * 60 * 1000)) {
            debug(`Cache hit for user ${id}`)
            return cached.user
        }

        try {
            debug(`Fetching user ${id} from Clerk API`)
            const user = await clerkClient.users.getUser(id)

            // Cache the result
            this.userCache.set(id, {
                user,
                cachedAt: now,
            })

            return user
        } catch (error) {
            debug(`Failed to fetch user ${id}:`, error)

            // Return cached data if available, even if expired, as a fallback
            if (cached) {
                debug(`Returning expired cache for user ${id} as fallback`)
                return cached.user
            }

            throw error
        }
    }

    /**
     * Batch get multiple users by ID to optimize N+1 scenarios
     */
    public async getUsersByIds(ids: string[]): Promise<Map<string, any>> {
        const results = new Map<string, any>()
        const uncachedIds: string[] = []
        const now = Date.now()

        // Check cache first
        for (const id of ids) {
            const cached = this.userCache.get(id)
            if (cached && (now - cached.cachedAt) < (5 * 60 * 1000)) {
                results.set(id, cached.user)
                debug(`Cache hit for user ${id}`)
            } else {
                uncachedIds.push(id)
            }
        }

        // Fetch uncached users in parallel
        if (uncachedIds.length > 0) {
            debug(`Fetching ${uncachedIds.length} users from Clerk API`)

            const fetchPromises = uncachedIds.map(async (id) => {
                try {
                    const user = await clerkClient.users.getUser(id)

                    // Cache the result
                    this.userCache.set(id, {
                        user,
                        cachedAt: now,
                    })

                    return {id, user}
                } catch (error) {
                    debug(`Failed to fetch user ${id}:`, error)

                    // Check for expired cache as fallback
                    const cached = this.userCache.get(id)
                    if (cached) {
                        debug(`Using expired cache for user ${id} as fallback`)
                        return {id, user: cached.user}
                    }

                    return {id, user: null}
                }
            })

            const fetchResults = await Promise.all(fetchPromises)

            fetchResults.forEach(({id, user}) => {
                if (user) {
                    results.set(id, user)
                }
            })
        }

        return results
    }

    /**
     * Clear cache for a specific user (useful after user updates)
     */
    public clearUserCache(id: string): void {
        this.userCache.delete(id)
        debug(`Cleared cache for user ${id}`)
    }

    /**
     * Clear all cached users
     */
    public clearAllCache(): void {
        this.userCache.clear()
        debug('Cleared all user cache')
    }

    /**
     * Get cache statistics for monitoring
     */
    public getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
        return {
            size: this.userCache.size,
            maxSize: this.userCache.max || 0,
        }
    }
}

// Legacy compatibility function for existing code
export async function getUserClerkByID(id: string): Promise<any> {
    const clerkService = ClerkService.getInstance()
    return clerkService.getUserById(id)
}

// Export the service instance for direct usage
export const clerkService = ClerkService.getInstance()