/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useUIStore} from '@/lib'
import PackFeedController from '@/pages/pack/components'
import {useParams} from 'wouter'

export default function PackChannel() {
    let {channel} = useParams<{
        channel: string
    }>()
    const {navigation} = useUIStore()

    const currentChannel = navigation.find(nav => nav.id === channel)

    return <PackFeedController key={channel} channelID={channel} feedQueryOverride={currentChannel?.query}/>
}
