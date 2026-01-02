/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useResourceStore, useUserAccountStore } from '@/lib/state'
import PackHeader from '@/components/shared/pack/header'
import { Feed } from '@/components/feed'

interface PackFeedControllerProps {
    overrideFeedID?: string
}

export default function PackFeedController({ overrideFeedID }: PackFeedControllerProps) {
    const { user } = useUserAccountStore()
    const { currentResource } = useResourceStore()

    // Determine feed ID based on context
    const feedID = overrideFeedID || (currentResource?.slug === 'universe' ? 'universe:home' : currentResource?.id)

    // Only show feed to authenticated users
    const isAuthenticated = user && !user?.anonUser

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
