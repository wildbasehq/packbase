import {HTTPError} from '@/lib/HTTPError'

export default async function requiresAccount({set, user}: { set: any; user: { sub: string } }) {
    if (!user) {
        set.status = 401
        throw HTTPError.unauthorized({summary: 'Unauthorized'})
    }

    const hasAccount = await prisma.profiles.findUnique({
        where: {id: user.sub},
        select: {id: true}
    })

    if (!hasAccount) {
        set.status = 403
        throw HTTPError.forbidden({summary: 'Account required'})
    }
    return true
}
