/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { SidebarPortal } from '@/lib/context/sidebar-context.tsx'
import { SidebarDivider, SidebarItem, SidebarLabel, SidebarSection, Button, Input, BadgeButton } from '@/src/components'
import ContentFrame, { useContentFrame, useContentFrameMutation } from '@/components/shared/content-frame.tsx'
import { Avatar } from '@/components/shared/avatar.tsx'
import { useLocation } from 'wouter'
import { useMemo, useState } from 'react'
import { Text } from '@/components/shared/text.tsx'
import { usePerformanceMonitor } from '@/components/chat/usePerformanceMonitor.ts'
import { useQueryClient } from '@tanstack/react-query'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarPortal>
                <ChatSidebarContent />
            </SidebarPortal>
            {children}
        </>
    )
}

function ChatSidebarContent() {
    return (
        <>
            <ContentFrame get="dm.channels" refetchInterval={5} id="channels">
                <SidebarSection>
                    <NewDMForm />
                    <ChannelsList />
                </SidebarSection>
                <SidebarDivider />
            </ContentFrame>
        </>
    )
}

function ChannelsList() {
    usePerformanceMonitor('ChannelsList')
    let { data: channelsFrame, isLoading } = useContentFrame('get', 'dm.channels', undefined, { id: 'channels' })
    // sort by last_message.created_at (most recent first)
    const channels = useMemo(() => {
        if (!Array.isArray(channelsFrame)) return channelsFrame
        return channelsFrame
            .map(channel => {
                return {
                    id: channel.id,
                    type: channel.type,
                    last_message: {
                        created_at: channel.last_message?.created_at,
                        content: channel.last_message?.content,
                    },
                    unread_count: channel.unread_count,
                    recipients: channel.recipients,
                }
            })
            .sort((a: any, b: any) => {
                const aTime = a.last_message?.created_at
                const bTime = b.last_message?.created_at

                // Channels without messages go to the bottom
                if (!aTime && !bTime) return 0
                if (!aTime) return 1
                if (!bTime) return -1

                // Sort by timestamp descending (newest first)
                return new Date(bTime).getTime() - new Date(aTime).getTime()
            })
    }, [JSON.stringify(channelsFrame)])

    if (isLoading) {
        return (
            <div className="p-2 space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
        )
    }

    if (!Array.isArray(channels) || channels.length === 0) {
        return <div className="p-2 text-xs text-muted-foreground">No conversations yet</div>
    }

    return (
        <>
            {channels.map((c: any) => {
                const rec = c.recipients?.[0]
                const name = rec?.display_name || rec?.username || 'Direct Message'
                const avatarSrc = rec?.images_avatar || null
                const initials = (rec?.display_name || rec?.username || '?').slice(0, 1)
                return (
                    <SidebarItem key={c.id} href={`/c/${c.id}`}>
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                                <Avatar src={avatarSrc} alt={name} initials={avatarSrc ? undefined : initials} className="size-6" />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <SidebarLabel>{name}</SidebarLabel>
                                    {c.last_message?.content ? (
                                        <SidebarLabel className="text-muted-foreground truncate">{c.last_message.content}</SidebarLabel>
                                    ) : null}
                                </div>
                            </div>
                            {c.unread_count > 0 && <BadgeButton color="indigo">{c.unread_count > 99 ? '99+' : c.unread_count}</BadgeButton>}
                        </div>
                    </SidebarItem>
                )
            })}
        </>
    )
}

function NewDMForm() {
    const [, setLocation] = useLocation()
    const [username, setUsername] = useState('')
    const queryClient = useQueryClient()

    const createChannel = useContentFrameMutation('post', 'dm/channels', {
        onSuccess: channel => {
            setLocation(`/c/${channel.id}`)
            queryClient.invalidateQueries({ queryKey: ['channels'] })
        },
    })

    const startDM = async (userId: string) => {
        createChannel.mutate({ userId })
    }

    const { refetch: fetchUser } = useContentFrame('get', `user/${encodeURIComponent(username.trim())}`, undefined, {
        enabled: false,
    })

    const { refetch: fetchMe } = useContentFrame('get', 'user/me', undefined, {
        enabled: false,
    })

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim()) return

        try {
            const { data: profile } = await fetchUser()
            if (!profile?.id) throw new Error('invalid user')
            await startDM(profile.id)
            setUsername('')
        } catch (_) {
            // TODO: surface error to user later
        }
    }

    const onSelfDM = async () => {
        try {
            const { data: meData } = await fetchMe()
            if (!meData?.id) throw new Error('invalid me')
            await startDM(meData.id)
        } catch (_) {
            // no-op
        }
    }

    return (
        <form onSubmit={onSubmit} className="mb-3 space-y-2">
            <Text alt size="xs">
                A dirty way to start a DM, for now
            </Text>
            {/* debug input to force dm creation */}
            <Input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <Button color="indigo" type="submit" className="w-full" disabled={createChannel.isPending}>
                Start DM
            </Button>
            <Button outline className="w-full" type="button" onClick={onSelfDM} disabled={createChannel.isPending}>
                Jump to Your Basecamp
            </Button>
        </form>
    )
}
