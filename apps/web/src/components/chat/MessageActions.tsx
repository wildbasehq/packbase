/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'

interface MessageActionsProps {
    onEdit: () => void
    onDelete: () => void
    className?: string
}

export function MessageActions({ onEdit, onDelete, className }: MessageActionsProps) {
    return (
        <div className={`absolute -top-2 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity bg-background border border-border rounded-md shadow-sm p-1 flex gap-1 ${className || ''}`}>
            <button
                className="text-xs px-2 py-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                onClick={onEdit}
            >
                Edit
            </button>
            <button
                className="text-xs px-2 py-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                onClick={onDelete}
            >
                Delete
            </button>
        </div>
    )
}
