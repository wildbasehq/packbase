import { MessageInput, MessageList } from '@/components/chat'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Heading } from '@/components/shared'
import { PresenceExtension, usePresence } from '@/lib/socket/useProvider'
import { useEffect, useState } from 'react'

export default function Test() {
    const currentUserId = 'u_me'

    const [messages, setMessages] = useState([
        {
            id: 'm1',
            content: 'Wildbase staff will never ask for your personal information. Never share PII (Personally Identifiable Information), passwords, or sensitive data in this chat.',
            senderType: 'system' as const,
            createdAt: new Date().toISOString(),
        },
        {
            id: 'm2',
            content: 'Hey there 👋',
            userId: 'u_alex',
            userName: 'Alex',
            avatarUrl: '/img/default-avatar.png',
            senderType: 'user' as const,
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
            id: 'm3',
            content: 'Hi Alex! How’s your day going?',
            userId: 'u_me',
            userName: 'You',
            avatarUrl: '/img/default-avatar.png',
            senderType: 'user' as const,
            createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        },
        {
            id: 'm4',
            content: 'Pretty good! Just shipped a UI tweak.',
            userId: 'u_alex',
            userName: 'Alex',
            avatarUrl: '/img/default-avatar.png',
            senderType: 'user' as const,
            createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        },
        {
            id: 'm5',
            content: 'Nice! Want to pair later?',
            user: {username: 'You', id: 'u_me'},
            avatarUrl: '/img/default-avatar.png',
            senderType: 'user' as const,
            createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        },
         {
            id: 'm6',
            content: 'Nice! Want to pair later?',
            user: {username: 'You', id: 'u_me'},
            avatarUrl: '/img/default-avatar.png',
            senderType: 'user' as const,
            createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        },
    ])

    return (
        <div className="absolute p-2 w-96 right-0 bottom-0 z-40">
            <ChatContainer
                // header={<Heading>Chat</Heading>}
                footer={<MessageInput onChatSend={text => console.log(text)} />}
            >
                <MessageList messages={messages} currentUserId={currentUserId} />
            </ChatContainer>
        </div>
    )
}
