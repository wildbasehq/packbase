/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PackFeedController from '../../../pack/components'
import { useParams } from 'wouter'

export default function UniverseEverything() {
    let { channel } = useParams<{
        channel: string
    }>()

    return <PackFeedController key={channel} channelID={channel} />
}
