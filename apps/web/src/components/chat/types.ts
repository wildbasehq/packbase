export type ChatSenderType = 'user' | 'other' | 'system' | 'assistant'

export interface ChatUserRef {
  id: string
  username?: string
  display_name?: string
  images?: { avatar?: string }
}

export interface ChatMessage {
  id: string
  senderType: ChatSenderType
  user?: ChatUserRef // present for 'user' and 'other'
  content: string
  createdAt: string | number | Date
  metadata?: Record<string, any>
}

export interface ChatEvents {
  onChatSend?: (text: string) => void
  onMessageClick?: (message: ChatMessage) => void
  onLoadMore?: () => void
}
