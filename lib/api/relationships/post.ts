import {FetchHandler} from '@/lib/api'

/**
 * POST check if user is following a user
 *
 * @returns boolean
 * @param userid
 */
export async function isFollowing(userid: number): Promise<boolean> {
    const res = await fetch(`${FetchHandler.API_URL}relationships/following`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(FetchHandler.TOKEN ? {
                'Authorization': `Bearer ${FetchHandler.TOKEN}`,
            } : {}),
        },
        body: JSON.stringify({
            'target': userid
        })
    })
    const data = await res.json()
    return data.relationship
}

/**
 * POST follow a user
 *
 * @returns boolean
 * @param userid
 */
export async function follow(userid: number): Promise<{ success: boolean; relationship: any }> {
    const res = await fetch(`${FetchHandler.API_URL}relationships/follow`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(FetchHandler.TOKEN ? {
                'Authorization': `Bearer ${FetchHandler.TOKEN}`,
            } : {}),
        },
        body: JSON.stringify({
            'target': userid
        })
    })
    return await res.json()
}

/**
 * POST unfollow a user
 *
 * @returns boolean
 * @param userid
 */
export async function unfollow(userid: number): Promise<{ success: boolean; relationship: any }> {
    const res = await fetch(`${FetchHandler.API_URL}relationships/unfollow`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(FetchHandler.TOKEN ? {
                'Authorization': `Bearer ${FetchHandler.TOKEN}`,
            } : {}),
        },
        body: JSON.stringify({
            'target': userid
        })
    })
    return await res.json()
}

/**
 * POST friend request a user
 *
 * @returns boolean
 * @param userid
 */
export async function friendRequest(userid: number): Promise<{ success: boolean; relationship: any }> {
    const res = await fetch(`${FetchHandler.API_URL}relationships/friend/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(FetchHandler.TOKEN ? {
                'Authorization': `Bearer ${FetchHandler.TOKEN}`,
            } : {}),
        },
        body: JSON.stringify({
            'target': userid
        })
    })
    return await res.json()
}

/**
 * GET relationship
 */
export async function getRelationship(userid: number): Promise<{ success: boolean; relationship: any }> {
    const res = await fetch(`${FetchHandler.API_URL}relationships/get/${userid}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(FetchHandler.TOKEN ? {
                'Authorization': `Bearer ${FetchHandler.TOKEN}`,
            } : {}),
        }
    })
    return await res.json()
}

/**
 * GET friend requests for logged in user
 */
export async function getFriendRequests(): Promise<{ success: boolean; requests: any[] }> {
    const res = await fetch(`${FetchHandler.API_URL}relationships/friend/request`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(FetchHandler.TOKEN ? {
                'Authorization': `Bearer ${FetchHandler.TOKEN}`,
            } : {}),
        }
    })
    return await res.json()
}