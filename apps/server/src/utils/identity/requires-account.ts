import {HTTPError} from '@/lib/http-error'

export default async function requiresAccount(user) {
    if (!user) {
        throw HTTPError.unauthorized({summary: 'Unauthorized'})
    }

    const hasAccount = await prisma.profiles.findUnique({
        where: {id: user.sub},
        select: {id: true}
    })

    if (!hasAccount) {
        throw HTTPError.forbidden({summary: 'Account required'})
    }
    return true
}
