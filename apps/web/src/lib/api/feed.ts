/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {vg} from '@/lib/api'
import {FeedPostData} from '@/src/components'

export interface FeedPageResult {
    posts: FeedPostData[] | {
        [key: string]: FeedPostData[]
    },
    hasMore: boolean
}

export interface FeedPageParams {
    packID: string
    page: number
}

export interface SearchPageParams {
    tagsSplit?: string[]
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

export async function fetchSearchPage({channelID, q, page, tagsSplit}: SearchPageParams): Promise<FeedPageResult> {
    const take = 5
    const skip = (page - 1) * take

    let query = q
    if (!query) {
        if (tagsSplit?.length > 0) {
            query = tagsSplit.map((tag) => {
                return `$${tag} = [Where posts:channel_id ("${channelID}") AND posts:tags ("${tag}")] | PAGE({SKIP}, {TAKE}) | BULKPOSTLOAD() AS *;`
            }).join('\n')
        } else {
            query = `$posts = [Where posts:channel_id ("${channelID}")] | PAGE({SKIP}, {TAKE}) | BULKPOSTLOAD() AS *;`
        }
    }

    const formattedQuery = query
        .replaceAll('{SKIP}', skip.toString())
        .replaceAll('{TAKE}', take.toString())

    const response = await vg.search.get({query: {page, q: formattedQuery}})

    if (tagsSplit?.length > 0) {
        const postsByTag: { [key: string]: FeedPostData[] } = {}

        for (const tag of tagsSplit) {
            postsByTag[tag] = response.data?.[tag] || []
        }

        return {
            posts: postsByTag,
            hasMore: response.data?.has_more || false,
        }
    }

    return {
        posts: response.data?.posts || [],
        hasMore: response.data?.has_more || false,
    }
}
