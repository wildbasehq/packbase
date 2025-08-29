/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'

interface MessageEditorProps {
    content: string
    onContentChange: (content: string) => void
    onSave: () => void
    onCancel: () => void
    className?: string
}

export function MessageEditor({ content, onContentChange, onSave, onCancel, className }: MessageEditorProps) {
    return (
        <div className={`space-y-2 ${className || ''}`}>
            <textarea
                value={content}
                onChange={e => onContentChange(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Escape') {
                        onCancel()
                    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        onSave()
                    }
                }}
                className="w-full p-2 text-sm border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                autoFocus
            />
            <div className="flex gap-2">
                <button
                    onClick={onSave}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Save
                </button>
                <button
                    onClick={onCancel}
                    className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
