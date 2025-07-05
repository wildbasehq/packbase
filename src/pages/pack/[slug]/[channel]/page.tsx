/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PackFeedController from '../../../pack/components'
import { useParams } from 'wouter'
import { useUIStore } from '@/lib'

export default function PackChannel() {
    let { channel } = useParams<{
        channel: string
    }>()
    const { navigation } = useUIStore()

    const currentChannel = navigation.find(nav => nav.id === channel)

    return <PackFeedController key={channel} channelID={channel} feedQueryOverride={currentChannel?.query} />
}
