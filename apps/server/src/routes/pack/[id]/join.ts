import {t} from 'elysia'
import supabase from '@/utils/supabase/client'
import {getPack, getPackMembership, PackMembershipCache} from './index'
import {YapockType} from '@/index'
import requiresUserProfile from '@/utils/identity/requires-user-profile'
import {pack} from '@/lib/packs/permissions'
import {ErrorTypebox} from '@/utils/errors'
import {FeedController} from '@/lib/class/FeedController'
import {HTTPError} from '@/lib/class/HTTPError'
import prisma from '@/db/prisma'

export default (app: YapockType) => app
    .post('', async ({params: {id}, set, user}) => {
        await requiresUserProfile({set, user})

        const packExists = await getPack(id, 'id')
        if (!packExists) {
            set.status = 404
            return
        }

        const isMember = await getPackMembership(id, user.sub)
        if (!isMember) {
            let data;
            try {
                data = await prisma.packs_memberships.create({
                    data: {
                        tenant_id: id,
                        user_id: user.sub
                    }
                });
            } catch (insertError) {
                set.status = 400
                throw HTTPError.badRequest({
                    summary: insertError.message || 'unknown'
                });
            }

            if (!data) {
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'Failed to create membership'
                });
            }

            FeedController.packCache.delete(user.sub)
            set.status = 200
            return data
        } else {
            set.status = 409
            throw HTTPError.conflict({
                summary: 'you are already a member'
            })
        }
    }, {
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
        }
    })
    .delete('', async ({params: {id}, set, user, error}) => {
            await requiresUserProfile({set, user, error})

            const packExists = await getPack(id, 'id')
            if (!packExists) {
                set.status = 404
                return
            }

            const isMember = await getPackMembership(id, user.sub)
            if (isMember) {
                if (await pack.hasPermission(isMember.permissions || 0, pack.PERMISSIONS.Owner)) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'you cannot leave a pack you own'
                    })
                }

                try {
                    await prisma.packs_memberships.deleteMany({
                        where: {
                            tenant_id: id,
                            user_id: user.sub
                        }
                    });
                } catch (deleteError) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: deleteError.message
                    });
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
                    summary: 'you are not a member of the pack'
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
            }
        })
