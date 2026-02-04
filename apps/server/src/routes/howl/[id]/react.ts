import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {ErrorTypebox, HTTPError} from '@/lib/http-error'
import {NotificationManager} from '@/lib/notification-manager'
import {xpManager} from '@/lib/trinket-manager'
import requiresAccount from '@/utils/identity/requires-account'
import requiresToken from '@/utils/identity/requires-token'
import {t} from 'elysia'

export default (app: YapockType) =>
    app
        .post(
            '',
            async ({params: {id}, body: {slot = '👍'}, set, user}: any) => {
                await requiresAccount(user)

                let postExists
                try {
                    postExists = await prisma.posts.findUnique({where: {id}, select: {user_id: true, body: true}})
                } catch (postError) {
                    set.status = 500
                    throw HTTPError.fromError(postError)
                }
                if (!postExists) {
                    set.status = 404
                    return
                }

                let reactionExists
                try {
                    reactionExists = await prisma.posts_reactions.findMany({
                        where: {
                            post_id: id,
                            actor_id: user.sub,
                            slot,
                        },
                        select: {
                            created_at: true,
                            slot: true,
                        },
                    })
                } catch (reactionError) {
                    set.status = 500
                    throw HTTPError.fromError(reactionError)
                }

                if (reactionExists && reactionExists.length > 0) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'You have already reacted to this post.',
                    })
                }

                // Count unique slots for this post
                const reactionSlots = await prisma.posts_reactions.findMany({
                    where: {
                        post_id: id,
                    },
                    select: {
                        slot: true,
                    },
                })

                const slotAmount = reactionSlots.length

                if (slotAmount >= 25) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'Too many reactions.',
                    })
                }

                try {
                    await prisma.posts_reactions.create({
                        data: {
                            post_id: id,
                            slot,
                            actor_id: user.sub,
                        },
                    })
                } catch (insertError) {
                    throw HTTPError.fromError(insertError)
                }

                // Count all reactions for this post
                const reactionCount = await prisma.posts_reactions.count({
                    where: {
                        post_id: id,
                    },
                })
                const tooManyReactions = reactionCount > 100
                if (user.sub !== postExists.user_id) {
                    if (!tooManyReactions) {
                        await xpManager.increment(postExists.user_id, 3)
                    }

                    await xpManager.increment(user.sub, 3, 3)
                }

                await NotificationManager.createNotification(postExists.user_id, 'howl_react', `${user.sessionClaims.nickname} reacted ${slot}`, postExists.body, {
                    post_id: id,
                    user: {
                        id: user.sub,
                        username: user.sessionClaims.nickname,
                        images_avatar: `${process.env.HOSTNAME}/user/${user.sub}/avatar`
                    },
                })

                set.status = 201
            },
            {
                detail: {
                    description: 'React to a post',
                    tags: ['Howl'],
                },
                body: t.Object({
                    slot: t.String({
                        minimum: 1,
                        default: '👍',
                    }),
                }),
                response: {
                    201: t.Undefined(),
                    400: t.Optional(ErrorTypebox),
                    401: t.Undefined(),
                    404: t.Undefined(),
                    500: ErrorTypebox,
                },
            },
        )
        .delete(
            '',
            async ({params: {id}, set, user}) => {
                await requiresToken(user)

                try {
                    await prisma.posts_reactions.deleteMany({
                        where: {
                            post_id: id,
                            actor_id: user.sub,
                        },
                    })
                } catch (deleteError) {
                    throw HTTPError.fromError(deleteError)
                }

                set.status = 204
            },
            {
                detail: {
                    description: 'Remove reaction from a post',
                    tags: ['Howl'],
                },
                body: t.Object({
                    slot: t.Optional(
                        t.String({
                            minimum: 1,
                            default: '👍',
                        }),
                    ),
                }),
                response: {
                    204: t.Undefined(),
                    400: t.Optional(ErrorTypebox),
                    401: t.Undefined(),
                    404: t.Undefined(),
                    500: ErrorTypebox,
                },
            },
        );
