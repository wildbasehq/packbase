/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed.tsx
import {useEffect} from 'react'
import {useSession} from '@clerk/clerk-react'
import {useResourceStore, useUIStore} from '@/lib/state'
import {FeedProps} from './types/feed'
import {FeedError, FeedList, FeedLoading, FeedMaintenance} from '.'
import {useLocalStorage} from 'usehooks-ts'
import {useFeedPagination} from './hooks/use-feed-pagination'
import {useFeedQuery} from './hooks/use-feed-query'
import {useFeedTitle} from './hooks/use-feed-title'
import {useFeedHandlers} from './hooks/use-feed-handlers'

export default function Feed({
                                 packID = '00000000-0000-0000-0000-000000000000',
                                 channelID,
                                 feedQueryOverride,
                                 titleOverride,
                                 dontShowCompose,
                             }: FeedProps) {
    const {maintenance} = useUIStore()
    const {currentResource} = useResourceStore()
    const {isSignedIn} = useSession()
    const [, setUserSidebarCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)

    const {page, setPage} = useFeedPagination({packID, channelID})

    const {posts, hasMore, isLoading, error, isSearch, queryKey} = useFeedQuery({
        packID,
        channelID,
        feedQueryOverride,
        page,
        isSignedIn,
    })

    useFeedTitle({
        page,
        titleOverride,
        currentResourceDisplayName: currentResource?.display_name,
        currentResourceId: currentResource?.id,
    })

    const {handleDeletePost, handleLoadMore, handleComposeRefresh} = useFeedHandlers({
        queryKey,
        isSearch,
        channelID,
        feedQueryOverride,
        packID,
        setPage,
    })

    useEffect(() => {
        const shouldCollapseSidebar = dontShowCompose === true
        if (shouldCollapseSidebar) {
            setUserSidebarCollapsed(false)
        }
    }, [dontShowCompose, setUserSidebarCollapsed])

    if (maintenance) {
        return <FeedMaintenance message={maintenance}/>
    }

    if (error) {
        return <FeedError error={error as Error}/>
    }

    const isFirstPageLoading = isLoading && page === 1
    const shouldShowCompose = dontShowCompose !== true

    return (
        <div className="relative pb-20 max-w-3xl space-y-4 mx-auto">
            {/*{shouldShowCompose && <FloatingCompose onShouldFeedRefresh={handleComposeRefresh}/>}*/}

            {isFirstPageLoading ? (
                <FeedLoading isMasonry={false} message="Loading howls..."/>
            ) : (
                <FeedList posts={posts} hasMore={hasMore} onLoadMore={handleLoadMore} onPostDelete={handleDeletePost}/>
            )}
        </div>
    )
}
