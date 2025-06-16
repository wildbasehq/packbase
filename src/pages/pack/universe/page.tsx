/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PackFeedController from '@/pages/pack/components.tsx'
import { Protect } from '@clerk/clerk-react'

export default function UniversePack() {
    return (
        <>
            <Protect>
                <PackFeedController />
            </Protect>
        </>
    )
}
