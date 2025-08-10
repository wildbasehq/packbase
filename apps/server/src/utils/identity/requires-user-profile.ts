import {HTTPError} from '@/lib/class/HTTPError'
import prisma from '@/db/prisma'

export default async function requiresUserProfile({set, user}: any) {
    if (!user) {
        set.status = 401
        throw HTTPError.unauthorized({
            summary: 'Needs authentication'
        })
    }
    try {
        const data = await prisma.profiles.findUnique({
            where: { id: user.sub },
            select: { id: true }
        });
        if (!data) {
            set.status = 401
            throw HTTPError.unauthorized({
                summary: 'User profile not found'
            })
        }

        // Set last_online
        await prisma.profiles.update({
            where: { id: user.sub },
            data: { last_online: new Date() }
        })

    } catch (selectError) {
        set.status = 401
        throw HTTPError.unauthorized({
            summary: selectError.message || 'unknown'
        })
    }
}
