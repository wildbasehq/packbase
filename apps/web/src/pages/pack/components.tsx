/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useResourceStore} from '@/lib/state'
import {Feed} from '@/components/feed'
import {Protect} from '@clerk/clerk-react'

interface PackFeedControllerProps {
    overrideFeedID?: string
    channelID?: string
    feedQueryOverride?: string
}

export default function PackFeedController({overrideFeedID, channelID, feedQueryOverride}: PackFeedControllerProps) {
    const {currentResource} = useResourceStore()

    // Determine feed ID based on context
    const feedID = overrideFeedID || currentResource.id

    return (
        <Protect>
            <div className="relative">
                <div className="flex flex-col">
                    {/* Feed container */}
                    <div className="p-4 sm:p-8">
                        <Feed packID={feedID} channelID={channelID} feedQueryOverride={feedQueryOverride}/>
                    </div>
                </div>
            </div>
        </Protect>
    )
}
