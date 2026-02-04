import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {FeedController} from '@/lib/feed-controller'
import {ErrorTypebox, HTTPError} from '@/lib/http-error'
import PackMan from '@/lib/packs/pack-manager'
import requiresAccount from '@/utils/identity/requires-account'
import requiresToken from '@/utils/identity/requires-token'
import {t} from 'elysia'
import {getPack, getPackMembership, PackMembershipCache} from './index'

export default (app: YapockType) =>
    app
        .post(
            '',
            async ({params: {id}, set, user}) => {
                await requiresAccount(user)

                const packExists = await getPack(id, 'id')
                if (!packExists || id === '00000000-0000-0000-0000-000000000000') {
                    throw HTTPError.notFound({
                        summary: 'Pack not available',
                    })
                    return
                }

                const isMember = await getPackMembership(id, user.sub)
                if (!isMember) {
                    let data
                    try {
                        data = await prisma.packs_memberships.create({
                            data: {
                                tenant_id: id,
                                user_id: user.sub,
                            },
                        })

                        await prisma.profiles.updateMany({
                            where: {
                                id: user.sub,
                                default_pack: null
                            },
                            data: {
                                default_pack: id
                            }
                        })

                    } catch (insertError) {
                        set.status = 400
                        throw HTTPError.badRequest({
                            summary: insertError.message || 'unknown',
                        })
                    }

                    if (!data) {
                        set.status = 400
                        throw HTTPError.badRequest({
                            summary: 'Failed to create membership',
                        })
                    }

                    FeedController.packCache.delete(user.sub)
                    set.status = 200
                    return data
                } else {
                    set.status = 409
                    throw HTTPError.conflict({
                        summary: 'you are already a member',
                    })
                }
            },
            {
                detail: {
                    description: 'Join a specific pack.',
                    tags: ['Pack'],
                },
                response: {
                    200: t.Object({
                        tenant_id: t.String(),
                        user_id: t.String(),
                    }),
                    400: ErrorTypebox,
                    409: ErrorTypebox,
                    404: t.Undefined(),
                },
            },
        )
        .delete(
            '',
            async ({params: {id}, set, user}) => {
                await requiresToken(user)

                const packExists = await getPack(id, 'id')
                if (!packExists) {
                    set.status = 404
                    return
                }

                if (!(await PackMan.hasPermission(user.sub, id, PackMan.PERMISSIONS.Owner)) && user.default_pack !== id) {
                    try {
                        await prisma.packs_memberships.deleteMany({
                            where: {
                                tenant_id: id,
                                user_id: user.sub,
                            },
                        })
                    } catch (deleteError) {
                        set.status = 400
                        throw HTTPError.badRequest({
                            summary: deleteError.message,
                        })
                    }

                    PackMembershipCache.forEach((v, k) => {
                        if (v.tenant_id === id && v.user_id === user.sub) {
                            PackMembershipCache.delete(k)
                        }
                    })

                    FeedController.packCache.delete(user.sub)

                    set.status = 204
                } else {
                    set.status = 409
                    throw HTTPError.conflict({
                        summary: 'you are not a member of the pack',
                    })
                }
            },
            {
                detail: {
                    description: 'Leave a specific pack.',
                    tags: ['Pack'],
                },
                response: {
                    204: t.Void(),
                    400: ErrorTypebox,
                    401: ErrorTypebox,
                    409: ErrorTypebox,
                    404: t.Void(),
                },
            },
        );
