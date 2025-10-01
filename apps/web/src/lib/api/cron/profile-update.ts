/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {vg} from '@/lib/api'
import {useResourceStore, useUserAccountStore, WorkerStore} from '@/lib'

const hasUserChanged = (userBuild: any): boolean => {
    const storedUser = JSON.parse(localStorage.getItem('user-account') || '{}').state?.user
    return JSON.stringify(userBuild) !== JSON.stringify(storedUser)
}

const havePacksChanged = (packs: any[]): boolean => {
    const storedPacks = localStorage.getItem('packs')
    return JSON.stringify(packs) !== storedPacks
}

const syncPacks = async (setResources: (packs: any[]) => void) => {
    const packs = (await vg.user.me.packs.get()).data || []

    if (havePacksChanged(packs)) {
        log.info('User Data', '↻ Packs data changed, updating...')
        localStorage.setItem('packs', JSON.stringify(packs))
        setResources(packs)
    } else {
        setResources(JSON.parse(localStorage.getItem('packs') || '[]'))
    }
}

const clearPacks = (setResources: (packs: any[]) => void) => {
    localStorage.removeItem('packs')
    setResources([])
}

const handleUserData = async (
    data: any,
    setUser: (user: any) => void,
    setResources: (packs: any[]) => void,
    enqueue: (key: string, fn: () => Promise<void>) => void
) => {
    log.info('User Data', 'Got:', data)

    if (!data) {
        // @ts-ignore
        window.Clerk.signOut()
        return
    }

    const hasUsername = Boolean(data.username)
    const userBuild = {
        id: data.id,
        username: data.username || 'new_here',
        display_name: data.display_name || 'new_here',
        reqOnboard: !hasUsername,
        dp: data.dp || {},
        anonUser: !hasUsername,
        ...data,
    }

    if (hasUserChanged(userBuild)) {
        log.info('User Data', '↻ User data changed, updating...')
        setUser(userBuild)
    }

    if (hasUsername) {
        enqueue('pack-sync', () => syncPacks(setResources))
    } else {
        clearPacks(setResources)
    }

    log.info('User Data', 'Syncing user data... Done')
}

export const getSelfProfile = (cb?: () => void) => {
    log.info('User Data', 'Syncing user data...')

    const {setUser} = useUserAccountStore.getState()
    const {enqueue} = WorkerStore.getState()
    const {setResources} = useResourceStore.getState()

    enqueue('account-sync', async () => {
        try {
            const {data} = await vg.user.me.get()
            await handleUserData(data, setUser, setResources, enqueue)
            cb?.()
        } catch (e) {
            log.error('User Data', 'Error:', e)
        }
    })
}
