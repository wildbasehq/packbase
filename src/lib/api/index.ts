// export const API_URL = (typeof window !== 'undefined' ? (
//     window.location.hostname === 'localhost'
//         ? 'http://localhost/api/'
//         : `${window.location.protocol}//api.${window.location.hostname.replace('www.', '')}/api/`) : '/api/') + 'v2/';
import VoyageSDK from 'voyagesdk-ts'
import { getSelfProfile } from '@/lib/api/cron/profile-update.ts'

import './cron/check-update.ts'
import { WorkerStore } from '@/lib/workers'

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

export const API_URL = import.meta.env.VITE_YAPOCK_URL

export let { supabase, vg } = new VoyageSDK(API_URL, {
    supabase: {
        URL: import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
})

const { enqueue } = WorkerStore.getState()

let refreshTimer

export const setToken = (token?: string, expires_at?: number) => {
    enqueue('voyage-initiate', async () => {
        globalThis.TOKEN = token
        let newClient = new VoyageSDK(API_URL, {
            token,
            supabase: {
                URL: import.meta.env.VITE_SUPABASE_URL,
                key: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
        })
        vg = newClient.vg
        supabase = newClient.supabase

        if (expires_at) {
            log.info('Wild ID', 'Token set, will refresh at', expires_at)
            if (refreshTimer) clearInterval(refreshTimer)
            refreshTimer = setInterval(() => {
                // Check if date passed
                if (new Date().getTime() >= expires_at) {
                    refreshSession()
                }
            }, 60000)
        } else {
            clearInterval(refreshTimer)
        }
    })
}

export const refreshSession = async () => {
    if (!globalThis.TOKEN) return
    enqueue('refresh-session', async () => {
        const { data, error } = await supabase.auth.refreshSession()
        const { session, user } = data || {}
        if (error || !session) {
            alert('Oops! Voyage lost this session, your page will refresh')
            window.location.reload()
        }

        setToken(session?.access_token)

        getSelfProfile()

        log.info('Wild ID', 'Token refreshed, will refresh in', session.expires_in)
    })
}
