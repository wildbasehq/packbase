import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {getUser} from '@/routes/user/[username]'
import {isValidUUID} from '@/utils/dm/validation'
import requiresAccount from '@/utils/identity/requires-account'

export default (app: YapockType) =>
    app.get('', async ({params: {id}, set, user}) => {
        await requiresAccount({set, user})

        if (!isValidUUID(id)) {
            set.status = 404
            return
        }

        const packExists = await prisma.packs.findUnique({
            where: {id},
            select: {id: true},
        })

        if (!packExists) {
            set.status = 404
            return
        }

        let data
        try {
            data = await prisma.packs_memberships.findMany({
                where: {tenant_id: id},
                select: {user_id: true, joined_at: true},
            })

            if (!data || data.length === 0) {
                set.status = 403
                return
            }
        } catch (error) {
            throw error
        }

        let members: any[] = []
        for (const member of data) {
            let profile = await getUser({
                by: 'id',
                value: member.user_id,
                user,
                scope: 'pack_member'
            })

            profile.joined_at = member.joined_at.toISOString()

            members.push(profile)
        }

        // Sort by online, then last online, then joined_at
        members.sort((a, b) => {
            if (a.online && !b.online) return -1
            if (!a.online && b.online) return 1
            if (a.last_online && b.last_online) {
                return b.last_online.getTime() - a.last_online.getTime()
            }
            if (a.joined_at && b.joined_at) return b.joined_at.getTime() - a.joined_at.getTime()
            return 0
        })

        return members
    });
