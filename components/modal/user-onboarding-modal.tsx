import {vg} from '@/lib/api'
import {UserProfileBasic} from '@/lib/defs/user'
import {useUserAccountStore} from '@/lib/states'
import {toast} from 'sonner'
import {ProjectSafeName} from '@/lib/utils'
import WolfoxDrawing from '@/src/images/png/wolfox-drawing.png'
import PuzzleCharacters from '@/src/images/svg/3-puzzle-characters.svg'
import CharacterHoldingPencil from '@/src/images/svg/character-holding-pencil.svg'
import CursorCharacterSorting from '@/src/images/svg/cursor-character-sorting.svg'
import MusicMutedCharacters from '@/src/images/svg/music-muted-characters.svg'
import clsx from 'clsx'
import {CheckIcon} from 'lucide-react'
import {Dispatch, FormEvent, JSX, SetStateAction, useEffect, useState} from 'react'
import Modal from '.'
import GodRays from '../charm/god-rays'
import {LoadingCircle} from '../icons'
import XMarkIcon from '@/components/icons/dazzle/xmark'
import SelectPills from '../shared/input/select-pills'
import Link from '../shared/link'
import {Heading, Text} from '../shared/text'
import {Button} from '../shared/button'

type StepFuncType = {
    setSubmitting: Dispatch<SetStateAction<boolean>>
    callback?: () => void
    [x: string]: any
}

function PackSelectForSetting() {
    const [packs, setPacks] = useState<any[] | null>(null)

    useEffect(() => {
        let effectTimeout
        vg.user.me.packs.get().then((data) => {
            effectTimeout = setTimeout(() => {
                setPacks(data?.data || [])
            }, 2000)
        })

        return () => clearTimeout(effectTimeout)
    }, [])

    return (
        <>
            {!packs ? (
                <div className="flex gap-1">
                    <LoadingCircle/>{' '}
                    <span
                        className="animate-gradient-move-x bg-linear-to-r from-neutral-100 via-neutral-500 to-neutral-100 bg-clip-text text-transparent [background-size:300%]">
                        Loading packs...
                    </span>
                </div>
            ) : !packs.length ? (
                <p className="flex">
                    <XMarkIcon className="text-alt mr-1 h-5 w-6 text-tertiary"/>
                    <Text alt size="sm" className="text-tertiary!">
                        You don't have any packs yet, you can join one and set it as default later. Your default pack for now will be the Universe.
                    </Text>
                </p>
            ) : (
                <SelectPills
                    label="Default Pack"
                    options={[
                        {
                            id: 'default',
                            name: 'Universe',
                            desc: 'All howls outside a pack goes into the global feed.',
                        },
                        {
                            id: 'custom_this_shouldnt_go_to_the_server_but_if_it_does_then_oh_well_just_put_in_universe_pls',
                            name: 'Another Pack',
                            desc: 'All howls outside a pack goes to the one selected below instead, not the global feed.',
                            disabled: true,
                        },
                    ]}
                />
            )}
        </>
    )
}

