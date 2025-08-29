/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useParams } from 'wouter'
import { useContentFrame, useContentFrames } from '@/src/components'
import ContentFrame from '@/components/shared/content-frame.tsx'
import { ChatBox } from '@/components/shared/chat-box.tsx'
import { Avatar } from '@/components/shared/avatar.tsx'
import { useSession } from '@clerk/clerk-react'
import Markdown from '@/components/shared/markdown.tsx'
import { useUserAccountStore } from '@/lib'
import React from 'react'
import { toast } from 'sonner'

export default function ChatThreadPage() {
    const { id } = useParams<{ id: string }>()
    if (!id) return null

    return (
        <div className="flex flex-col h-full w-full">
            <ContentFrame get={`dm.channels.${id}`} cache>
                <ChannelHeader />
                <ContentFrame get={`dm.channels.${id}.messages`} cache refreshInterval={1}>
                    <MessagesList />
                    <MessageComposer channelId={id} />
                </ContentFrame>
            </ContentFrame>
        </div>
    )
}

function ChannelHeader() {
    const { data: channel, loading } = useContentFrame()
    const rec = channel?.recipients?.[0]
    const name = rec?.display_name || rec?.username || 'Direct Message'
    const avatarSrc = rec?.images_avatar || null
    const initials = (rec?.display_name || rec?.username || '?').slice(0, 1)
    return (
        <div className="border-b p-3">
            {loading ? (
                <div className="h-5 w-40 bg-muted animate-pulse rounded" />
            ) : channel ? (
                <div className="flex items-center gap-3">
                    <Avatar src={avatarSrc} alt={name} initials={avatarSrc ? undefined : initials} className="size-6" />
                    <div className="text-sm text-muted-foreground">{name}</div>
                </div>
            ) : null}
        </div>
    )
}

