import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react'
import {cn} from '@/lib/utils/cn'
import {ChatEvents} from './types'
import {Button} from '@/components/shared'

interface MessageInputProps extends ChatEvents {
    placeholder?: string
    disabled?: boolean
    className?: string
}

export const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>(
    ({onChatSend, placeholder = 'Message…', disabled, className}, ref) => {
        const [value, setValue] = useState('')
        const inputRef = useRef<HTMLInputElement>(null)

        // Forward the ref to the input element
        useImperativeHandle(ref, () => inputRef.current!, [])

        const send = () => {
            if (!value.trim() || disabled) return
            onChatSend?.(value)
            setValue('')
            // Auto-focus after sending
            setTimeout(() => {
                inputRef.current?.focus()
            }, 0)
        }

        const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
            }
        }

        return (
            <div className={cn('flex items-center gap-2', className)}>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        'flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none',
                        'border-n-3 focus:ring-2 focus:ring-primary/30 dark:border-n-6',
                        'transition-all duration-150'
                    )}
                />
                <Button type="button" onClick={send} disabled={disabled || !value.trim()} color="indigo">
                    Send
                </Button>
            </div>
        )
    }
)

MessageInput.displayName = 'MessageInput'
