'use client'
import {useResourceStore, useUserAccountStore} from '@/lib/states'
import {memo, useEffect, useState} from 'react'
import dynamic from 'next/dynamic'
import Body from '@/components/layout/body'
import {Heading, Text} from '@/components/shared/text'
import Link from '@/components/shared/link'
import {Button} from '@/components/shared/experimental-button-rework'
import girlDogBusStop from '@/datasets/lottie/girl-dog-bus-stop.json'
import {LayoutDashboard} from 'lucide-react'
import FeedList from '@/components/shared/feed/list'

const PackHeader = dynamic(() => import('@/components/shared/pack/header'))

export default function PackFeedController({overrideFeedID}: { overrideFeedID?: string }) {
    const {user} = useUserAccountStore()
    const {currentResource} = useResourceStore()

    const [showFeed, setShowFeed] = useState(false)
    const [shadowSize, setShadowSize] = useState(0)
    const [changingView, setChangingView] = useState(false)
    const Lottie = memo(dynamic(() => import('lottie-react'), {ssr: false}))

    useEffect(() => {
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
            {currentResource && currentResource?.slug !== 'universe' && <PackHeader pack={currentResource}/>}

            {user?.anonUser && (
                <Body className="max-w-6xl">
                    <div className="mb-12 grid max-w-6xl grid-cols-1 items-center justify-center gap-8 lg:grid-cols-2">
                        <div className="flex flex-col space-y-4">
                            <Heading size="xl">All there's left is to wait.</Heading>
                            <div className="space-y-2">
                                <Text size="sm">
                                    If you'd like to participate with the community, you'll need an invite from someone, wait for a completely random invite drop into
                                    your inbox, or wait for us to open up. <b>You can view packs and profiles, but howls and other data will be completely
                                    inaccessible!</b>
                                    <br/>
                                    <br/>
                                    If you don't know anyone already in, your best bet is to wait.{' '}
                                    <span className="text-tertiary">If you've traded anything for an invite, you've been scammed.</span>
                                </Text>

                                <Link href="/settings">
                                    <Button color="indigo">I got a code!! yay!</Button>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-end justify-end">
                            <Lottie className="right-0 h-80 w-auto" animationData={girlDogBusStop}/>
                        </div>
                    </div>
                </Body>
            )}

            {showFeed && (
                <div className="flex flex-col">
                    {/* Header */}
                    {currentResource && currentResource?.slug === 'universe' && (
                        <div
                            className="sticky hidden sm:flex top-0 z-10 items-center justify-between border-b px-8 py-2 backdrop-blur-sm bg-white/95 dark:bg-zinc-900/95"
                            // shadow based on shadowSize value
                            style={{boxShadow: `0 0 ${shadowSize}px 0 rgba(0, 0, 0, 0.1)`}}
                        >
                            <Heading>Your Galaxy</Heading>
                            <Button plain className="items-center" onClick={() => setChangingView(true)}>
                                <LayoutDashboard className="mr-1 h-6 w-6"/>
                                Change view
                            </Button>
                        </div>
                    )}

                    <div className="p-8">
                        <FeedList packID={overrideFeedID || (currentResource?.slug === 'universe' ? 'universe:home' : currentResource?.id)} changingView={changingView}
                                  setChangingView={setChangingView}/>
                    </div>
                </div>
            )}
        </>
    )
}