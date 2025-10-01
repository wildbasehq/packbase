/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useUIStore} from '@/lib'

window.onload = () => {
    const {setUpdateAvailable} = useUIStore.getState()

    if (globalThis.check_update_cron) clearInterval(globalThis.check_update_cron)
    globalThis.check_update_cron = setInterval(async () => {
        const c = import.meta.env.CF_PAGES_COMMIT_SHA
        const response = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/server/fwupd/check?c=${c}`)
        const {u, s} = await response.json()

        if (u) {
            setUpdateAvailable(s)
        }
    }, 10000)
}