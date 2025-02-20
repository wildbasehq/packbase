'use client'
import PackFeedController from '../../pack/components'
import {useUIStore, useUserAccountStore} from '@/lib/states'
import {useEffect} from 'react'
import GuestLanding from '@/components/home/guestlanding.tsx'

export default function PackHome() {
    const {user} = useUserAccountStore()
    const {setHidden} = useUIStore()

    useEffect(() => {
        if (!user || user?.anonUser) setHidden(true)
    }, [user])

    if (!user) return <GuestLanding/>
    return <PackFeedController/>
}
