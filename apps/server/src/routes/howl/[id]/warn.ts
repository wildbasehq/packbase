import {YapockType} from '@/index'
import {HTTPError} from '@/lib/http-error'
import {t} from 'elysia'

export default (app: YapockType) =>
    app
        // @ts-ignore - Not sure what's going on here
        .post(
            '',
            async ({params, body, user, auditLog}) => {
                const {id} = params
                const {reason} = body

                if (!user.is_content_moderator) throw HTTPError.forbidden({summary: 'The maze isn\'t meant for you.'})

                // exist?
                const howl = await prisma.posts.findFirst({
                    where: {
                        id
                    },
                    select: {
                        id: true,
                        user_id: true,
                        warning: true
                    }
                })

                if (!howl) throw HTTPError.notFound({summary: 'Howl not found'})

                if (howl.warning) throw HTTPError.conflict({summary: 'Howl already has a warning'})

                const log = await auditLog({
                    action: 'HOWL_WARNED',
                    model_id: howl.user_id,
                    model_type: 'profiles',
                    model_object: {
                        howl_id: howl.id,
                        author_id: howl.user_id,
                        reason
                    },
                })

                await prisma.posts.update({
                    where: {
                        id: howl.id
                    },
                    data: {
                        warning: {
                            reason,
                            audit: log.id
                        }
                    }
                })
            },
            {
                detail: {
                    description: 'Warn the user who howled',
                    tags: ['Howl'],
                    hidden: true
                },
                params: t.Object({
                    id: t.String({
                        description: 'Howl ID',
                    })
                }),
                body: t.Object({
                    reason: t.String({
                        description: 'Reason for the warning'
                    })
                }),
                response: {
                    404: t.Null(),
                },
            },
        )