import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChatMessage } from './types'
import { MessageItem } from './MessageItem'

interface MessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: ChatMessage[]
  currentUserId?: string
  onMessageClick?: (m: ChatMessage) => void
  showAvatars?: boolean
  autoScroll?: boolean
}

export function MessageList({
  messages,
  currentUserId,
  onMessageClick,
  className,
  showAvatars = true,
  autoScroll = true,
  ...props
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, autoScroll])

  return (
    <div className={cn('flex h-full flex-col px-4 py-3', className)} {...props}>
      {messages.map(m => (
        <MessageItem
          key={m.id}
          message={m}
          isOwn={m.user?.id && m.user.id === currentUserId && m.senderType === 'user'}
          onClick={onMessageClick}
          showAvatar={showAvatars}
        />
      ))}
      <div ref={endRef} />
    </div>
  )
}
