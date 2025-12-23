/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {TagsInput} from '@/components/howl-creator/tags-input'
import {useModal} from '@/components/modal/provider'
import {Button} from '@/components/shared/button'
import {Input} from '@/components/shared/input'
import {Heading, Text} from '@/components/shared/text'
import {isVisible, useUserAccountStore} from '@/lib'
import {useContentFrame, useContentFrameMutation} from '@/lib/hooks/content-frame'
import {queryBuildFromRaw} from '@/lib/utils/query-build-from-raw'
import {Field, SidebarItem} from '@/src/components'
import {PencilSquareIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/solid'
import {Activity, useMemo, useState} from 'react'

export type Folder = {
    id: string
    name: string
    description?: string
    emoji?: string
    query?: string
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
    const [query, setQuery] = useState((initial?.query?.match(/\[Where posts:tags \((.*?)\) AND posts:user_id \(".*?"\)\] AS \*/)?.[1] || '').trim().replaceAll('"', '').replaceAll('~', '') || '')

    const canSave = useMemo(() => {
        if (!name.trim()) return false
        return query?.trim().length > 0
    }, [name, query])

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

            <div className="space-y-2">
                <Text size="sm" className="font-medium">Search Query</Text>
                <TagsInput
                    value={query}
                    onChange={setQuery}/>
                <Text size="xs" alt>
                    Search query is used to populate the folder. Howls must have all tags in the query.
                </Text>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
                <Button plain onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    color="indigo"
                    disabled={!canSave}
                    onClick={() => onSave({name, description, emoji, query})}
                >
                    {initial?.id ? 'Update' : 'Create'} Folder
                </Button>
            </div>
        </div>
    )
}

export default function UserFolders({user: folderUser}: { user: { id: string; username: string } }) {
    const {show, hide} = useModal()
    const {user} = useUserAccountStore()

    const {
        data,
        isLoading,
        refetch
    } = useContentFrame('get', `folders?user=${folderUser.id}`, undefined, {
        id: `folders.${folderUser.id}`,
        enabled: true
    })
    const createMutation = useContentFrameMutation('post', 'folders', {onSuccess: () => refetch()})

    const folders: Folder[] = data?.folders || []

    const onCreate = async (input: Partial<Folder>) => {
        if (input.query && !input.query.startsWith('[')) {
            input.query = `$posts = [Where posts:tags (${queryBuildFromRaw(input.query)}) AND posts:user_id ("${folderUser.id}")] AS *;\n$posts:user = [Where profiles ("${folderUser.id}")] AS *;`
        }

        await createMutation.mutateAsync(input)
        hide()
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Heading size="sm">Folders</Heading>
                <Activity mode={isVisible(folderUser.id === user?.id && folders.length < 25)}>
                    <Button plain onClick={() => show(<FolderForm onCancel={() => hide()} onSave={onCreate}/>)}>
                        <PlusIcon className="h-4 w-4 mr-1"/> New
                    </Button>
                </Activity>
            </div>

            {isLoading && <Text size="xs" alt>Loading folders…</Text>}

            {!isLoading && folders.length === 0 && <Text size="xs" alt>No folders yet</Text>}

            <div className="flex flex-col gap-2">
                {folders.map(f => (
                    <Folder folder={f} user={folderUser} refetch={refetch} key={f.id}/>
                ))}
            </div>
        </div>
    )
}

function Folder({folder, user, refetch}: {
    folder: Folder
    user: { id: string; username: string }
    refetch: () => void
}) {
    const {show, hide} = useModal()
    const {user: currentUser} = useUserAccountStore()

    const updateMutation = useContentFrameMutation('patch', `folder.${folder.id}`, {onSuccess: () => refetch()})
    const deleteMutation = useContentFrameMutation('delete', `folder.${folder.id}`, {onSuccess: () => refetch()})

    const onUpdate = async (input: Partial<Folder>) => {
        if (input.query && !input.query.startsWith('[')) {
            input.query = `$posts = [Where posts:tags (${queryBuildFromRaw(input.query)}) AND posts:user_id ("${user.id}")] AS *;\n$posts:user = [Where profiles:id ("${user.id}")] AS *;`
        }

        await updateMutation.mutateAsync(input)
        hide()
    }

    const onDelete = async () => {
        await deleteMutation.mutateAsync({})
    }

    return (
        <SidebarItem key={folder.id} className="group"
                     href={`/@${user.username}/folders/${folder.id}`}>
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

                {user.id === currentUser?.id && (
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
                )}
            </div>
        </SidebarItem>
    )
}