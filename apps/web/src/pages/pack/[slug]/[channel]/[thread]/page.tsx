/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useParams} from 'wouter'
import {useEffect, useState} from 'react'
import {Text} from '@/components/shared/text.tsx'
import {Avatar} from '@/components/shared/avatar.tsx'
import {Divider} from '@/components/shared/divider.tsx'
import {ChatBox} from '@/components/shared/chat-box.tsx'
import {Hash, MessageSquare, Reply} from 'lucide-react'
import {formatRelativeTime} from '@/lib/utils/date.ts'
import {useUIStore, vg} from '@/lib'
import {FeedPostData, LogoSpinner} from '@/src/components'
import {toast} from 'sonner'
import Markdown from '@/components/shared/markdown.tsx'
import {SignedIn} from '@clerk/clerk-react'
import {ServerReactionStack} from '@/components/ui/reaction-stack'

function ThreadMessage({message, isOriginalPost = false}: {
    message: FeedPostData;
    isOriginalPost?: boolean;
    currentUserId?: string
}) {
    const bucketRoot = useUIStore(state => state.bucketRoot)

    return (
        <div className={`group relative ${isOriginalPost ? 'pb-4' : 'py-2'}`}>
            <div className="flex space-x-3">
                <Avatar
                    src={message.user?.images?.avatar}
                    initials={(message.user?.display_name || message.user?.username)
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    className="h-10 w-10 shrink-0"
                    square
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                        <Text weight="semibold" size="sm">
                            {message.user?.display_name || message.user?.username || 'Anonymous'}
                        </Text>
                        <Text size="xs" className="text-muted-foreground">
                            {formatRelativeTime(message.created_at)}
                        </Text>
                    </div>
                    <div className="mt-1">
                        <Markdown className="leading-relaxed whitespace-normal">{message.body}</Markdown>
                    </div>

                    {/* Reactions */}
                    <ServerReactionStack entityId={message.id} allowAdd={true} max={10}
                                         initialReactions={message.reactions}/>
                </div>

                {/* Message actions */}
                {/*<div className="opacity-0 group-hover:opacity-100 transition-opacity">*/}
                {/*    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">*/}
                {/*        <MoreHorizontal className="h-4 w-4" />*/}
                {/*    </Button>*/}
                {/*</div>*/}
            </div>

            {/* Display assets if any */}
            {message.assets && message.assets.length > 0 && (
                <div className="mt-3 pl-12">
                    <div className="grid grid-cols-2 gap-2">
                        {message.assets.map((asset, index) => (
                            <div key={index} className="overflow-hidden rounded-md">
                                <img
                                    src={`${bucketRoot}/${asset.data.url}`}
                                    alt={asset.data.name || 'Attached image'}
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PackChannelThread() {
    const {id, channel} = useParams<{ id: string; channel: string; slug: string }>()
    const [newMessage, setNewMessage] = useState('')
    const [currentUserId] = useState('user-1') // In a real app, this would come from authentication

    const [threadContent, setThreadContent] = useState<FeedPostData | null>(null)

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return

        console.log('Sending message:', content)
        const {error} = await vg.howl({id}).comment.post({
            body: content.trim(),
        })

        if (error) {
            console.error(error)
            toast.error('Failed to send message')
            return
        } else {
            setNewMessage('')
            await getHowl()
        }
    }

    const getHowl = async () => {
        console.log('Fetching thread:', id)
        const howl = await vg.howl({id}).get()

        console.log('Fetched thread:', howl)
        if (howl.data) {
            setThreadContent(howl.data)
        } else {
            setThreadContent(null)
        }
        return howl
    }

    useEffect(() => {
        getHowl()
    }, [id])

    if (!threadContent)
        return (
            <div className="flex h-full flex-col">
                <div className="border-b px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-muted-foreground"/>
                        <Text weight="semibold" className="text-lg">
                            {channel}
                        </Text>
                    </div>
                </div>

                <div className="flex flex-1 h-full w-full justify-center items-center">
                    <LogoSpinner delay={0}/>
                </div>
            </div>
        )

    return (
        <div className="flex h-full flex-col">
            {/* Thread Header */}
            <div className="border-b px-6 py-4">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-muted-foreground"/>
                        <Text weight="semibold" className="text-lg">
                            {channel}
                        </Text>
                    </div>
                    <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                        <Text size="sm" alt>
                            Thread
                        </Text>
                    </div>
                </div>
                <Text size="sm" className="text-muted-foreground mt-1">
                    {threadContent.comments?.length + 1 || 1} messages
                </Text>
            </div>

            {/* Thread Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-4">
                    {/* Original Post */}
                    <div className="mb-4">
                        <ThreadMessage message={threadContent} isOriginalPost={true} currentUserId={currentUserId}/>
                        <Divider className="my-4"/>

                        <div className="flex items-center space-x-2 mb-4">
                            <Reply className="h-4 w-4 text-muted-foreground"/>
                            <Text size="sm" weight="semibold" className="text-muted-foreground">
                                {threadContent.comments?.length} replies
                            </Text>
                        </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-4">
                        {threadContent.comments?.map(reply => (
                            <ThreadMessage key={reply.id} message={reply} currentUserId={currentUserId}/>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Input */}
            <SignedIn>
                <div className="border-t p-4">
                    <ChatBox placeholder={`Reply to howl...`} onSend={handleSendMessage} value={newMessage}
                             onChange={setNewMessage}/>
                </div>
            </SignedIn>
        </div>
    )
}
