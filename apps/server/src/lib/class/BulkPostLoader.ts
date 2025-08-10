import prisma from '@/db/prisma'
import getClerkAvatar from '@/utils/get-clerk-avatar'

/**
 * BulkPostLoader - Efficiently loads multiple posts with a single query
 */
export class BulkPostLoader {
    constructor() {
    }

    /**
     * Load multiple posts with a single query, including user data and reactions
     *
     * @param postIds Array of post IDs to fetch
     * @returns Object mapping post IDs to their complete data
     */
    async loadPosts(postIds: string[]): Promise<Record<string, any>> {
        if (!postIds.length) return {}

        try {
            // First, fetch the posts with minimal related data
            const posts = await prisma.posts.findMany({
                where: {
                    id: {in: postIds}
                },
            })

            if (!posts?.length) return {}

            // Create a map of post IDs to their data
            const postsMap: Record<string, any> = {}
            posts.forEach(post => {
                postsMap[post.id] = {
                    ...post,
                    created_at: post.created_at.toISOString(),
                    reactions: {},
                    comments: []
                }
            })

            // Collect all user_ids, tenant_ids, and channel_ids
            const userIds = [...new Set(posts.map(post => post.user_id).filter(Boolean))]
            const tenantIds = [...new Set(posts.map(post => post.tenant_id).filter(Boolean))]
            const channelds = [...new Set(posts.map(post => post.channel_id).filter(Boolean))]

            // Fetch profiles for post authors in parallel
            const profilesPromise = this.fetchProfiles(userIds)

            // Fetch reactions for posts in parallel
            const reactionsPromise = this.fetchReactions(postIds)

            // Fetch comments for posts in parallel
            const commentsPromise = this.fetchComments(postIds)

            // Fetch packs for posts in parallel
            const packsPromise = this.fetchPacks(tenantIds)

            // Fetch pages for posts in parallel
            const channelPromise = this.fetchPages(channelds)

            // Wait for all data to be fetched
            const [profiles, reactions, comments, packs, channels] = await Promise.all([
                profilesPromise,
                reactionsPromise,
                commentsPromise,
                packsPromise,
                channelPromise
            ])

            // Process user profiles
            const userMap: Record<string, any> = {}
            profiles.forEach(profile => {
                userMap[profile.id] = {
                    id: profile.id,
                    username: profile.username,
                    type: profile.type,
                    display_name: profile.display_name,
                    badge: profile.badge,
                    about: {
                        bio: profile.bio
                    },
                    images: {
                        avatar: profile.images_avatar,
                        header: profile.images_header
                    }
                }
            })

            // Process pack data
            const packMap: Record<string, any> = {}
            packs.forEach(pack => {
                packMap[pack.id] = {
                    ...pack,
                    created_at: pack.created_at.toISOString(),
                }
            })

            // Process page data
            const channelMap: Record<string, any> = {}
            channels.forEach(channel => {
                channelMap[channel.id] = {
                    id: channel.id,
                    title: channel.title,
                    slug: channel.slug,
                    description: channel.description,
                    icon: channel.icon
                }
            })

            // Organize reactions by post ID and slot
            reactions.forEach(reaction => {
                const post = postsMap[reaction.post_id]
                if (post) {
                    const slot = reaction.slot.toString()
                    if (!post.reactions[slot]) {
                        post.reactions[slot] = []
                    }
                    post.reactions[slot].push(reaction.actor_id)
                }
            })

            // Organize comments by post ID
            for (const comment of comments) {
                const post = postsMap[comment.parent]
                if (post) {
                    let userProfile = userMap[comment.user_id] || (await this.fetchProfiles([comment.user_id]))[0] || this.createDeletedUserProfile(comment.user_id)
                    if (!userMap[userProfile.id]) {
                        userProfile = {
                            id: userProfile.id,
                            username: userProfile.username,
                            display_name: userProfile.display_name,
                            about: {
                                bio: userProfile.bio
                            },
                            images: {
                                avatar: userProfile.images_avatar,
                                header: userProfile.images_header
                            }
                        }

                        userMap[userProfile.id] = userProfile
                    }

                    post.comments.push({
                        id: comment.id,
                        body: comment.body,
                        created_at: comment.created_at.toISOString(),
                        user: userProfile
                    })
                }
            }

            // Finalize post data
            Object.values(postsMap).forEach((post: any) => {
                // Add user data
                post.user = userMap[post.user_id] || this.createDeletedUserProfile(post.user_id)
                delete post.user_id

                // Add pack data
                if (post.tenant_id && packMap[post.tenant_id]) {
                    post.pack = packMap[post.tenant_id]
                    post.pack.images = {
                        avatar: post.pack.images_avatar,
                        header: post.pack.images_header
                    }
                }
                delete post.tenant_id

                // Add page data
                if (post.channel_id && channelMap[post.channel_id]) {
                    post.page = channelMap[post.channel_id]
                }
                delete post.channel_id

                // Clean up empty collections
                if (Object.keys(post.reactions).length === 0) {
                    delete post.reactions
                }

                if (post.comments.length === 0) {
                    delete post.comments
                }
            })

            return postsMap
        } catch (error) {
            console.error('Error loading posts in bulk:', error)
            return {}
        }
    }

