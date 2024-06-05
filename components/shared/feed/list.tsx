'use client'

import {useEffect, useState} from 'react'
import Image from 'next/image'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry, {ResponsiveMasonry} from 'react-responsive-masonry'
import {fetcher} from '@/lib/utils'
import {Heading, Text} from '@/components/shared/text'
import GridBody from '@/components/layout/grid-body'
import {LayoutDashboard, MegaphoneIcon} from 'lucide-react'
import WireframeGrid from '@/components/shared/icons/wireframe-grid'
import WireframeList from '@/components/shared/icons/wireframe-list'
import Card from '@/components/shared/card'
import Popover from '@/components/shared/popover'
import {useUIStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import FeedPost from '@/components/shared/feed/post'

export default function FeedList() {
    const packID = '00000000-0000-0000-0000-000000000000'
    const feedID = 'EVERYTHING0'
    const [postsReady, setPostsReady] = useState<boolean>(false)
    const [postsHasMore, setPostsHasMore] = useState<boolean>(false)
    const [postsCurrentPage, setPostsCurrentPage] = useState<number>(1)
    const [posts, setPosts] = useState<any>([])
    const [masonryColumns, setMasonryColumns] = useState<{
        [key: number]: number;
    }>({750: 1, 900: 2, 1460: 4})

    const FeedViewConfig = useUIStore(state => state.feedView)

    useEffect(() => {
        let timeout: NodeJS.Timeout
        if (feedID) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setPosts([])
            setPostsReady(false)
            setPostsHasMore(false)
            setPostsCurrentPage(1)
            fetchPosts()
        }

        return () => {
            console.log('nope')
            if (timeout) clearTimeout(timeout)
        }
    }, [feedID])

    useEffect(() => {
        switch (FeedViewConfig) {
            default:
            case 1:
                setMasonryColumns({750: 1, 900: 2, 1460: 4})
                break
            case 2:
                setMasonryColumns({350: 1})
                break
        }
    }, [FeedViewConfig])

    const fetchPosts = (feed: string = '', clearPosts = false) => {
        fetcher(`${process.env.NEXT_PUBLIC_YAPOCK_URL}/content/feed`).then((res: any) => {
            if (clearPosts) {
                setPosts(res.posts)
                setPostsCurrentPage(1)
            } else {
                setPosts([...posts, ...res.posts])
                setPostsCurrentPage(postsCurrentPage + 1)
            }
            setPostsReady(true)
            setPostsHasMore(res.hasMore)
        })
    }

    const LoadingCardSmall = () => {
        return (
            <GridBody>
                <Card className="dont-animate">
                    <Image src="/img/dog-on-ship.gif"
                           alt="Animated pixel dog in box panting before falling over, then looping."
                           height={128}
                           width={168}
                           style={{
                               imageRendering: 'pixelated',
                               display: 'inline-block',
                               marginTop: '-1px',
                               marginRight: '4px',
                           }}
                    />
                    <Text size="sm">
                        Loading posts for @<span className="font-bold">{feedID}</span>
                    </Text>
                </Card>
            </GridBody>
        )
    }

    return (
        <div>
            {!postsReady && <LoadingCard title={
                <>
                    Loading posts for @<span className="font-bold">{feedID}</span>
                </>
            }/>}

            {postsReady && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        feed {packID}/{feedID} &mdash; {posts.length} posts &mdash; {postsHasMore ? 'has more' : 'no more'}
                        <FeedViewListbox/>
                    </div>

                    {/* Center feed */}
                    <div className={FeedViewConfig !== 1 ? 'sm:flex sm:justify-center' : ''}>
                        {posts.length !== 0 && (
                            <InfiniteScroll
                                key={feedID}
                                className={FeedViewConfig !== 1 ? 'sm:max-w-md sm:w-screen' : ''}
                                dataLength={posts.length}
                                next={fetchPosts}
                                hasMore={postsHasMore}
                                loader={<LoadingCardSmall/>}
                                endMessage={
                                    <p className="text-sm text-neutral-500 text-center">
                                        And just like that, you{'\''}ve reached the end of it all.<br/>
                                        <span className="font-bold">No more posts to show.</span>
                                    </p>
                                }
                            >
                                {/* @ts-ignore */}
                                <ResponsiveMasonry
                                    columnsCountBreakPoints={masonryColumns}>
                                    {/* @ts-ignore */}
                                    <Masonry className="list-stagger" gutter="24px">
                                        <Card>
                                            <Heading size="xs" className="flex items-center mb-1">
                                                <MegaphoneIcon className="w-5 h-5 inline-block mr-2"/>
                                                <span>PACK ANNOUNCEMENT</span>
                                            </Heading>
                                            <Text size="sm">
                                                🎉 thx for testing pookies. Go wild!
                                            </Text>
                                            <Text className="flex items-center justify-end mt-2">
                                                <UserAvatar user={{
                                                    username: 'rek',
                                                    images: {
                                                        avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3e133370-0ec2-4825-b546-77de3804c8b1/0/avatar.jpeg'
                                                    }
                                                }} size="sm" className="mr-1"/>
                                                Rek
                                            </Text>
                                        </Card>

                                        {posts.map((post: any) => (
                                            <FeedListItem key={post.id} post={post}/>
                                        ))}
                                    </Masonry>
                                </ResponsiveMasonry>
                            </InfiniteScroll>
                        )}
                    </div>

                    {posts.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center">
                            Oddly enough, there{'\''}s nothing to show you here.<br/>
                            <span className="font-bold">Try following someone!</span>
                        </p>
                    )}
                </>
            )}
        </div>
    )
}

