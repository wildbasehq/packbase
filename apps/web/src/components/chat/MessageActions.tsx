import React from 'react'

interface MessageActionsProps {
    onEdit: () => void
    onDelete: () => void
    className?: string
}

export function MessageActions({ onEdit, onDelete, className }: MessageActionsProps) {
    return (
        <div
            className={`
            absolute -top-2 right-0 
            opacity-0 group-hover/message:opacity-100 
            transition-all duration-200 
            bg-background border border-border 
            rounded-md shadow-sm p-1 
            flex gap-1 
            ${className || ''}
        `}
        >
            <button
                className="
                    text-xs px-2 py-1
                    hover:bg-muted rounded-md
                    text-muted-foreground hover:text-foreground
                    transition-colors duration-150
                "
                onClick={onEdit}
                type="button"
            >
                Edit
            </button>
            <button
                className="
                    text-xs px-2 py-1
                    hover:bg-destructive/10 rounded-md
                    text-muted-foreground hover:text-destructive
                    transition-colors duration-150
                "
                onClick={onDelete}
                type="button"
            >
                Delete
            </button>
        </div>
    )
}
