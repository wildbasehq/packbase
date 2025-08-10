import {YapockType} from '@/index'
import {t} from 'elysia'
import requiresUserProfile from '@/utils/identity/requires-user-profile'
import {ErrorTypebox} from '@/utils/errors'
import {HTTPError} from '@/lib/class/HTTPError'
import prisma from '@/db/prisma'

export default (app: YapockType) => app
    .post('', async ({params: {id}, body: {body}, set, user, error}) => {
        await requiresUserProfile({set, user})

        body = body.trim()
        if (body.length === 0) {
            set.status = 400
            return
        }

        let postExists;
        try {
            postExists = await prisma.posts.findUnique({
                where: { id },
                select: { id: true }
            });
        } catch (postError) {
            set.status = 500;
            throw HTTPError.fromError(postError);
        }

        if (!postExists) {
            set.status = 404;
            return;
        }

        let data;
        try {
            data = await prisma.posts.create({
                data: {
                    parent: id,
                    body,
                    user_id: user.sub,
                    content_type: 'howling_alongside'
                },
                select: {
                    id: true
                }
            });
        } catch (insertError) {
            set.status = 500;
            throw HTTPError.fromError(insertError);
        }

        if (!data) {
            set.status = 400;
            return;
        }

        set.status = 201
        return {
            id: data.id
        }
    }, {
        detail: {
            description: 'Reply to a post',
            tags: ['Howl']
        },
        body: t.Object({
            body: t.String({
                minLength: 1,
                maxLength: 1024
            })
        }),
        response: {
            201: t.Object({
                id: t.String()
            }),
            400: t.Null(),
            404: t.Null(),
            500: ErrorTypebox
        }
    })
