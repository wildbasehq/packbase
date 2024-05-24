/**
 * @title: API\Users\Me
 * @description: Contains funcs for interacting with the /users/@me endpoint
 */

import {FetchHandler} from '@/lib/api'

export const API_PREFIX = 'member'

/**
 * @description Get the current user's profile
 */
export const getMe = (forceCacheFlush?: boolean) => {
    const token = FetchHandler.TOKEN
    if (!token) return null

    let cache = window.YipnyapStateCache['FetchCache:API\\Users\\Me']
    if (cache && !forceCacheFlush) {
        return {
            ...cache,
            setDipswitch,
        }
    } else {
        cache = undefined
    }

    if (typeof cache === 'undefined') {
        console.log('Fetching API\\Users\\Me')
        FetchHandler.get(`${API_PREFIX}/@me/12`).then((res) => {
            console.log('Fetched API\\Users\\Me -- Write Cached')

            if (!res.success) {
                FetchHandler.TOKEN = null
                window.YipnyapStateCache['FetchCache:API\\Users\\Me'] = null
            } else {
                window.YipnyapStateCache['FetchCache:API\\Users\\Me'] = res.data
            }

            return {
                ...res.data,
                setDipswitch,
            }
        })
    }

    return null
}

const setDipswitch = async function (key: string, value: any) {
    if (!window.YipnyapStateCache['FetchCache:API\\Users\\Me'].dipswitch) window.YipnyapStateCache['FetchCache:API\\Users\\Me'].dipswitch = {}
    window.YipnyapStateCache['FetchCache:API\\Users\\Me'].dipswitch[key] = value

    return FetchHandler.post(`dipswitch`, {
        body: JSON.stringify({
            key,
            value,
        }),
    }).then((response) => {
        return response.status === 200
    }).catch((error) => {
        console.error(error)
        return false
    })
}
