import React, {useEffect, useRef} from 'react'
import {Button, Textarea} from '@/components/shared'

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
            <Textarea
                ref={textareaRef}
                value={content}
                onChange={e => onContentChange(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
                placeholder="Edit message..."
            />
            <div className="flex gap-2 text-xs">
                <Button
                    outline
                    onClick={onSave}
                    className="px-3! py-0.5! items-center justify-center flex text-sm! font-medium!"
                >
                    Save
                </Button>
                <Button
                    outline
                    onClick={onCancel}
                    className="px-3! py-0.5!"
                >
                    Cancel
                </Button>
                <span className="text-muted-foreground ml-auto flex items-center">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to cancel,
                    <kbd className="ml-1 px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Enter</kbd> to save
                </span>
            </div>
        </div>
    )
}
