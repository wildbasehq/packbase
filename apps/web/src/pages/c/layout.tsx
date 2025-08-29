/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { SidebarPortal } from '@/lib/context/sidebar-context.tsx'
import { SidebarDivider, SidebarItem, SidebarLabel, SidebarSection, Button, Input } from '@/src/components'
import ContentFrame, { useContentFrame } from '@/components/shared/content-frame.tsx'
import { Avatar } from '@/components/shared/avatar.tsx'
import { useSession } from '@clerk/clerk-react'
import { useLocation } from 'wouter'
import { useState } from 'react'
import { Text } from '@/components/shared/text.tsx'

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
            <ContentFrame get="dm.channels">
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
    const { data: channels, loading } = useContentFrame()

    if (loading) {
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
                        <div className="flex items-center gap-2 min-w-0">
                            <Avatar src={avatarSrc} alt={name} initials={avatarSrc ? undefined : initials} className="size-6" />
                            <div className="flex flex-col min-w-0 flex-1">
                                <SidebarLabel>{name}</SidebarLabel>
                                {c.last_message?.content ? (
                                    <SidebarLabel className="text-muted-foreground truncate">{c.last_message.content}</SidebarLabel>
                                ) : null}
                            </div>
                            {c.unread_count > 0 && (
                                <div className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-medium shrink-0">
                                    {c.unread_count > 99 ? '99+' : c.unread_count}
                                </div>
                            )}
                        </div>
                    </SidebarItem>
                )
            })}
        </>
    )
}

function NewDMForm() {
    const { session } = useSession()
    const channelsFrame = useContentFrame() // parent ContentFrame (dm.channels)
    const [, setLocation] = useLocation()
    const [username, setUsername] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const startDM = async (userId: string) => {
        const token = await session?.getToken()
        const res = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/dm/channels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ userId }),
        })
        if (!res.ok) throw new Error('failed')
        const channel = await res.json()
        // Navigate to the channel and refresh list
        setLocation(`/c/${channel.id}`)
        channelsFrame.refresh()
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim()) return
        setSubmitting(true)
        try {
            const token = await session?.getToken()
            const profileRes = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/user/${encodeURIComponent(username.trim())}`, {
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })
            if (!profileRes.ok) throw new Error('user not found')
            const profile = await profileRes.json()
            if (!profile?.id) throw new Error('invalid user')
            await startDM(profile.id)
            setUsername('')
        } catch (_) {
            // TODO: surface error to user later
        } finally {
            setSubmitting(false)
        }
    }

    const onSelfDM = async () => {
        setSubmitting(true)
        try {
            const token = await session?.getToken()
            const meRes = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/user/me`, {
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })
            if (!meRes.ok) throw new Error('failed')
            const me = await meRes.json()
            if (!me?.id) throw new Error('invalid me')
            await startDM(me.id)
        } catch (_) {
            // no-op
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="mb-3 space-y-2">
            <Text alt size="xs">
                A dirty way to start a DM, for now
            </Text>
            {/* debug input to force dm creation */}
            <Input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <Button color="indigo" type="submit" className="w-full" disabled={submitting}>
                Start DM
            </Button>
            <Button outline className="w-full" type="button" onClick={onSelfDM} disabled={submitting}>
                Jump to Your Basecamp
            </Button>
        </form>
    )
}
