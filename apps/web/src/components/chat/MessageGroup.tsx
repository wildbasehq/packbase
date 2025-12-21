import React from 'react'
import { MessageItem } from './MessageItem'
import { ChatMessage } from './types'
import { usePerformanceMonitor } from './usePerformanceMonitor'
import { toast } from 'sonner'

interface MessageGroupProps {
    group: {
        type: 'group'
        id: string
        authorId: string
        startAt: Date
        items: any[]
    }
    author: {
        name: string
        images_avatar: string | null
        initials: string
    }
    editingMessageId: string | null
    editContent: string
    currentUserId?: string
    onStartEdit: (messageId: string, content: string) => void
    onSaveEdit: (messageId: string) => void
    onCancelEdit: () => void
    onDeleteMessage: (messageId: string) => void
    onEditContentChange: (content: string) => void
}

export const MessageGroup = React.memo<MessageGroupProps>(
    ({
        group,
        author,
        currentUserId,
    }) => {
        usePerformanceMonitor('MessageGroup')
        const isOwnMessage = currentUserId ? group.authorId === currentUserId : false

        return (
            <div className="flex flex-col gap-1 w-full">
                {group.items.map((item, index) => {
                    const isLast = index === group.items.length - 1

                    // Construct ChatMessage object for MessageItem
                    // We need to map the raw message format to ChatMessage
                    const chatMessage: ChatMessage = {
                        id: item.id,
                        senderType: item.message_type || (isOwnMessage ? 'user' : 'other'),
                        content: item.content,
                        createdAt: item.created_at,
                        user: {
                            id: group.authorId,
                            display_name: author.name,
                            username: author.name, // Fallback
                            images: { avatar: author.images_avatar || undefined }
                        },
                        metadata: {
                            isPending: item._isPending
                        }
                    }

                    return (
                        <MessageItem
                            key={item.id}
                            message={chatMessage}
                            isOwn={isOwnMessage}
                            showAvatar={isLast} // Only show avatar on the last message of the group for styling
                            onClick={() => {
                                toast.error('Not implemented yet')
                            }}
                        />
                    )
                })}
            </div>
        )
    },
    (prev, next) => {
        // Simple optimization check
        return (
            prev.group.items.length === next.group.items.length &&
            prev.group.id === next.group.id &&
            prev.currentUserId === next.currentUserId
        )
    }
)
