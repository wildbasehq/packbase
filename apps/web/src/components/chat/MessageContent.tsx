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
    className,
}: MessageContentProps) {
    const isPending = message._isPending

    return (
        <div className={`text-sm whitespace-normal message-content group/message relative ${className || ''}`}>
            {isEditing ? (
                <MessageEditor content={editContent} onContentChange={onEditContentChange} onSave={onSaveEdit} onCancel={onCancelEdit} />
            ) : (
                <div className={isPending ? 'relative' : ''}>
                    {message.content ? (
                        <Markdown>{message.content.replaceAll('![]', '\\![]')}</Markdown>
                    ) : (
                        <i className="text-muted-foreground">deleted</i>
                    )}
                    {isPending && (
                        <div className="absolute -right-2 -top-1">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-medium">
                                <span className="animate-spin text-xs">⟳</span>
                                <span>Sending</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {showActions && !message.deleted_at && <MessageActions onEdit={onStartEdit} onDelete={onDelete} />}
        </div>
    )
}
