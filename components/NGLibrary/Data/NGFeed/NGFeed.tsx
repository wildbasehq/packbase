'use client'
import React, {useEffect, useState} from 'react'
import {NGSkeleton} from '@/components/NGLibrary'
import InfiniteScroll from 'react-infinite-scroll-component'
import {FetchHandler} from 'lib/api'

export default function NGFeed({...props}: {
    feedID: string;
    feedType?: 'feed' | 'user' | 'pack';
    onlyParent?: boolean;
}) {
    const [feedID, setFeedID] = useState<string>(props.feedID || 'Guest')
    const [posts, setPosts] = useState<any>([])
    const [postsReady, setPostsReady] = useState<boolean>(false)
    const [postsHasMore, setPostsHasMore] = useState<boolean>(false)
    const [postsCurrentPage, setPostsCurrentPage] = useState<number>(1)

    useEffect(() => {
        if (props.feedID !== feedID) {
            setFeedID(props.feedID || 'Guest')
            setPosts([])
            setPostsReady(false)
            setPostsHasMore(false)
            setPostsCurrentPage(1)
        }
    }, [props])

    // Fire once
    useEffect(() => {
        fetchPosts()
    }, [feedID])

    const fetchPosts = () => {
        const feed = props.feedID === 'Guest' ? '' : props.feedID
        FetchHandler.get(`feed/?${props.feedType || 'feed'}=${feed}&page=${postsCurrentPage}${props.onlyParent ? '&onlyParent' : ''}`).then(res => {
            setPosts([...posts, ...res.posts])
            setPostsReady(true)
            setPostsHasMore(res.hasMore)
            setPostsCurrentPage(postsCurrentPage + 1)
        })
    }

    return (
        <>
            {!postsReady && (
                <NGSkeleton/>
            )}

            {postsReady && (
                <>
                    {posts.length !== 0 && (
                        <InfiniteScroll
                            key={feedID}
                            dataLength={posts.length}
                            next={fetchPosts}
                            hasMore={postsHasMore}
                            loader={<NGSkeleton dontAlternate/>}
                            endMessage={
                                <p className="text-sm text-neutral-500 text-center">
                                    And just like that, you've reached the end of it all.<br/>
                                    <span className="font-bold">No more posts to show.</span>
                                </p>
                            }
                            scrollableTarget="NGRoot"
                            className="space-y-8"
                        >
                            {/*{posts.map((post: any) => (*/}
                            {/*    <NGFeedPost*/}
                            {/*        key={post.id}*/}
                            {/*        post={post}*/}
                            {/*        onDelete={() => setPosts(posts.filter((p: any) => p.id !== post.id))}*/}
                            {/*    >*/}
                            {/*        {typeof post?.content === 'object' ? (*/}
                            {/*            <article className="prose dark:prose-invert">*/}
                            {/*                {post.content}*/}
                            {/*            </article>*/}
                            {/*        ) : post.content}*/}
                            {/*    </NGFeedPost>*/}
                            {/*))}*/}
                        </InfiniteScroll>
                    )}

                    {posts.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center">
                            Oddly enough, there's nothing to show you here.<br/>
                            <span className="font-bold">Try following someone!</span>
                        </p>
                    )}
                </>
            )}
        </>
    )
}