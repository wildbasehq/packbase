/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed-list.tsx
import InfiniteScroll from 'react-infinite-scroll-component'
import { Text } from '@/components/shared/text'
import { FeedPost } from '@/components/feed'
import { FeedListProps } from './types/feed'
import FeedLoading from './feed-loading'

/**
 * Renders a linear list of feed posts in thread style
 */
export default function FeedList({ posts, hasMore, onLoadMore, onPostDelete }: FeedListProps) {
    return (
        <div className="max-w-2xl mx-auto">
            <InfiniteScroll
                scrollableTarget="NGRoot"
                dataLength={posts.length}
                next={onLoadMore}
                hasMore={hasMore}
                loader={<FeedLoading message="Loading more threads..." />}
                scrollThreshold={0.8}
                endMessage={
                    <Text className="py-8 text-center text-neutral-500 dark:text-neutral-400">You've reached the end of the threads.</Text>
                }
            >
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {posts.map(post => (
                        <div key={post.id} className="py-6 first:pt-0 px-4">
                            <FeedPost post={post} postState={[posts, () => {}]} onDelete={() => onPostDelete(post.id)} />
                        </div>
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    )
}
