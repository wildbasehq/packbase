/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {FeedPageResult, fetchFeedPage, fetchFolderPage, fetchSearchPage} from '@/lib/api/feed'
import {useQuery} from '@tanstack/react-query'

interface UseFeedQueryProps {
    packID: string
    channelID?: string
    folderID?: string
    feedQueryOverride?: string
    page: number
    isSignedIn?: boolean
}

export function useFeedQuery({
                                 packID,
                                 channelID,
                                 folderID,
                                 feedQueryOverride,
                                 page,
                                 isSignedIn,
                             }: UseFeedQueryProps) {
    const hasChannelID = Boolean(channelID)
    const hasFeedQuery = Boolean(feedQueryOverride)
    const isFolder = Boolean(folderID)
    const isSearch = hasChannelID || hasFeedQuery
    const queryKey = isSearch ? ['search', channelID, feedQueryOverride, page] : isFolder ? ['folder', folderID, page] : ['feed', packID, page]

    const {data, error, isLoading, refetch} = useQuery<FeedPageResult>({
        // but this stops that behaviour.
        retryOnMount: false,
        queryKey,
        queryFn: async () => {
            if (isSearch) {
                console.log('Fetching search page', {channelID, feedQueryOverride, page})
                return fetchSearchPage({
                    channelID: channelID!,
                    q: feedQueryOverride,
                    page,
                })
            } else if (isFolder) {
                console.log('Fetching folder page', {folderID, page})
                return fetchFolderPage({
                    folderID: folderID!,
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
