// src/components/pages/pack-feed-controller.tsx
import {useEffect, useState} from 'react'
import {useResourceStore, useUserAccountStore} from '@/lib/states'
import Lottie from 'lottie-react'

import Body from '@/components/layout/body'
import {Heading, Text} from '@/components/shared/text'
import Link from '@/components/shared/link'
import { Button } from '@/components/shared/experimental-button-rework'
import PackHeader from '@/components/shared/pack/header'
import { Feed } from '@/components/feed'

// Animation asset
import girlDogBusStop from '@/datasets/lottie/girl-dog-bus-stop.json'

interface PackFeedControllerProps {
    overrideFeedID?: string
}

export default function PackFeedController({ overrideFeedID }: PackFeedControllerProps) {
    const { user } = useUserAccountStore()
    const { currentResource } = useResourceStore()

    const [shadowSize, setShadowSize] = useState(0)
    const [viewSettingsOpen, setViewSettingsOpen] = useState(false)

    // Determine feed ID based on context
    const feedID = overrideFeedID || (currentResource?.slug === 'universe' ? 'universe:home' : currentResource?.id)

    // Only show feed to authenticated users
    const isAuthenticated = user && !user?.anonUser

    // Handle scroll detection for header shadow
    useEffect(() => {
        const root = document.getElementById('NGRoot')
        if (!root) return

        const handleScroll = () => {
            // Max size of shadow is 16px, spread over 160px of scroll (0.1px per scroll)
            setShadowSize(Math.min(16, root.scrollTop * 0.1))
        }

        root.addEventListener('scroll', handleScroll)
        return () => root.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="relative min-h-screen">
            {/* Pack header (if in a specific pack) */}
            {currentResource && currentResource?.slug !== 'universe' && <PackHeader pack={currentResource} />}

            {/* Guest view - login prompt */}
            {!isAuthenticated && (
                <Body className="max-w-6xl py-12">
                    <div className="grid items-center grid-cols-1 gap-8 lg:grid-cols-2">
                        <div className="flex flex-col space-y-6">
                            <Heading size="xl" className="text-neutral-900 dark:text-neutral-100">
                                All there's left is to wait.
                            </Heading>

                            <div className="space-y-4">
                                <Text className="text-neutral-700 dark:text-neutral-300">
                                    If you'd like to participate with the community, you'll need an invite from someone, wait for a
                                    completely random invite drop into your inbox, or wait for us to open up.{' '}
                                    <span className="font-medium">
                                        You can view packs and profiles, but howls and other data will be completely inaccessible!
                                    </span>
                                </Text>

                                <Text className="text-neutral-600 dark:text-neutral-400">
                                    If you don't know anyone already in, your best bet is to wait.{' '}
                                    <span className="text-amber-600 dark:text-amber-400">
                                        If you've traded anything for an invite, you've been scammed.
                                    </span>
                                </Text>

                                <div className="pt-2">
                                    <Button color="indigo" href="/settings">
                                        I have an invite code!
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end justify-center lg:justify-end">
                            <Lottie className="w-auto h-80" animationData={girlDogBusStop} />
                        </div>
                    </div>
                </Body>
            )}

            {/* Authenticated view - feed display */}
            {isAuthenticated && (
                <div className="flex flex-col">
                    {/* Feed container */}
                    <div className="p-4 sm:p-8">
                        <Feed packID={feedID} />
                    </div>
                </div>
            )}
        </div>
    )
}