'use client'
import FeedList from '@/components/shared/feed/list'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/states'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Heading } from '@/components/shared/text'
import { Button } from '@/components/shared/ui/button'
import { LayoutDashboard } from 'lucide-react'

const GuestLanding = dynamic(() => import('@/components/home/guestlanding'))
const PackHeader = dynamic(() => import('@/components/shared/pack/header'))

export default function Home({ params }: { params: { slug: string } }) {
    const { user } = useUserAccountStore()
    const { setHidden } = useUIStore()
    const { currentResource } = useResourceStore()

    const [showFeed, setShowFeed] = useState(false)
    const [shadowSize, setShadowSize] = useState(0)
    const [changingView, setChangingView] = useState(false)
    // const Lottie = memo(dynamic(() => import('lottie-react'), { ssr: false, suspense: true }))

    useEffect(() => {
        if (!user) setHidden(true)
        if (user && !user.anonUser) setShowFeed(true)
    }, [user])

    // Scroll detection
    useEffect(() => {
        const root = document.getElementById('NGRoot')
        const handleScroll = () => {
            // Max size of shadow is 20px, spread over 100px of scroll  (0.2px per scroll)
            setShadowSize(Math.min(20, root.scrollTop * 0.1))
        }

        root.addEventListener('scroll', handleScroll)
        return () => root.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <>
            {!user && <GuestLanding />}

            {currentResource && currentResource?.slug !== 'universe' && <PackHeader pack={currentResource} />}

            {showFeed && (
                <div className="flex flex-col">
                    {/* Header */}
                    {currentResource && currentResource?.slug === 'universe' && (
                        <div
                            className="bg-sidebar sticky top-0 z-10 flex items-center justify-between border-b px-8 py-3 backdrop-blur"
                            // shadow based on shadowSize value
                            style={{ boxShadow: `0 0 ${shadowSize}px 0 rgba(0, 0, 0, 0.1)` }}
                        >
                            <Heading>Your Galaxy</Heading>
                            <Button className="items-center" onClick={() => setChangingView(true)}>
                                <LayoutDashboard className="mr-1 h-6 w-6" />
                                Change view
                            </Button>
                        </div>
                    )}

                    <div className="p-8">
                        <FeedList packID={currentResource.id} changingView={changingView} setChangingView={setChangingView} />
                    </div>
                </div>
            )}
        </>
    )
}
