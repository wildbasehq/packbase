/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useParams } from 'wouter'
import { useEffect, useState } from 'react'
import { Text } from '@/components/shared/text.tsx'
import { Avatar } from '@/components/shared/avatar.tsx'
import { Divider } from '@/components/shared/divider.tsx'
import { ChatBox } from '@/components/shared/chat-box.tsx'
import { Hash, MessageSquare, Reply } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/date.ts'
import { useUIStore, vg } from '@/lib'
import { FeedPostData, LogoSpinner } from '@/src/components'
import { toast } from 'sonner'

function ThreadMessage({
    message,
    isOriginalPost = false,
    currentUserId = 'user-1',
}: {
    message: FeedPostData
    isOriginalPost?: boolean
    currentUserId?: string
}) {
    const bucketRoot = useUIStore(state => state.bucketRoot)
    // Map reaction slots to emoji representations
    const reactionEmojis = {
        '0': '👍',
        '1': '❤️',
        '2': '🔥',
        '3': '😂',
        '4': '😮',
        '5': '😢',
        '6': '🙏',
        '7': '👎',
        '8': '🚀',
        '9': '🎉',
    }

    // Transform reactions to UI format
    const formattedReactions = message.reactions
        ? Object.entries(message.reactions)
              .filter(([_, users]) => users && users.length > 0)
              .map(([slot, users]) => ({
                  emoji: reactionEmojis[slot as keyof typeof reactionEmojis] || '👍',
                  count: users?.length || 0,
                  userReacted: users?.includes(currentUserId) || false,
              }))
        : []

    return (
        <div className={`group relative ${isOriginalPost ? 'pb-4' : 'py-2'}`}>
            <div className="flex space-x-3">
                <Avatar
                    src={message.user?.images?.avatar}
                    initials={(message.user?.display_name || message.user?.username)
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    className="h-10 w-10 shrink-0"
                    square
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                        <Text weight="semibold" size="sm">
                            {message.user?.display_name || message.user?.username || 'Anonymous'}
                        </Text>
                        <Text size="xs" className="text-muted-foreground">
                            {formatRelativeTime(message.created_at)}
                        </Text>
                    </div>
                    <div className="mt-1">
                        <Text size="sm" className="leading-relaxed whitespace-pre-wrap">
                            {message.body}
                        </Text>
                    </div>

                    {/* Reactions */}
                    {formattedReactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {formattedReactions.map((reaction, index) => (
                                <button
                                    key={index}
                                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                                        reaction.userReacted
                                            ? 'bg-primary/10 border-primary/20 text-primary dark:bg-primary/20 dark:border-primary/30 dark:text-primary-text-cosmos'
                                            : 'bg-n-1 border-n-3 text-n-6 hover:bg-n-2 dark:bg-n-7 dark:border-n-6 dark:text-n-3 dark:hover:bg-n-6'
                                    }`}
                                >
                                    <span>{reaction.emoji}</span>
                                    <span>{reaction.count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Message actions */}
                {/*<div className="opacity-0 group-hover:opacity-100 transition-opacity">*/}
                {/*    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">*/}
                {/*        <MoreHorizontal className="h-4 w-4" />*/}
                {/*    </Button>*/}
                {/*</div>*/}
            </div>

            {/* Display assets if any */}
            {message.assets && message.assets.length > 0 && (
                <div className="mt-3 pl-12">
                    <div className="grid grid-cols-2 gap-2">
                        {message.assets.map((asset, index) => (
                            <div key={index} className="overflow-hidden rounded-md">
                                <img
                                    src={`${bucketRoot}/${asset.data.url}`}
                                    alt={asset.data.name || 'Attached image'}
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PackChannelThread() {
    const { id, channel, slug } = useParams<{ id: string; channel: string; slug: string }>()
    const [newMessage, setNewMessage] = useState('')
    const [currentUserId] = useState('user-1') // In a real app, this would come from authentication

    const [threadContent, setThreadContent] = useState<FeedPostData | null>(null)

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return

        console.log('Sending message:', content)
        const { data, error } = await vg.howl({ id }).comment.post({
            body: content.trim(),
        })

        if (error) {
            console.error(error)
            toast.error('Failed to send message')
            return
        } else {
            // Emit message sent event for plugins
            if (window.packbase && data) {
                window.packbase.emit('message:sent', {
                    messageId: data.id,
                    threadId: id,
                    channelId: channel,
                    content: content.trim(),
                    timestamp: new Date().toISOString(),
                })
            }

            setNewMessage('')
            await getHowl()
        }
    }

    const getHowl = async () => {
        console.log('Fetching thread:', id)
        const howl = await vg.howl({ id }).get()

        console.log('Fetched thread:', howl)
        if (howl.data) {
            setThreadContent(howl.data)

            // Emit thread opened event for plugins
            if (window.packbase) {
                window.packbase.emit('thread:opened', {
                    threadId: id,
                    channelId: channel,
                    packSlug: slug,
                    title: howl.data.title || 'Untitled Thread',
                    postCount: (howl.data.comments?.length || 0) + 1,
                })
            }
        } else {
            setThreadContent(null)
        }
        return howl
    }

    useEffect(() => {
        getHowl()
    }, [id])

    if (!threadContent)
        return (
            <div className="flex h-full flex-col">
                <div className="border-b px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <Text weight="semibold" className="text-lg">
                            {channel}
                        </Text>
                    </div>
                </div>

                <div className="flex flex-1 h-full w-full justify-center items-center">
                    <LogoSpinner delay={0} />
                </div>
            </div>
        )

    return (
        <div className="flex h-full flex-col">
            {/* Thread Header */}
            <div className="border-b px-6 py-4">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <Text weight="semibold" className="text-lg">
                            {channel}
                        </Text>
                    </div>
                    <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Text size="sm" alt>
                            Thread
                        </Text>
                    </div>
                </div>
                <Text size="sm" className="text-muted-foreground mt-1">
                    {threadContent.comments?.length + 1 || 1} messages
                </Text>
            </div>

            {/* Thread Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-4">
                    {/* Original Post */}
                    <div className="mb-4">
                        <ThreadMessage message={threadContent} isOriginalPost={true} currentUserId={currentUserId} />
                        <Divider className="my-4" />

                        <div className="flex items-center space-x-2 mb-4">
                            <Reply className="h-4 w-4 text-muted-foreground" />
                            <Text size="sm" weight="semibold" className="text-muted-foreground">
                                {threadContent.comments?.length} replies
                            </Text>
                        </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-4">
                        {threadContent.comments?.map(reply => (
                            <ThreadMessage key={reply.id} message={reply} currentUserId={currentUserId} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Input */}
            <div className="border-t p-4">
                <ChatBox placeholder={`Reply to howl...`} onSend={handleSendMessage} value={newMessage} onChange={setNewMessage} />
            </div>
        </div>
    )
}
