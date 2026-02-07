/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {TagsInput} from '@/components/howl-creator/tags-input'
import {useModal} from '@/components/modal/provider'
import {Button} from '@/components/shared/button'
import {Input} from '@/components/shared/input'
import {Text} from '@/components/shared/text'
import {isVisible, useUserAccountStore} from '@/lib'
import {useContentFrame, useContentFrameMutation} from '@/lib/hooks/content-frame'
import {Field} from '@/src/components'
import {Activity, useMemo, useState} from 'react'
import Folder from '../folders/FolderIcon'

export type FolderResponse = {
    id: string
    name: string
    description?: string
    emoji?: string
    query?: string
    created_at: string
    updated_at: string
    assets: string[]
    howl_count: number
}

export function FolderForm({
                               initial,
                               onSave,
                               onCancel,
                           }: { initial?: Partial<FolderResponse>, onSave: (input: Partial<FolderResponse>) => void, onCancel: () => void }) {
    const [name, setName] = useState(initial?.name || '')
    const [description, setDescription] = useState(initial?.description || '')
    const [emoji, setEmoji] = useState(initial?.emoji || '📁')
    const [query, setQuery] = useState(initial?.query)

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

    const folders: FolderResponse[] = data?.folders || []

    const onCreate = async (input: Partial<FolderResponse>) => {
        await createMutation.mutateAsync(input)
        hide()
    }

    return (
        <div className="py-4">
            {folders?.length > 0 && (
                <div className="flex flex-wrap gap-2 px-8">
                    {folders.map(f => (
                        <Folder
                            href={`/@${folderUser.username}/folders/${f.id}`}
                            name={f.name || 'Test'}
                            fileCount={f.howl_count || 0}
                            size={10}
                            visibleFiles={f.assets}
                        />
                    ))}

                    <Activity mode={isVisible(folderUser.id === user?.id && folders.length < 25)}>
                        <svg
                            viewBox="-1 0 95 45"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="p-1 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity duration-200"
                            onClick={() => show(<FolderForm onCancel={() => hide()} onSave={onCreate}/>)}
                            style={{
                                width: '10rem',
                            }}
                        >
                            {/* Dotted folder outline */}
                            <path
                                d="M12 0 H32.5471 C35.1211 0 37.6338 0.784908 39.75 2.25 C41.8662 3.71509 44.3789 4.5 46.9529 4.5 H78.5 C85.1274 4.5 90.5 9.87258 90.5 16.5 V44 C90.5 50.63 85.1274 56 78.5 56 H12 C5.37258 56 0 50.63 0 44 V12 C0 5.37258 5.37258 0 12 0 Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="4 3"
                                fill="none"
                            />

                            {/* Plus symbol in the middle */}
                            <g transform="translate(45, 28)">
                                {/* Vertical line */}
                                <line
                                    x1="0"
                                    y1="-8"
                                    x2="0"
                                    y2="8"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                                {/* Horizontal line */}
                                <line
                                    x1="-8"
                                    y1="0"
                                    x2="8"
                                    y2="0"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </g>
                        </svg>
                    </Activity>
                </div>
            )}
        </div>
    )
}

// function Folder({folder, user, refetch}: {
//     folder: Folder
//     user: { id: string; username: string }
//     refetch: () => void
// }) {
//     const {show, hide} = useModal()
//     const {user: currentUser} = useUserAccountStore()
//
//     const updateMutation = useContentFrameMutation('patch', `folder.${folder.id}`, {onSuccess: () => refetch()})
//     const deleteMutation = useContentFrameMutation('delete', `folder.${folder.id}`, {onSuccess: () => refetch()})
//
//     const onUpdate = async (input: Partial<Folder>) => {
//         await updateMutation.mutateAsync(input)
//         hide()
//     }
//
//     const onDelete = async () => {
//         await deleteMutation.mutateAsync({})
//     }
//
//     return (
//         <SidebarItem key={folder.id} className="group"
//                      href={`/@${user.username}/folders/${folder.id}`}>
//             <div className="flex items-center w-full">
//                 <div className="flex w-full grow">
//                     <span className="text-xl" aria-hidden>{folder.emoji || '📁'}</span>
//                     <div className="flex flex-col gap-1 ml-2" aria-hidden="true">
//                         <div
//                             className="font-medium text-sm">{folder.name}</div>
//
//                         <Activity mode={isVisible(!!folder.description)}>
//                             <Text size="xs" alt>{folder.description}</Text>
//                         </Activity>
//                     </div>
//                 </div>
//
//                 {user.id === currentUser?.id && (
//                     <Dropdown>
//                         <DropdownButton as="div">
//                             <div className="ml-2 cursor-pointer opacity-0 group-hover:opacity-100 rounded-full p-1 transition ring-ring hover:ring-2">
//                                 <EllipsisHorizontalIcon className="h-5 w-5"/>
//                             </div>
//                         </DropdownButton>
//                         <DropdownMenu>
//                             <DropdownItem onClick={() => show(<FolderForm
//                                 initial={folder}
//                                 onCancel={() => hide()}
//                                 onSave={(input) => onUpdate(input)}
//                             />)}>
//                                 <PencilSquareIcon/> Edit
//                             </DropdownItem>
//
//                             <DropdownItem onClick={() => onDelete()} className="hover:bg-red-600! *:data-[slot=icon]:fill-red-500! hover:*:data-[slot=icon]:fill-white!">
//                                 <TrashIcon/> Delete
//                             </DropdownItem>
//                         </DropdownMenu>
//                     </Dropdown>
//                 )}
//             </div>
//         </SidebarItem>
//     )
// }