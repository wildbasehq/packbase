/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {FeedPost} from '@/components/feed'
import PagedContainer from '@/components/shared/paged-container'
import {Text} from '@/components/shared/text'
import {AnimatePresence, motion} from 'motion/react'
import {useLocation, useSearchParams} from 'wouter'
import {FeedListProps} from './types/feed'

/**
 * Renders a linear list of feed posts in thread style
 */
export default function FeedList({posts, pages, hasMore, onPostDelete}: FeedListProps) {
    const [location] = useLocation()
    const [searchParams] = useSearchParams()
    const page = searchParams.get('page') || '1'

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
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location + page}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-12"
                    >
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                variants={{
                                    initial: {opacity: 0, y: 10},
                                    animate: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            delay: index * 0.05,
                                            duration: 0.3,
                                            type: 'spring',
                                            bounce: 0.3
                                        }
                                    },
                                    exit: {
                                        opacity: 0,
                                        y: -10,
                                        transition: {
                                            delay: (posts.length - 1 - index) * 0.02,
                                            duration: 0.2,
                                            ease: 'easeIn'
                                        }
                                    }
                                }}
                            >
                                <FeedPost post={post} postState={[posts, () => {
                                }]} onDelete={() => onPostDelete(post.id)}/>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </PagedContainer>
        </div>
    )
}
