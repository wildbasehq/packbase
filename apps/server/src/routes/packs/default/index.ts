import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import getUserPrivateSettings from '@/utils/get-user-private-settings'
import requiresToken from '@/utils/identity/requires-token'
import {t} from 'elysia'

export async function checkDefaultPackSetup(userId: string) {
    const profile = await prisma.profiles.findFirst({
        where: {
            id: userId
        },
        select: {
            id: true,
            default_pack: true
        }
    })

    const lastSwitch = await getUserPrivateSettings(userId, 'last_default_pack_switch')
    // More than 30 days since last switch
    const can_switch = !lastSwitch || (Date.now() - new Date(lastSwitch || 0).getTime()) > 30 * 24 * 60 * 60 * 1000

    const requires_switch = !!(await hasPostsInUniverse(userId))
    // !profile?.default_pack
    const requires_setup = !profile?.default_pack

    return {
        id: profile.default_pack,
        requires_switch,
        requires_setup,
        can_switch,
    }
}

async function hasPostsInUniverse(userId: string) {
    return await prisma.posts.findFirst({
        where: {
            user_id: userId,
            tenant_id: '00000000-0000-0000-0000-000000000000'
        },
        select: {
            id: true,
            user_id: true,
            tenant_id: true
        }
    })
}

export default (app: YapockType) =>
    app.get(
        '',
        async ({set, user}) => {
            requiresToken({set, user})

            return await checkDefaultPackSetup(user.sub)
        }
    )
        .patch(
            '',
            async ({set, user, body}) => {
                requiresToken({set, user})
                const {pack_id} = body

                if ((await hasPostsInUniverse(user.sub))) {
                    const targetPack = await prisma.packs.findUnique({
                        where: {id: pack_id},
                        select: {
                            id: true,
                            owner_id: true
                        }
                    })

                    if (!targetPack) {
                        set.status = 404
                        throw HTTPError.notFound({summary: 'Pack not found.'})
                    }

                    if (targetPack.owner_id !== user.sub) {
                        set.status = 403
                        throw HTTPError.forbidden({summary: 'You do not have permission to switch to this pack.'})
                    }

                    // Switch universe posts to the new pack
                    await prisma.posts.updateMany({
                        where: {
                            user_id: user.sub,
                            tenant_id: '00000000-0000-0000-0000-000000000000'
                        },
                        data: {
                            tenant_id: pack_id
                        }
                    })
                }

                await prisma.profiles.update({
                    where: {id: user.sub},
                    data: {default_pack: pack_id}
                })

                return {}
            },
            {
                body: t.Object({
                    pack_id: t.String()
                })
            }
        )