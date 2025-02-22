// export const API_URL = (typeof window !== 'undefined' ? (
//     window.location.hostname === 'localhost'
//         ? 'http://localhost/api/'
//         : `${window.location.protocol}//api.${window.location.hostname.replace('www.', '')}/api/`) : '/api/') + 'v2/';
import VoyageSDK from 'voyagesdk-ts'
import {useUIStore} from '@/lib/states.ts'
import {getSelfProfile} from '@/lib/api/cron/profile-update.ts'

import './cron/check-update.ts'

/**
 * The name of the project. All Wildbase projects should have a name
 * outside the final product name. Should be sent with telemetry and
 * all requests to the server.
 *
 * @projectName Korat
 * @since 24-05-2024
 * @specific Yipnyap (AKA Korat) v4 (Honeybear)
 * @authors @rek
 */
export const ProjectName = `Project Korat`
export const ProjectSafeName = 'Packbase'
export const ProjectDeps = ['scalebite', 'ypnyp', 'feral']

export const API_URL = import.meta.env.VITE_YAPOCK_URL
let TOKEN: string | undefined

export let {supabase, vg} = new VoyageSDK(API_URL, {
    supabase: {
        URL: import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
})

const {queueWorker, completeWorker} = useUIStore.getState()

let refreshTimer

export const setToken = (token?: string, expires_at?: number) => {
    queueWorker('voyage-initiate')
    TOKEN = token
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

    completeWorker('voyage-initiate')
}

export const refreshSession = async () => {
    if (!TOKEN) return
    queueWorker('refresh-session')
    const {data, error} = await supabase.auth.refreshSession()
    const {session, user} = data || {}
    if (error || !session) {
        alert('Oops! Voyage lost this session, your page will refresh')
        window.location.reload()
    }

    completeWorker('refresh-session')
    setToken(session?.access_token)

    getSelfProfile()

    log.info('Wild ID', 'Token refreshed, will refresh in', session.expires_in)
}
