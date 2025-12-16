import {
    Avatar,
    BubblePopover,
    Button,
    FieldGroup,
    Logo,
    PopoverHeader,
    Text,
    TextSize,
    useContentFrame
} from "@/components/shared";
import {ArrowLeftIcon, ArrowRightIcon, EllipsisHorizontalIcon, PlusIcon} from "@heroicons/react/24/solid";
import {CreatePackModal} from "@/pages/pack/new/page.tsx";
import {Activity, memo, useEffect, useState} from "react";
import {cn, isVisible, useUserAccountStore, vg} from "@/lib";
import {ArrowDownIcon, XCircleIcon} from "@heroicons/react/20/solid";
import {Drawer} from "vaul";
import {toast} from "sonner";
import {LoadingSpinner, MediaGallery} from "@/src/components";
import {useCountdown, useCounter} from "usehooks-ts";
import {AnimatePresence, motion, useAnimation} from "motion/react";
import {getAvatar} from "@/lib/api/get-avatar.ts";

type SetPackFunction = (pack: { id: string, slug: string, display_name: string, description?: string }) => void
const MemoBackground = memo(SkewedCardGridBackground);

export default function DefaultPackSunset() {
    const {user} = useUserAccountStore()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>()
    const [page, setPage] = useState<'data-reset' | 'onboard'>('onboard')
    const [postsBG, setPostsBG] = useState<any[]>(Array(25).fill({}).map((_, i) => ({id: i})))
    const [finaliseScreen, setFinaliseScreen] = useState(false)

    useEffect(() => {
        vg.packs.default.get().then(({data}) => {
            setTimeout(() => {
                if (!data?.requires_switch) {
                    setError(`You have already switched off from the Universe.`)
                    return
                }

                vg.search.get({
                    query: {
                        q: `$posts = [Where posts:user_id ("${user.id}") AND posts:tenant_id ("00000000-0000-0000-0000-000000000000")] AS *;\n$posts:user = [Where profiles:id ($posts:user_id->ONE)] AS *;`
                    }
                }).then(({data: response}) => {
                    setLoading(false)
                    const posts = response?.posts
                    setPostsBG([...Array(Math.max(25, posts?.length || 0)).keys()].map(i => posts?.[i % (posts?.length || 1)]))
                })
            }, 500)
        })
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center overflow-visible h-screen">
            <MemoBackground posts={postsBG} exit={page === 'onboard' && (loading || finaliseScreen)}/>

            {/* Error Overlay */}
            <Activity mode={isVisible(!!error)}>
                <div
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="max-w-md w-full space-y-4 p-6 bg-card rounded-lg border shadow-lg">
                        <PopoverHeader
                            variant="destructive"
                            title="The switch can't be completed"
                            description={error}
                        />
                        <Button onClick={() => window.location.href = '/'} className="w-full">
                            Go Home
                        </Button>
                    </div>
                </div>
            </Activity>

            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(var(--background)_15%,transparent_100%)] -z-1"/>

            <div
                className="max-w-md space-y-8 overflow-x-hidden overflow-y-auto px-2 py-8 rounded-4xl">
                <Activity mode={isVisible(page === 'data-reset')}>
                    <DataReset/>
                </Activity>
                <Activity mode={isVisible(page === 'onboard')}>
                    <Onboard loading={loading} setLoading={setLoading} setPage={setPage}
                             setFinaliseScreen={setFinaliseScreen} posts={postsBG}/>
                </Activity>
            </div>
        </div>
    )
}

