/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Feed, FeedError, FeedLoading} from '@/components/feed'
import Body from '@/components/layout/body'
import {Heading, Text} from '@/components/shared/text'
import UserInfoCol from '@/components/shared/user/info-col'
import {isVisible} from '@/lib'
import {useContentFrame} from '@/lib/hooks/content-frame'
import {Activity} from 'react'
import {useParams} from 'wouter'

export default function UserFolderPage() {
    const {id} = useParams<{ id: string }>()

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
                    <div className="flex max-w-3xl mx-auto mb-4 border-b pb-4">
                        <div className="flex-1 ml-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl" aria-hidden>{folder.emoji || '📁'}</span>
                                <Heading size="md">{folder.name}</Heading>
                            </div>
                            {folder.description && <Text size="sm" alt className="mt-1">{folder.description}</Text>}
                        </div>

                        <Activity mode={isVisible(!!profile)}>
                            <UserInfoCol user={profile}/>
                        </Activity>
                    </div>

                    <Feed folderID={folder.id}/>
                </>
            )}
        </div>
    )
}
