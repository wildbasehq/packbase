/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed.tsx
import {Activity, useEffect} from 'react'
import {useSession} from '@clerk/clerk-react'
import {useResourceStore, useUIStore} from '@/lib/state'
import {FeedProps} from './types/feed'
import {FeedError, FeedList, FeedLoading, FeedMaintenance} from '.'
import {useFeedPagination} from './hooks/use-feed-pagination'
import {useFeedQuery} from './hooks/use-feed-query'
import {useFeedTitle} from './hooks/use-feed-title'
import {useFeedHandlers} from './hooks/use-feed-handlers'
import PackbaseInstance from "@/lib/workers/global-event-emit.ts";
import {isVisible} from "@/lib";

export default function Feed({
                                 packID,
                                 channelID,
                                 feedQueryOverride,
                                 titleOverride,
                             }: FeedProps) {
    const {maintenance} = useUIStore()
    const {currentResource} = useResourceStore()
    const {isSignedIn} = useSession()

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

    const {handleDeletePost, handleComposeRefresh} = useFeedHandlers({
        queryKey,
        isSearch,
        channelID,
        feedQueryOverride,
        packID
    })

    useEffect(() => {
        const listener = PackbaseInstance.on('feed-reload', () => {
            log.debug('Feed', 'Received feed-reload event')
            handleComposeRefresh()
        })

        return () => {
            listener()
        }
    }, [])

    if (maintenance) {
        return <FeedMaintenance message={maintenance}/>
    }

    if (error) {
        return <FeedError error={error as Error}/>
    }
    
    return (
        <div className="pb-20 max-w-3xl space-y-4 mx-auto">
            <Activity mode={isVisible(isLoading)}>
                <FeedLoading isMasonry={false} message="Loading howls..."/>
            </Activity>

            <Activity mode={isVisible(!isLoading)}>
                <FeedList posts={posts} hasMore={hasMore} onPostDelete={handleDeletePost}/>
            </Activity>
        </div>
    )
}
