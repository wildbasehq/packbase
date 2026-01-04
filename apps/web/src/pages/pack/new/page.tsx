/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {ExclamationDiamondIcon} from '@/components/icons/plump/exclamation-diamond'
import {useModal} from '@/components/modal/provider'
import {Button, Desktop, Textarea} from '@/components/shared'
import {Description, Field, Label} from '@/components/shared/fieldset'
import {Input} from '@/components/shared/input'
import Markdown from '@/components/shared/markdown'
import PackCard from '@/components/shared/pack/card'
import {Heading, Text} from '@/components/shared/text'
import {useResourceStore, useUserAccountStore} from '@/lib'
import {vg} from '@/lib/api'
import PackbaseInstance from '@/lib/workers/global-event-emit'
import {LoadingSpinner} from '@/src/components'
import {UserGroupIcon} from '@heroicons/react/20/solid'
import {MagnifyingGlassIcon} from '@heroicons/react/24/solid'
import {Separator} from '@radix-ui/react-dropdown-menu'
import {useRive} from '@rive-app/react-canvas'
import {ChangeEvent, FormEvent, useCallback, useEffect, useState} from 'react'
import {toast} from 'sonner'

// Types
type PrivacyOption = {
    id: string
    name: string
    desc: string
    warn?: string
}

type Pack = {
    id: string
    slug: string
    display_name: string
    description?: string
    [key: string]: any
}

// Privacy options for packs
const PRIVACY_OPTIONS: PrivacyOption[] = [
    {
        id: 'everyone',
        name: 'Public',
        desc: 'Everyone in the world can see this',
    },
    {
        id: 'followers',
        name: 'Followers Only',
        desc: 'Only your followers can see this',
        warn: 'Your friends are counted as followers',
    },
    {
        id: 'friends',
        name: 'Friends Only',
        desc: 'Only your friends can see this',
    },
    {
        id: 'private',
        name: 'Private',
        desc: 'Just for you and people you invite',
    },
]

/**
 * CreatePackModal - Component for creating a new pack
 */
