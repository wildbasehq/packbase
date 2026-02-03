import {HTTPError} from '@/lib/http-error'

export default function requiresToken({set, user}: { set: any; user: { sub: string } }) {
    if (!user) {
        set.status = 401
        throw HTTPError.unauthorized({summary: 'Unauthorized'})
    }
    return true
}
