// export const API_URL = (typeof window !== 'undefined' ? (
//     window.location.hostname === 'localhost'
//         ? 'http://localhost/api/'
//         : `${window.location.protocol}//api.${window.location.hostname.replace('www.', '')}/api/`) : '/api/') + 'v2/';
import {createClient} from '@/lib/supabase/client'
import VoyageSDK from 'voyagesdk-ts'

export const API_URL = import.meta.env.VITE_PUBLIC_YAPOCK_URL
let TOKEN: string | undefined

export const supabase = createClient()

export let {vg} = new VoyageSDK(API_URL, {
    supabase: {
        client: createClient(),
    },
})

export const setToken = (token?: string) => {
    TOKEN = token
    let newClient = new VoyageSDK(API_URL, {
        token,
        supabase: {
            client: createClient(),
        },
    })
    vg = newClient.vg
}
