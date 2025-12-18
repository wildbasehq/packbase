/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {vg} from '@/lib/api'
import {FeedPostData} from './types/post'

export interface FeedPageResult {
    posts: FeedPostData[]
    hasMore: boolean
}

export interface FeedPageParams {
    packID: string
    page: number
}

export interface SearchPageParams {
    channelID: string
    q?: string
    page: number
}

export async function fetchFeedPage({packID, page = 1}: FeedPageParams): Promise<FeedPageResult> {
    const response = await vg.feed({id: packID}).get({query: {page}})

    return {
        posts: response.data?.data || [],
        hasMore: response.data?.has_more || false,
    }
}

export async function fetchSearchPage({channelID, q, page}: SearchPageParams): Promise<FeedPageResult> {
    const query = q || `$posts = [Where posts:channel_id ("${channelID}")]`
    const response = await vg.search.get({query: {page, q: query}})

    return {
        posts: response.data?.data?.posts || [],
        hasMore: response.data?.has_more || false,
    }
}
