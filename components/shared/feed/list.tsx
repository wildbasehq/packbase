'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import { Heading, Text } from '@/components/shared/text'
import GridBody from '@/components/layout/grid-body'
import { HelpCircleIcon, LayoutDashboard, MegaphoneIcon } from 'lucide-react'
import WireframeGrid from '@/components/shared/icons/wireframe-grid'
import WireframeList from '@/components/shared/icons/wireframe-list'
import Card from '@/components/shared/card'
import Popover from '@/components/shared/popover'
import { useUISettingsStore } from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import FeedPost from '@/components/shared/feed/post'
import { FetchHandler } from '@/lib/api'
import SelectMenu from '@/components/shared/input/select'
import { Button } from '@/components/shared/ui/button'

export default function FeedList() {
    const packID = '00000000-0000-0000-0000-000000000000'
    const feedID = 'EVERYTHING0'
    const [postsReady, setPostsReady] = useState<boolean>(false)
    const [postsHasMore, setPostsHasMore] = useState<boolean>(false)
    const [postsCurrentPage, setPostsCurrentPage] = useState<number>(1)
    const [posts, setPosts] = useState<any>([])
    const [changingView, setChangingView] = useState<boolean>(false)
    const [masonryColumns, setMasonryColumns] = useState<{
        [key: number]: number
    }>({ 750: 1, 900: 2, 1460: 4 })

    const FeedViewConfig = useUISettingsStore((state) => state.feedView)

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
                setMasonryColumns({ 750: 1, 900: 2, 1460: 4 })
                break
            case 2:
                setMasonryColumns({ 350: 1 })
                break
        }
    }, [FeedViewConfig])

    const fetchPosts = (feed: string = '', clearPosts = false) => {
        FetchHandler.get(`/xrpc/app.packbase.feed.get`).then(({ data }) => {
            if (clearPosts) {
                setPosts(data.posts)
                setPostsCurrentPage(1)
            } else {
                setPosts([...posts, ...data.posts])
                setPostsCurrentPage(postsCurrentPage + 1)
            }
            setPostsReady(true)
            setPostsHasMore(data.hasMore)
        })
    }

    const LoadingCardSmall = () => {
        return (
            <GridBody>
                <Card className="dont-animate">
                    <Image
                        src="/img/dog-on-ship.gif"
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
            {!postsReady && (
                <LoadingCard
                    title={
                        <>
                            Loading posts for @<span className="font-bold">{feedID}</span>
                        </>
                    }
                />
            )}

            {postsReady && (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        feed {packID}/{feedID} &mdash; {posts.length} posts &mdash; {postsHasMore ? 'has more' : 'no more'}
                        <Button className="items-center" onClick={() => setChangingView(true)}>
                            <LayoutDashboard className="mr-1 h-6 w-6" />
                            Change view
                        </Button>
                    </div>

                    {changingView && (
                        <Card
                            className={`${
                                FeedViewConfig === 2 ? 'lg:left-[31vw]' : 'lg:left-[50vw]'
                            } ease-[cubic-bezier(0.32,0.72,0,1)] absolute top-1/4 z-50 m-auto mt-48 gap-2 shadow-2xl transition-all`}
                        >
                            <Heading size="lg" className="flex items-center">
                                <HelpCircleIcon className="mr-2 inline-block h-5 w-5" />
                                Feed View
                                <span className="flex-1" />
                                {/*<MagicElement numSparkles={2}>*/}
                                {/*    <span className="text-sm text-primary">new!</span>*/}
                                {/*</MagicElement>*/}
                            </Heading>
                            <Text>
                                You can switch the feed view anytime you want. This may affect some user-made experiences, i.e. comics, stories, etc, that are designed
                                for a specific view.
                            </Text>
                            {/*<Text>*/}
                            {/*    You can plug-in custom made views by other people, or even make your own!**/}
                            {/*</Text>*/}
                            {/*<Text className="text-xs text-on-surface-variant/75">*/}
                            {/*    * Wolfbite Labs aren&apos;t responsible for any damages caused by third-party scripts.*/}
                            {/*    Always check the source code before installing.*/}
                            {/*</Text>*/}
                            <FeedListViewControls callback={() => setChangingView(false)} />
                        </Card>
                    )}

                    {/* Center feed */}
                    <div className={FeedViewConfig !== 1 ? 'sm:flex sm:justify-center' : ''}>
                        {posts.length !== 0 && (
                            <InfiniteScroll
                                key={feedID}
                                className={FeedViewConfig !== 1 ? 'sm:w-screen sm:max-w-md' : ''}
                                dataLength={posts.length}
                                next={fetchPosts}
                                hasMore={postsHasMore}
                                loader={<LoadingCardSmall />}
                                endMessage={
                                    <p className="text-center text-sm text-neutral-500">
                                        And just like that, you've reached the end of it all.
                                        <br />
                                        <span className="font-bold">No more posts to show.</span>
                                    </p>
                                }
                            >
                                {/* @ts-ignore */}
                                <ResponsiveMasonry columnsCountBreakPoints={masonryColumns}>
                                    {/* @ts-ignore */}
                                    <Masonry className="list-stagger" gutter="24px">
                                        <Card>
                                            <Heading size="xs" className="mb-1 flex items-center">
                                                <MegaphoneIcon className="mr-2 inline-block h-5 w-5" />
                                                <span>PACK ANNOUNCEMENT</span>
                                            </Heading>
                                            <Text size="sm">🎉 thx for testing pookies. Go wild!</Text>
                                            <Text className="mt-2 flex items-center justify-end">
                                                <UserAvatar
                                                    user={{
                                                        username: 'rek',
                                                        images: {
                                                            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3e133370-0ec2-4825-b546-77de3804c8b1/0/avatar.jpeg',
                                                        },
                                                    }}
                                                    size="sm"
                                                    className="mr-1"
                                                />
                                                Rek
                                            </Text>
                                        </Card>

                                        {posts.map((post: any, i: number) => (
                                            <FeedListItem key={post.id} post={post} gridTutorialID={changingView ? i : undefined} />
                                        ))}
                                    </Masonry>
                                </ResponsiveMasonry>
                            </InfiniteScroll>
                        )}
                    </div>

                    {posts.length === 0 && (
                        <p className="text-center text-sm text-neutral-500">
                            Oddly enough, there's nothing to show you here.
                            <br />
                            <span className="font-bold">Try following someone!</span>
                        </p>
                    )}
                </>
            )}
        </div>
    )
}

