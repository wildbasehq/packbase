'use client'

import GridBody from '@/components/layout/grid-body'
import Card from '@/components/shared/card'
import FeedPost from '@/components/shared/feed/post'
import WireframeGrid from '@/components/shared/icons/wireframe-grid'
import WireframeList from '@/components/shared/icons/wireframe-list'
import SelectMenu from '@/components/shared/input/select-dropdown'
import { Heading, Text } from '@/components/shared/text'
import { Button } from '@/components/shared/ui/button'
import { vg } from '@/lib/api'
import { useUISettingsStore } from '@/lib/states'
import { HelpCircleIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import { toast } from '@/lib/toast'
import { HandRaisedIcon, MegaphoneIcon } from '@heroicons/react/20/solid'
import { ProjectSafeName } from '@/lib/utils'
import UserAvatar from '@/components/shared/user/avatar'

export default function FeedList({
    packID = '00000000-0000-0000-0000-000000000000',
    changingView,
    setChangingView,
}: {
    packID?: string
    changingView?: boolean
    setChangingView?: any
}) {
    const feedID = 'EVERYTHING0'
    const [error, setError] = useState<Error | null>(null)
    const [postsReady, setPostsReady] = useState<boolean>(false)
    const [postsHasMore, setPostsHasMore] = useState<boolean>(false)
    const [postsCurrentPage, setPostsCurrentPage] = useState<number>(1)
    const [posts, setPosts] = useState<any>([])
    const [masonryColumns, setMasonryColumns] = useState<{
        [key: number]: number
    }>({ 350: 1 })

    const FeedViewConfig = useUISettingsStore((state) => state.feedView)

    useEffect(() => {
        let timeout: NodeJS.Timeout
        if (feedID) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setPosts([])
            setPostsReady(false)
            setPostsHasMore(false)
            setPostsCurrentPage(1)
            fetchPosts('pack_update')
        }

        return () => {
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

    const fetchPosts = (source?: string, clearPosts = false) => {
        if (source) console.log(`Fetching posts for ${packID} from ${source}...`)
        vg.feed({ id: packID })
            .get()
            .then(({ data, error }) => {
                if (error) {
                    console.error(data) // @TODO: This returns [object Object] no matter what? Why?
                    setPosts([])
                    toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                    setError(new Error(error.status))
                    return
                }

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
                        unoptimized
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

    if (error) {
        return (
            <>
                <Heading className="items-center">
                    <HandRaisedIcon className="text-default mr-1 inline-block h-6 w-6" />
                    {ProjectSafeName} can't continue
                </Heading>
                <p className="text-alt mt-1 text-sm leading-6">
                    {(error.cause as string) || 'Something went wrong'}: {error.message || error.stack}
                </p>
            </>
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
                    {/*<div className="mb-4 flex items-center justify-between">*/}
                    {/*    feed {packID}/{feedID} &mdash; {posts.length} posts &mdash; {postsHasMore ? 'has more' : 'no more'}*/}
                    {/*    <Button className="items-center" onClick={() => setChangingView(true)}>*/}
                    {/*        <LayoutDashboard className="mr-1 h-6 w-6" />*/}
                    {/*        Change view*/}
                    {/*    </Button>*/}
                    {/*</div>*/}

                    {changingView && (
                        <Card className="absolute right-0 top-0 z-50 mr-12 mt-40 gap-2 shadow-2xl">
                            <Heading size="lg" className="flex !w-full items-center">
                                <HelpCircleIcon className="mr-2 inline-block h-5 w-5" />
                                Feed View
                                {/*<span className="flex-1" />*/}
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
                                next={() => fetchPosts('infinite_scroll')}
                                hasMore={postsHasMore}
                                loader={<LoadingCardSmall />}
                                endMessage={
                                    <Text alt className="pt-8 text-center">
                                        And just like that, you've reached the end of it all.
                                    </Text>
                                }
                            >
                                {/* @ts-ignore */}
                                <ResponsiveMasonry columnsCountBreakPoints={masonryColumns}>
                                    {/* @ts-ignore */}
                                    <Masonry className="list-stagger" gutter="24px">
                                        {/*{(packID === '00000000-0000-0000-0000-000000000000' || packID === 'universe') ? (*/}
                                        <Card>
                                            <Heading size="xs" className="mb-1 flex items-center">
                                                <MegaphoneIcon className="mr-2 inline-block h-5 w-5" />
                                                <span>PACK ANNOUNCEMENT</span>
                                            </Heading>
                                            <Text size="sm">
                                                🎉 You're testing SUPER early, so much that the waitlist hasn't even begun yet. Things will break, please report them in
                                                the Discord instead of posting them publicly. Thank you!
                                            </Text>
                                            <Text className="mt-2 flex items-center justify-end">
                                                <UserAvatar
                                                    user={{
                                                        username: 'rek',
                                                        images: {
                                                            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3e133370-0ec2-4825-b546-77de3804c8b1/0/avatar.png',
                                                        },
                                                    }}
                                                    size="sm"
                                                    className="mr-1"
                                                />
                                                Rek
                                            </Text>
                                        </Card>
                                        {/*)}*/}

                                        {posts.map((post: any, i: number) => (
                                            <FeedListItem key={post.id} post={post} gridTutorialID={changingView ? i : undefined} postState={[posts, setPosts]} />
                                        ))}
                                    </Masonry>
                                </ResponsiveMasonry>
                            </InfiniteScroll>
                        )}
                    </div>

                    {posts.length === 0 && (
                        <Text alt className="pt-8 text-center">
                            Oddly enough, there's nothing to show you here.
                        </Text>
                    )}
                </>
            )}
        </div>
    )
}

const views = [
    { id: 1, name: 'Grid', icon: WireframeGrid, unavailable: false },
    { id: 2, name: 'List', icon: WireframeList, unavailable: false },
]

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
                        unoptimized
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

function FeedListItem({ post, gridTutorialID, postState }: { post: any; gridTutorialID?: number; postState: [any, any] }) {
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
                <h1 className="text-alt m-auto text-6xl font-bold text-surface-variant">{gridTutorialID + 1}</h1>
            </Card>
        )
    } else {
        return (
            <FeedPost
                key={post.id}
                post={post}
                postState={postState}
                onDelete={() => {
                    postState[1]((posts: any) => posts.filter((p: any) => p.id !== post.id))
                }}
            ></FeedPost>
        )
    }
}
