/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useParams } from 'wouter'
import { useState } from 'react'
import { Text } from '@/components/shared/text.tsx'
import { Avatar } from '@/components/shared/avatar.tsx'
import { Button } from '@/components/shared/button.tsx'
import { Divider } from '@/components/shared/divider.tsx'
import { ChatBox } from '@/components/shared/chat-box.tsx'
import { Hash, MessageSquare, MoreHorizontal, Reply } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/date.ts'

// Mock data for the thread
const mockThread = {
    id: '1',
    title: 'Discussion about the new project features',
    channel: 'general',
    originalPost: {
        id: 'msg-1',
        content:
            "Hey everyone! I wanted to start a discussion about the new features we're planning to implement. What are your thoughts on the user interface redesign?",
        author: {
            name: 'Unknown Mock "display_name" Enum!!!',
            avatar: 'https://i.pravatar.cc/150?img=1',
            status: 'online',
        },
        timestamp: '2025-06-02T10:30:00Z',
        reactions: [
            { emoji: '👍', count: 5, userReacted: true },
            { emoji: '❤️', count: 2, userReacted: false },
            { emoji: '🔥', count: 1, userReacted: false },
        ],
    },
    replies: [
        {
            id: 'msg-2',
            content: 'I think the new UI looks great! The color scheme is much more modern and accessible.',
            author: {
                name: 'Unknown Mock "display_name" Enum!!!',
                avatar: 'https://i.pravatar.cc/150?img=2',
                status: 'online',
            },
            timestamp: '2025-06-02T10:35:00Z',
            reactions: [{ emoji: '👍', count: 3, userReacted: false }],
        },
        {
            id: 'msg-3',
            content: 'Agreed! One suggestion though - could we make the sidebar navigation a bit wider? Sometimes the text gets truncated.',
            author: {
                name: 'Unknown Mock "display_name" Enum!!!',
                avatar: 'https://i.pravatar.cc/150?img=3',
                status: 'away',
            },
            timestamp: '2025-06-02T10:42:00Z',
            reactions: [],
        },
    ],
}

function ThreadMessage({ message, isOriginalPost = false }: { message: any; isOriginalPost?: boolean }) {
    return (
        <div className={`group relative ${isOriginalPost ? 'pb-4' : 'py-2'}`}>
            <div className="flex space-x-3">
                <Avatar
                    src={message.author.avatar}
                    initials={message.author.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    className="h-10 w-10 shrink-0"
                    square
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                        <Text weight="semibold" className="text-sm">
                            {message.author.name}
                        </Text>
                        <Text size="xs" className="text-muted-foreground">
                            {formatRelativeTime(message.timestamp)}
                        </Text>
                    </div>
                    <div className="mt-1">
                        <Text className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</Text>
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction: any, index: number) => (
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function PackChannelThread() {
    const { id, channel, slug } = useParams<{ id: string; channel: string; slug: string }>()
    const [newMessage, setNewMessage] = useState('')

    const handleSendMessage = (content: string) => {
        console.log('Sending message:', content)
        // Here you would typically send the message to your backend
        setNewMessage('')
    }

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
                    {mockThread.replies.length + 1} messages
                </Text>
            </div>

            {/* Thread Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-4">
                    {/* Original Post */}
                    <div className="mb-4">
                        <ThreadMessage message={mockThread.originalPost} isOriginalPost={true} />
                        <Divider className="my-4" />

                        <div className="flex items-center space-x-2 mb-4">
                            <Reply className="h-4 w-4 text-muted-foreground" />
                            <Text size="sm" weight="semibold" className="text-muted-foreground">
                                {mockThread.replies.length} replies
                            </Text>
                        </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-4">
                        {mockThread.replies.map(reply => (
                            <ThreadMessage key={reply.id} message={reply} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Input */}
            <div className="border-t border-n-3 dark:border-n-6 p-4">
                <ChatBox placeholder={`Reply to thread...`} onSend={handleSendMessage} value={newMessage} onChange={setNewMessage} />
            </div>
        </div>
    )
}
