/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {Activity, useEffect, useState} from 'react'
import {useParams} from 'wouter'
import {useContentFrame} from '@/components/shared/content-frame'
import Body from '@/components/layout/body'
import {Feed, FeedError, FeedList, FeedLoading} from '@/components/feed'
import {Heading, Text} from '@/components/shared/text'
import {vg} from '@/lib/api'
import {isVisible} from "@/lib";
import UserInfoCol from "@/components/shared/user/info-col.tsx";

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

    const [manualPosts, setManualPosts] = useState<any[]>([])
    const [loadingManual, setLoadingManual] = useState(false)
    const [manualError, setManualError] = useState<any>(null)

    useEffect(() => {
        if (!folder || folder.mode !== 'manual') return
        let cancelled = false
        const load = async () => {
            setLoadingManual(true)
            setManualError(null)
            try {
                const ids = folder.howl_ids || []
                const results = await Promise.all(
                    ids.map(async (hid) => {
                        const res = await vg.howl({id: hid}).get()
                        return res.data
                    })
                )
                if (!cancelled) setManualPosts(results.filter(Boolean))
            } catch (e) {
                if (!cancelled) setManualError(e)
            } finally {
                if (!cancelled) setLoadingManual(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [folder?.id])

    if (error) return <FeedError error={error as any}/>

    return (
        <div className="p-6">
            {isLoading && (
                <Body>
                    <FeedLoading isMasonry={false} message="Loading folder..."/>
                </Body>
            )}

            {folder && (
                <div className="flex max-w-3xl mx-auto mb-4 border-b pb-4">
                    <div className="flex-1 ml-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl" aria-hidden>{folder.emoji || '📁'}</span>
                            <Heading size="md">{folder.name}</Heading>
                            {folder.mode === 'dynamic' &&
                                <span
                                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Dynamic</span>}
                        </div>
                        {folder.description && <Text size="sm" alt className="mt-1">{folder.description}</Text>}
                    </div>

                    <Activity mode={isVisible(!!profile)}>
                        <UserInfoCol user={profile}/>
                    </Activity>
                </div>
            )}

            {folder?.mode === 'dynamic' && (
                <Feed feedQueryOverride={folder.query}/>
            )}

            {folder?.mode === 'manual' && (
                <div className="relative pb-20 max-w-3xl space-y-4 mx-auto">
                    <Activity mode={isVisible(loadingManual)}>
                        <FeedLoading isMasonry={false} message="Loading howls..."/>
                    </Activity>

                    <Activity mode={isVisible(manualError)}>
                        <FeedError error={manualError as any}/>
                    </Activity>

                    <Activity mode={isVisible(manualPosts.length > 0)}>
                        <FeedList posts={manualPosts as any} hasMore={false} onLoadMore={async () => {
                        }} onPostDelete={() => {
                        }}/>
                    </Activity>
                </div>
            )}
        </div>
    )
}
