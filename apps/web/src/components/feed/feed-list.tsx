/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {FeedPost} from '@/components/feed'
import PagedContainer from '@/components/shared/paged-container'
import {Text} from '@/components/shared/text'
import {useLocation} from 'wouter'
import {FeedListProps} from './types/feed'

/**
 * Renders a linear list of feed posts in thread style
 */
export default function FeedList({posts, pages, hasMore, onPostDelete}: FeedListProps) {
    const [location] = useLocation()
    return (
        <div className="mx-auto">
            <PagedContainer
                pages={pages}
                hasMore={hasMore}
                endMessage={
                    <Text alt className="py-8 text-center italic">
                        The distant echoes of howling {location === '/everything' ? 'wolves' : 'packmates'} fade into
                        silence...
                    </Text>
                }
            >
                <div className="space-y-12">
                    {posts.map(post => (
                        <div key={post.id}>
                            <FeedPost post={post} postState={[posts, () => {
                            }]} onDelete={() => onPostDelete(post.id)}/>
                        </div>
                    ))}
                </div>
            </PagedContainer>
        </div>
    )
}
