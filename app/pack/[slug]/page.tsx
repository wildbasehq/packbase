'use client'
import dynamic from 'next/dynamic'
import PackFeedController from '@/app/pack/components'
import {useUserAccountStore} from '@/lib/states'

const GuestLanding = dynamic(() => import('@/components/home/guestlanding'))

export default function Home() {
    const { user } = useUserAccountStore()

    if (!user) return <GuestLanding />
    return <PackFeedController />
}
