// export const API_URL = (typeof window !== 'undefined' ? (
//     window.location.hostname === 'localhost'
//         ? 'http://localhost/api/'
//         : `${window.location.protocol}//api.${window.location.hostname.replace('www.', '')}/api/`) : '/api/') + 'v2/';
import VoyageSDK from 'voyagesdk-ts'
import {useUIStore} from '@/lib/states.ts'
import './cron/profile-update.ts'
import {getSelfProfile} from '@/lib/api/cron/profile-update.ts'

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

export const setToken = (token?: string, expires_in?: number) => {
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

    if (expires_in) {
        clearTimeout(refreshTimer)
        refreshTimer = setTimeout(refreshSession, expires_in * 1000)
        log.info('Wild ID', 'Token set, will refresh in', expires_in)
    } else {
        clearTimeout(refreshTimer)
    }

    completeWorker('voyage-initiate')
}

const refreshSession = async () => {
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

    setTimeout(refreshSession, session.expires_in * 1000)
    log.info('Wild ID', 'Token refreshed, will refresh in', session.expires_in)
}
