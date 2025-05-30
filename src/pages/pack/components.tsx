// src/components/pages/pack-feed-controller.tsx
import { useEffect, useState } from 'react'
import { useResourceStore, useUserAccountStore } from '@/lib/state'
import PackHeader from '@/components/shared/pack/header'
import { Feed } from '@/components/feed'

// Animation asset
import { useModal } from '@/components/modal/provider.tsx'

interface PackFeedControllerProps {
    overrideFeedID?: string
}

export default function PackFeedController({ overrideFeedID }: PackFeedControllerProps) {
    const { user } = useUserAccountStore()
    const { currentResource } = useResourceStore()
    const { show } = useModal()

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
