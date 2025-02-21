import GridBody from '@/components/layout/grid-body'
import Card from '@/components/shared/card'
import FeedPost from '@/components/shared/feed/post'
import WireframeGrid from '@/components/icons/wireframe-grid'
import WireframeList from '@/components/icons/wireframe-list'
import SelectMenu from '@/components/shared/input/select-dropdown'
import {Heading, Text} from '@/components/shared/text'
import {Button} from '@/components/shared/experimental-button-rework'
import {vg} from '@/lib/api'
import {useUISettingsStore, useUIStore} from '@/lib/states'
import {HelpCircleIcon} from 'lucide-react'
import {JSX, useEffect, useState} from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import Masonry, {ResponsiveMasonry} from 'react-responsive-masonry'
import {toast} from 'sonner'
import {HandRaisedIcon, MegaphoneIcon, WrenchScrewdriverIcon} from '@heroicons/react/20/solid'
import {ProjectSafeName} from '@/lib/utils'
import UserAvatar from '@/components/shared/user/avatar'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'
import WrenchCharacter from '@/src/images/svg/wrench-character.svg'

export default function FeedList({
                                     packID = '00000000-0000-0000-0000-000000000000',
                                     changingView,
                                     setChangingView,
                                 }: {
    packID?: string
    changingView?: boolean
    setChangingView?: any
}) {
    const {maintenance, queueWorker, completeWorker} = useUIStore()

    if (maintenance) {
        return (
            <div className="flex flex-col items-center justify-center">
                <Alert className="max-w-4xl">
                    <AlertTitle>
                        <WrenchScrewdriverIcon className="text-default -mt-1 mr-1 inline-block h-4 w-4"/>
                        Feed Maintenance
                    </AlertTitle>
                    <AlertDescription className="grid grid-cols-2">
                        <span>
                            The feed is currently under maintenance and can't be used. Please check again later!
                            <br/>
                            <br/>
                            {maintenance}
                            <br/>
                            <br/>
                            <Button color="indigo" href="https://discord.gg/StuuK55gYA" target="_blank">Discord</Button>{' '}
                        </span>
                        <div className="flex items-center justify-end">
                            <img src={WrenchCharacter} alt="Wrench head character waving" className="aspect-square h-48 w-auto"/>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const feedID = 'EVERYTHING0'
    const [error, setError] = useState<Error | null>(null)
    const [postsReady, setPostsReady] = useState<boolean>(false)
    const [postsHasMore, setPostsHasMore] = useState<boolean>(false)
    const [postsCurrentPage, setPostsCurrentPage] = useState<number>(1)
    const [posts, setPosts] = useState<any>([])
    const [masonryColumns, setMasonryColumns] = useState<{
        [key: number]: number
    }>({350: 1})

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
                setMasonryColumns({750: 1, 1080: 2, 1360: 3, 1640: 4})
                break
            case 2:
                setMasonryColumns({350: 1})
                break
        }
    }, [FeedViewConfig])

    const fetchPosts = (source?: string, clearPosts = false) => {
        queueWorker('howl-dl')
        if (source) console.log(`Fetching howls for ${packID} from ${source}...`)
        vg.feed({id: packID})
            .get({query: {page: postsCurrentPage}})
            .then(({data, error}) => {
                if (error) {
                    console.error(data) // @TODO: This returns [object Object] no matter what? Why?
                    setPosts([])
                    toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                    setError(new Error(error.status))
                    return
                }

                if (clearPosts) {
                    setPosts(data.data)
                    setPostsCurrentPage(1)
                } else {
                    setPosts([...posts, ...data.data])
                    setPostsCurrentPage(postsCurrentPage + 1)
                }

                setPostsReady(true)
                setPostsHasMore(data.has_more)
                completeWorker('howl-dl')
            })
    }

    const LoadingCardSmall = () => {
        return (
            <GridBody className="dont-animate">
                <Card>
                    <img
                        src="/img/dog-on-ship.gif"
                        alt="Animated pixel dog in box panting before falling over, then looping."
                        style={{
                            imageRendering: 'pixelated',
                            display: 'inline-block',
                            marginTop: '-1px',
                            marginRight: '4px',
                        }}
                    />
                    <Text size="sm">
                        Speeding through the howls...
                    </Text>
                </Card>
            </GridBody>
        )
    }

    if (error) {
        return (
            <>
                <Heading className="items-center">
                    <HandRaisedIcon className="text-default mr-1 inline-block h-6 w-6"/>
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
                            Speeding through the howls...
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
                        <Card className="absolute right-0 top-0 z-50 mr-10 mt-40 gap-2 shadow-2xl">
                            <Heading size="lg" className="flex w-full! items-center">
                                <HelpCircleIcon className="mr-2 inline-block h-5 w-5"/>
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
                            <FeedListViewControls callback={() => setChangingView(false)}/>
                        </Card>
                    )}

                    {/* Center feed */}
                    <div className={FeedViewConfig !== 1 ? 'sm:flex sm:justify-center' : ''}>
                        {posts.length !== 0 && (
                            <InfiniteScroll
                                scrollableTarget="NGRoot"
                                key={changingView ? 'changing' : 'unchanged'}
                                scrollThreshold={0.5}
                                className={FeedViewConfig !== 1 ? 'sm:w-screen sm:max-w-md' : ''}
                                dataLength={posts.length}
                                next={() => fetchPosts('infinite_scroll')}
                                hasMore={postsHasMore}
                                loader={<LoadingCardSmall/>}
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
                                                <MegaphoneIcon className="mr-2 inline-block h-5 w-5"/>
                                                <span>PACK ANNOUNCEMENT</span>
                                            </Heading>
                                            <Text size="sm">
                                                The invite code generation requirement is temporarily disabled! You can generate and invite as many people as you'd like
                                                :3
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
                                            <FeedListItem key={post.id} post={post} gridTutorialID={changingView ? i : undefined} postState={[posts, setPosts]}/>
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
    {id: 1, name: 'Grid', icon: WireframeGrid, unavailable: false},
    {id: 2, name: 'List', icon: WireframeList, unavailable: false},
]

function FeedListViewControls({callback}: { callback?: () => void }) {
    const uiOptions = useUISettingsStore((state) => state)

    return (
        <Card className="flex justify-center">
            <SelectMenu
                title="View Style"
                selected={views[uiOptions.feedView - 1]}
                onChange={(i) => {
                    uiOptions.setOptions({feedView: views.indexOf(i) + 1})
                }}
                options={views}
            />

            <Button color="indigo" className="mt-4" onClick={() => callback?.()}>
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
            {/*<Card className="dont-animate w-full absolute z-10">*/}
            {/*    <img*/}
            {/*        src="/img/dog-on-ship.gif"*/}
            {/*        alt="Animated pixel dog in box panting before falling over, then looping."*/}
            {/*        className="h-42 w-fit"*/}
            {/*        style={{*/}
            {/*            imageRendering: 'pixelated',*/}
            {/*            display: 'inline-block',*/}
            {/*            marginTop: '-1px',*/}
            {/*            marginRight: '4px',*/}
            {/*        }}*/}
            {/*    />*/}
            {/*    <Text size="sm">{title}</Text>*/}
            {/*</Card>*/}

            <Masonry className="list-stagger animate-pulse-stagger" gutter="24px">
                {/* EXTREMELY DIRTY TRICKKKKK */}
                <Card className="w-full dont-animate">
                    <img
                        src="/img/dog-on-ship.gif"
                        alt="Animated pixel dog in box panting before falling over, then looping."
                        className="h-42 w-fit"
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
                            width: '100%',
                        }}
                    >
                        <></>
                    </Card>
                ))}
            </Masonry>
        </ResponsiveMasonry>
    )
}

function FeedListItem({post, gridTutorialID, postState}: { post: any; gridTutorialID?: number; postState: [any, any] }) {
    if (gridTutorialID !== undefined) {
        return (
            <Card
                style={{
                    height: `${Math.floor(Math.random() * 75) + 150}px`,
                    backgroundColor: `hsl(${gridTutorialID * 15} 50% 50% / 0.05)`,
                    width: '100%',
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-surface-variant"/>
                    <div className="flex flex-col gap-1">
                        <div className="h-4 w-20 rounded bg-surface-variant"/>
                        <div className="h-4 w-10 rounded bg-surface-variant"/>
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
