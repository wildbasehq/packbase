/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed-list.tsx
import { Text } from '@/components/shared/text'
import { FeedPost } from '@/components/feed'
import { FeedListProps } from './types/feed'
import FeedLoading from './feed-loading'
import PagedContainer, { PagedContentLoadStatus } from '@/components/shared/paged-container.tsx'

/**
 * Renders a linear list of feed posts in thread style
 */
export default function FeedList({ posts, pages, hasMore, onLoadMore, onPostDelete }: FeedListProps) {
    return (
        <div className="mx-auto">
            <PagedContainer
                pages={pages}
                hasMore={hasMore}
                onNeedsContent={async function (page: number): Promise<PagedContentLoadStatus> {
                    try {
                        await onLoadMore(page)
                        return PagedContentLoadStatus.SUCCESS
                    } catch (__1) {
                        return PagedContentLoadStatus.ERROR
                    }
                }}
                loader={<FeedLoading message="Loading more howls..." />}
                endMessage={
                    <Text className="py-8 text-center text-muted-foreground dark:text-neutral-400">You've reached the end of howls.</Text>
                }
            >
                <div className="space-y-4 divide-y divide-dashed">
                    {posts.map(post => (
                        <div key={post.id}>
                            <FeedPost post={post} postState={[posts, () => {}]} onDelete={() => onPostDelete(post.id)} />
                        </div>
                    ))}
                </div>
            </PagedContainer>
        </div>
    )
}
