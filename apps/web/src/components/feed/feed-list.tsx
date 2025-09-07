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
                loader={<FeedLoading message="Loading more howls..." />}
                scrollThreshold={0.8}
                endMessage={
                    <Text className="py-8 text-center text-muted-foreground dark:text-neutral-400">You've reached the end of howls.</Text>
                }
            >
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post.id}>
                            <FeedPost post={post} postState={[posts, () => {}]} onDelete={() => onPostDelete(post.id)} />
                        </div>
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    )
}