export function CreatePackModal({close, onCreate}: {
    close?: () => void
    onCreate?: (pack: Pack) => void
}) {
    const [selected] = useState<PrivacyOption>(PRIVACY_OPTIONS[0])
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        display_name: '',
        slug: '',
        description: '',
    })

    document.title = `Create Pack • ${formData.display_name || 'Pack Name'}`

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'slug' ? value.toLowerCase() : value,
        }))
    }

    const createPack = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        try {
            const {data, error} = await vg.pack.create.post({
                display_name: formData.display_name,
                slug: formData.slug,
                description: formData.description,
                privacy: selected.id,
            })

            if (error) {
                toast.error(
                    `Whoops! ${error.status}: ${
                        (error.status as unknown as number) === 403
                            ? 'You cannot create Packs at this time.'
                            : error.value.summary || 'Check details and try again'
                    }${error.value.property ? ` (/${error.value.on}${error.value.property})` : ''}`
                )
                setSubmitting(false)
                return
            }

            toast.success(`Pack "${data.display_name}" created successfully!`)
            if (onCreate) {
                onCreate(data)
            } else {
                window.location.href = `/p/${data.slug}`
            }
        } catch (err) {
            toast.error('Failed to create pack. Please try again.')
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={createPack}
              className="flex flex-col-reverse w-full md:max-w-2xl lg:max-w-4xl md:flex-row">
            <div className="flex flex-col justify-between md:w-1/2 md:border-r">
                <Desktop>
                    <div className="flex-1 grow p-6 space-y-6">
                        <div className="flex items-center space-x-3">
                            <div
                                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-muted/50 p-3">
                                <UserGroupIcon className="size-5" aria-hidden={true}/>
                            </div>
                            <div className="space-y-0.5">
                                <Heading>{formData?.display_name || 'Pack Name'}</Heading>
                                <Text
                                    alt>{formData?.slug ? `#${formData.slug}` : 'Pack information will show here'}</Text>
                            </div>
                        </div>
                        <Separator className="my-4"/>
                        <div>
                            <Heading size="sm">Description</Heading>
                            <Markdown componentClassName="!leading-6 mt-1 !text-muted-foreground">
                                {formData?.description || '*Packs that describe what they are are more likely to be discovered!*'}
                            </Markdown>
                        </div>
                        <div>
                            <Heading size="sm">Tips</Heading>
                            <Text as="div" alt className="leading-6! mt-1">
                                <ul className="list-disc list-inside">
                                    <li>The call sign must be unique, but the name can be anything.</li>
                                    <li>After creation, don't forget to add an icon and banner image!</li>
                                </ul>
                            </Text>
                        </div>
                    </div>
                </Desktop>

                <div className="flex items-center justify-between border-t p-4">
                    {close && (
                        <Button type="button" plain onClick={close}>
                            Cancel
                        </Button>
                    )}
                    <Button color="indigo" type="submit" submissionState={submitting ? 'pending' : 'idle'}>
                        Create
                    </Button>
                </div>
            </div>

            <div className="flex-1 space-y-6 md:w-1/2 p-6 md:px-6 md:pb-8 md:pt-6">
                <Field>
                    <div className="flex items-center space-x-3 mb-2">
                        <Text className="inline-flex size-6 items-center justify-center rounded-lg bg-muted/50">1</Text>
                        <Label htmlFor="display_name" className="text-sm font-medium">
                            Give it a name
                        </Label>
                    </div>
                    <Input
                        type="text"
                        name="display_name"
                        placeholder="My Awesome Pack"
                        value={formData.display_name}
                        onChange={handleInputChange}
                        className="mt-1"
                    />
                </Field>

                <Field>
                    <div className="flex items-center space-x-3 mb-2">
                        <Text className="inline-flex size-6 items-center justify-center rounded-lg bg-muted/50">2</Text>
                        <Label htmlFor="slug" className="text-sm font-medium">
                            Now a call sign
                        </Label>
                    </div>
                    <Description className="text-xs!">
                        Used to quickly get to your pack via URL, and optionally show as a flair on profiles.
                        <br/>
                        <br/>
                        Only lowercase letters, hyphens, and underscores are allowed.
                    </Description>
                    <Input type="text" name="slug" placeholder="rawr" value={formData.slug} onChange={handleInputChange}
                           className="mt-1"/>
                </Field>

                <Field>
                    <div className="flex items-center space-x-3 mb-2">
                        <Text className="inline-flex size-6 items-center justify-center rounded-lg bg-muted/50">3</Text>
                        <Label htmlFor="description" className="text-sm font-medium">
                            What are you about?
                        </Label>
                    </div>
                    <Textarea
                        name="description"
                        placeholder="A pack for all your rawr needs"
                        value={formData.description}
                        onChange={handleInputChange}
                    />
                </Field>
            </div>
        </form>
    )
}

/**
 * SearchablePackList - Component for searching and displaying packs
 */
function SearchablePackList() {
    const [packs, setPacks] = useState<Pack[]>([])
    const [packsHidden, setPacksHidden] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPacks = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const {data} = await vg.packs.get()

                if (data) {
                    setPacks(data.packs || [])
                    setPacksHidden(data.hidden || 0)
                } else {
                    setPacks([])
                }
            } catch (err) {
                const errorMessage = 'Failed to load packs. Please try again.'
                setError(errorMessage)
                toast.error(errorMessage)
                console.error('Error fetching packs:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPacks()
    }, [])

    const handleSearchClick = useCallback(() => {
        PackbaseInstance.emit('search-open', {
            searchQuery: '#'
        })
    }, [])

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <PackListHeader packsHidden={packsHidden} onSearchClick={handleSearchClick}/>
                <div className="flex justify-center py-12">
                    <LoadingSpinner/>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <PackListHeader packsHidden={packsHidden} onSearchClick={handleSearchClick}/>
                <div className="text-center py-16">
                    <Text alt className="text-red-500">
                        {error}
                    </Text>
                </div>
            </div>
        )
    }

    // Empty state
    if (packs.length === 0) {
        return (
            <div className="space-y-6">
                <PackListHeader packsHidden={packsHidden} onSearchClick={handleSearchClick}/>
                <div className="text-center py-16">
                    <Text alt>
                        No packs available. Be the first to create one!
                    </Text>
                </div>
            </div>
        )
    }

    // Success state with packs
    return (
        <div className="space-y-6">
            <PackListHeader packsHidden={packsHidden} onSearchClick={handleSearchClick}/>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {packs.map(pack => (
                    <PackCard key={pack.id} pack={pack}/>
                ))}
            </div>
        </div>
    )
}

