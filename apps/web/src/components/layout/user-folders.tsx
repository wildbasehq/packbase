/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {Activity, useMemo, useState} from 'react'
import {Heading, Text} from '@/components/shared/text'
import {PencilSquareIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/solid'
import {useContentFrame, useContentFrameMutation} from '@/components/shared/content-frame'
import {isVisible, useUserAccountStore} from '@/lib'
import {Input} from '@/components/shared/input'
import {Button} from '@/components/shared/button'
import {Field, SidebarItem} from "@/src/components";
import {useModal} from "@/components/modal/provider.tsx";
import {TagsInput} from "@/components/feed/floating-compose.tsx";

export type Folder = {
    id: string
    name: string
    description?: string
    emoji?: string
    mode: 'dynamic' | 'manual'
    query?: string
    howl_ids?: string[]
    created_at: string
    updated_at: string
}

function FolderForm({
                        initial,
                        onSave,
                        onCancel,
                    }: { initial?: Partial<Folder>, onSave: (input: Partial<Folder>) => void, onCancel: () => void }) {
    const [name, setName] = useState(initial?.name || '')
    const [description, setDescription] = useState(initial?.description || '')
    const [emoji, setEmoji] = useState(initial?.emoji || '📁')
    const [mode, setMode] = useState<'dynamic' | 'manual'>(initial?.mode || 'dynamic')
    const [query, setQuery] = useState(initial?.query || '')
    const [howlIds, setHowlIds] = useState<string[]>(initial?.howl_ids || [])

    const [howlInput, setHowlInput] = useState('')

    const canSave = useMemo(() => {
        if (!name.trim()) return false
        if (mode === 'dynamic') return query.trim().length > 0
        return howlIds.length > 0
    }, [name, mode, query, howlIds])

    return (
        <div
            className="p-4 space-y-4 bg-card w-full min-w-md max-w-md">
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Field>
                        <Input
                            id="folder-emoji"
                            value={emoji}
                            onChange={e => setEmoji(e.target.value)}
                            placeholder="📁"
                            className="!w-12 !text-center text-xl"
                            maxLength={2}
                        />
                    </Field>

                    <Field>
                        <Input
                            id="folder-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Folder name"
                            className="flex-1 !max-w-full !w-full"
                            autoFocus
                        />
                    </Field>
                </div>

                <Input
                    id="folder-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full"
                />
            </div>

            {/*<SelectPills*/}
            {/*    onChange={({id}) => setMode(id as 'dynamic' | 'manual')}*/}
            {/*    options={[*/}
            {/*        {*/}
            {/*            id: 'dynamic',*/}
            {/*            name: 'Dynamic (search)'*/}
            {/*        },*/}
            {/*        {*/}
            {/*            id: 'manual',*/}
            {/*            name: 'Manual selection'*/}
            {/*        }*/}
            {/*    ]}*/}
            {/*/>*/}

            <Activity mode={isVisible(mode === 'dynamic')}>
                <div className="space-y-2">
                    <Text size="sm" className="font-medium">Search Query</Text>
                    <TagsInput value={query.replace('[tag', '').replace(']', '').trim()}
                               onChange={setQuery}/>
                    <Text size="xs" alt>
                        Search query is used to populate the folder. Howls must have all tags in the query.
                    </Text>
                </div>
            </Activity>

            {/*<Activity mode={isVisible(mode === 'manual')}>*/}
            {/*    <div className="space-y-3">*/}
            {/*        <Text size="sm" className="font-medium">Howl IDs</Text>*/}
            {/*        <div className="flex gap-2">*/}
            {/*            <Input*/}
            {/*                id="folder-howl-input"*/}
            {/*                value={howlInput}*/}
            {/*                onChange={e => setHowlInput(e.target.value)}*/}
            {/*                placeholder="Add howl ID"*/}
            {/*                className="flex-1"*/}
            {/*                onKeyDown={(e) => {*/}
            {/*                    if (e.key === 'Enter' && howlInput.trim()) {*/}
            {/*                        setHowlIds(prev => Array.from(new Set([...prev, howlInput.trim()])))*/}
            {/*                        setHowlInput('')*/}
            {/*                    }*/}
            {/*                }}*/}
            {/*            />*/}
            {/*            <Button*/}
            {/*                color="indigo"*/}
            {/*                onClick={() => {*/}
            {/*                    if (howlInput.trim()) {*/}
            {/*                        setHowlIds(prev => Array.from(new Set([...prev, howlInput.trim()])))*/}
            {/*                        setHowlInput('')*/}
            {/*                    }*/}
            {/*                }}*/}
            {/*                disabled={!howlInput.trim()}*/}
            {/*            >*/}
            {/*                <PlusIcon className="h-4 w-4" data-slot="icon"/>*/}
            {/*                Add*/}
            {/*            </Button>*/}
            {/*        </div>*/}

            {/*        <Activity mode={isVisible(howlIds.length > 0)}>*/}
            {/*            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">*/}
            {/*                {howlIds.map(id => (*/}
            {/*                    <Badge key={id} color="zinc" className="flex items-center gap-1.5 px-2 py-1">*/}
            {/*                        <span className="text-xs font-mono">{id}</span>*/}
            {/*                        <button*/}
            {/*                            onClick={() => setHowlIds(prev => prev.filter(x => x !== id))}*/}
            {/*                            className="hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded p-0.5 transition-colors"*/}
            {/*                            aria-label={`Remove ${id}`}*/}
            {/*                        >*/}
            {/*                            <XMarkIcon className="h-3 w-3"/>*/}
            {/*                        </button>*/}
            {/*                    </Badge>*/}
            {/*                ))}*/}
            {/*            </div>*/}
            {/*        </Activity>*/}

            {/*        <Activity mode={isVisible(!howlIds?.length)}>*/}
            {/*            <Text size="xs" alt className="text-center py-4">*/}
            {/*                Add howl IDs to manually populate this folder. Note: This is temporary -*/}
            {/*                search is brokey.*/}
            {/*            </Text>*/}
            {/*        </Activity>*/}
            {/*    </div>*/}
            {/*</Activity>*/}

            <div className="flex gap-2 justify-end pt-2 border-t">
                <Button plain onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    color="indigo"
                    disabled={!canSave}
                    onClick={() => onSave({name, description, emoji, mode, query, howl_ids: howlIds})}
                >
                    {initial?.id ? 'Update' : 'Create'} Folder
                </Button>
            </div>
        </div>
    )
}

export default function UserFolders() {
    const {show, hide} = useModal()

    const {data, isLoading, refetch} = useContentFrame('get', 'folders', undefined, {id: 'folders', enabled: true})
    const createMutation = useContentFrameMutation('post', 'folders', {onSuccess: () => refetch()})

    const folders: Folder[] = data?.folders || []

    const onCreate = async (input: Partial<Folder>) => {
        if (input.mode === 'dynamic' && input.query && !input.query.startsWith('[')) {
            input.query = `[tag ${input.query}]`
        }

        await createMutation.mutateAsync(input)
        hide()
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Heading size="sm">Folders</Heading>
                <Button plain onClick={() => show(<FolderForm onCancel={() => hide()} onSave={onCreate}/>)}>
                    <PlusIcon className="h-4 w-4 mr-1"/> New
                </Button>
            </div>

            {isLoading && <Text size="xs" alt>Loading folders…</Text>}

            {!isLoading && folders.length === 0 && <Text size="xs" alt>No folders yet</Text>}

            <div className="flex flex-col gap-2">
                {folders.map(f => (
                    <Folder folder={f} refetch={refetch} key={f.id}/>
                ))}
            </div>
        </div>
    )
}

function Folder({folder, refetch}: {
    folder: Folder
    refetch: () => void
}) {
    const {user} = useUserAccountStore()
    const {show, hide} = useModal()

    const updateMutation = useContentFrameMutation('patch', `folder.${folder.id}`, {onSuccess: () => refetch()})
    const deleteMutation = useContentFrameMutation('delete', `folder.${folder.id}`, {onSuccess: () => refetch()})

    const onUpdate = async (input: Partial<Folder>) => {
        if (input.mode === 'dynamic' && input.query && !input.query.startsWith('[')) {
            input.query = `[tag ${input.query}]`
        }

        await updateMutation.mutateAsync(input)
        hide()
    }

    const onDelete = async () => {
        await deleteMutation.mutateAsync({})
    }

    return (
        <SidebarItem key={folder.id} className="group"
                     href={`/${user?.username ? '@' + user.username : 'user/me'}/folders/${folder.id}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-1 w-full">
                    <span className="text-xl" aria-hidden>{folder.emoji || '📁'}</span>
                    <div className="flex flex-col gap-1 ml-2" aria-hidden="true">
                        <div
                            className="font-medium text-sm">{folder.name}</div>

                        <Activity mode={isVisible(!!folder.description)}>
                            <Text size="xs" alt>{folder.description}</Text>
                        </Activity>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <div onClick={() => show(<FolderForm
                        initial={folder}
                        onCancel={() => hide()}
                        onSave={(input) => onUpdate(input)}
                    />)}>
                        <PencilSquareIcon className="h-4 w-4"/>
                    </div>
                    <div onClick={() => onDelete()}>
                        <TrashIcon className="h-4 w-4"/>
                    </div>
                </div>
            </div>
        </SidebarItem>
    )
}