const steps: {
    id: string
    name: string
    description: string
    component: (arg0: any) => JSX.Element
    func?: (arg0: StepFuncType) => Promise<void>
}[] = [
    {
        id: '01',
        name: 'Welcome!',
        description: 'Well... Who are you?',
        component: ({user}: { user: UserProfileBasic }) => (
            <>
                <div className="flex flex-col">
                    <Heading>✨ Welcome to Packbase ✨</Heading>
                    <div className="mt-2 space-y-2">
                        <Text alt size="sm">
                            We're so glad you're here! We just need a few details to get you started, it'll only take a minute. This is a mandatory one-time setup if
                            you'd like to do anything other than browsing.
                        </Text>
                        <Text alt size="sm">
                            If you haven't already, please familiarise yourself with our <Link href="/terms">Community & Data Security Guidelines</Link>.
                        </Text>
                    </div>

                    <div className="mt-12 flex flex-col">
                        <div className="relative sm:col-span-4">
                            <label htmlFor="slug" className="block">
                                <Heading>First, your Space URL & Username</Heading>
                                <Text alt size="xs">
                                    Your username is used to find and reference you across {ProjectSafeName}. Your Space URL holds your personal customised site.
                                </Text>
                            </label>
                            <div className="mt-2">
                                <div
                                    className="bg-default flex rounded-md shadow-xs ring-1 ring-inset ring-neutral-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 dark:ring-neutral-800">
                                    <input
                                        type="text"
                                        name="slug"
                                        id="slug"
                                        autoComplete="slug"
                                        className="no-legacy text-default block flex-1 border-0 bg-transparent px-3 py-1.5 placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder={user.slug}
                                        defaultValue={user.slug}
                                        required
                                    />
                                    <span className="flex select-none items-center pr-3 text-neutral-500 sm:text-sm">.packbase.app</span>
                                </div>
                                <Text size="xs" className="text-alt mt-1">
                                    This is for your personal space. You can set this to a custom domain later,
                                    <br/>
                                    <b>
                                        <u>but changing the base URL is impossible!</u>
                                    </b>
                                </Text>
                            </div>

                            <div className="mt-2">
                                <div
                                    className="bg-default flex rounded-md shadow-xs ring-1 ring-inset ring-neutral-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 dark:ring-neutral-800">
                                    <span className="flex select-none items-center pl-3 text-neutral-500 sm:text-sm">@</span>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        autoComplete="username"
                                        className="no-legacy text-default block flex-1 border-0 bg-transparent py-1.5 pl-1 placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder={user.username}
                                        defaultValue={user.username}
                                        required
                                    />
                                </div>
                                <Text size="xs" className="text-alt mt-1">
                                    This is used for others to find you and your profile.
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden aspect-square items-center lg:flex">
                    <img src={WolfoxDrawing} alt="LITTLE BABY BOY" className="w-auto" height={3000} width={3000}/>
                </div>
            </>
        ),
        func: async ({setSubmitting, user, setUser, callback, username, slug}) => {
            vg.user.me
                .post({
                    username,
                    slug,
                })
                .then(({data, error}) => {
                    if (data && !error) {
                        toast.success('Profile updated')
                        setUser({...user, username, slug})
                        callback()
                    } else {
                        setSubmitting(false)
                        toast.error('Couldn\'t save: ' + (error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'))
                    }
                })
                .catch((err) => {
                    setSubmitting(false)
                    toast.error('Couldn\'t save: ' + (err.message ? `${err.cause}: ${err.message}` : 'Something went wrong'))
                })
        },
    },
    {
        id: '02',
        name: 'Profile Type',
        description: 'Use our template, or your own HTML/CSS.',
        component: ({user}: { user: UserProfileBasic }) => (
            <>
                <div className="flex flex-col">
                    <Heading>Hey {user.username}! How do you want us to show you?</Heading>
                    <div className="mt-2 space-y-2">
                        <Text alt size="sm">
                            We need to know what you'd like to show on your space ({user.slug}.packbase.app). You can choose to use our default template, or fully use
                            your own HTML and CSS!
                        </Text>
                        <Text alt size="sm">
                            You can change to a custom domain later, and your profile (@{user.username}) can have limited CSS.
                        </Text>
                    </div>

                    <div className="mt-8">
                        <SelectPills
                            options={[
                                {
                                    id: 'default',
                                    name: 'Default',
                                    desc: 'Use our template to show your space, mimicking your profile.',
                                },
                                {
                                    id: 'custom_free',
                                    name: 'Custom',
                                    desc: 'Use all your own HTML and CSS, with a default "Your site is ready!" page.',
                                    warn: 'You can give anchors for our engine to hook into (i.e. feeds), but JS is only for custom domains.',
                                },
                            ]}
                        />
                    </div>
                </div>
                <div className="hidden items-center lg:flex">
                    <img src={PuzzleCharacters} alt="3 Puzzle Characters" className="w-auto"/>
                </div>
            </>
        ),
        func: async ({setSubmitting, user, setUser, callback, ...args}) => {
            const space_type = args['RadioGroup[id]'] // ??? IDK
            vg.user.me
                .post({
                    space_type,
                })
                .then(({data, error}) => {
                    if (data && !error) {
                        toast.success('Profile updated')
                        setUser({...user, space_type})
                        callback()
                    } else {
                        setSubmitting(false)
                        toast.error('Couldn\'t save: ' + (error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'))
                    }
                })
                .catch((err) => {
                    setSubmitting(false)
                    toast.error('Couldn\'t save: ' + (err.message ? `${err.cause}: ${err.message}` : 'Something went wrong'))
                })
        },
    },
    {
        id: '03',
        name: 'Privacy & Default Pack',
        description: 'Specify who sees your howls, and where it goes.',
        component: () => {
            return (
                <>
                    <div className="flex flex-col">
                        <Heading>Where should we send your global howls, and who should see them?</Heading>
                        <div className="mt-2 space-y-2">
                            <Text alt size="sm">
                                Every howl belongs to a pack - even global ones. You can choose your default pack ('Universe' by default), and who specifically sees your
                                howls. <b>Your post privacy only affects howls to the Universe and visibility on your profile!</b> They'll always be public in the pack
                                they're in.
                            </Text>
                            <Text alt size="sm">
                                Changing the default pack causes your howl to no longer appear in the Universe & Explore feeds, unless someone rehowls them into it.
                            </Text>
                            <Text alt size="sm">
                                <b>In other words</b>: If a howl doesn't have a pack selected, it'll go to the following pack instead.
                            </Text>
                        </div>
                        <div className="mt-8 space-y-8">
                            <PackSelectForSetting/>

                            <SelectPills
                                label="Who Sees Your Howls"
                                id="post_privacy"
                                options={[
                                    {
                                        id: 'everyone',
                                        name: 'Everyone',
                                    },
                                    {
                                        id: 'followers',
                                        name: 'Only Followers',
                                    },
                                    {
                                        id: 'friends',
                                        name: 'Only Friends / Mutuals',
                                    },
                                    {
                                        id: 'private',
                                        name: 'Only You',
                                    },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="hidden items-center lg:flex">
                        <img src={MusicMutedCharacters} alt="3 Puzzle Characters" className="w-auto"/>
                    </div>
                </>
            )
        },
        func: async ({setSubmitting, user, setUser, callback, ...args}) => {
            const post_privacy = args['post_privacy[id]'] // ??? IDK
            vg.user.me
                .post({
                    post_privacy,
                })
                .then(({data, error}) => {
                    if (data && !error) {
                        toast.success('Profile updated')
                        setUser({...user, post_privacy})
                        callback()
                    } else {
                        setSubmitting(false)
                        toast.error('Couldn\'t save: ' + (error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'))
                    }
                })
                .catch((err) => {
                    setSubmitting(false)
                    toast.error('Couldn\'t save: ' + (err.message ? `${err.cause}: ${err.message}` : 'Something went wrong'))
                })
        },
    },
    {
        id: '04',
        name: 'Data Storage',
        description: 'Choose who hosts your data - us, or you.',
        component: () => (
            <>
                <div className="flex flex-col">
                    <Heading>And finally; Where do you want your data to be stored?</Heading>
                    <div className="mt-2 space-y-2">
                        <Text alt size="sm">
                            You can store your data on our servers or host it yourself. If you self-host, some data (i.e. user db) will be "replicated", but other data
                            (i.e. space files) will be fully hosted by you.
                        </Text>
                        <Text alt size="sm">
                            Replicated data is data that is hosted on our servers, but an exact copy is also stored on your server. Basically a full backup of everything
                            we have about you.
                        </Text>
                    </div>
                    <div className="mt-8 space-y-8">
                        <SelectPills
                            id="data_storage"
                            options={[
                                {
                                    id: 'none',
                                    name: 'Wildbase (Us)',
                                    desc: '1GB storage on us. Not sure what to pick? This is the best option.',
                                },
                                {
                                    id: 'pixeldrain',
                                    name: 'Pixeldrain',
                                    desc: 'However much you have on your Pixeldrain account',
                                },
                                {
                                    id: 'dummy',
                                    name: 'More soon!',
                                    disabled: true,
                                },
                                // {
                                //     id: 'sftp',
                                //     name: 'Secure File Transfer Protocol (SFTP)',
                                //     desc: "A high performance server recommended, as we don't cache your data this way.",
                                // },
                                // {
                                //     id: 'supabase',
                                //     name: 'Supabase',
                                //     desc: 'Used internally, but extremely overkill compared to other options.',
                                // },
                            ]}
                        />
                        <Text alt size="sm">
                            <b>WARNING:</b> We only provide support for our own storage, you're on your own if you choose to host it yourself. You'll also need to
                            complete more setup in your settings later.
                        </Text>
                    </div>
                </div>
                <div className="hidden items-center lg:flex">
                    <img src={CursorCharacterSorting} alt="3 Puzzle Characters" className="w-auto"/>
                </div>
            </>
        ),
        func: async ({callback}) => callback(),
    },
    {
        id: '05',
        name: 'All Done!',
        description: 'Welcome to Packbase!',
        component: () => (
            <>
                <div className="flex flex-col">
                    <Heading>🎉 You're all done!</Heading>
                    <div className="mt-2 space-y-2">
                        <Text alt size="sm">
                            We hope you enjoy Packbase~! If you ever need to change anything, you can do so in your settings. Have fun!
                        </Text>
                        <Text alt size="sm">
                            There may be some features that won't be available until you've completed some more setup over in your settings, but you've got the basics
                            down!
                        </Text>
                    </div>
                </div>
                <div className="hidden items-center lg:flex">
                    <img src={CharacterHoldingPencil} alt="3 Puzzle Characters" className="w-auto"/>
                </div>
            </>
        ),
    },
]

export default function UserOnboardingModal({state}: { state: [boolean, Dispatch<SetStateAction<boolean>>] }) {
    const {user, setUser} = useUserAccountStore()
    const [showOnboardingModal, setShowOnboardingModal] = state
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [currentStep, setCurrentStep] = useState<number>(0)

    const nextStep = (event: FormEvent) => {
        event.preventDefault()
        // Convert event to form data
        const formData = new FormData(event.target as HTMLFormElement)
        const newStep = currentStep + 1

        if (currentStep === steps.length - 1) {
            vg.dipswitch.post({dpk: 'uod', dpv: ''})
            return setShowOnboardingModal(false)
        }

        if (steps[currentStep].func) {
            setSubmitting(true)
            steps[currentStep]
                .func({
                    setSubmitting,
                    user,
                    setUser,
                    callback: () => {
                        setCurrentStep(newStep)
                    },
                    ...Object.fromEntries(formData),
                })
                .then(() => {
                    setSubmitting(false)
                })
        } else {
            toast.error('No function for this step!')
        }
    }

    return (
        <>
            {showOnboardingModal && <GodRays className="-top-12 z-40 opacity-20"/>}
            <Modal
                showModal={showOnboardingModal}
                setShowModal={setShowOnboardingModal}
                maxWidth
                className="h-full w-full max-w-(--breakpoint-2xl) overflow-auto! lg:max-h-[80%]"
            >
                <>
                    {/* Loading overlay */}
                    {submitting && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/25 backdrop-blur-lg dark:bg-black">
                            <div className="flex items-center justify-center">
                                <LoadingCircle/>
                                <span className="text-default ml-2">Please wait...</span>
                            </div>
                        </div>
                    )}

                    {/* Steps Header */}
                    <div className="sticky top-0 z-30 border-0 border-b border-solid bg-white backdrop-blur-sm dark:bg-neutral-700/10 md:w-full md:overflow-x-auto">
                        <nav className="mx-auto overflow-x-auto px-4 sm:px-6 md:w-full lg:px-8" aria-label="Progress">
                            <ol role="list" className="overflow-hidden rounded-md border-0 lg:flex lg:rounded-none lg:border-l lg:border-r">
                                {steps.map((step, stepIdx) => (
                                    <li key={step.id} className="relative select-none overflow-hidden lg:flex-1">
                                        <div
                                            className={clsx(
                                                stepIdx === 0 ? 'rounded-t-md border-b-0' : '',
                                                stepIdx === steps.length - 1 ? 'rounded-b-md border-t-0' : '',
                                                'overflow-hidden border lg:border-0',
                                            )}
                                        >
                                            <div className="group">
                                                <span
                                                    className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-neutral-500/10 lg:bottom-0 lg:top-auto lg:h-1 lg:w-full"
                                                    aria-hidden="true"
                                                />
                                                <span className={clsx(stepIdx !== 0 ? 'lg:pl-9' : '', 'flex items-start px-6 py-5 text-sm font-medium')}>
                                                    <span className="shrink-0">
                                                        <span
                                                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                                                stepIdx < currentStep ? 'bg-primary' : stepIdx == currentStep ? 'border border-primary' : 'border'
                                                            }`}
                                                        >
                                                            {stepIdx == currentStep ? (
                                                                <span className="text-primary">{step.id}</span>
                                                            ) : stepIdx < currentStep ? (
                                                                <CheckIcon className="h-6 w-6 text-white" aria-hidden="true"/>
                                                            ) : (
                                                                <span className="text-alt">{step.id}</span>
                                                            )}
                                                        </span>
                                                    </span>
                                                    <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                                        <span className={`font-medium ${stepIdx > currentStep ? 'text-default' : 'text-primary'}`}>{step.name}</span>
                                                        <span className="text-alt text-sm">{step.description}</span>
                                                    </span>
                                                </span>
                                            </div>

                                            {stepIdx !== 0 ? (
                                                <>
                                                    {/* Separator */}
                                                    <div className="absolute inset-0 left-0 top-0 hidden w-3 lg:block" aria-hidden="true">
                                                        <svg
                                                            className="h-full w-full text-neutral-300 dark:text-neutral-800"
                                                            viewBox="0 0 12 82"
                                                            fill="none"
                                                            preserveAspectRatio="none"
                                                        >
                                                            <path d="M0.5 0V31L10.5 41L0.5 51V82" stroke="currentcolor" vectorEffect="non-scaling-stroke"/>
                                                        </svg>
                                                    </div>
                                                </>
                                            ) : null}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="mx-auto h-1/2 max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
                        <form onSubmit={nextStep} className="grid grid-cols-1 items-center justify-center gap-8 lg:grid-cols-2">
                            {/* Render JSX component from step */}
                            {steps[currentStep].component({user})}

                            {/* Buttons */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowOnboardingModal(false)
                                    }}
                                >
                                    Continue Later
                                </Button>
                                <Button variant="primary" type="submit">
                                    Next &rarr;
                                </Button>
                            </div>
                        </form>
                    </div>
                </>
            </Modal>
        </>
    )
}
