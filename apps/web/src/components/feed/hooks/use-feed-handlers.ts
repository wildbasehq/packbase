/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useQueryClient} from '@tanstack/react-query'

interface UseFeedHandlersProps {
    queryKey: unknown[]
    isSearch: boolean
    channelID?: string
    feedQueryOverride?: string
    packID: string
    setPage: (page: number) => void
}

export function useFeedHandlers({
    queryKey,
    isSearch,
    channelID,
    feedQueryOverride,
    packID,
    setPage,
}: UseFeedHandlersProps) {
    const queryClient = useQueryClient()

    const handleDeletePost = (_postId: string) => {
        queryClient.invalidateQueries({queryKey}).catch(error => {
            console.error(error)
        })
    }

    const handleLoadMore = async (requestedPage: number): Promise<void> => {
        setPage(requestedPage)
    }

    const handleComposeRefresh = async (): Promise<void> => {
        const baseKey = isSearch ? ['search', channelID, feedQueryOverride] : ['feed', packID]
        await queryClient.invalidateQueries({queryKey: baseKey, exact: false})
    }

    return {
        handleDeletePost,
        handleLoadMore,
        handleComposeRefresh,
    }
}
