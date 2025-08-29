/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import Markdown from '@/components/shared/markdown.tsx'
import { MessageEditor } from './MessageEditor'
import { MessageActions } from './MessageActions'

interface MessageContentProps {
    message: any
    isEditing: boolean
    editContent: string
    onEditContentChange: (content: string) => void
    onStartEdit: () => void
    onSaveEdit: () => void
    onCancelEdit: () => void
    onDelete: () => void
    showActions?: boolean
    className?: string
}

export function MessageContent({
    message,
    isEditing,
    editContent,
    onEditContentChange,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    showActions = true,
    className
}: MessageContentProps) {
    return (
        <div className={`text-sm whitespace-normal break-words group/message relative ${className || ''}`}>
            {isEditing ? (
                <MessageEditor
                    content={editContent}
                    onContentChange={onEditContentChange}
                    onSave={onSaveEdit}
                    onCancel={onCancelEdit}
                />
            ) : (
                <div className={message._isPending ? 'opacity-60' : ''}>
                    <Markdown>{message.content ?? <i className="text-muted-foreground">deleted</i>}</Markdown>
                    {message._isPending && (
                        <span className="ml-2 text-xs text-muted-foreground">
                            <span className="animate-pulse">Sending...</span>
                        </span>
                    )}
                </div>
            )}
            {showActions && !message._isPending && !message.deleted_at && (
                <MessageActions onEdit={onStartEdit} onDelete={onDelete} />
            )}
        </div>
    )
}
