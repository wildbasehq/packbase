import prisma from '@/db/prisma'
import {Settings} from '@/lib/settings'

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
     * @param currentUserId Optional current user ID for reaction context
     * @returns Object mapping post IDs to their complete data
     */
    async loadPosts(postIds: string[], currentUserId?: string): Promise<Record<string, any>> {
        if (!postIds.length) return {}

        // Don't load more than 25 posts at once
        postIds = postIds.slice(0, 25)

        try {
            // First, fetch the posts with minimal related data
            const posts = await prisma.posts.findMany({
                where: {
                    id: {in: postIds},
                },
                select: {
                    id: true,
                    created_at: true,
                    user_id: true,
                    tenant_id: true,
                    channel_id: true,
                    content_type: true,
                    body: true,
                    assets: true,
                    parent: true,
                    tags: true,
                    warning: true
                },
            })

            if (!posts?.length) return {}

            // Create a map of post IDs to their data
            const postsMap: Record<string, any> = {}
            for (const post of posts) {
                const settings = new Settings('user', {
                    modelId: post.user_id,
                    currentUserId
                })

                await settings.waitForInit()
                postsMap[post.id] = {
                    ...post,
                    allow_rehowl: settings.get('allow_rehowl'),
                    created_at: post.created_at.toISOString(),
                    reactions: [],
                    comments: [],
                }
            }

            // Collect all user_ids, tenant_ids, and channel_ids
            const userIds = [...new Set(posts.map((post) => post.user_id).filter(Boolean))]
            const tenantIds = [...new Set(posts.map((post) => post.tenant_id).filter(Boolean))]
            const channelds = [...new Set(posts.map((post) => post.channel_id).filter(Boolean))]

            // Handle HOWLING_ECHO posts (rehowls)
            const rehowls = posts.filter(post => post.content_type.toLowerCase() === 'howling_echo' && post.parent)
            const parentIds = [...new Set(rehowls.map(post => post.parent as string))]

            // Fetch parent posts if they are not already in our current batch
            const missingParentIds = parentIds.filter(id => !postIds.includes(id))
            let parentPostsMap: Record<string, any> = {}

            if (missingParentIds.length > 0) {
                // Recursively call loadPosts to get parent posts and their data
                // We use a new loader instance to avoid any potential state issues, 
                // though currently the loader is stateless.
                const parentLoader = new BulkPostLoader()
                parentPostsMap = await parentLoader.loadPosts(missingParentIds, currentUserId)
            }

            // Collect user IDs from parent posts that were already in our batch
            parentIds.filter(id => postIds.includes(id)).forEach(parentId => {
                const parentPost = postsMap[parentId]
                if (parentPost && parentPost.user_id) {
                    userIds.push(parentPost.user_id)
                }
            })

            const finalUserIds = [...new Set(userIds)]

            // Fetch profiles for post authors in parallel
            const profilesPromise = this.fetchProfiles(finalUserIds)

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
                channelPromise,
            ])

            // Process user profiles
            const userMap: Record<string, any> = {}
            profiles.forEach((profile) => {
                userMap[profile.id] = {
                    id: profile.id,
                    username: profile.username,
                    type: profile.type,
                    display_name: profile.display_name,
                    badge: profile.badge,
                    about: {
                        bio: profile.bio,
                    },
                    images: {
                        avatar: `${process.env.HOSTNAME}/user/${profile.id}/avatar`,
                        header: profile.images_header,
                    },
                }
            })

            // Process pack data
            const packMap: Record<string, any> = {}
            packs.forEach((pack) => {
                packMap[pack.id] = {
                    ...pack,
                    created_at: pack.created_at.toISOString(),
                }
            })

            // Process page data
            const channelMap: Record<string, any> = {}
            channels.forEach((channel) => {
                channelMap[channel.id] = {
                    id: channel.id,
                    title: channel.title,
                    slug: channel.slug,
                    description: channel.description,
                    icon: channel.icon,
                }
            })

            // Transform reactions into the new Reaction type structure
            const reactionsByPost: Record<string, Record<string, { emoji: string; users: string[] }>> = {}

            // First, organize reactions by post ID and slot
            reactions.forEach((reaction) => {
                const postId = reaction.post_id
                const slot = reaction.slot

                if (!reactionsByPost[postId]) {
                    reactionsByPost[postId] = {}
                }

                if (!reactionsByPost[postId][slot]) {
                    reactionsByPost[postId][slot] = {
                        emoji: slot, // Use slot as emoji for now, could be enhanced later
                        users: [],
                    }
                }

                reactionsByPost[postId][slot].users.push(reaction.actor_id)
            })

            // Transform into Reaction type structure
            Object.keys(reactionsByPost).forEach((postId) => {
                const post = postsMap[postId]
                if (post) {
                    post.reactions = Object.entries(reactionsByPost[postId]).map(([key, data]) => ({
                        key,
                        emoji: data.emoji,
                        count: data.users.length,
                        reactedByMe: currentUserId ? data.users.includes(currentUserId) : false,
                    }))
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
                                bio: userProfile.bio,
                            },
                            images: {
                                avatar: `${process.env.HOSTNAME}/user/${userProfile.id}/avatar`,
                                header: userProfile.images_header,
                            },
                        }

                        userMap[userProfile.id] = userProfile
                    }

                    // Reactions fetched forcefully
                    const userReactions = await this.fetchReactions([comment.id])
                    const reactionSlots = userReactions.filter(r => r.post_id === comment.id).map(r => r.slot)
                    comment.reactions = reactionSlots.map(slot => ({
                        key: slot,
                        emoji: slot,
                        count: 1,
                        reactedByMe: currentUserId === comment.user_id,
                    }))

                    post.comments.push({
                        id: comment.id,
                        body: comment.body,
                        reactions: comment.reactions,
                        created_at: comment.created_at.toISOString(),
                        user: userProfile,
                        content_type: comment.content_type,
                    })
                }
            }

            // Finalize post data
            Object.values(postsMap).forEach((post: any) => {
                // Handle HOWLING_ECHO: replace with parent post and add rehowled_by
                if (post.content_type.toLowerCase() === 'howling_echo' && post.parent) {
                    const parentId = post.parent
                    const parentPost = postsMap[parentId] || parentPostsMap[parentId]

                    if (parentPost) {
                        const rehowlerUserId = post.user_id
                        const rehowlerProfile = userMap[rehowlerUserId] || this.createDeletedUserProfile(rehowlerUserId)

                        // Replace post data with parent post data
                        const originalId = post.id
                        const rehowled_by = {
                            id: rehowlerUserId,
                            username: rehowlerProfile.username,
                            display_name: rehowlerProfile.display_name,
                        }

                        // Use the already fetched user data from parentPost if available
                        const parentUser = parentPost.user

                        Object.keys(post).forEach(key => delete post[key])
                        Object.assign(post, JSON.parse(JSON.stringify(parentPost)))

                        // Restore the original ID of the rehowl post so the feed maintains order and unique IDs
                        post.id = originalId
                        post.rehowled_by = rehowled_by

                        // If the parent post already has user data (from parentLoader), preserve it
                        if (parentUser) {
                            post.user = parentUser
                        } else if (userMap[post.user_id]) {
                            // If user data is available in our own userMap (e.g. parent was in same batch), use it
                            post.user = userMap[post.user_id]
                        }
                    } else {
                        // Missing parent, assume orphan and delete
                        delete postsMap[post.id]
                    }
                }

                // Add user data
                if (!post.user) {
                    post.user = userMap[post.user_id] || this.createDeletedUserProfile(post.user_id)
                }
                delete post.user_id

                // Add pack data
                if (post.tenant_id && packMap[post.tenant_id]) {
                    post.pack = packMap[post.tenant_id]
                    post.pack.images = {
                        avatar: post.pack.images_avatar,
                        header: post.pack.images_header,
                    }
                }
                delete post.tenant_id

                // Add page data
                if (post.channel_id && channelMap[post.channel_id]) {
                    post.page = channelMap[post.channel_id]
                }
                delete post.channel_id

                // Clean up empty collections
                if (post.reactions?.length === 0) {
                    delete post.reactions
                }

                if (post.comments?.length === 0) {
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
                    id: {in: userIds},
                },
            })

            let profilesMap: Record<string, any> = {}

            // Get user badges & avatar too
            for (const profile of data) {
                let profileBuild: typeof profile & {
                    badge?: string;
                } = {
                    ...profile,
                }

                // Metadata
                const userBadges = await prisma.inventory.findFirst({
                    where: {
                        user_id: profile.id,
                        type: 'badge',
                        is_set: true,
                    },
                })

                if (userBadges) {
                    profileBuild.badge = userBadges.item_id
                }

                profileBuild.images_avatar = `${process.env.HOSTNAME}/user/${profileBuild.id}/avatar`

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
    private async fetchReactions(postIds: string[]): Promise<{
        post_id: string; actor_id: string; slot: string
    }[]> {
        if (!postIds.length) return []

        try {
            const data = await prisma.posts_reactions.findMany({
                where: {
                    post_id: {in: postIds},
                },
                select: {
                    post_id: true,
                    actor_id: true,
                    slot: true,
                },
            })

            return data || []
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
                    parent: {in: postIds},
                },
                select: {
                    id: true,
                    body: true,
                    created_at: true,
                    user_id: true,
                    parent: true,
                    content_type: true,
                },
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
                    id: {in: packIds},
                },
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
                    id: {in: channelds},
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    icon: true,
                    tenant_id: true,
                },
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
            },
        }
    }
}
