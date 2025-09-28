/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed.tsx
import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'wouter'
import { useSession } from '@clerk/clerk-react'
import { useResourceStore, useUIStore } from '@/lib/state'
import { setToken } from '@/lib'
import { FeedProps } from './types/feed'
import { fetchFeedPage, fetchSearchPage, FeedPageResult } from './fetchers'
import FeedList from './feed-list'
import FeedLoading from './feed-loading'
import FeedMaintenance from './feed-maintenance'
import FeedError from './feed-error'
import useWindowSize from '@/lib/hooks/use-window-size.ts'
import { FloatingCompose } from './index'
import { useLocalStorage } from 'usehooks-ts'

export default function Feed({
    packID = '00000000-0000-0000-0000-000000000000',
    channelID,
    feedQueryOverride,
    titleOverride,
    dontShowCompose,
}: FeedProps) {
    const { maintenance } = useUIStore()
    const { currentResource } = useResourceStore()
    const { session, isSignedIn } = useSession()
    const [userSidebarCollapsed, setUserSidebarCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)
    const queryClient = useQueryClient()
    const prevPackIDRef = useRef(packID)
    const prevChannelIDRef = useRef(channelID)

    const { isMobile } = useWindowSize()

    // Read page from URL
    const [searchParams, setSearchParams] = useSearchParams()
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1
    const setPage = (newPage: number) => setSearchParams({ page: newPage.toString() })

    // Determine if this is a search or feed query
    const isSearch = !!channelID || !!feedQueryOverride
    const queryKey = isSearch ? ['search', channelID, feedQueryOverride, page] : ['feed', packID, page]

    // Single query for the current page
    const { data, isLoading, error } = useQuery<FeedPageResult>({
        queryKey,
        queryFn: async () => {
            if (isSearch) {
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
        placeholderData: previousData => previousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const posts = data?.posts || []
    const hasMore = data?.hasMore || false

    useEffect(() => {
        document.title = `${titleOverride || currentResource?.display_name || (currentResource?.id?.startsWith('0000') ? 'Home' : 'Packbase')} • P${page}`
    }, [page, titleOverride, currentResource])

    // Reset to page 1 when packID or channelID changes
    useEffect(() => {
        if (packID !== prevPackIDRef.current || channelID !== prevChannelIDRef.current) {
            prevPackIDRef.current = packID
            prevChannelIDRef.current = channelID
            setPage(1)
        }
    }, [packID, channelID, setPage])

    useEffect(() => {
        if (dontShowCompose) {
            setUserSidebarCollapsed(false)
        }
    }, [dontShowCompose])

    // Handle post deletion
    const handleDeletePost = (_postId: string) => {
        // Invalidate current page query to refresh
        queryClient.invalidateQueries({ queryKey })
    }

    // Handle load more for pagination
    const handleLoadMore = async (requestedPage: number): Promise<void> => {
        // Navigate to the requested page
        setPage(requestedPage)
    }

    // Handle compose refresh - invalidate base query keys
    const handleComposeRefresh = async (): Promise<void> => {
        const baseKey = isSearch ? ['search', channelID, feedQueryOverride] : ['feed', packID]
        await queryClient.invalidateQueries({ queryKey: baseKey, exact: false })
    }

    if (maintenance) {
        return <FeedMaintenance message={maintenance} />
    }

    if (error) {
        return <FeedError error={error as Error} />
    }

    let content
    if (isLoading && page === 1) {
        content = <FeedLoading isMasonry={false} message="Loading howls..." />
    } else {
        content = <FeedList posts={posts} hasMore={hasMore} onLoadMore={handleLoadMore} onPostDelete={handleDeletePost} />
    }

    return (
        <div className="relative pb-20 max-w-3xl space-y-4 mx-auto">
            {!dontShowCompose && <FloatingCompose onShouldFeedRefresh={handleComposeRefresh} />}

            {/* Main content area */}
            {content}
        </div>
    )
}
