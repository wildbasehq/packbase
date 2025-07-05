/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useResourceStore } from '@/lib/state'
import PackHeader from '@/components/shared/pack/header'
import { Feed } from '@/components/feed'
import { Protect } from '@clerk/clerk-react'

interface PackFeedControllerProps {
    overrideFeedID?: string
    channelID?: string
}

export default function PackFeedController({ overrideFeedID, channelID }: PackFeedControllerProps) {
    const { currentResource } = useResourceStore()

    // Determine feed ID based on context
    const feedID = overrideFeedID || (currentResource?.slug === 'universe' ? 'universe:home' : currentResource?.id)

    return (
        <div className="relative min-h-screen">
            {/* Pack header (if in a specific pack) */}
            {currentResource && currentResource?.slug !== 'universe' && <PackHeader pack={currentResource} />}

            <Protect>
                <div className="flex flex-col">
                    {/* Feed container */}
                    <div className="p-4 sm:p-8">
                        <Feed packID={feedID} channelID={channelID} />
                    </div>
                </div>
            </Protect>
        </div>
    )
}
