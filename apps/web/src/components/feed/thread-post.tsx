/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/thread-post.tsx
import {Activity, FormEvent, useState} from 'react'
import {ChatBubbleLeftIcon, ChevronRightIcon, TrashIcon} from '@heroicons/react/24/outline'
import {UserGroupIcon} from '@heroicons/react/16/solid'
import {toast} from 'sonner'
import {vg} from '@/lib/api'
import UserAvatar from '@/components/shared/user/avatar'
import Link from '@/components/shared/link'
import Markdown from '@/components/shared/markdown'
import {MediaGallery} from '.'
import {UserProfileBasic} from '@/lib/defs/user'
import {formatRelativeTime} from '@/lib/utils/date'
import {Text} from '@/components/shared/text.tsx'
import {AvatarButton, Badge, FeedPostData, LoadingCircle} from '@/src/components'
import {Button} from '@/components/shared'
import {BentoGenericUnlockableBadge, BentoStaffBadge} from '@/lib/utils/pak.tsx'
import Card from '@/components/shared/card.tsx'
import UserInfoCol from '@/components/shared/user/info-col.tsx'
import {ServerReactionStack} from '../ui/reaction-stack'
import {isVisible} from "@/lib";
import {ExclamationTriangleIcon} from "@heroicons/react/20/solid";

interface ThreadPostProps {
    post: FeedPostData
    signedInUser?: UserProfileBasic | null
    onDelete: () => void
    onComment: (comment: FeedPostData) => void
    isRoot?: boolean
    depth?: number
}

