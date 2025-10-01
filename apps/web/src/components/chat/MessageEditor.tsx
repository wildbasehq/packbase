import React, {useEffect, useRef} from 'react'
import {Button} from '@/components/shared'

interface MessageEditorProps {
    content: string
    onContentChange: (content: string) => void
    onSave: () => void
    onCancel: () => void
    className?: string
}

export function MessageEditor({content, onContentChange, onSave, onCancel, className}: MessageEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        // Auto-focus and select all text when editor opens
        if (textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.select()
        }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            onSave()
        }
    }

    return (
        <div className={`space-y-2 ${className || ''}`}>
            <textarea
                ref={textareaRef}
                value={content}
                onChange={e => onContentChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="
                    w-full p-2 text-sm
                    border border-border rounded-md
                    resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    bg-background
                    transition-all duration-150
                "
                rows={3}
                placeholder="Edit message..."
            />
            <div className="flex gap-2 text-xs">
                <Button
                    color="indigo"
                    onClick={onSave}
                    className="!px-3 !py-0.5 items-center justify-center flex !text-sm !font-medium"
                    type="button"
                >
                    Save
                </Button>
                <button
                    onClick={onCancel}
                    className="
                        px-3 py-1.5
                        bg-muted text-muted-foreground
                        rounded-md
                        hover:bg-muted/80
                        transition-colors duration-150
                    "
                    type="button"
                >
                    Cancel
                </button>
                <span className="text-muted-foreground ml-auto flex items-center">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to cancel,
                    <kbd className="ml-1 px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Enter</kbd> to save
                </span>
            </div>
        </div>
    )
}