function FeedListViewControls({ callback }: { callback?: () => void }) {
    const uiOptions = useUISettingsStore((state) => state)

    return (
        <Card className="flex justify-center">
            <SelectMenu
                title="View Style"
                selected={views[uiOptions.feedView - 1]}
                onChange={(i) => {
                    uiOptions.setOptions({ feedView: views.indexOf(i) + 1 })
                }}
                options={views}
            />

            <Button className="mt-4" onClick={() => callback?.()}>
                Done
            </Button>
        </Card>
    )
}

export function LoadingCard({
    title,
    masonryColumns,
}: {
    title: string | JSX.Element
    masonryColumns?: {
        [key: number]: number
    }
}) {
    return (
        // @ts-ignore
        <ResponsiveMasonry columnsCountBreakPoints={masonryColumns}>
            {/* @ts-ignore */}
            <Masonry className="list-stagger animate-pulse-stagger" gutter="24px">
                <Card className="dont-animate">
                    <Image
                        src="/img/dog-on-ship.gif"
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
                    <Text size="sm">{title}</Text>
                </Card>

                {/* Bunch of empty cards of different random heights */}
                {Array.from(Array(50).keys()).map((i) => (
                    <Card
                        key={i}
                        style={{
                            height: `${Math.floor(Math.random() * 100) + 120}px`,
                        }}
                    >
                        <></>
                    </Card>
                ))}
            </Masonry>
        </ResponsiveMasonry>
    )
}

const views = [
    { id: 1, name: 'Grid', icon: WireframeGrid, unavailable: false },
    { id: 2, name: 'List', icon: WireframeList, unavailable: false },
]

function FeedViewListbox() {
    const setUIOptions = useUISettingsStore((state) => state.setOptions)

    return (
        <div className="relative">
            <Popover
                content={
                    <div className="flex gap-4 rounded bg-card px-3 py-4">
                        {views.map((view) => (
                            <div
                                key={view.id}
                                className={`flex cursor-pointer flex-col items-center gap-2 p-2`}
                                onClick={() => {
                                    setUIOptions({ feedView: view.id })
                                }}
                            >
                                <view.icon className="rounded-default w-24 border" />
                                <span>{view.name}</span>
                            </div>
                        ))}
                    </div>
                }
                align="end"
            >
                <LayoutDashboard className="h-8 w-8 cursor-pointer" />
            </Popover>
        </div>
    )
}

function FeedListItem({ post, gridTutorialID }: { post: any; gridTutorialID?: number }) {
    if (gridTutorialID !== undefined) {
        return (
            <Card
                style={{
                    height: `${Math.floor(Math.random() * 75) + 150}px`,
                    backgroundColor: `hsl(${gridTutorialID * 15} 50% 50% / 0.05)`,
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-surface-variant" />
                    <div className="flex flex-col gap-1">
                        <div className="h-4 w-20 rounded bg-surface-variant" />
                        <div className="h-4 w-10 rounded bg-surface-variant" />
                    </div>
                </div>

                {/* Large number using gridTutorialID */}
                <h1 className="m-auto text-6xl font-bold text-surface-variant">{gridTutorialID + 1}</h1>
            </Card>
        )
    } else {
        return (
            <FeedPost
                key={post.id}
                post={post}
                // onDelete={() => posts = posts.filter((p: any) => p.id !== post.id)}
            ></FeedPost>
        )
    }
}
