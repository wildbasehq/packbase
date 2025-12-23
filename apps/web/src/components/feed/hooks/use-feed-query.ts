/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useQuery } from '@tanstack/react-query'
import { FeedPageResult, fetchFeedPage, fetchSearchPage } from '../../../lib/api/feed'

interface UseFeedQueryProps {
    packID: string
    channelID?: string
    feedQueryOverride?: string
    page: number
    isSignedIn?: boolean
}

export function useFeedQuery({
    packID,
    channelID,
    feedQueryOverride,
    page,
    isSignedIn,
}: UseFeedQueryProps) {
    const hasChannelID = Boolean(channelID)
    const hasFeedQuery = Boolean(feedQueryOverride)
    const isSearch = hasChannelID || hasFeedQuery
    const queryKey = isSearch ? ['search', channelID, feedQueryOverride, page] : ['feed', packID, page]

    const { data, error, isLoading, refetch } = useQuery<FeedPageResult>({
        // but this stops that behaviour.
        retryOnMount: false,
        queryKey,
        queryFn: async () => {
            if (isSearch) {
                console.log('Fetching search page', { channelID, feedQueryOverride, page })
                return fetchSearchPage({
                    channelID: channelID!,
                    q: feedQueryOverride,
                    page,
                })
            } else {
                return fetchFeedPage({
                    packID,
                    page,
                })
            }
        },
        enabled: isSignedIn,
        // placeholderData: previousData => previousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const posts = data?.posts ?? []
    const hasMore = data?.hasMore ?? false

    return {
        posts,
        hasMore,
        isLoading,
        error,
        isSearch,
        queryKey,
    }
}