    /**
     * Fetch user profiles by IDs
     */
    private async fetchProfiles(userIds: string[]): Promise<any[]> {
        if (!userIds.length) return []
        try {
            const data = await prisma.profiles.findMany({
                where: {
                    id: {in: userIds}
                }
            })

            let profilesMap: Record<string, any> = {}

            // Get user badges & avatar too
            for (const profile of data) {
                let profileBuild: typeof profile & {
                    badge?: string
                } = {
                    ...profile,
                }

                const userAvatar = await getClerkAvatar(profile.owner_id)

                // Metadata
                const userBadges = await prisma.collectibles.findFirst({
                    where: {
                        user_id: profile.id,
                        is_set: true
                    }
                })

                if (userBadges) {
                    profileBuild.badge = userBadges.badge_id
                }

                if (userAvatar) {
                    profileBuild.images_avatar = userAvatar
                }

                profilesMap[profile.id] = profileBuild
            }

            return Object.values(profilesMap) || []
        } catch (error) {
            console.error('Error fetching profiles:', error)
            return []
        }
    }

    /**
     * Fetch reactions for posts
     */
    private async fetchReactions(postIds: string[]): Promise<any[]> {
        if (!postIds.length) return []

        try {
            const data = await prisma.posts_reactions.findMany({
                where: {
                    post_id: {in: postIds}
                },
                select: {
                    post_id: true,
                    actor_id: true,
                    slot: true
                }
            })

            // Convert BigInt slot values to numbers to make them JSON serializable
            return (data || []).map(reaction => ({
                ...reaction,
                slot: typeof reaction.slot === 'bigint' ? Number(reaction.slot) : reaction.slot
            }))
        } catch (error) {
            console.error('Error fetching reactions:', error)
            return []
        }
    }

    /**
     * Fetch comments for posts
     */
    private async fetchComments(postIds: string[]): Promise<any[]> {
        if (!postIds.length) return []

        try {
            const data = await prisma.posts.findMany({
                where: {
                    parent: {in: postIds}
                },
                select: {
                    id: true,
                    body: true,
                    created_at: true,
                    user_id: true,
                    parent: true
                }
            })

            return data || []
        } catch (error) {
            console.error('Error fetching comments:', error)
            return []
        }
    }

    /**
     * Fetch packs by IDs
     */
    private async fetchPacks(packIds: string[]): Promise<any[]> {
        if (!packIds.length) return []

        try {
            const data = await prisma.packs.findMany({
                where: {
                    id: {in: packIds}
                }
            })

            return data || []
        } catch (error) {
            console.error('Error fetching packs:', error)
            return []
        }
    }

    /**
     * Fetch pages by IDs
     */
    private async fetchPages(channelds: string[]): Promise<any[]> {
        if (!channelds.length) return []

        try {
            const data = await prisma.packs_pages.findMany({
                where: {
                    id: {in: channelds}
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    icon: true,
                    tenant_id: true
                }
            })

            return data || []
        } catch (error) {
            console.error('Error fetching pages:', error)
            return []
        }
    }

    /**
     * Create a placeholder profile for deleted users
     */
    private createDeletedUserProfile(userId: string): any {
        return {
            id: userId,
            username: 'deleted',
            display_name: 'Deleted User',
            about: {
                bio: 'This user has been deleted.',
            },
            images: {
                avatar: `https://www.gravatar.com/avatar/${userId}?d=mp`,
                header: null,
            }
        }
    }
}
