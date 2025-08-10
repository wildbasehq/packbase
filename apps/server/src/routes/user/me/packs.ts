import {YapockType} from '@/index'
import {getPack} from '@/routes/pack/[id]'
import requiresUserProfile from '@/utils/identity/requires-user-profile'
import {t} from 'elysia'
import {PackResponse} from '@/models/defs'
import {ErrorTypebox} from '@/utils/errors'
import {HTTPError} from '@/lib/class/HTTPError'
import prisma from '@/db/prisma'

export default (app: YapockType) => app
    .get('', async ({set, user}) => {
        await requiresUserProfile({set, user})

        return await getUserPacks({user, set})
    }, {
        detail: {
            description: 'Get the current user\'s packs.',
            tags: ['User']
        },
        response: {
            200: t.Array(PackResponse),
            500: ErrorTypebox
        }
    })

export async function getUserPacks({user, set, error}: any) {
    try {
        const memberships = await prisma.packs_memberships.findMany({
            where: {
                user_id: user.sub
            },
            select: {
                tenant_id: true
            }
        })

        if (!memberships || memberships.length === 0) return []

        return await Promise.all(memberships.map(async (pack) => {
            return await getPack(pack.tenant_id, '', user.sub)
        }))
    } catch (error) {
        set.status = 500
        throw HTTPError.serverError({
            summary: 'Failed to get user packs',
            detail: error.message
        })
    }
}