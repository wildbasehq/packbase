import { useParams } from 'wouter'
import { useContentFrame, useContentFrameMutation } from '@/components/shared/content-frame.tsx'
import ContentFrame from '@/components/shared/content-frame.tsx'
import { Avatar } from '@/components/shared/avatar.tsx'
import { useSession } from '@clerk/clerk-react'
import { useUserAccountStore } from '@/lib'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { MessageGroup } from '@/components/chat/MessageGroup'
import { ChatBox } from '@/components/shared/chat-box.tsx'
import { Heading, Text } from '@/components/shared/text.tsx'
import { HomeModernIcon } from '@heroicons/react/24/solid'
import { useNormalizedMessages } from '@/components/chat/useNormalizedMessages'
import { useEditingState, useScrollState, useLoadingState } from '@/components/chat/useChatContext'
import { usePerformanceMonitor } from '@/components/chat/usePerformanceMonitor'
import { useQueryClient } from '@tanstack/react-query'

export default function ChatThreadPage() {
    const { id } = useParams<{ id: string }>()
    if (!id) return null

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <ContentFrame get={`dm.channels.${id}`} id={`channel-${id}`}>
                <ChannelHeader channelId={id} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ContentFrame get={`dm.channels.${id}.messages`} refetchInterval={5} id={`messages-${id}`}>
                        <MessagesList channelId={id} />
                    </ContentFrame>
                    <MessageComposer channelId={id} />
                </div>
            </ContentFrame>
        </div>
    )
}