export default function ThreadPost({
                                       post,
                                       signedInUser,
                                       onDelete,
                                       onComment,
                                       isRoot = true,
                                       depth = 0
                                   }: ThreadPostProps) {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)

    const isAuthor = post.user?.id === signedInUser?.id
    const maxDepth = 4
    const showNested = depth < maxDepth

    // Thread line styling
    const threadLineClass = depth > 0 ? 'before:absolute before:left-16 before:top-0 before:bottom-0 before:w-px before:bg-border' : ''

    const [showUnsavouryNotice, setShowUnsavouryNotice] = useState<boolean>(post.tags?.some(
        (tag) => tag === 'rating_explicit' || tag === 'rating_suggestive' || tag === 'rating_mature'
    ))

    const handleSubmitReply = async (e: FormEvent) => {
        e.preventDefault()
        if (!replyText.trim() || isSubmittingReply || !signedInUser) return

        setIsSubmittingReply(true)

        try {
            const {data, error} = await vg.howl({id: post.id}).comment.post({
                body: replyText.trim(),
            })

            if (error) {
                const errorMessage = error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'
                toast.error(errorMessage)
                return
            }

            const newComment: FeedPostData = {
                id: data.id,
                body: replyText.trim(),
                user: signedInUser,
                created_at: new Date().toISOString(),
                reactions: [],
            }

            onComment(newComment)

            setReplyText('')
            setShowReplyForm(false)
            toast.success('Reply added')
        } catch (err) {
            toast.error('Failed to add reply')
            console.error(err)
        } finally {
            setIsSubmittingReply(false)
        }
    }

    return (
        <Card className={`relative !border-0 !max-w-full ${(isRoot ? '' : '!pl-12')} ${threadLineClass}`}>
            <div className={`relative ${(isRoot ? '' : 'pt-3')}`}>
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 flex flex-col">
                        <UserAvatar user={post.user} size={depth > 0 ? 'md' : 'lg'} className="rounded-full"/>
                        {post.pack && post.pack?.slug !== 'universe' && (
                            <Link
                                href={`/p/${post.pack.slug}`}
                                className="relative h-12 before:absolute before:left-5 before:top-0 before:bottom-0 before:w-px before:bg-border"
                            >
                                <AvatarButton
                                    src={post.pack.images?.avatar}
                                    alt={post.pack.display_name}
                                    initials={post.pack.display_name[0]}
                                    className="w-10 h-10 mt-4 aspect-square"
                                    square
                                />
                            </Link>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 -mt-1">
                        <div className="flex items-center justify-between mb-1">
                            <UserInfoCol user={post.user} className="flex items-baseline gap-2">
                                <Link href={`/@${post.user?.username}/`}
                                      className="font-semibold hover:underline text-default">
                                    {post.user?.display_name || post.user?.username}
                                </Link>
                                {post.user?.type && (
                                    <BentoStaffBadge
                                        type={post.user?.type}
                                        className="relative top-1 ml-1 inline-flex h-5 w-5"
                                        width={20}
                                        height={20}
                                    />
                                )}
                                {post.user?.badge && (
                                    <BentoGenericUnlockableBadge
                                        type={post.user?.badge}
                                        className="relative top-1 ml-1 inline-flex h-5 w-5"
                                        width={20}
                                        height={20}
                                    />
                                )}
                                <Text className="text-sm" alt>
                                    @{post.user?.username}
                                </Text>
                                <Text className="text-sm" alt>
                                    ·
                                </Text>
                                <Link href={`/p/universe/all/${post.id}`}>
                                    <time
                                        className="text-sm text-muted-foreground">{formatRelativeTime(post.created_at)}</time>
                                </Link>
                            </UserInfoCol>

                            {/* Delete button for author */}
                            {isAuthor && (
                                <button onClick={onDelete}
                                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            )}
                        </div>

                        {post.pack && post.pack?.slug !== 'universe' && (
                            <Link href={`/p/${post.pack.slug}`}>
                                <Text size="xs" alt className="mb-1 items-center flex">
                                    <UserGroupIcon className="h-3 w-3 mr-1 inline-flex"/> howl'd
                                    in {post.pack.display_name}
                                </Text>
                            </Link>
                        )}

                        {/* Unsavoury content notice */}
                        <Activity mode={isVisible(showUnsavouryNotice)}>
                            <div
                                className="flex justify-between items-center mt-2 text-xs rounded-md border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 px-3 py-2 text-sm">
                                <div>
                                    <ExclamationTriangleIcon className="w-4 h-4 mr-1 inline-flex"/>
                                    Heads up: This post contains content that may not be suitable for you.
                                </div>
                                <Button color="amber" className="!py-1 !text-xs"
                                        onClick={() => setShowUnsavouryNotice(false)}>
                                    Show me anyway
                                </Button>
                            </div>
                        </Activity>

                        <Activity mode={isVisible(!showUnsavouryNotice)}>
                            {/* Post body */}
                            <div className="whitespace-normal break-words">
                                <Markdown>{post.body}</Markdown>
                            </div>

                            {/* tag debug */}
                            <div className="mt-3 flex flex-wrap gap-1">
                                <Text className="!text-[0.75rem]" alt>
                                    (debug) Tags:
                                </Text>
                                {post.tags?.map((tag) => (
                                    <Badge>
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            {/* Media */}
                            {post.assets && post.assets.length > 0 && (
                                <div className="mt-3 max-w-lg">
                                    <MediaGallery assets={post.assets}/>
                                </div>
                            )}
                        </Activity>

                        {isRoot && signedInUser && (
                            <div className="flex items-center gap-4 mt-3">
                                <ServerReactionStack entityId={post.id} allowAdd={true} max={10}
                                                     initialReactions={post.reactions}/>

                                <button
                                    onClick={() => setShowReplyForm(!showReplyForm)}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-indigo-500 transition-colors"
                                >
                                    <ChatBubbleLeftIcon className="w-5 h-5"/>
                                    <span className="text-sm">{post.comments?.length || 0}</span>
                                </button>
                            </div>
                        )}

                        {/* Reply form */}
                        {showReplyForm && signedInUser && (
                            <form onSubmit={handleSubmitReply} className="mt-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={isSubmittingReply}
                                    />
                                    <Button type="submit" disabled={!replyText.trim() || isSubmittingReply}
                                            color="indigo">
                                        {isSubmittingReply ? <LoadingCircle/> : 'Reply'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Nested comments as thread continuation */}
                {showNested && post.comments && post.comments.length > 0 && (
                    <div className="mt-4">
                        {post.comments.map(comment => (
                            <ThreadPost
                                key={comment.id}
                                post={comment}
                                signedInUser={signedInUser}
                                onDelete={() => {
                                    // Handle nested comment deletion
                                    post.comments = post.comments?.filter(c => c.id !== comment.id) || []
                                }}
                                onComment={onComment}
                                isRoot={false}
                                depth={depth + 1}
                            />
                        ))}

                        {/* Show more comments indicator */}
                        {depth >= maxDepth - 1 && post.comments.length > 0 && (
                            <div className="ml-12 mt-3">
                                <button
                                    className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600">
                                    <ChevronRightIcon className="w-4 h-4"/>
                                    Continue thread
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    )
}
