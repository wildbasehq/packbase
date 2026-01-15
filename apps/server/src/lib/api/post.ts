import {Database} from '@/database.types'
import prisma from '@/db/prisma'
import {HTTPError} from '@/lib/HTTPError'
import createStorage from '@/lib/storage'
import {UserProfile} from '@/models/defs'
import {getPack} from '@/routes/pack/[id]'
import {getUser} from '@/routes/user/[username]'
import requiresToken from '@/utils/identity/requires-token'
import posthog, {distinctId} from '@/utils/posthog'

const HowlCache = new Map<string, Database['public']['Tables']['posts']['Row'] & typeof UserProfile>()

export async function getPost(id: string, post?: (Database['public']['Tables']['posts']['Row'] & typeof UserProfile) | undefined) {
    const timer = new Date().getTime()
    const cached = HowlCache.get(id)
    let data = post || cached
    if (!data) {
        try {
            const fetchData = await prisma.posts.findUnique({
                where: {id},
            })

            if (!fetchData) {
                return null
            }

            data = fetchData as any
            if (data && !cached) {
                HowlCache.set(id, data)
            }
        } catch (error: any) {
            throw HTTPError.serverError({
                summary: error.message,
                ...error,
            })
        }
    }

    // Wasn't able to do it in the query
    if (!data) {
        return null
    }

    data.created_at = data.created_at.toString()

    data.user = await getUser({
        by: 'id',
        value: data.user_id || data.user.id,
    })

    if (!data.user) {
        // Assume the user was deleted
        data.user = {
            id: '00000000-0000-0000-0000-000000000000',
            username: 'deleted',
            display_name: 'Deleted User',
            about: {
                bio: 'This user has been deleted.',
            },
            images: {
                avatar: `https://www.gravatar.com/avatar/${data.user_id}?d=mp`,
                header: null,
            },
        }
    }

    // @ts-ignore - it should be removed
    delete data.user_id

    const reactions = await prisma.posts_reactions.findMany({
        where: {post_id: id},
        select: {actor_id: true, slot: true},
    })

    if (reactions.length > 0) {
        data.reactions = []
        for (const reaction of reactions) {
            const slotKey = reaction.slot

            data.reactions.push({
                key: slotKey,
                emoji: slotKey,
                count: reactions.filter((r) => r.slot === slotKey).length,
            })
        }
    }

    // Comments - sorted by created_at
    const comments = await prisma.posts.findMany({
        where: {parent: id},
        orderBy: {created_at: 'asc'},
    })

    if (comments.length > 0) {
        data.comments = []
        for (const comment of comments as any[]) {
            comment.user = await getUser({
                by: 'id',
                value: comment.user_id,
            })
            delete comment.user_id

            comment.created_at = comment.created_at.toString()
            data.comments.push(comment)
        }
    }

    data.pack = await getPack(data.tenant_id, 'basic')

    // @ts-ignore - it should be removed
    delete data.tenant_id
    delete data.classification

    posthog.capture({
        distinctId,
        event: 'Viewed Howl',
        properties: {
            fetch_time: new Date().getTime() - timer,
            howl: data,
        },
    })

    return data
}

export async function deletePost({params: {id}, body, set, user, logAudit}) {
    requiresToken({set, user})

    const reason: string | undefined = body?.reason

    // Check user ID against post user ID
    const post = await prisma.posts.findUnique({
        where: {id},
        select: {id: true, user_id: true, assets: true},
    })

    if (!post) {
        set.status = 404
        return
    }

    if (post?.user_id !== user?.sub && (!user.is_content_moderator && !reason)) {
        set.status = 403
        throw HTTPError.forbidden({
            summary: 'You are not the author of this post',
        })
    }

    try {
        await prisma.posts.delete({
            where: {id},
        })

        if (user.is_content_moderator && reason) {
            logAudit({
                action: 'HOWL_DELETED',
                model_id: post.user_id,
                model_type: 'profiles',
                model_object: {
                    howl_id: post.id,
                    author_id: post.user_id,
                    reason
                },
            })
        }
    } catch (error: any) {
        set.status = 400
        throw HTTPError.badRequest({
            summary: error.message,
            ...error,
        })
    }

    // If post has assets, delete them too
    if (post.assets && (post.assets as any).length > 0) {
        const storage = createStorage(process.env.S3_PROFILES_BUCKET)

        // List files in the user's folder for this post
        const listResult = await storage.listFiles(user.sub, `${id}`)

        if (listResult.success && listResult.files) {
            // Delete each file
            for (const file of listResult.files) {
                await storage.deleteFile(user.sub, `${id}/${file.name}`)
            }
        }
    }

    HowlCache.delete(id)
    set.status = 204
}
