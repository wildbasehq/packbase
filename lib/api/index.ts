'use client'
// export const API_URL = (typeof window !== 'undefined' ? (
//     window.location.hostname === 'localhost'
//         ? 'http://localhost/api/'
//         : `${window.location.protocol}//api.${window.location.hostname.replace('www.', '')}/api/`) : '/api/') + 'v2/';
import {ProjectDeps, ProjectName} from '@/lib/utils'
import {PostHog} from 'posthog-js'

export const API_URL = ''
let TOKEN: string | null = null

const FETCH_BASE = async (url: string, options: RequestInit = {}, posthog?: PostHog) => {
    const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(TOKEN ? {
            'Authorization': `Bearer ${TOKEN}`,
        } : {}),
        'X-Wolfbite-Project-Id': ProjectName,
        'X-Wolfbite-Project-Deps': ProjectDeps.join(','),
    })

    const defaultOptions = {
        headers, ...options,
    }

    const response = await fetch(url, defaultOptions)
    const data = await response.json()
    switch (response.status) {
        case 401:
            if (data.code === 'PROJECT_LEAK') {
                // Server assumed project was leaked, kill the UI.
                // Yeah yeah, its horrible to have it *on the client*, but the first API call happens before
                // Next.js fully loads, so should be fine.
                try {
                    posthog?.capture('project_leak', {
                        project: ProjectName,
                        deps: ProjectDeps,
                    })
                } catch (_) {
                }

                window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ?r=you_arent_very_bright'
                throw new Error(data.code)
            }
            throw new Error(data.message || 'UNAUTHORIZED')
        case 403:
            throw new Error(data.message || 'FORBIDDEN')
        case 404:
            throw new Error(data.message || 'NOT_FOUND')
        case 500:
            throw new Error(data.message || 'INTERNAL_SERVER_ERROR')
        default:
            break
    }

    const res = {
        data,
        status: response.status,
    }
    window.YipnyapStateCache[`FetchCache:${url}`] = res

    return res
}

export const FetchHandler = {
    API_URL,
    TOKEN,
    get: async (name: string, options: RequestInit = {}, posthog?: PostHog) => {
        if (window.YipnyapStateCache && window.YipnyapStateCache[`FetchCache:${name}`]) return window.YipnyapStateCache[`FetchCache:${name}`]
        if (!window.YipnyapStateCache) window.YipnyapStateCache = {}
        window.YipnyapStateCache[`FetchCache:${name}`] = {}

        const url = `${API_URL}${name}`
        return await FETCH_BASE(url, options, posthog)
    },

    post: (name: string, options: RequestInit = {}, posthog?: PostHog) => {
        const url = `${API_URL}${name}/`
        return FETCH_BASE(url, {
            ...options,
            method: 'POST',
        }, posthog)
    },

    put: (name: string, options: RequestInit = {}, posthog?: PostHog) => {
        const url = `${API_URL}${name}/`
        return FETCH_BASE(url, {
            ...options,
            method: 'PUT',
        }, posthog)
    },

    delete: (name: string, options: RequestInit = {}, posthog?: PostHog) => {
        const url = `${API_URL}${name}/`
        return FETCH_BASE(url, {
            ...options,
            method: 'DELETE',
        }, posthog)
    },
}