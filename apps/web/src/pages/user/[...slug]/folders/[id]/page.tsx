/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Feed, FeedError, FeedLoading} from '@/components/feed'
import {generateFolderColors} from '@/components/folders/FolderIcon'
import Body from '@/components/layout/body'
import {FolderForm} from '@/components/layout/user-folders'
import {useModal} from '@/components/modal/provider'
import {Heading, Text} from '@/components/shared/text'
import UserInfoCol from '@/components/shared/user/info-col'
import {isVisible, useUserAccountStore} from '@/lib'
import {useContentFrame, useContentFrameMutation} from '@/lib/hooks/content-frame'
import {Button} from '@/src/components'
import {ArrowLeftIcon, PencilIcon, TrashIcon} from '@heroicons/react/20/solid'
import {Activity, useMemo} from 'react'
import {useParams} from 'wouter'

export default function UserFolderPage() {
    const {id} = useParams<{ id: string }>()
    const {user} = useUserAccountStore()
    const {show, hide} = useModal()

    const {data, isLoading, error} = useContentFrame('get', `folder.${id}`, undefined, {
        id: `folder.${id}`,
        enabled: true
    })

    const folder = data?.folder as undefined | {
        id: string;
        name: string;
        description?: string;
        emoji?: string;
        mode: 'dynamic' | 'manual';
        query?: string;
        howl_ids?: string[];
    }

    const profile = data?.profile as undefined | {
        id: string;
        username: string;
        display_name: string;
        images_avatar?: string;
    }

    const folderColor = useMemo(() =>
            folder ? generateFolderColors(folder.name)?.color : '#FD577B',
        [folder?.name]
    )

    const updateMutation = useContentFrameMutation('patch', `folder.${folder?.id}`)
    const deleteMutation = useContentFrameMutation('delete', `folder.${folder?.id}`)

    const onUpdate = async (input) => {
        await updateMutation.mutateAsync(input)
        hide()
    }

    const onDelete = async () => {
        await deleteMutation.mutateAsync({})
    }

    if (error) return <FeedError error={error as any}/>

    return (
        <div className="p-6">
            {isLoading && (
                <Body>
                    <FeedLoading isMasonry={false} message="Loading collection..."/>
                </Body>
            )}

            {folder && (
                <>
                    <div className="max-w-3xl mx-auto mb-4">
                        <div className="mb-4">
                            <ArrowLeftIcon className="h-5 w-5 cursor-pointer" onClick={() => window.history.back()}/>
                        </div>

                        {/* Folder Notch */}
                        <div className="relative">
                            <svg
                                viewBox="0 0 200 32"
                                className="h-8 drop-shadow-xs"
                                style={{width: '200px'}}
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 0 H65 C68 0 71 1 74 2.5 C77 4 80 5 83 5 H188 C194.6 5 200 10.4 200 17 V32 H0 V12 C0 5.4 5.4 0 12 0 Z"
                                    fill={folderColor}
                                />
                            </svg>
                        </div>

                        {/* Header Content */}
                        <div
                            className="flex border border-t-0 rounded-b-lg p-4"
                            style={{
                                borderTopColor: folderColor,
                                borderTopWidth: '3px'
                            }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl" aria-hidden>{folder.emoji || '📁'}</span>
                                    <Heading size="md">{folder.name}</Heading>
                                </div>
                                {folder.description && <Text size="sm" alt className="mt-1">{folder.description}</Text>}
                                {profile?.id === user.id && (
                                    <div>
                                        <Button plain onClick={() => show(<FolderForm initial={folder} onCancel={() => hide()} onSave={onUpdate}/>)}>
                                            <PencilIcon/>
                                        </Button>

                                        <Button plain onClick={onDelete}>
                                            <TrashIcon/>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Activity mode={isVisible(!!profile)}>
                                <UserInfoCol user={profile}/>
                            </Activity>
                        </div>
                    </div>

                    <Feed folderID={folder.id}/>
                </>
            )}
        </div>
    )
}