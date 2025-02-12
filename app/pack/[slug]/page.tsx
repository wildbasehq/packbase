'use client'
import FeedList from '@/components/shared/feed/list'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/states'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const GuestLanding = dynamic(() => import('@/components/home/guestlanding'))
const PackHeader = dynamic(() => import('@/components/shared/pack/header'))

export default function Home({ params }: { params: { slug: string } }) {
    const { user } = useUserAccountStore()
    const { setHidden } = useUIStore()
    const { currentResource } = useResourceStore()
    // const Lottie = memo(dynamic(() => import('lottie-react'), { ssr: false, suspense: true }))

    useEffect(() => {
        if (!user) setHidden(true)
    }, [user])

    return (
        <>
            {!user && <GuestLanding />}

            {currentResource && currentResource?.slug !== 'universe' && <PackHeader pack={currentResource} />}

            {user && !user.anonUser && (
                <div className="p-8">
                    <FeedList packID={currentResource.id} />
                </div>
            )}
        </>
    )
}
