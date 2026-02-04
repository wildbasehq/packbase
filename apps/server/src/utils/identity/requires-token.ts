import {HTTPError} from '@/lib/http-error'

export default function requiresToken(user) {
    if (!user) {
        throw HTTPError.unauthorized({summary: 'Unauthorized'})
    }
    return true
}
