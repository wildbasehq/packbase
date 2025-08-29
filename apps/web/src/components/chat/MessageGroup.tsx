/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import { Avatar } from '@/components/shared/avatar.tsx'
import { MessageContent } from './MessageContent'

interface MessageGroupProps {
    group: {
        type: 'group'
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

export function MessageGroup({
    group,
    author,
    editingMessageId,
    editContent,
    currentUserId,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDeleteMessage,
    onEditContentChange
}: MessageGroupProps) {
    const first = group.items[0]
    const timeLabel = new Date(first.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const isOwnMessage = currentUserId && group.authorId === currentUserId

    return (
        <div className="group">
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
                    <MessageContent
                        message={first}
                        isEditing={editingMessageId === first.id}
                        editContent={editContent}
                        onEditContentChange={onEditContentChange}
                        onStartEdit={() => onStartEdit(first.id, first.content)}
                        onSaveEdit={() => onSaveEdit(first.id)}
                        onCancelEdit={onCancelEdit}
                        onDelete={() => onDeleteMessage(first.id)}
                        showActions={isOwnMessage}
                    />
                </div>
            </div>
            {group.items.slice(1).map((m: any) => (
                <div key={m.id} className="pl-11 mt-1">
                    <MessageContent
                        message={m}
                        isEditing={editingMessageId === m.id}
                        editContent={editContent}
                        onEditContentChange={onEditContentChange}
                        onStartEdit={() => onStartEdit(m.id, m.content)}
                        onSaveEdit={() => onSaveEdit(m.id)}
                        onCancelEdit={onCancelEdit}
                        onDelete={() => onDeleteMessage(m.id)}
                        showActions={isOwnMessage}
                    />
                </div>
            ))}
        </div>
    )
}
