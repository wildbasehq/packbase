import {getMe} from '@/lib/api/users/me'
import {FetchHandler} from '@/lib/api'

/**
 * Get a member by their ID or username
 * via /api/v2/members/:id(/:bits)
 *
 * @param {string} id The ID or username of the member
 * @param {number} bits The bitwise flags for what to include
 */
export default async function getMember(id: string, bits: number = 8) {
    const res = await FetchHandler.get(`member/${id}/${bits}`)
    if (!res.success) throw new Error(res.message)
    return res.data
}

/**
 * Get member groups
 */
export async function getMemberGroups(id: string) {
    const currentUser = getMe()
    if (!currentUser) {
        console.log(`[🗄️ Cache] Member groups for ${id} cannot be cached.`)
        return []
    }

    if (!Array.isArray(currentUser.groups) || (
        Date.now() - currentUser.groupsCacheTime
    ) > 600000) {
        const res = await fetch(`${FetchHandler.API_URL}member/${id}/groups`)
        const json = await res.json()

        if (Array.isArray(json)) {
            console.log(`[🗄️ Cache] Member groups for ${id} cached.`)
            window.YipnyapStateCache['FetchCache:API\\Users\\Me'].groups = json
        } else {
            console.log(`[🗄️ Cache] Member groups is non-existent or not an array for ${id}`)
            window.YipnyapStateCache['FetchCache:API\\Users\\Me'].groups = []
        }

        window.YipnyapStateCache['FetchCache:API\\Users\\Me'].groupsCacheTime = Date.now()
    } else {
        console.log(`[🗄️ Cache] Member groups for ${id} already cached.`)
    }

    return window.YipnyapStateCache['FetchCache:API\\Users\\Me'].groups
}

/**
 * Get member friends
 */
export async function getMemberFriends(id: string) {
    const currentUser = getMe()
    // Check yipnyap_constants.currentUser exists
    if (!currentUser) {
        console.log(`[🗄️ Cache] Member friends for ${id} cannot be cached.`)
        return []
    }

    // Check yipnyap_constants.currentUser for friends, if not, populate it.
    // Also check if it's been 10 minutes since last cache
    if (!Array.isArray(currentUser.friends) || (
        Date.now() - currentUser.friendsCacheTime
    ) > 600000) {
        const res = await fetch(`${FetchHandler.API_URL}member/${id}/friends`)
        const json = await res.json()

        if (Array.isArray(json)) {
            window.YipnyapStateCache['FetchCache:API\\Users\\Me'].friends = json
        } else {
            window.YipnyapStateCache['FetchCache:API\\Users\\Me'].friends = []
        }

        window.YipnyapStateCache['FetchCache:API\\Users\\Me'].friendsCacheTime = Date.now()
    } else {
        console.log(`[🗄️ Cache] Member friends for ${id} already cached.`)
    }

    return window.YipnyapStateCache['FetchCache:API\\Users\\Me'].friends
}
