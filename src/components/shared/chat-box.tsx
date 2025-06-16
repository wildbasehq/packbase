/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/src/components'
import { Text } from './text'
import { cn } from '@/lib/utils'
import { AtSign, Bold, Code, Hash, Italic, Link2, List, ListOrdered, Paperclip, Quote, Smile, Strikethrough } from 'lucide-react'
import { PaperAirplaneIcon } from '@heroicons/react/16/solid'

interface ChatBoxProps {
    placeholder?: string
    onSend: (content: string) => void
    value?: string
    onChange?: (value: string) => void
    className?: string
    disabled?: boolean
    maxHeight?: number
    showMarkdownToolbar?: boolean
    showAttachments?: boolean
    showEmoji?: boolean
    showMentions?: boolean
}

interface MarkdownButton {
    icon: React.ComponentType<{ className?: string }>
    label: string
    syntax: string
    wrap?: boolean
}

const markdownButtons: MarkdownButton[] = [
    { icon: Bold, label: 'Bold', syntax: '**text**', wrap: true },
    { icon: Italic, label: 'Italic', syntax: '*text*', wrap: true },
    { icon: Strikethrough, label: 'Strikethrough', syntax: '~~text~~', wrap: true },
    { icon: Code, label: 'Inline Code', syntax: '`code`', wrap: true },
    { icon: Link2, label: 'Link', syntax: '[text](url)' },
    { icon: Quote, label: 'Quote', syntax: '> ' },
    { icon: List, label: 'Bullet List', syntax: '- ' },
    { icon: ListOrdered, label: 'Numbered List', syntax: '1. ' },
]

export function ChatBox({
    placeholder = 'Type a message...',
    onSend,
    value = '',
    onChange,
    className,
    disabled = false,
    maxHeight = 120,
    showMarkdownToolbar = true,
    showAttachments = false,
    showEmoji = false,
    showMentions = false,
}: ChatBoxProps) {
    const [internalValue, setInternalValue] = useState('')
    const [showToolbar, setShowToolbar] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const currentValue = value || internalValue
    const setValue = onChange || setInternalValue

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            const scrollHeight = textareaRef.current.scrollHeight
            textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
        }
    }, [currentValue, maxHeight])

    const insertMarkdown = (syntax: string, wrap = false) => {
        if (!textareaRef.current) return

        const textarea = textareaRef.current
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = currentValue.substring(start, end)

        let newText: string
        let newCursorPos: number

        if (wrap && selectedText) {
            // Wrap selected text
            if (syntax === '**text**') {
                newText = currentValue.substring(0, start) + `**${selectedText}**` + currentValue.substring(end)
                newCursorPos = end + 4
            } else if (syntax === '*text*') {
                newText = currentValue.substring(0, start) + `*${selectedText}*` + currentValue.substring(end)
                newCursorPos = end + 2
            } else if (syntax === '~~text~~') {
                newText = currentValue.substring(0, start) + `~~${selectedText}~~` + currentValue.substring(end)
                newCursorPos = end + 4
            } else if (syntax === '`code`') {
                newText = currentValue.substring(0, start) + `\`${selectedText}\`` + currentValue.substring(end)
                newCursorPos = end + 2
            } else {
                newText = currentValue.substring(0, start) + syntax.replace('text', selectedText) + currentValue.substring(end)
                newCursorPos = end + syntax.length - 4
            }
        } else {
            // Insert at cursor position
            if (syntax.startsWith('> ') || syntax.startsWith('- ') || syntax.startsWith('1. ')) {
                // For block-level elements, insert at line start
                const lineStart = currentValue.lastIndexOf('\n', start - 1) + 1
                newText = currentValue.substring(0, lineStart) + syntax + currentValue.substring(lineStart)
                newCursorPos = lineStart + syntax.length
            } else {
                newText = currentValue.substring(0, start) + syntax + currentValue.substring(end)
                newCursorPos = start + syntax.length
            }
        }

        setValue(newText)

        // Set cursor position after state update
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
            }
        }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Allow new line with Shift+Enter
                return
            } else if (!e.ctrlKey && !e.metaKey) {
                // Send message with Enter (unless Ctrl/Cmd is held)
                e.preventDefault()
                handleSend()
            }
        }

        // Markdown shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault()
                    insertMarkdown('**text**', true)
                    break
                case 'i':
                    e.preventDefault()
                    insertMarkdown('*text*', true)
                    break
                case 'k':
                    e.preventDefault()
                    insertMarkdown('[text](url)')
                    break
            }
        }
    }

    const handleSend = () => {
        if (currentValue.trim() && !disabled) {
            onSend(currentValue.trim())
            setValue('')
        }
    }

    const handleFocus = () => {
        setShowToolbar(true)
    }

    const handleBlur = (e: React.FocusEvent) => {
        // Keep toolbar visible if clicking on toolbar buttons
        if (!e.relatedTarget?.closest('.markdown-toolbar')) {
            setShowToolbar(false)
        }
    }

    return (
        <div className={cn('w-full', className)}>
            {/* Markdown Toolbar */}
            {showMarkdownToolbar && showToolbar && (
                <div className="markdown-toolbar border rounded-t-lg px-3 py-2">
                    <div className="flex items-center space-x-1 overflow-x-auto">
                        {markdownButtons.map(button => {
                            const Icon = button.icon
                            return (
                                <Button
                                    key={button.label}
                                    plain
                                    className="h-8 w-8 p-0"
                                    onClick={() => insertMarkdown(button.syntax, button.wrap)}
                                    title={button.label}
                                    type="button"
                                >
                                    <Icon data-slot="icon" className="h-4 w-4" />
                                </Button>
                            )
                        })}
                        <div className="h-6 w-px bg-n-3 dark:bg-n-6 mx-2" />
                        {showMentions && (
                            <Button
                                plain
                                className="h-8 w-8 p-0 shrink-0"
                                onClick={() => insertMarkdown('@')}
                                title="Mention someone"
                                type="button"
                            >
                                <AtSign data-slot="icon" className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            plain
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => insertMarkdown('#')}
                            title="Reference channel"
                            type="button"
                        >
                            <Hash className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div
                className={cn(
                    'border bg-card/75',
                    showMarkdownToolbar && showToolbar ? 'rounded-b-lg border-t-0' : 'rounded-lg',
                    'focus-within:ring-2 focus-within:ring-primary focus-within:border-primary'
                )}
            >
                <div className="p-3">
                    <textarea
                        ref={textareaRef}
                        value={currentValue}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className="w-full resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                        style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
                    />
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between border-t px-3 py-2">
                    <div className="flex items-center space-x-2">
                        {showAttachments && (
                            <Button plain className="h-8 w-8 p-0" type="button">
                                <Paperclip data-slot="icon" className="h-4 w-4" />
                            </Button>
                        )}
                        {showEmoji && (
                            <Button plain className="h-8 w-8 p-0" type="button">
                                <Smile data-slot="icon" className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Text size="xs" className="text-muted-foreground">
                            Shift+Enter for new line
                        </Text>
                        <Button onClick={handleSend} disabled={!currentValue.trim() || disabled} color="indigo" className="h-8 px-3">
                            <PaperAirplaneIcon data-slot="icon" className="h-4 w-4" />
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
