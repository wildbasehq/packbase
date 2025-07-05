/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { FeedPostData } from './post'

export type FeedViewType = 1 | 2 // Legacy - may be removed

export interface FeedViewOption {
    id: FeedViewType
    name: string
    icon: React.FC<React.SVGProps<SVGSVGElement>>
    unavailable?: boolean
}

export interface FeedProps {
    packID?: string
    channelID?: string
}

export interface FeedState {
    posts: FeedPostData[]
    isLoading: boolean
    hasMore: boolean
    currentPage: number
    error: Error | null
}

export interface FeedHeaderProps {
    onViewChange: () => void
    postsCount: number
    hasMore: boolean
}

export interface FeedViewControlsProps {
    onClose: () => void
    currentView: FeedViewType
    onViewChange: (view: FeedViewType) => void
}

export interface FeedListProps {
    posts: FeedPostData[]
    hasMore: boolean
    onLoadMore: () => void
    onPostDelete: (postId: string) => void
}

export interface FeedLoadingProps {
    message?: string | React.ReactNode
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
