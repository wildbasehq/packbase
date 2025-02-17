'use client'
import dynamic from 'next/dynamic'
import PackFeedController from '@/app/pack/components'
import {useUIStore, useUserAccountStore} from '@/lib/states'
import {useEffect} from 'react'

const GuestLanding = dynamic(() => import('@/components/home/guestlanding'))

export default function Home() {
    const { user } = useUserAccountStore()
    const { setHidden } = useUIStore()

    useEffect(() => {
        if (!user || user?.anonUser) setHidden(true)
    }, [user])

    if (!user) return <GuestLanding />
    return <PackFeedController />
}