/**
 * PackListHeader - Header component with title and search button
 */
function PackListHeader({
                            packsHidden,
                            onSearchClick
                        }: {
    packsHidden: number
    onSearchClick: () => void
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <Heading size="lg">Discover Packs</Heading>
                {packsHidden > 0 && (
                    <Text size="sm" alt>
                        {packsHidden} pack{packsHidden === 1 ? '' : 's'} already joined
                    </Text>
                )}
            </div>

            <div className="relative w-full sm:w-64">
                <button
                    className="flex w-full items-center border bg-muted rounded py-1 px-2 gap-2 hover:bg-muted/80 hover:ring-1 ring-default transition-shadow"
                    aria-label="Search Packs"
                    onClick={onSearchClick}
                >
                    <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true"/>
                    <Text alt>
                        Search Packs...
                    </Text>
                </button>
            </div>
        </div>
    )
}

/**
 * PackAdd - Main component for the pack creation page
 */
export default function PackAdd() {
    const {user} = useUserAccountStore()
    const {setCurrentResource} = useResourceStore()
    const {show, hide} = useModal()

    const {RiveComponent} = useRive({
        src: '/img/rive/pack-bench.riv',
        stateMachines: 'Animation',
        autoplay: true
    })

    document.title = 'Packbase • Discover Packs'

    useEffect(() => {
        setCurrentResource({
            id: 'new',
            slug: 'new',
            display_name: 'Discover Packs',
            standalone: true,
        })
    }, [setCurrentResource])

    const handleCreatePack = () => {
        show(<CreatePackModal close={hide}/>)
    }

    // if (!user || user.anonUser) {
    //     return (
    //         <div className="py-16 px-4 text-center">
    //             <Heading size="xl">Join packs on the platform</Heading>
    //             <Text alt className="mt-4 max-w-md mx-auto">
    //                 You need to sign in to view and join packs.
    //             </Text>
    //             <div className="mt-8">
    //                 <Button href="/auth/signin">Sign In</Button>
    //             </div>
    //         </div>
    //     )
    // }

    return (
        <div className="px-6 py-8 max-w-screen-xl mx-auto space-y-12">
            {user && (
                <>
                    {!user?.requires_setup && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6">
                            <div className="max-w-md">
                                <Heading>Find 'yo pack</Heading>
                                <Text alt className="mt-2">
                                    Join packs that match your vibe or start your own lil community to find your people.
                                    Packs
                                    are
                                    public, open, weird,
                                    and (hopefully) fun~
                                </Text>
                                <div className="mt-6">
                                    <Button onClick={handleCreatePack} color="indigo">
                                        Create a Pack
                                    </Button>
                                </div>
                            </div>
                            <div className="w-full max-w-lg">
                                <RiveComponent
                                    className="w-full h-[18rem]"/>
                            </div>
                        </div>
                    )}

                    {user?.requires_setup && (
                        <div className="p-4 bg-muted border border-amber-500 rounded-lg">
                            <Heading size="xl" className="mb-2 items-center flex">
                                <ExclamationDiamondIcon className="size-6 mr-2 text-yellow-500"
                                                        aria-hidden="true"/>
                                Your first Pack will be your default!!
                            </Heading>
                            <Text>
                                Since this is your first time on Packbase, the first Pack you create will be set as your
                                Default Pack. You can change this later in your account settings.
                                <br/><br/>
                                Your "Default Pack" will be the one you see when going to your home page, and will be
                                the Pack
                                used for any actions that require a Pack context by default (i.e. Howling). Don't worry,
                                you can
                                always change your default Pack later, and can howl into any pack as long as you're a
                                member!
                            </Text>
                            <div className="mt-6">
                                <Button onClick={handleCreatePack} color="indigo">
                                    Create a Pack
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <SearchablePackList/>
        </div>
    )
}
