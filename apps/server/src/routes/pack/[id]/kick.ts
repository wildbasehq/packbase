import {t} from 'elysia'
import {YapockType} from '@/index'
import {ErrorTypebox} from '@/utils/errors'
import {HTTPError} from '@/lib/HTTPError'
import requiresToken from '@/utils/identity/requires-token'
import PackMan from '@/lib/packs/PackMan'

export default (app: YapockType) =>
    app.post(
        '',
        async ({params: {id}, set, user, body}) => {
            requiresToken({set, user})

            const targetUserId = body?.user_id || body?.userId
            if (!targetUserId || typeof targetUserId !== 'string') {
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'Missing target user ID',
                })
            }

            let packMan
            try {
                packMan = await PackMan.init(id, user.sub)
            } catch (error: any) {
                set.status = 403
                throw HTTPError.forbidden({
                    summary: error?.message || 'Pack membership not found',
                })
            }

            if (!packMan) {
                throw HTTPError.notFound({
                    summary: 'Pack not found',
                })
            }

            const result = await packMan.kickMember(targetUserId)

            if (!result.success) {
                switch (result.error) {
                    case 'Missing permission':
                        throw HTTPError.forbidden({
                            summary: 'You do not have permission to kick members from this pack',
                        })
                    case 'Membership not found':
                        throw HTTPError.notFound({
                            summary: 'User is not a member of this pack',
                        })
                    case 'Not a pack member':
                        throw HTTPError.forbidden({
                            summary: 'You are not a member of this pack',
                        })
                    case 'Use leave endpoint to exit a pack':
                        throw HTTPError.badRequest({
                            summary: result.error,
                        })
                    default:
                        set.status = 400
                        throw HTTPError.badRequest({
                            summary: result.error || 'Failed to kick member',
                        })
                }
            }

            set.status = 204
        },
        {
            body: t.Object({
                user_id: t.String(),
            }),
            detail: {
                description: 'Kick a member from a specific pack.',
                tags: ['Pack'],
            },
            response: {
                204: t.Void(),
                400: ErrorTypebox,
                401: ErrorTypebox,
                403: ErrorTypebox,
                404: ErrorTypebox,
            },
        },
    )

