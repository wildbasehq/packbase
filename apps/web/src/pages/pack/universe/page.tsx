/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PackFeedController from '@/pages/pack/components.tsx'
import { Protect } from '@clerk/clerk-react'

export default function UniversePack({ useEverythingQuery }: { useEverythingQuery?: boolean }) {
    return (
        <>
            <Protect>
                <PackFeedController
                    channelID={useEverythingQuery ? '0A' : null}
                    feedQueryOverride={useEverythingQuery ? '[Where posts:content_type ("markdown")]' : undefined}
                />
            </Protect>
        </>
    )
}
