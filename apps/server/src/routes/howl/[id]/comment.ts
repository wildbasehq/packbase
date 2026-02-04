import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {ErrorTypebox, HTTPError} from '@/lib/http-error'
import {NotificationManager} from '@/lib/notification-manager'
import {xpManager} from '@/lib/trinket-manager'
import requiresAccount from '@/utils/identity/requires-account'
import {t} from 'elysia'

export default (app: YapockType) =>
    app.post(
        '',
        async ({params: {id}, body: {body}, user}) => {
            await requiresAccount(user)

            body = body.trim()
            if (body.length === 0) {
                throw HTTPError.badRequest({
                    summary: 'body required'
                })
            }

            let postExists
            try {
                postExists = await prisma.posts.findUnique({
                    where: {id},
                    select: {user_id: true, id: true, tenant_id: true},
                })
            } catch (postError) {
                throw HTTPError.fromError(postError)
            }

            if (!postExists) {
                return
            }

            let data
            try {
                data = await prisma.posts.create({
                    data: {
                        parent: id,
                        body,
                        user_id: user.sub,
                        content_type: 'howling_alongside',
                        tenant_id: postExists.tenant_id
                    },
                    select: {
                        id: true,
                    },
                })

                if (user.sub !== postExists.user_id) {
                    await NotificationManager.createNotification(postExists.user_id, 'howl_comment', `${user.sessionClaims.nickname} replied`, body, {
                        post_id: id,
                        user: {
                            id: user.sub,
                            username: user.sessionClaims.nickname,
                            images_avatar: `${process.env.HOSTNAME}/user/${user.sub}/avatar`,
                        },
                    })
                }

                // Is unique commenter?
                const isUniqueCommenter = (await prisma.posts.count({
                    where: {
                        parent: id,
                        user_id: user.sub,
                    },
                })) === 0

                if (isUniqueCommenter) {
                    // Give OP 10 XP, unique
                    await xpManager.increment(postExists.user_id, 10)
                }

                // Give commenter 15 XP
                await xpManager.increment(user.sub, 15)
            } catch (insertError) {
                throw HTTPError.fromError(insertError)
            }

            if (!data) {
                throw HTTPError.serverError({
                    summary: 'Something went wrong and we cannot get the specific error.'
                })
            }

            return {
                id: data.id,
            }
        },
        {
            detail: {
                description: 'Reply to a post',
                tags: ['Howl'],
            },
            body: t.Object({
                body: t.String({
                    minLength: 1,
                    maxLength: 4096,
                }),
            }),
            response: {
                201: t.Object({
                    id: t.String(),
                }),
                400: t.Null(),
                404: t.Null(),
                500: ErrorTypebox,
            },
        },
    );
