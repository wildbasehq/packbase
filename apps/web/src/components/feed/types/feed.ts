/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {ReactNode} from 'react'
import {FeedPostData} from './post'

export interface FeedProps {
    packID?: string
    channelID?: string
    feedQueryOverride?: string
    titleOverride?: string
    dontShowCompose?: boolean
}

export interface FeedListProps {
    posts: FeedPostData[]
    pages?: number
    hasMore?: boolean
    onPostDelete: (postId: string) => void
}

export interface FeedLoadingProps {
    message?: string | ReactNode
    isMasonry?: boolean
}

export interface FeedEmptyProps {
    message?: string
}

export interface FeedMaintenanceProps {
    message?: string
}

export interface FeedErrorProps {
    error: Error
}
