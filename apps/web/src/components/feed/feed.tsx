/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {isVisible} from '@/lib'
import {useResourceStore, useUIStore} from '@/lib/state'
import PackbaseInstance from '@/lib/workers/global-event-emit'
import {Heading} from '@/src/components'
import {useSession} from '@clerk/clerk-react'
import {Activity, useEffect} from 'react'
import {FeedError, FeedList, FeedLoading, FeedMaintenance} from '.'
import {useFeedHandlers} from './hooks/use-feed-handlers'
import {useFeedPagination} from './hooks/use-feed-pagination'
import {useFeedQuery} from './hooks/use-feed-query'
import {useFeedTitle} from './hooks/use-feed-title'
import {FeedProps} from './types/feed'

export default function Feed({
                                 packID,
                                 channelID,
                                 feedQueryOverride,
                                 titleOverride,
                                 folderID,
                             }: FeedProps) {
    const {maintenance} = useUIStore()
    const {currentResource} = useResourceStore()
    const {isSignedIn} = useSession()

    const {page, setPage} = useFeedPagination({packID, channelID})

    const {posts, hasMore, isLoading, error, isSearch, queryKey} = useFeedQuery({
        packID,
        channelID,
        folderID,
        feedQueryOverride,
        page,
        isSignedIn
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

    const isPostsArray = Array.isArray(posts)
    const postsObject = isPostsArray ? null : posts as Record<string, any[]>
    const isEmptyObjectWithMore = postsObject && Object.keys(postsObject).length === 0 && hasMore

    const formatKeyToHumanReadable = (key: string): string => {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase())
    }

    return (
        <div className="pb-20 max-w-3xl space-y-4 mx-auto">
            <Activity mode={isVisible(isLoading)}>
                <FeedLoading isMasonry={false} message="Loading howls..."/>
            </Activity>

            <Activity mode={isVisible(!isLoading)}>
                {isPostsArray ? (
                    <FeedList posts={posts as any[]} hasMore={hasMore} onPostDelete={handleDeletePost}/>
                ) : (
                    <div className="space-y-8">
                        {postsObject && Object.keys(postsObject).map((sectionKey) => (
                            <div key={sectionKey} className="space-y-4">
                                <Heading size="xl" className="px-4">
                                    {formatKeyToHumanReadable(sectionKey)}
                                </Heading>
                                <FeedList
                                    posts={postsObject[sectionKey]}
                                    hasMore={false}
                                    onPostDelete={handleDeletePost}
                                />
                            </div>
                        ))}
                        {isEmptyObjectWithMore && (
                            <FeedList posts={[]} hasMore={hasMore} onPostDelete={handleDeletePost}/>
                        )}
                    </div>
                )}
            </Activity>
        </div>
    )
}
