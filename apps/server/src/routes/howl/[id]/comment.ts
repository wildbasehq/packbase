import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import {NotificationManager} from '@/lib/NotificationManager'
import {ErrorTypebox} from '@/utils/errors'
import requiresAccount from '@/utils/identity/requires-account'
import {t} from 'elysia'

export default (app: YapockType) =>
    app.post(
        '',
        async ({params: {id}, body: {body}, set, user, error}) => {
            await requiresAccount({set, user})

            body = body.trim()
            if (body.length === 0) {
                set.status = 400
                return
            }

            let postExists
            try {
                postExists = await prisma.posts.findUnique({
                    where: {id},
                    select: {user_id: true, id: true, tenant_id: true},
                })
            } catch (postError) {
                set.status = 500
                throw HTTPError.fromError(postError)
            }

            if (!postExists) {
                set.status = 404
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

                await NotificationManager.createNotification(postExists.user_id, 'howl_comment', `${user.sessionClaims.nickname} replied`, body, {
                    post_id: id,
                    user: {
                        id: user.sub,
                        username: user.sessionClaims.nickname,
                        images_avatar: `${process.env.HOSTNAME}/user/${user.sub}/avatar`,
                    },
                })
            } catch (insertError) {
                set.status = 500
                throw HTTPError.fromError(insertError)
            }

            if (!data) {
                set.status = 400
                return
            }

            set.status = 201
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
