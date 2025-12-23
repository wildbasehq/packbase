import {MessageGroup} from '@/components/chat/MessageGroup'
import {useEditingState, useLoadingState, useScrollState} from '@/components/chat/useChatContext'
import {useNormalizedMessages} from '@/components/chat/useNormalizedMessages'
import {usePerformanceMonitor} from '@/components/chat/usePerformanceMonitor'
import {Avatar} from '@/components/shared/avatar'
import {Heading, Text} from '@/components/shared/text'
import {API_URL, useUserAccountStore} from '@/lib'
import {useContentFrame} from '@/lib/hooks/content-frame'
import {Button} from '@/src/components'
import {getAvatar} from '@/src/lib/api/users/avatar'
import {useSession} from '@clerk/clerk-react'
import {ArrowDownIcon} from '@heroicons/react/20/solid'
import {HomeModernIcon} from '@heroicons/react/24/solid'
import {useQueryClient} from '@tanstack/react-query'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {toast} from 'sonner'

export function MessagesList({channelId}: { channelId: string }) {
    usePerformanceMonitor('MessagesList')

    const {data: messages, isLoading} = useContentFrame('get', `dm.channels.${channelId}.messages`, undefined, {
        id: `messages-${channelId}`,
        refetchInterval: 5,
    })
    const {data: channel} = useContentFrame('get', `dm.channels.${channelId}`, undefined, {id: `channel-${channelId}`})

    const messageArray = useMemo(() => (Array.isArray(messages) ? messages : []), [messages])
    const normalizedMessages = useNormalizedMessages(messageArray)
    const {user: me} = useUserAccountStore()
    const {session} = useSession()

    const {editingMessageId, editContent, setEditingMessage, setEditContent, cancelEdit} = useEditingState()
    const {isUserScrolled, setUserScrolled} = useScrollState()
    const {loadingOlder, hasMoreMessages, setLoadingOlder, setHasMoreMessages} = useLoadingState()

    const queryClient = useQueryClient()

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const scrollBottomRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
        scrollBottomRef.current?.scrollIntoView({behavior})
    }, [])

    const checkIfScrolledToBottom = useCallback(() => {
        const container = scrollContainerRef.current
        if (!container) return false
        const threshold = 120
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    }, [])

    const loadOlderMessages = useCallback(async () => {
        if (loadingOlder || !hasMoreMessages || !messageArray.length) return

        setLoadingOlder(true)
        try {
            const token = await session?.getToken()
            const oldestMessage = messageArray[messageArray.length - 1]

            const res = await fetch(
                `${API_URL}/dm/channels/${channelId}/messages?before=${oldestMessage.id}&limit=50`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...(token ? {Authorization: `Bearer ${token}`} : {}),
                    },
                }
            )

            if (res.ok) {
                const olderMessages = await res.json()
                if (olderMessages.length === 0) {
                    setHasMoreMessages(false)
                } else {
                    await queryClient.invalidateQueries({queryKey: [`messages-${channelId}`]})
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
    }, [loadingOlder, hasMoreMessages, messageArray, channelId, session, queryClient, setHasMoreMessages, setLoadingOlder])

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const isAtBottom = checkIfScrolledToBottom()
        setUserScrolled(!isAtBottom)

        if (container.scrollTop <= 200 && !loadingOlder && hasMoreMessages) {
            loadOlderMessages()
        }
    }, [checkIfScrolledToBottom, loadingOlder, hasMoreMessages, loadOlderMessages, setUserScrolled])

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
                const res = await fetch(`${API_URL}/dm/messages/${messageId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? {Authorization: `Bearer ${token}`} : {}),
                    },
                    body: JSON.stringify({content: editContent.trim()}),
                })

                if (res.ok) {
                    await queryClient.invalidateQueries({queryKey: [`messages-${channelId}`]})
                } else {
                    toast.error('Failed to save changes')
                }
            } catch (error) {
                console.error('Failed to edit message:', error)
                toast.error('Failed to save changes')
            }
        },
        [cancelEdit, editContent, channelId, session, queryClient]
    )

    const deleteMessage = useCallback(
        async (messageId: string) => {
            try {
                const token = await session?.getToken()
                const res = await fetch(`${API_URL}/dm/messages/${messageId}`, {
                    method: 'DELETE',
                    headers: {
                        ...(token ? {Authorization: `Bearer ${token}`} : {}),
                    },
                })

                if (res.ok) {
                    await queryClient.invalidateQueries({queryKey: [`messages-${channelId}`]})
                } else {
                    toast.error('Failed to delete message')
                }
            } catch (error) {
                console.error('Failed to delete message:', error)
                toast.error('Failed to delete message')
            }
        },
        [channelId, session, queryClient]
    )

    const recipient = useMemo(() => channel?.recipients?.[0], [channel])

    const getAuthorInfo = useCallback(
        (authorId: string) => {
            if (me && authorId === me.id) {
                const name = me.display_name || me.username || 'You'
                return {
                    name,
                    images_avatar: getAvatar(me.id),
                    initials: (name || 'Y').slice(0, 1),
                }
            }

            const name = recipient?.display_name || recipient?.username || 'Friend'
            return {
                name,
                images_avatar: recipient?.id ? getAvatar(recipient.id) : null,
                initials: (name || 'F').slice(0, 1),
            }
        },
        [me, recipient]
    )

    const groups = normalizedMessages.groups

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
                <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-muted animate-pulse"/>
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-40 bg-muted animate-pulse rounded"/>
                            <div className="h-4 w-2/3 bg-muted/70 animate-pulse rounded-lg"/>
                            <div className="h-4 w-1/2 bg-muted/60 animate-pulse rounded-lg"/>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="size-8 rounded-full bg-muted animate-pulse"/>
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-28 bg-muted animate-pulse rounded"/>
                            <div className="h-4 w-1/2 bg-muted/70 animate-pulse rounded-lg"/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!messageArray.length) {
        const isSelf = recipient?.id && recipient?.id === me?.id
        return (
            <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
                <div className="mx-auto w-full max-w-3xl px-4 py-10">
                    <div className="rounded-2xl border bg-card/60 p-6 shadow-sm">
                        {isSelf ? (
                            <div className="flex flex-col gap-3">
                                <Heading>
                                    <HomeModernIcon className="inline-flex -mt-1 mr-1 h-5 w-5"/>
                                    Welcome to your basecamp
                                </Heading>
                                <Text alt>
                                    No one but you here, forever and always. Use this space however you want: saved
                                    messages, random photos, whatever.
                                </Text>
                                <Text size="xs" alt className="pt-1">
                                    Tip: paste links, notes, and code snippets. It’s your private scratchpad.
                                </Text>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <Avatar
                                    src={recipient?.images_avatar || null}
                                    alt={recipient?.display_name || recipient?.username || 'Friend'}
                                    initials={(recipient?.display_name || recipient?.username || 'F').slice(0, 1)}
                                    className="size-11"
                                />
                                <div className="min-w-0">
                                    <Heading size="md" className="truncate">
                                        Say hi to {recipient?.display_name || recipient?.username || 'your friend'}
                                    </Heading>
                                    <Text alt className="mt-1">
                                        This is the start of your conversation. Send a message to break the ice.
                                    </Text>
                                    <Text size="xs" alt className="mt-3">
                                        Try: “Hey! What are you up to?”
                                    </Text>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col w-full relative overflow-hidden">
            {/* Scroll area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
                <div className="mx-auto w-full max-w-3xl px-4 py-4 space-y-4">
                    {/* Older messages status */}
                    {hasMoreMessages && (
                        <div className="flex justify-center py-1">
                            <button
                                type="button"
                                onClick={() => loadOlderMessages()}
                                disabled={loadingOlder}
                                className="text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                            >
                                {loadingOlder ? 'Loading older…' : 'Load older messages'}
                            </button>
                        </div>
                    )}

                    {groups.map((g, idx) => {
                        if (g.type === 'day') {
                            return (
                                <div key={`day-${idx}`} className="relative flex items-center justify-center py-2">
                                    <div className="absolute inset-x-0 h-px bg-border/70"/>
                                    <span
                                        className="relative z-10 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-muted-foreground shadow-sm"
                                    >
                                        {g.label}
                                    </span>
                                </div>
                            )
                        }

                        const author = getAuthorInfo(g.authorId)
                        return (
                            <div key={`grp-${idx}`}
                                 className="rounded-xl px-2 py-1 hover:bg-muted/30 transition-colors">
                                <MessageGroup
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
                            </div>
                        )
                    })}

                    <div ref={scrollBottomRef}/>
                </div>
            </div>

            {/* Floating jump-to-latest */}
            {isUserScrolled && (
                <div className="pointer-events-none absolute left-0 right-0 bottom-4 flex justify-center px-4">
                    <Button
                        onClick={() => {
                            setUserScrolled(false)
                            scrollToBottom('auto')
                        }}
                        className="pointer-events-auto inline-flex"
                    >
                        <ArrowDownIcon/>
                        Jump to latest
                    </Button>
                </div>
            )}
        </div>
    )
}

