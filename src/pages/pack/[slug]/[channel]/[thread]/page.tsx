/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useParams } from 'wouter'

export default function PackChannelThread() {
    const { id } = useParams<{ id: string }>()

    return <span>threads not yet available. sorry~</span>
}
