'use client'
// export const API_URL = (typeof window !== 'undefined' ? (
//     window.location.hostname === 'localhost'
//         ? 'http://localhost/api/'
//         : `${window.location.protocol}//api.${window.location.hostname.replace('www.', '')}/api/`) : '/api/') + 'v2/';
import {ProjectDeps, ProjectName} from '@/lib/utils'
import {createClient} from '@/lib/supabase/client'

export const API_URL = process.env.NEXT_PUBLIC_YAPOCK_URL
let TOKEN: string | undefined

const FETCH_BASE = async (url: string, options: RequestInit = {}) => {
    const supabase = createClient()
    TOKEN = (await supabase.auth.getSession()).data.session?.access_token
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
        headers,
        ...options,
    }

    const response = await fetch(url, defaultOptions)
    const data = await response.json()
    switch (response.status) {
        case 401:
            throw new Error(data.message || 'UNAUTHORIZED')
        case 403:
            throw new Error(data.message || 'FORBIDDEN')
        // case 404:
        // throw new Error(data.message || 'NOT_FOUND')
        case 500:
            throw new Error(data.message || 'INTERNAL_SERVER_ERROR')
        default:
            break
    }

    return {
        data,
        status: response.status,
    }
}

export const FetchHandler = {
    API_URL,
    TOKEN,
    get: async (name: string, options: RequestInit = {}) => {
        const url = `${API_URL}${name}`
        return await FETCH_BASE(url, options)
    },

    post: (name: string, options: RequestInit = {}) => {
        const url = `${API_URL}${name}/`
        return FETCH_BASE(url, {
            ...options,
            method: 'POST',
        })
    },

    put: (name: string, options: RequestInit = {}) => {
        const url = `${API_URL}${name}/`
        return FETCH_BASE(url, {
            ...options,
            method: 'PUT',
        })
    },

    delete: (name: string, options: RequestInit = {}) => {
        const url = `${API_URL}${name}/`
        return FETCH_BASE(url, {
            ...options,
            method: 'DELETE',
        })
    },
}