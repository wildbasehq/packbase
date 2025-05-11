// src/components/feed/FeedList.tsx
import { useMemo } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import { Text } from '@/components/shared/text'
import { FeedPost } from '@/components/feed'
import { FeedListProps } from './types/feed'
import FeedLoading from './feed-loading'

/**
 * Renders a list of feed posts with either grid or list layout
 */
export default function FeedList({ posts, hasMore, onLoadMore, onPostDelete, viewType }: FeedListProps) {
    // Configure masonry grid columns based on view type
    const masonryColumns = useMemo(() => {
        return viewType === 1
            ? { 750: 1, 1080: 2, 1360: 3, 1640: 4 } // Grid view
            : { 350: 1 } // List view (single column)
    }, [viewType])

    // Container class based on view type
    const containerClass = viewType === 2 ? 'sm:flex sm:justify-center' : ''

    // Width class for list view to constrain width
    const widthClass = viewType === 2 ? 'sm:w-screen sm:max-w-md' : ''

    return (
        <div className={containerClass}>
            <InfiniteScroll
                scrollableTarget="NGRoot"
                dataLength={posts.length}
                next={onLoadMore}
                hasMore={hasMore}
                loader={<FeedLoading message="Loading more posts..." />}
                scrollThreshold={0.8}
                className={widthClass}
                endMessage={
                    <Text className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                        And just like that, you've reached the end of it all.
                    </Text>
                }
            >
                <ResponsiveMasonry columnsCountBreakPoints={masonryColumns}>
                    <Masonry className="list-stagger" gutter="24px">
                        {/* Show announcement at the top of feed */}
                        {/*<FeedAnnouncement/>*/}

                        {/* Render the actual posts */}
                        {posts.map(post => (
                            <FeedPost
                                key={post.id}
                                post={post}
                                postState={[posts, () => {}]} // We handle post state in the parent component
                                onDelete={() => onPostDelete(post.id)}
                            />
                        ))}
                    </Masonry>
                </ResponsiveMasonry>
            </InfiniteScroll>
        </div>
    )
}
