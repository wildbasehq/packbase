import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import Baozi from '@/lib/events'
import {HTTPError} from '@/lib/http-error'
import {getPack} from '@/routes/pack/[id]'
import requiresAccount from '@/utils/identity/requires-account'

export default (app: YapockType) =>
    app.get(
        '',
        async ({user}) => {
            await requiresAccount(user)
            return await getUserPacks(user)
        },
        {
            detail: {
                description: 'Get the current user\'s packs.',
                tags: ['User'],
            },
        },
    );

Baozi.on('ADDITIONAL_CONTEXT', async (ctx) => {
    if (!ctx.context.user) return ctx
    ctx.context.packs = await getUserPacks(ctx.context.user)
    return ctx
})

export async function getUserPacks(user) {
    try {
        const memberships = await prisma.packs_memberships.findMany({
            where: {
                user_id: user.sub,
            },
            select: {
                tenant_id: true,
            },
        })

        if (!memberships || memberships.length === 0) return []

        return await Promise.all(
            memberships.map(async (pack) => {
                return await getPack(pack.tenant_id, '', user.sub)
            }),
        )
    } catch (error) {
        throw HTTPError.serverError({
            summary: 'Failed to get user packs',
            detail: error.message,
        })
    }
}