function Onboard({loading, posts, setLoading, setPage, setFinaliseScreen}: {
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    setPage: React.Dispatch<React.SetStateAction<'data-reset' | 'onboard'>>
    setFinaliseScreen: React.Dispatch<React.SetStateAction<boolean>>
    posts?: any[]
}) {
    const [ready, setReady] = useState(false)
    const [pack, setPack] = useState<{
        id: string
        slug: string
        display_name: string
        description?: string
        [key: string]: any
    }>()

    useEffect(() => {
        if (pack) {
            setLoading(true)
            // Check it's usable
            vg.pack({id: pack.id}).get().then(({status}) => {
                setTimeout(() => {
                    setLoading(false)
                    if (status === 200) {
                        setReady(true)
                        setFinaliseScreen(true)
                    } else {
                        setReady(false)
                        toast.error('This pack is not usable. Please choose another one.')
                    }
                }, 1000)
            })
        } else {
            setFinaliseScreen(false)
        }
    }, [pack]);

    const performSwitchover = () => {
        setLoading(true)
        vg.packs.default.patch({
            pack_id: pack?.id
        }).then(({status}) => {
            setTimeout(() => {
                if (status === 200) {
                    toast.success('Default Pack switched successfully!')
                    window.location.reload()
                } else {
                    setLoading(false)
                    toast.error('Failed to switch Default Pack. Please try again.')
                }
            }, 1000)
        })
    }

    return (
        <div className="relative space-y-8">
            <PopoverHeader
                variant="destructive"
                title="Changing the Default Pack"
            />

            <Text>
                You must change the Default Pack before you continue to Packbase. Your previous default, The "Universe",
                has been retired. Your current howls outside of a Pack must be moved, please choose how you'd like to
                proceed.
            </Text>

            <Activity mode={isVisible(!ready)}>
                <div className="flex items-center gap-2 py-2 px-3 border rounded-full">
                    <Logo/>
                    <div className="flex flex-col">
                        <Text className="font-medium">Universe</Text>
                        <Text className="text-sm text-muted-foreground">
                            The original default which you were forced into
                        </Text>
                    </div>
                </div>

                <ArrowDownIcon className="size-6 mx-auto"/>

                <FieldGroup className="space-y-4!">
                    {loading && (
                        <div
                            className="absolute top-0 left-0 right-0 rounded-2xl bottom-0 w-full h-full bg-card z-1 flex items-center justify-center">
                            <LoadingSpinner size={24}/>
                        </div>
                    )}

                    <Text>
                        <b>Please choose carefully.</b>
                    </Text>

                    <CreateDefaultPack disabled={loading} setPack={setPack}/>

                    <SwitchUsingExistingPack disabled={loading} setPack={setPack}/>

                    <MustOwnPackReasoning setPage={setPage} setLoading={setLoading}/>
                </FieldGroup>
            </Activity>

            <Activity mode={isVisible(ready)}>
                <div
                    className="flex items-center gap-2 p-2 -mb-8 border border-b-0 rounded-t-3xl bg-linear-to-b from-card to-transparent">
                    <Logo/>
                    <div className="flex flex-col">
                        <Text className="font-medium">Universe</Text>
                    </div>
                </div>

                <CardMarquee posts={posts}/>

                <div
                    className="flex items-center border border-t-0 rounded-b-3xl gap-2 p-2 bg-linear-to-t from-card to-transparent -mt-16">
                    <Avatar src={pack?.images?.avatar} initials={pack?.slug?.[0]} className="size-8"/>
                    <div className="flex flex-col">
                        <Text className="font-medium">{pack?.display_name}</Text>
                        {pack?.description && (
                            <Text className="text-sm text-muted-foreground">
                                {pack.description}
                            </Text>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Text alt>
                        Last chance to confirm!
                    </Text>
                    <div className="flex">
                        <Button outline onClick={() => {
                            setPack(undefined)
                            setReady(false)
                        }}>
                            <ArrowLeftIcon/> Nope, Go Back
                        </Button>

                        <div className="grow"/>

                        <Button onClick={() => performSwitchover()}>
                            Looks good, switch it now <ArrowRightIcon/>
                        </Button>
                    </div>
                </div>
            </Activity>
        </div>
    )
}

function CreateDefaultPack({disabled, setPack}: { disabled: boolean; setPack: SetPackFunction }) {
    const [loading, setLoading] = useState(false)
    const [popoverPage, setPopoverPage] = useState<'create' | 'public-warning'>('public-warning')

    return (
        <BubblePopover isCentered id="default-pack-create"
                       className={popoverPage === 'create' ? "[&>div]:p-0 [&>div]:w-full [&>div]:max-w-4xl" : ''}
                       trigger={
                           ({setOpen}) =>
                               <Button outline
                                       disabled={disabled}
                                       submissionState={loading ? 'pending' : 'idle'}
                                       className={cn(!loading && 'justify-start', "overflow-hidden items-center w-full transition-all! hover:ring-1 ring-default")}
                                       onClick={() => setOpen(true)}>
                                   <PlusIcon className="h-6 w-6 text-muted-foreground"/>
                                   <Text>
                                       Create a new Pack and set it as the default
                                   </Text>
                               </Button>
                       }>
            {({setOpen}) =>
                <>
                    <Activity mode={isVisible(popoverPage === 'create')}>
                        <CreatePackModal onCreate={(pack) => {
                            setPack(pack)
                            setOpen(false)
                        }}/>
                    </Activity>

                    <Activity mode={isVisible(popoverPage === 'public-warning')}>
                        <PopoverHeader title="Default Pack is public"
                                       description="Setting a Default Pack forces it to be public, you won't be able to change it's visibility settings."
                                       variant="warning"
                                       onPrimaryAction={() => setPopoverPage('create')}
                        />
                    </Activity>
                </>
            }
        </BubblePopover>
    )
}

function SwitchUsingExistingPack({disabled, setPack}: { disabled: boolean; setPack: SetPackFunction }) {
    const {user} = useUserAccountStore()
    const [loadState, setLoadState] = useState<'idle' | 'pending' | 'success'>('idle')
    const [hasEligible, setHasEligible] = useState(true)
    const [showDrawer, setShowDrawer] = useState(false)

    const {
        data,
        refetch
    } = useContentFrame('get', 'user.me.packs', undefined, {
        id: 'user.me.packs'
    })

    const findAllOwnedPacks = () => {
        if (loadState !== 'idle') return
        setLoadState('pending')
        refetch().then(({data}) => {
            console.log(data)
            setTimeout(() => {
                setHasEligible(data.find(pack => pack.owner_id === user.id))
                setLoadState('idle')
                setShowDrawer(true)
            }, 1000)
        })
    }

    const ownedPacks = data?.filter(pack => pack.owner_id === user.id) ?? []

    return (
        <Drawer.Root open={showDrawer} onClose={() => setShowDrawer(false)}>
            <Drawer.Trigger asChild>
                <Button outline
                        disabled={loadState === 'pending' || !hasEligible || disabled}
                        className={cn(loadState === 'idle' && 'justify-start', "overflow-hidden items-center w-full transition-all! hover:ring-1 ring-default")}
                        submissionState={loadState}
                        onClick={() => {
                            findAllOwnedPacks()
                        }}
                >
                    <Activity mode={isVisible(hasEligible)}>
                        <EllipsisHorizontalIcon className="h-6 w-6"/>
                        <Text>
                            Make an existing Pack I own the default
                        </Text>
                    </Activity>

                    <Activity mode={isVisible(!hasEligible)}>
                        <XCircleIcon className="h-6 w-6"/>
                        <Text>
                            No eligible Packs found
                        </Text>
                    </Activity>
                </Button>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-10 bg-black/40"/>
                <Drawer.Content
                    className="bg-card p-4 flex flex-col max-w-xl mx-auto rounded-t mt-24 h-fit fixed z-20 bottom-0 left-0 right-0 outline-none">
                    <Drawer.Title>
                        <PopoverHeader variant="info" title="Choose a Pack"
                                       description="These are Packs you directly own"/>
                    </Drawer.Title>
                    <div className="overflow-y-auto max-h-96 space-y-2 mt-4">
                        {ownedPacks?.filter(pack => pack.owner_id === user.id).map(pack => (
                            <Button
                                outline
                                key={pack.id}
                                className="w-full p-2! justify-start!"
                                onClick={() => {
                                    // handle pack selection
                                    setPack(pack)
                                    setShowDrawer(false)
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar src={pack.images?.avatar} initials={pack.slug[0]} className="size-8"/>
                                    <div className="flex items-center h-full">
                                        <Text className="font-medium">{pack.display_name}</Text>
                                        {pack.description && (
                                            <Text className="text-sm text-muted-foreground mt-1">
                                                {pack.description}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}

function MustOwnPackReasoning({setPage, setLoading}: {
    setPage: React.Dispatch<React.SetStateAction<'data-reset' | 'onboard'>>
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const goToDataReset = () => {
        setLoading(true)
        setTimeout(() => {
            setPage('data-reset')
        }, 2500)
    }

    return (
        <BubblePopover id="must-own-pack-reasoning" trigger={
            ({setOpen}) => (
                <Text alt size="xs" onClick={() => setOpen(true)}>
                    I want to use a pack I don't own &rarr;
                </Text>
            )
        } isCentered>
            {({setOpen}) => (
                <div className="space-y-2">
                    <PopoverHeader title="You'll need a reset"
                                   description={`If you'd like to use another Pack you don't own, to avoid spamming Packs, you'll need to create a new account or delete all Howls that don't belong to a Pack ("Universe Howls").`}
                                   onClose={() => setOpen(false)}
                    />

                    <MustOwnPackCounter close={() => {
                        goToDataReset()
                        setOpen(false)
                    }}/>
                </div>
            )}
        </BubblePopover>
    )
}

function MustOwnPackCounter({close}: {
    close: () => void;
}) {
    const {count, increment, reset} = useCounter()

    useEffect(() => {
        reset()
    }, []);

    let textSize: TextSize = 'xs'
    if (count === 1) textSize = 'sm'
    if (count === 2) textSize = 'md'
    if (count > 2) {
        textSize = 'lg'
        close()
    }
    return (
        <Text alt size={textSize} onClick={() => increment()}>
            {count === 0 && "I want to delete all my existing Universe Howls"}
            {count === 1 && "I really don't care about my existing Universe Howls"}
            {count === 2 && "I REALLY REALLY DO NOT CARE ONE BIT about my existing Universe Howls AND REALLY WANT TO DELETE THEM"}
            {count > 2 && "redirecting to data reset..."}
            {' '}&rarr;
        </Text>
    )
}

function DataReset() {
    const [countdownMs, setCountdownMs] = useState(1000)
    const [countdown, {startCountdown, stopCountdown}] = useCountdown({
        countStart: 60,
        intervalMs: countdownMs,
        isIncrement: false
    })

    useEffect(() => {
        startCountdown()

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopCountdown()
            } else {
                startCountdown()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, []);


    const digits = countdown.toString().padStart(2, '0').split('')

    return (
        <>
            <PopoverHeader
                variant="destructive"
                title="PERMANENT RESET"
                description="You're about to permanently delete all your existing Howls in the Universe. This action can NEVER be undone."
            />

            <Text>
                <b>Data is wiped in</b>
            </Text>

            <div className="flex items-center justify-center py-6">
                <div className="flex gap-2">
                    {digits.map((digit, i) => (
                        <FlipDigit
                            key={i}
                            digit={digit}
                            countdownMs={countdownMs}
                            count={countdown}
                        />
                    ))}
                </div>
            </div>

            <Button color="red" onClick={() => window.location.reload()} className="w-full">
                CANCEL RESET
            </Button>

            <Button
                outline
                className="w-full mt-2"
                onMouseDown={() => setCountdownMs(200)}
                onMouseUp={() => setCountdownMs(1000)}
                onMouseLeave={() => setCountdownMs(1000)}
            >
                I understand the risks - Hold to speed up
            </Button>
        </>
    )
}

type FlipDigitProps = {
    countdownMs: number;
    digit: string;
    count: number; // <- add this
};

function FlipDigit({countdownMs, digit, count}: FlipDigitProps) {
    // Only shake when below 30
    const isShaking = count < 30;

    // Map 29 → small shake, 0 → max shake
    const normalized = isShaking ? (30 - count) / 30 : 0; // 0–1
    const amplitude = normalized * 2.5;
    const speed = 0.25 - normalized * 0.15; // 0.25s–0.1s

    return (
        <motion.div
            animate={{
                x: isShaking ? [-amplitude, amplitude, -amplitude, amplitude, 0] : 0,
            }}
            transition={{
                x: isShaking
                    ? {
                        duration: speed,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut",
                    }
                    : {duration: 0},
            }}
            className="relative h-24 w-16 overflow-hidden rounded-lg border bg-zinc-900 shadow-xl"
        >
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={digit}
                    initial={{y: "100%"}}
                    animate={{y: "0%"}}
                    exit={{y: "-100%"}}
                    transition={{
                        y: {
                            duration: countdownMs < 1000 ? 0 : 0.25,
                            ease: [0.26, 0.08, 0.25, 1],
                        },
                        x: isShaking
                            ? {
                                duration: speed,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeInOut",
                            }
                            : {duration: 0},
                    }}
                    className="absolute inset-0 flex items-center justify-center text-5xl font-mono font-bold text-white"
                >
                    {digit}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

function SkewedCardGridBackground({posts, exit}: {
    posts?: {
        id: string
        body: string
        user: {
            id: string
            username: string
            images?: {
                avatar?: string
            }
        }
        assets: any
    }[]
    exit?: boolean
}) {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-10"/>

            <div
                className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] flex flex-wrap gap-8 justify-center items-center content-center opacity-[0.25] transform -rotate-12">
                {/* Split into 5 rows of 16 cards each */}
                {[0, 1, 2, 3, 4].map(row => (
                    <div
                        key={row}
                        className={cn(
                            row % 2 === 0 ? "translate-x-[1%]" : "",
                            "flex gap-8"
                        )}
                    >
                        {Array.from({length: 16}).map((_, i) => {
                            const index = row * 16 + i;
                            const post = posts?.[index % (posts?.length || 1)]

                            return (
                                <motion.div
                                    key={`${row}-${i}`}
                                    custom={row}
                                    initial="hidden"
                                    animate={exit ? "exit" : "visible"}
                                    variants={{
                                        hidden: (row) => ({opacity: 0, x: row % 2 === 0 ? -1000 : 1000}),
                                        visible: {
                                            opacity: 1,
                                            x: row % 2 === 0 ? 0 : 250,
                                            transition: {
                                                duration: 3,
                                                delay: row % 2 === 0 ? (15 - i) * 0.15 : i * 0.15,
                                                ease: "easeInOut"
                                            }
                                        },
                                        exit: (row) => ({
                                            opacity: 0,
                                            x: row % 2 === 0 ? -1000 : 1000,
                                            transition: {
                                                duration: 0.5,
                                                delay: row % 2 === 0 ? i * 0.1 : (15 - i) * 0.1,
                                                ease: "easeIn"
                                            }
                                        })
                                    }}
                                    className={cn(
                                        post ? 'bg-card' : 'bg-foreground',
                                        "w-40 h-60 rounded-xl p-4 border border-black min-w-md")}
                                >
                                    {(post && post.user) && (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Avatar src={getAvatar(post.user.id)} initials={post.user.username[0]}
                                                        className="size-6 shrink-0"/>
                                                <Text className="font-bold truncate text-xs">
                                                    {post.user.username}
                                                </Text>
                                            </div>
                                            <Text className="text-[10px] leading-tight line-clamp-[9]">
                                                {post.body}
                                            </Text>

                                            {post.assets && (
                                                <MediaGallery assets={post.assets}/>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

function CardMarquee({posts}: {
    posts?: {
        id: string
        body: string
        user: {
            id: string
            username: string
            images?: {
                avatar?: string
            }
        }
        assets: any
    }[]
}) {
    const controls = useAnimation();
    const controlsCard = useAnimation();

    useEffect(() => {
        controls.start({
            y: [-(posts.length / 2) * (240 + 16), 0],
            transition: {
                repeat: Infinity,
                repeatType: "loop",
                duration: posts.length * 4,
                ease: "linear"
            }
        });
    }, [controls, posts.length]);

    useEffect(() => {
        controlsCard.start((idx: number) => ({
            y: 0,
            opacity: 1,
            transition: {
                duration: 2,
                delay: (posts.length - idx) * 0.15,
                ease: "easeInOut",
            },
        }));
    }, [controlsCard]);

    return (
        <div className="relative overflow-hidden h-56 w-full py-8 -z-[1]">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-10"/>
            <motion.div
                className="flex flex-col gap-4 w-full"
                animate={controls}
            >
                {posts.map((post, idx) => (
                    <motion.div
                        key={`${post?.id}-${idx}`}
                        className={cn(
                            post ? "bg-card" : "bg-foreground",
                            "w-full h-60 rounded-xl p-4 border"
                        )}
                        custom={idx}
                        initial={{y: -500, opacity: 0}}
                        animate={controlsCard}
                    >
                        {(post && post.user) && (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <Avatar src={getAvatar(post.user.id)} initials={post.user.username[0]}
                                            className="size-6 shrink-0"/>
                                    <Text className="font-bold truncate text-xs">
                                        {post.user.username}
                                    </Text>
                                </div>
                                <Text>
                                    {post.body}
                                </Text>

                                {post.assets && (
                                    <MediaGallery assets={post.assets}/>
                                )}
                            </>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