export function LoadingCard({title, masonryColumns}: {
    title: string | JSX.Element;
    masonryColumns?: {
        [key: number]: number;
    }
}) {
    return (
        // @ts-ignore
        <ResponsiveMasonry
            columnsCountBreakPoints={masonryColumns}>
            {/* @ts-ignore */}
            <Masonry className="list-stagger animate-pulse-stagger" gutter="24px">
                <Card className="dont-animate">
                    <Image src="/img/dog-on-ship.gif"
                           alt="Animated pixel dog in box panting before falling over, then looping."
                           height={128}
                           width={168}
                           style={{
                               imageRendering: 'pixelated',
                               display: 'inline-block',
                               marginTop: '-1px',
                               marginRight: '4px',
                           }}
                    />
                    <Text size="sm">
                        {title}
                    </Text>
                </Card>

                {/* Bunch of empty cards of different random heights */}
                {Array.from(Array(50).keys()).map((i) => (
                    <Card key={i} style={{
                        height: `${Math.floor(Math.random() * 100) + 150}px`,
                    }}>
                        <></>
                    </Card>
                ))}
            </Masonry>
        </ResponsiveMasonry>
    )
}

const views = [
    {id: 1, name: 'Grid', icon: WireframeGrid, unavailable: false},
    {id: 2, name: 'List', icon: WireframeList, unavailable: false},
]

function FeedViewListbox() {
    const setUIOptions = useUIStore(state => state.setOptions)

    return (
        <div className="relative">
            <Popover
                content={
                    <div className="flex gap-4 bg-card rounded px-3 py-4">
                        {views.map((view) => (
                            <div key={view.id}
                                 className={`flex flex-col items-center gap-2 p-2 cursor-pointer`}
                                 onClick={() => {
                                     setUIOptions({feedView: view.id})
                                 }}
                            >
                                <view.icon className="w-24 border rounded-default"/>
                                <span>{view.name}</span>
                            </div>
                        ))}
                    </div>
                }
                align="end"
            >
                <LayoutDashboard className="w-8 h-8 cursor-pointer"/>
            </Popover>
        </div>
    )
}

function FeedListItem({post}: {
    post: any;
}) {
    return (
        <FeedPost
            key={post.id}
            post={post}
            // onDelete={() => posts = posts.filter((p: any) => p.id !== post.id)}
        ></FeedPost>
    )
}
