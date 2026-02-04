import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {FeedController} from '@/lib/feed-controller'
import {ErrorTypebox, HTTPError} from '@/lib/http-error'
import {getUser} from '@/routes/user/[username]/index'
import requiresAccount from '@/utils/identity/requires-account'
import requiresToken from '@/utils/identity/requires-token'
import {t} from 'elysia'

export default (app: YapockType) =>
    app
        .post(
            '',
            async ({user, params, set}) => {
                await requiresAccount(user)

                const followUser = await getUser({
                    by: 'username',
                    value: params.username,
                    user,
                })

                if (!followUser) {
                    set.status = 404
                    return
                }

                if (followUser.id === user.sub) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'You cannot follow yourself.',
                    })
                }

                if (followUser.following) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'You are already following this user.',
                    })
                }

                try {
                    await prisma.profiles_followers.create({
                        data: {
                            user_id: user.sub,
                            following_id: followUser.id,
                        },
                    })
                } catch (insertError) {
                    set.status = 400
                    throw HTTPError.fromError(insertError)
                }

                FeedController.clearUserCache(user.sub)
            },
            {
                params: t.Object({
                    username: t.String({
                        description: 'Username of the user to follow.',
                    }),
                }),
                detail: {
                    description: 'Follow a specific user.',
                    tags: ['User'],
                },
                response: {
                    404: t.Undefined(),
                    400: ErrorTypebox,
                    200: t.Void(),
                },
            },
        )
        .delete(
            '',
            async ({params, set, user}) => {
                await requiresToken(user)
                const followUser = await getUser({
                    by: 'username',
                    value: params.username,
                    user,
                })

                if (!followUser) {
                    set.status = 404
                    return
                }

                if (followUser.id === user.sub) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'You cannot unfollow yourself.',
                    })
                }

                if (!followUser.following) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'You are not following this user.',
                    })
                }

                try {
                    await prisma.profiles_followers.deleteMany({
                        where: {
                            user_id: user.sub,
                            following_id: followUser.id,
                        },
                    })
                } catch (deleteError) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: deleteError.message || 'unknown',
                    })
                }

                FeedController.clearUserCache(user.sub)
            },
            {
                params: t.Object({
                    username: t.String({
                        description: 'Username of the user to unfollow.',
                    }),
                }),
                detail: {
                    description: 'Unfollow a specific user.',
                    tags: ['User'],
                },
                response: {
                    404: t.Undefined(),
                    400: ErrorTypebox,
                    200: t.Void(),
                },
            },
        );
