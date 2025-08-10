import React, { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChatEvents } from './types'
import { Button } from '@/components/shared//experimental-button-rework'

interface MessageInputProps extends ChatEvents {
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MessageInput({ onChatSend, placeholder = 'Message…', disabled, className }: MessageInputProps) {
  const [value, setValue] = useState('')

  const send = () => {
    if (!value.trim() || disabled) return
    onChatSend?.(value)
    setValue('')
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
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none',
          'border-n-3 focus:ring-2 focus:ring-primary/30 dark:border-n-6',
        )}
      />
      <Button
        type="button"
        onClick={send}
        disabled={disabled || !value.trim()}
        color="indigo"
      >
        Send
      </Button>
    </div>
  )
}