function ChannelHeader({ channelId }: { channelId: string }) {
    const { data: channel, isLoading } = useContentFrame('get', `dm.channels.${channelId}`, undefined, { id: `channel-${channelId}` })
    const rec = channel?.recipients?.[0]
    const name = rec?.display_name || rec?.username || 'Direct Message'
    const avatarSrc = rec?.images_avatar || null
    const initials = (rec?.display_name || rec?.username || '?').slice(0, 1)

    return (
        <div className="border-b p-3 flex-shrink-0">
            {isLoading ? (
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

function MessagesList({ channelId }: { channelId: string }) {
    usePerformanceMonitor('MessagesList')

    const { data: messages, isLoading } = useContentFrame('get', `dm.channels.${channelId}.messages`, undefined, {
        id: `messages-${channelId}`,
        refetchInterval: 5,
    })
    const { data: channel } = useContentFrame('get', `dm.channels.${channelId}`, undefined, { id: `channel-${channelId}` })
    const messageArray = useMemo(() => (Array.isArray(messages) ? messages : []), [messages])
    const normalizedMessages = useNormalizedMessages(messageArray)
    const { user: me } = useUserAccountStore()
    const { session } = useSession()

    const { editingMessageId, editContent, setEditingMessage, setEditContent, cancelEdit } = useEditingState()
    const { isUserScrolled, setUserScrolled } = useScrollState()
    const { loadingOlder, hasMoreMessages, setLoadingOlder, setHasMoreMessages } = useLoadingState()
    const queryClient = useQueryClient()

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const scrollBottomRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
        scrollBottomRef.current?.scrollIntoView({ behavior })
    }, [])

    const checkIfScrolledToBottom = useCallback(() => {
        const container = scrollContainerRef.current
        if (!container) return false
        const threshold = 100
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    }, [])

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const isAtBottom = checkIfScrolledToBottom()
        setUserScrolled(!isAtBottom)

        if (container.scrollTop <= 200 && !loadingOlder && hasMoreMessages) {
            loadOlderMessages()
        }
    }, [checkIfScrolledToBottom, loadingOlder, hasMoreMessages])

    useEffect(() => {
        if (!isUserScrolled && messageArray.length > 0) {
            scrollToBottom()
        }
    }, [messageArray, isUserScrolled, scrollToBottom])

    const startEdit = useCallback(
        (messageId: string, currentContent: string) => {
            setEditingMessage(messageId, currentContent || '')
        },
        [setEditingMessage]
    )

    const saveEdit = useCallback(
        async (messageId: string) => {
            if (!editContent.trim()) return

            cancelEdit()

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
                    await queryClient.invalidateQueries({ queryKey: [`messages-${channelId}`] })
                } else {
                    toast.error('Failed to save changes')
                }
            } catch (error) {
                console.error('Failed to edit message:', error)
                toast.error('Failed to save changes')
            }
        },
        [cancelEdit, editContent, channelId, session]
    )

    const deleteMessage = useCallback(
        async (messageId: string) => {
            try {
                const token = await session?.getToken()
                const res = await fetch(`${import.meta.env.VITE_YAPOCK_URL}/dm/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                })

                if (res.ok) {
                    queryClient.invalidateQueries({ queryKey: [`messages-${channelId}`] })
                } else {
                    toast.error('Failed to delete message')
                }
            } catch (error) {
                console.error('Failed to delete message:', error)
                toast.error('Failed to delete message')
            }
        },
        [channelId, session]
    )

    const loadOlderMessages = useCallback(async () => {
        if (loadingOlder || !hasMoreMessages || !messageArray.length) return

        setLoadingOlder(true)
        try {
            const token = await session?.getToken()
            const oldestMessage = messageArray[messageArray.length - 1]

            const res = await fetch(
                `${import.meta.env.VITE_YAPOCK_URL}/dm/channels/${channelId}/messages?before=${oldestMessage.id}&limit=50`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            )

            if (res.ok) {
                const olderMessages = await res.json()
                if (olderMessages.length === 0) {
                    setHasMoreMessages(false)
                } else {
                    queryClient.invalidateQueries({ queryKey: [`messages-${channelId}`] })
                }
            } else {
                toast.error('Failed to load older messages')
            }
        } catch (error) {
            console.error('Failed to load older messages:', error)
            toast.error('Failed to load older messages')
        } finally {
            setLoadingOlder(false)
        }
    }, [loadingOlder, hasMoreMessages, messageArray, channelId, session])

    const recipient = useMemo(() => channel?.recipients?.[0], [channel])

    const getAuthorInfo = useCallback(
        (authorId: string) => {
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
        },
        [me, recipient]
    )

    const groups = normalizedMessages.groups

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/5 bg-muted animate-pulse rounded" />
            </div>
        )
    }

    if (!messageArray.length) {
        return (
            <div className="flex-1 overflow-y-auto p-4 text-sm text-muted-foreground flex items-center justify-center">No messages yet</div>
        )
    }

    return (
        <div className="flex-1 flex flex-col w-full relative overflow-hidden">
            {isUserScrolled && (
                <div className="absolute w-full z-50">
                    <button
                        onClick={() => {
                            setUserScrolled(false)
                            scrollToBottom('auto')
                        }}
                        className="flex items-center justify-center h-8 gap-2 bg-gradient-to-b from-indigo-400 to-indigo-600 text-primary-foreground rounded-b-md w-full transition-all hover:h-12"
                    >
                        <span className="text-sm font-medium">New messages</span>
                        <span className="text-xs">↓</span>
                    </button>
                </div>
            )}

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" onScroll={handleScroll}>
                {recipient?.id === me?.id && (
                    <div className="flex flex-col mt-30 gap-2">
                        <Heading>
                            <HomeModernIcon className="inline-flex -mt-1 mr-1 h-5 w-5" />
                            Welcome to your basecamp
                        </Heading>
                        <Text>
                            No one but you here, forever and always. Use this space however you want; saved messages, random photos,
                            whatever!
                        </Text>
                    </div>
                )}

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
                    return (
                        <MessageGroup
                            key={`grp-${idx}`}
                            group={g}
                            author={author}
                            editingMessageId={editingMessageId}
                            editContent={editContent}
                            currentUserId={me?.id}
                            onStartEdit={startEdit}
                            onSaveEdit={saveEdit}
                            onCancelEdit={cancelEdit}
                            onDeleteMessage={deleteMessage}
                            onEditContentChange={setEditContent}
                        />
                    )
                })}

                <div ref={scrollBottomRef} />
            </div>
        </div>
    )
}

function MessageComposer({ channelId }: { channelId: string }) {
    const { user: me } = useUserAccountStore()
    const queryClient = useQueryClient()

    const sendMessage = useContentFrameMutation('post', `dm/channels/${channelId}/messages`, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`messages-${channelId}`] })
        },
        onError: () => {
            toast.error('Failed to send message')
        },
    })

    const onSend = async (content: string) => {
        if (sendMessage.isPending || !me) return
        sendMessage.mutate({ content })
    }

    return (
        <div className="p-3 border-t">
            <ChatBox placeholder="Message..." onSend={onSend} disabled={sendMessage.isPending} />
        </div>
    )
}
