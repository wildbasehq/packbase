/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// export const API_URL = (typeof window !== 'undefined' ? (
//     window.location.hostname === 'localhost'
//         ? 'http://localhost/api/'
//         : `${window.location.protocol}//api.${window.location.hostname.replace('www.', '')}/api/`) : '/api/') + 'v2/';
import VoyageSDK from 'voyagesdk-ts'

// import './cron/check-update.ts'
import {WorkerStore} from '@/lib/workers'
import {formatRelativeTime} from '../utils/date.ts'

/**
 * The name of the project. All Wildbase projects should have a name
 * outside the final product name. Should be sent with telemetry and
 * all requests to the server.
 *
 * @projectName Korat
 * @subcode Honeybear
 * @since 24-05-2024
 * @authors @rek
 */
export const ProjectName = `Project Korat Honeybear`
export const ProjectSafeName = 'Packbase'

export const API_URL = localStorage.getItem('api_url') || import.meta.env.VITE_YAPOCK_URL

// if url has query param 'api_override' then set localStorage and reload with no query param
if (window.location.search.includes('api_override=')) {
    const overrideUrl = window.location.search.split('api_override=')[1]
    if (overrideUrl) {
        localStorage.setItem('api_url', overrideUrl)
        window.location.href = window.location.href.split('?')[0]
    }
}

export let {vg} = new VoyageSDK(API_URL, {
    supabase: {
        client: {},
    },
})

const {enqueue} = WorkerStore.getState()

export const setToken = (token?: string) => {
    // skip if token is the same
    if (globalThis.TOKEN === token) return

    // enqueue('voyage-initiate', async () => {
    globalThis.TOKEN = token
    let newClient = new VoyageSDK(API_URL, {
        token,
        supabase: {
            client: {},
        },
    })
    vg = newClient.vg

    // Expose SDK for plugin development
    // @ts-ignore womp womp, we dont use this internally. for extension development.
    window.voyageSDK = newClient

    // Emit authentication event for plugins
    if (window.Packbase) {
        window.Packbase.emit('user:auth:changed', {authenticated: !!token})
    }
    // })
}

export const refreshSession = async () => {
    const timeToKnock = globalThis.LAST_TOKEN_REFRESHED + 30000 - Date.now()
    if (!globalThis.TOKEN || timeToKnock > 0) return

    log.info('Wild ID', `↻ Token last knocked ${formatRelativeTime(globalThis.LAST_TOKEN_REFRESHED)}`)
    const oldToken = globalThis.TOKEN
    enqueue(
        'refresh-session',
        async () => {
            globalThis.LAST_TOKEN_REFRESHED = Date.now()
            // @ts-ignore
            const token = await window.Clerk?.session.getToken()
            if (!token) {
                alert('Oops! Voyage lost this session, your page will refresh')
                window.location.reload()
            }

            const hasTokenChanged = oldToken !== token
            log.info('Wild ID', 'Token knocked, changed? ', hasTokenChanged)
            if (hasTokenChanged) {
                setToken(token)

                // getSelfProfile()
            }
        },
        {
            priority: 'critical',
        }
    )
}

setInterval(refreshSession, 1000)
