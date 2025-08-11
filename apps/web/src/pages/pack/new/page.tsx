/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, { FormEvent, useEffect, useState } from 'react'
import { LoadingCircle } from '@/components/icons'
import { Heading, Text } from '@/components/shared/text'
import { Button } from '@/components/shared/experimental-button-rework'
import { vg } from '@/lib/api'
import { useResourceStore, useUserAccountStore } from '@/lib'
import { toast } from 'sonner'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import PackCard from '@/components/shared/pack/card'
import { useModal } from '@/components/modal/provider.tsx'
import { Input } from '@/components/shared/input.tsx'
import { Description, Field, Label } from '@/components/shared/fieldset.tsx'
import Rive from '@rive-app/react-canvas'
import { UserGroupIcon } from '@heroicons/react/20/solid'
import { Separator } from '@radix-ui/react-dropdown-menu'
import { Select, Textarea } from '@/components/shared'
import Markdown from '@/components/shared/markdown.tsx'

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
function CreatePackModal({ close }: { close: () => void }) {
    const [selected, setSelected] = useState<PrivacyOption>(PRIVACY_OPTIONS[0])
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        display_name: '',
        slug: '',
        description: '',
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
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
            const { data, error } = await vg.pack.create.post({
                display_name: formData.display_name,
                slug: formData.slug,
                description: formData.description,
                privacy: selected.id,
            })

            if (error) {
                toast.error(
                    `Whoops! ${error.status}: ${
                        (error.status as unknown as number) === 403 ? 'You are not authorized to perform this action.' : error.value.summary
                    }${error.value.property ? ` (/${error.value.on}${error.value.property})` : ''}`
                )
                setSubmitting(false)
                return
            }

            toast.success(`Pack "${data.display_name}" created successfully!`)
            window.location.href = `/p/${data.slug}`
        } catch (err) {
            toast.error('Failed to create pack. Please try again.')
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col-reverse sm:w-[50vw] md:flex-row">
            <div className="flex flex-col justify-between sm:w-1/2 md:border-r">
                <div className="flex-1 grow p-6 space-y-6 max-w-5/6">
                    <div className="flex items-center space-x-3">
                        <div className="inline-flex shrink-0 items-center justify-center rounded-sm bg-muted p-3">
                            <UserGroupIcon className="size-5" aria-hidden={true} />
                        </div>
                        <div className="space-y-0.5">
                            <Heading>{formData?.display_name || 'Pack Name'}</Heading>
                            <Text alt>{formData?.slug ? `@${formData.slug}` : 'Pack information will show here'}</Text>
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <div>
                        <Heading size="sm">Description</Heading>
                        <Markdown componentClassName="!leading-6 mt-1 !text-muted-foreground">
                            {formData?.description || '*Packs that describe what they are are more likely to be discovered!*'}
                        </Markdown>
                    </div>
                    <div>
                        <Heading size="sm">Tips</Heading>
                        <Text as="div" alt className="!leading-6 mt-1">
                            <ul className="list-disc list-inside">
                                <li>The call sign must be unique, but the name can be anything.</li>
                            </ul>
                        </Text>
                    </div>
                </div>
                <div className="flex items-center justify-between border-t p-4">
                    <Button type="button" plain onClick={close}>
                        Cancel
                    </Button>
                    <Button color="indigo" type="submit">
                        Create
                    </Button>
                </div>
            </div>

            <div className="flex-1 space-y-6 sm:w-1/2 p-6 md:px-6 md:pb-8 md:pt-6">
                <Field>
                    <div className="flex items-center space-x-3 mb-2">
                        <Text className="inline-flex size-6 items-center justify-center rounded-sm bg-muted">1</Text>
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
                        <Text className="inline-flex size-6 items-center justify-center rounded-sm bg-muted">2</Text>
                        <Label htmlFor="slug" className="text-sm font-medium">
                            Now a call sign
                        </Label>
                    </div>
                    <Description className="!text-xs">
                        Used to quickly get to your pack via URL, and optionally show as a flair on profiles.
                    </Description>
                    <Input type="text" name="slug" placeholder="rawr" value={formData.slug} onChange={handleInputChange} className="mt-1" />
                </Field>

                <Field>
                    <div className="flex items-center space-x-3 mb-2">
                        <Text className="inline-flex size-6 items-center justify-center rounded-sm bg-muted">3</Text>
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

                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <Text className="inline-flex size-6 items-center justify-center rounded-sm bg-muted">4</Text>
                        <Heading className="!text-sm font-medium flex-1">
                            By clicking "Create", you agree that you have the right to use and act on the information you provide, and that
                            it does not violate any third-party rights.
                        </Heading>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * SearchablePackList - Component for searching and displaying packs
 */
function SearchablePackList() {
    const [packs, setPacks] = useState<Pack[]>([])
    const [packsHidden, setPacksHidden] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchPacks = async () => {
            try {
                const { data } = await vg.packs.get()
                setPacks(data?.packs.filter(pack => pack.slug !== 'universe') || [])
                setPacksHidden(data?.hidden || 0)
            } catch (error) {
                toast.error('Failed to fetch packs')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPacks()
    }, [])

    const filteredPacks = packs.filter(
        pack =>
            pack.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (pack.description && pack.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Heading size="lg">Discover Packs</Heading>
                    {packsHidden > 0 && (
                        <Text size="sm" alt>
                            {packsHidden} pack{packsHidden !== 1 ? 's' : ''} already joined
                        </Text>
                    )}
                </div>

                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search packs"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="[&>&]:pl-12"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingCircle className="h-5 w-5" />
                </div>
            ) : filteredPacks.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredPacks.map(pack => (
                        <PackCard key={pack.id} pack={pack} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <Text alt>
                        {searchQuery ? `No packs matching "${searchQuery}"` : 'No packs available. Be the first to create one!'}
                    </Text>
                </div>
            )}
        </div>
    )
}

/**
 * PackAdd - Main component for the pack creation page
 */
export default function PackAdd() {
    const { setCurrentResource } = useResourceStore()
    const user = useUserAccountStore(state => state.user)
    const { show, hide } = useModal()

    useEffect(() => {
        setCurrentResource({
            id: 'new',
            slug: 'new',
            display_name: 'Discover Packs',
            standalone: true,
        })
    }, [setCurrentResource])

    const handleCreatePack = () => {
        show(<CreatePackModal close={hide} />)
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6">
                <div className="max-w-md">
                    <Heading>Find yo' pack</Heading>
                    <Text alt className="mt-2">
                        Join packs that match your vibe or start your own lil community to find your people. Packs are public, open, weird,
                        and (hopefully) fun~
                    </Text>
                    <div className="mt-6">
                        <Button onClick={handleCreatePack} color="indigo">
                            Create a Pack
                        </Button>
                    </div>
                </div>
                <div className="w-full max-w-lg">
                    <Rive src="/img/rive/pack-bench.riv" stateMachines="Animation" className="w-full h-[18rem]" />
                </div>
            </div>

            <SearchablePackList />
        </div>
    )
}
