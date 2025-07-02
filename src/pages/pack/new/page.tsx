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
        <div className="p-6 max-w-lg">
            <h2 className="text-xl font-semibold mb-2">Create a Pack</h2>
            <p className="text-muted-foreground text-sm mb-6">
                Packs are communities of people with shared interests and customizable spaces.
            </p>

            <form onSubmit={createPack}>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">
                        Pack Name
                        <span className="text-red-500 ml-[0.25rem]">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">What should people call your community?</p>
                    <Input name="display_name" value={formData.display_name} onChange={handleInputChange} />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">
                        Pack Slug
                        <span className="text-red-500 ml-[0.25rem]">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">Choose wisely - changing this later will reset the pack!</p>
                    <div className="flex items-center">
                        <span className="text-muted-foreground text-sm mr-1">packbase.app/p/</span>
                        <Input name="slug" value={formData.slug} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="mb-6">
                    <Field>
                        <Label>Description</Label>
                        <Description>Tell others what your pack is all about</Description>
                        <Input name="description" type="textarea" value={formData.description} onChange={handleInputChange} />
                    </Field>
                </div>

                {/*<div className="mb-8">*/}
                {/*    <label className="block text-sm font-medium mb-2">Privacy</label>*/}

                {/*    <RadioGroup value={selected} onChange={setSelected}>*/}
                {/*        <Label className="sr-only select-none">Privacy</Label>*/}
                {/*        <div className="space-y-2">*/}
                {/*            {PRIVACY_OPTIONS.map(privacyOption => (*/}
                {/*                <Radio*/}
                {/*                    key={privacyOption.name}*/}
                {/*                    value={privacyOption}*/}
                {/*                    className={({ focus, checked }) =>*/}
                {/*                        `${focus ? 'ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-neutral-300' : ''}*/}
                {/*                                                                    ${*/}
                {/*                                                                        checked*/}
                {/*                                                                            ? 'bg-n-1/70 dark:bg-n-6'*/}
                {/*                                                                            : 'hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50'*/}
                {/*                                                                    }*/}
                {/*                                                                    ring-default flex select-none flex-col justify-center rounded border px-4 py-4 !no-underline transition-all`*/}
                {/*                    }*/}
                {/*                >*/}
                {/*                    {({ checked }) => (*/}
                {/*                        <div className="flex w-full items-center justify-between">*/}
                {/*                            <div className="flex items-center">*/}
                {/*                                <div className="text-sm">*/}
                {/*                                    <Label className={`font-medium  ${checked ? 'text-default' : 'text-alt'}`}>*/}
                {/*                                        {privacyOption.name}*/}
                {/*                                    </Label>*/}
                {/*                                    <Description className="text-alt inline">*/}
                {/*                                        <span>{privacyOption.desc}</span>{' '}*/}
                {/*                                        {privacyOption.warn && (*/}
                {/*                                            <p className="inline-flex items-center">*/}
                {/*                                                <QuestionMarkCircleIcon className="text-alt h-4 w-4" />*/}
                {/*                                                <span className="ml-1">{privacyOption.warn}</span>*/}
                {/*                                            </p>*/}
                {/*                                        )}*/}
                {/*                                    </Description>*/}
                {/*                                </div>*/}
                {/*                            </div>*/}
                {/*                            {checked && (*/}
                {/*                                <div className="text-default shrink-0">*/}
                {/*                                    <CheckIcon className="h-6 w-6" />*/}
                {/*                                </div>*/}
                {/*                            )}*/}
                {/*                        </div>*/}
                {/*                    )}*/}
                {/*                </Radio>*/}
                {/*            ))}*/}
                {/*        </div>*/}
                {/*    </RadioGroup>*/}
                {/*</div>*/}

                <div className="flex justify-end space-x-3">
                    <Button plain type="button" onClick={close}>
                        Cancel
                    </Button>
                    <Button color="indigo" type="submit" disabled={submitting}>
                        {submitting ? <LoadingCircle className="h-4 w-4" /> : 'Create Pack'}
                    </Button>
                </div>
            </form>
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

    if (!user || user.anonUser) {
        return (
            <div className="py-16 px-4 text-center">
                <Heading size="xl">Join packs on the platform</Heading>
                <Text alt className="mt-4 max-w-md mx-auto">
                    You need to sign in to view and join packs.
                </Text>
                <div className="mt-8">
                    <Button href="/auth/signin">Sign In</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="px-6 py-8 max-w-screen-xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6">
                <div className="max-w-md">
                    <Heading>Find your community</Heading>
                    <Text alt className="mt-2">
                        Join packs centered around your interests or create your own to connect with others.
                    </Text>
                    <div className="mt-6">
                        <Button onClick={handleCreatePack} color="indigo">
                            Create a Pack
                        </Button>
                    </div>
                </div>
                <div className="w-full max-w-xs">
                    <img src="/img/illustrations/settings/friends.svg" alt="Community illustration" className="w-full h-auto" />
                </div>
            </div>

            <SearchablePackList />
        </div>
    )
}
