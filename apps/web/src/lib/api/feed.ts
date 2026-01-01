/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {vg} from '@/lib/api'
import {FeedPostData} from '@/src/components'

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

export async function fetchFolderPage({folderID, page = 1}: { folderID: string; page: number }): Promise<FeedPageResult> {
    const response = await vg.folder({id: folderID}).query.get({query: {page}})

    return {
        posts: response.data?.results || [],
        hasMore: response.data?.has_more || false,
    }
}

export async function fetchSearchPage({channelID, q, page}: SearchPageParams): Promise<FeedPageResult> {
    const take = 5
    const skip = (page - 1) * take
    const query = (q || `$posts = @BULKPOSTLOAD(@PAGE({SKIP}, {TAKE}, [Where posts:channel_id ("${channelID}")]))`)
        .replaceAll('{SKIP}', skip.toString())
        .replaceAll('{TAKE}', take.toString())
    const response = await vg.search.get({query: {page, q: query}})

    return {
        posts: response.data?.posts || [],
        hasMore: response.data?.posts_has_more || false,
    }
}