function MessagesList() {
    const messagesFrame = useContentFrame()
    const { data: messages, loading } = messagesFrame
    const channelFrame = messagesFrame.parent
    const { user: me } = useUserAccountStore()
    const [loadingOlder, setLoadingOlder] = React.useState(false)
    const [hasMoreMessages, setHasMoreMessages] = React.useState(true)
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    
    // Editing state
    const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null)
    const [editContent, setEditContent] = React.useState('')

    const channel = channelFrame?.data as any
    const { session } = useSession()

    // Edit helper functions
    const startEdit = (messageId: string, currentContent: string) => {
        setEditingMessageId(messageId)
        setEditContent(currentContent || '')
    }

    const cancelEdit = () => {
        setEditingMessageId(null)
        setEditContent('')
    }

    const saveEdit = async (messageId: string) => {
        if (!editContent.trim()) return
        
        try {
            const token = await session?.getToken()
            const res = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/dm/messages/${messageId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content: editContent.trim() }),
            })
            
            if (res.ok) {
                const updatedMessage = await res.json()
                // Update the message in the local data
                messagesFrame.data = messagesFrame.data.map((msg: any) =>
                    msg.id === messageId ? { ...msg, content: updatedMessage.content, edited_at: updatedMessage.edited_at } : msg
                )
                cancelEdit()
            }
        } catch (error) {
            console.error('Failed to edit message:', error)
        }
    }

    // Function to load older messages
    const loadOlderMessages = async () => {
        if (loadingOlder || !hasMoreMessages || !messages?.length) return
        
        setLoadingOlder(true)
        try {
            const token = await session?.getToken()
            const oldestMessage = messages[messages.length - 1] // Messages are in desc order from API
            const channelId = channel?.id || messagesFrame.signature?.split('.')[2]
            
            const res = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/dm/channels/${channelId}/messages?before=${oldestMessage.id}&limit=50`, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })
            
            if (res.ok) {
                const olderMessages = await res.json()
                if (olderMessages.length === 0) {
                    setHasMoreMessages(false)
                } else {
                    // Deduplicate and merge
                    const existingIds = new Set(messages.map((m: any) => m.id))
                    const newMessages = olderMessages.filter((m: any) => !existingIds.has(m.id))
                    messagesFrame.data = [...messages, ...newMessages]
                }
            }
        } catch (error) {
            console.error('Failed to load older messages:', error)
        } finally {
            setLoadingOlder(false)
        }
    }

    // Scroll event handler
    const handleScroll = () => {
        const container = scrollContainerRef.current
        if (!container) return
        
        // Load more when scrolled near the top (within 200px)
        if (container.scrollTop <= 200 && !loadingOlder) {
            loadOlderMessages()
        }
    }

    if (loading) {
        return (
            <div className="flex-1 overflow-auto p-4 space-y-2">
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/5 bg-muted animate-pulse rounded" />
            </div>
        )
    }

    const recipient = channel?.recipients?.[0]

    const getAuthorInfo = (authorId: string) => {
        if (me && authorId === me.id) {
            const name = me.display_name || me.username || 'You'
            return {
                name,
                images_avatar: me.images?.avatar || null,
                initials: (name || 'Y').slice(0, 1),
            }
        }
        const name = recipient?.display_name || recipient?.username || 'Friend'
        return {
            name,
            images_avatar: recipient?.images_avatar || null,
            initials: (name || 'F').slice(0, 1),
        }
    }

    const formatDay = (d: Date) => {
        const today = new Date()
        const yest = new Date()
        yest.setDate(today.getDate() - 1)
        const sameDay = (a: Date, b: Date) =>
            a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
        if (sameDay(d, today)) return 'Today'
        if (sameDay(d, yest)) return 'Yesterday'
        return d.toLocaleDateString()
    }

    type Group = { type: 'group'; authorId: string; startAt: Date; items: any[] } | { type: 'day'; label: string }

    const groups: Group[] = []
    const asc = Array.isArray(messages) ? [...messages].reverse() : []
    const thresholdMs = 5 * 60 * 1000

    let lastDay: string | null = null

    for (const m of asc) {
        const ts = new Date(m.created_at)
        const day = formatDay(ts)
        if (lastDay !== day) {
            groups.push({ type: 'day', label: day })
            lastDay = day
        }
        const last = groups[groups.length - 1]
        if (last && last.type === 'group' && last.authorId === m.author_id && ts.getTime() - last.startAt.getTime() <= thresholdMs) {
            last.items.push(m)
        } else {
            groups.push({ type: 'group', authorId: m.author_id, startAt: ts, items: [m] })
        }
    }

    if (!asc.length) {
        return <div className="flex-1 overflow-auto p-4 text-sm text-muted-foreground">No messages yet</div>
    }

    return (
        <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-auto p-4 space-y-3"
            onScroll={handleScroll}
        >
            {loadingOlder && hasMoreMessages && (
                <div className="flex justify-center py-2">
                    <div className="text-xs text-muted-foreground">
                        <span className="animate-pulse">Loading older messages...</span>
                    </div>
                </div>
            )}
            {groups.map((g, idx) => {
                if (g.type === 'day') {
                    return (
                        <div key={`day-${idx}`} className="relative flex items-center justify-center my-2">
                            <div className="absolute inset-x-0 h-px bg-border" />
                            <span className="relative z-10 bg-background px-2 text-xs text-muted-foreground">{g.label}</span>
                        </div>
                    )
                }
                const author = getAuthorInfo(g.authorId)
                const first = g.items[0]
                const timeLabel = new Date(first.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                return (
                    <div key={`grp-${idx}`} className="group">
                        <div className="flex gap-3">
                            <Avatar
                                src={author.images_avatar}
                                alt={author.name}
                                initials={author.images_avatar ? undefined : author.initials}
                                className="size-8 mt-1"
                            />
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium">{author.name}</span>
                                    <span className="text-[11px] text-muted-foreground">{timeLabel}</span>
                                </div>
                                <div className="text-sm whitespace-normal break-words group/message relative">
                                    {editingMessageId === first.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        cancelEdit()
                                                    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                        e.preventDefault()
                                                        saveEdit(first.id)
                                                    }
                                                }}
                                                className="w-full p-2 text-sm border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                                rows={3}
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveEdit(first.id)}
                                                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={first._isPending ? 'opacity-60' : ''}>
                                            <Markdown>{first.content ?? <i className="text-muted-foreground">deleted</i>}</Markdown>
                                            {first._isPending && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    <span className="animate-pulse">Sending...</span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {me && g.authorId === me.id && !first._isPending && !first.deleted_at && (
                                        <div className="absolute -top-2 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity bg-background border border-border rounded-md shadow-sm p-1 flex gap-1">
                                            <button
                                                className="text-xs px-2 py-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                onClick={() => startEdit(first.id, first.content)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-xs px-2 py-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                onClick={async () => {
                                                    try {
                                                        const token = await session?.getToken()
                                                        const res = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/dm/messages/${first.id}`, {
                                                            method: 'DELETE',
                                                            headers: {
                                                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                                            },
                                                        })
                                                        if (res.ok) {
                                                            // Optimistically update the message to show as deleted
                                                            messagesFrame.data = messagesFrame.data.map((msg: any) =>
                                                                msg.id === first.id ? { ...msg, deleted_at: new Date().toISOString(), content: null } : msg
                                                            )
                                                        }
                                                    } catch (error) {
                                                        console.error('Failed to delete message:', error)
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {g.items.slice(1).map((m: any) => (
                            <div key={m.id} className="pl-11 mt-1 text-sm whitespace-normal break-words group/message relative">
                                {editingMessageId === m.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') {
                                                    cancelEdit()
                                                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                    e.preventDefault()
                                                    saveEdit(m.id)
                                                }
                                            }}
                                            className="w-full p-2 text-sm border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                            rows={3}
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveEdit(m.id)}
                                                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={m._isPending ? 'opacity-60' : ''}>
                                        <Markdown>{m.content ?? <i className="text-muted-foreground">deleted</i>}</Markdown>
                                        {m._isPending && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                <span className="animate-pulse">Sending...</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                                {me && m.author_id === me.id && !m._isPending && !m.deleted_at && (
                                    <div className="absolute -top-2 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity bg-background border border-border rounded-md shadow-sm p-1 flex gap-1">
                                        <button
                                            className="text-xs px-2 py-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                            onClick={() => startEdit(m.id, m.content)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-xs px-2 py-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                            onClick={async () => {
                                                try {
                                                    const token = await session?.getToken()
                                                    const res = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/dm/messages/${m.id}`, {
                                                        method: 'DELETE',
                                                        headers: {
                                                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                                        },
                                                    })
                                                    if (res.ok) {
                                                        // Optimistically update the message to show as deleted
                                                        messagesFrame.data = messagesFrame.data.map((msg: any) =>
                                                            msg.id === m.id ? { ...msg, deleted_at: new Date().toISOString(), content: null } : msg
                                                        )
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to delete message:', error)
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            })}
        </div>
    )
}

function MessageComposer({ channelId }: { channelId: string }) {
    const { session } = useSession()
    const { user: me } = useUserAccountStore()
    // get the nearest frame (messages) to refresh after send
    const messagesFrame = useContentFrame()
    const [isPosting, setIsPosting] = React.useState(false)

    const onSend = async (content: string) => {
        if (isPosting || !me) return
        
        const token = await session?.getToken()
        setIsPosting(true)
        
        // Generate temporary ID and create optimistic message
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const tempMessage = {
            id: tempId,
            channel_id: channelId,
            author_id: me.id,
            content,
            message_type: 'text',
            created_at: new Date().toISOString(),
            edited_at: null,
            deleted_at: null,
            reply_to: null,
            _isPending: true,
        }

        // Optimistically add the message
        const currentMessages = messagesFrame.data || []
        messagesFrame.data = [...currentMessages, tempMessage]
        
        try {
            const res = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/dm/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content }),
            })
            
            if (!res.ok) {
                throw new Error(`Failed to send message: ${res.status}`)
            }
            
            const realMessage = await res.json()
            
            // Replace temp message with real one
            messagesFrame.data = messagesFrame.data.map((msg: any) => 
                msg.id === tempId ? realMessage : msg
            )
        } catch (error) {
            // Remove temp message on failure and show error
            messagesFrame.data = messagesFrame.data.filter((msg: any) => msg.id !== tempId)
            
            // TODO: Show error toast/notification
            console.error('Failed to send message:', error)
        } finally {
            setIsPosting(false)
        }
    }

    return (
        <div className="p-3 border-t">
            <ChatBox 
                placeholder="Message..." 
                onSend={onSend}
                disabled={isPosting}
            />
        </div>
    )
}
