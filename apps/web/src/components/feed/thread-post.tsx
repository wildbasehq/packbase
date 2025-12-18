/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/thread-post.tsx
import {Activity, FormEvent, useCallback, useState} from 'react'
import {ChatBubbleLeftIcon, TrashIcon} from '@heroicons/react/24/outline'
import {ExclamationTriangleIcon} from '@heroicons/react/20/solid'
import {toast} from 'sonner'
import {vg} from '@/lib/api'
import UserAvatar from '@/components/shared/user/avatar'
import Link from '@/components/shared/link'
import Markdown from '@/components/shared/markdown'
import {MediaGallery} from '.'
import {UserProfileBasic} from '@/lib/defs/user'
import {formatRelativeTime} from '@/lib/utils/date'
import {Text} from '@/components/shared/text.tsx'
import {AvatarButton, BubblePopover, FeedPostData, LoadingCircle, PopoverHeader} from '@/src/components'
import {Button} from '@/components/shared'
import {BentoGenericUnlockableBadge, BentoStaffBadge} from '@/lib/utils/pak.tsx'
import Card from '@/components/shared/card.tsx'
import UserInfoCol from '@/components/shared/user/info-col.tsx'
import {ServerReactionStack} from '../ui/reaction-stack'
import {isVisible, useUserAccountStore} from '@/lib'

const MAX_THREAD_DEPTH = 4

// Helper to determine if a tag is mature
const MATURE_TAGS = new Set(['rating_explicit', 'rating_suggestive', 'rating_mature'])

function hasMatureTags(tags?: string[] | null): boolean {
    if (!tags || tags.length === 0) return false
    return tags.some((tag) => MATURE_TAGS.has(tag))
}

interface ThreadPostProps {
    /** Feed post (howl) to render */
    post: FeedPostData
    /** Currently signed in user, if any */
    signedInUser?: UserProfileBasic | null
    /** Callback when this post is deleted */
    onDelete: () => void
    /** Callback when a new comment is created under this post */
    onComment: (comment: FeedPostData) => void
    /** Whether this post is the root of a thread */
    isRoot?: boolean
    /** Current nesting depth (0-based). Controlled by parent recursion. */
    depth?: number
    /** Optional callback to notify parent of a nested comment deletion */
    onDeleteComment?: (commentId: string, parentPostId: string) => void
}

interface ThreadPostHeaderProps {
    post: FeedPostData
    isAuthor: boolean
    onDelete: () => void
}

function ThreadPostHeader({post, isAuthor, onDelete}: ThreadPostHeaderProps) {
    return (
        <div
            className="flex items-start justify-between px-4 pt-1 -mb-4 mr-4 bg-linear-to-b from-body to-neutral-100 dark:to-n-7 rounded-t h-12 bg-gradient-neutral-200 dark:bg-gradient-n-7">
            <div className="flex min-w-0 items-center gap-2">
                {/* Name + badges */}
                <UserInfoCol user={post.user} className="flex min-w-0 gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Link
                            href={`/@${post.user?.username}/`}
                            className="truncate font-semibold text-sm text-foreground"
                        >
                            {post.user?.display_name || post.user?.username}
                        </Link>
                        {post.user?.type && (
                            <BentoStaffBadge
                                type={post.user?.type}
                                className="relative inline-flex h-4 w-4 shrink-0"
                                width={16}
                                height={16}
                            />
                        )}
                        {post.user?.badge && (
                            <BentoGenericUnlockableBadge
                                type={post.user?.badge}
                                className="relative inline-flex h-4 w-4 shrink-0"
                                width={16}
                                height={16}
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Text className="truncate" alt>
                            • @{post.user?.username}
                        </Text>
                        {post.pack && (
                            <>
                                <span className="text-[0.6rem]">•</span>
                                <Link href={`/p/${post.pack?.slug || 'universe'}/all/${post.id}`}
                                      className="text-muted-foreground hover:underline">
                                    <time suppressHydrationWarning>{formatRelativeTime(post.created_at)}</time>
                                </Link>
                            </>
                        )}
                    </div>
                </UserInfoCol>
            </div>

            {/* Delete button for author */}
            {isAuthor && (
                <BubblePopover
                    isCentered
                    corner="top-right"
                    id={`delete-howl-${post.id}`}
                    trigger={({setOpen}) => (
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors"
                            aria-label="Delete howl"
                        >
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    )}
                >
                    <PopoverHeader
                        title="Delete Howl?"
                        description="Deleting a howl is permanent and cannot be undone."
                        onPrimaryAction={onDelete}
                        variant="destructive"
                    />
                </BubblePopover>
            )}
        </div>
    )
}

interface ThreadPostBodyProps {
    body: string
    tags?: string[] | null
}

function ThreadPostBody({body, tags}: ThreadPostBodyProps) {
    const containsMature = hasMatureTags(tags)
    const [showUnsavouryNotice, setShowUnsavouryNotice] = useState<boolean>(containsMature)

    return (
        <>
            {/* Unsavoury content notice */}
            {containsMature && (
                <Activity mode={isVisible(containsMature)}>
                    <div
                        className="flex items-start justify-between mb-2 gap-3 rounded-xl border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
                    >
                        <div className="flex-1 text-xs leading-snug">
                            <div className="mb-1 flex items-center gap-1.5">
                                <ExclamationTriangleIcon className="h-4 w-4"/>
                                <span className="font-medium">Heads up</span>
                            </div>
                            <span>
                                This howl contains adult content that may not be suitable for everyone.
                            </span>
                            {tags && tags.length > 0 && (
                                <span className="mt-1 block text-[0.7rem] font-medium">
                                    Contains: {tags.join(', ')}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Activity mode={isVisible(showUnsavouryNotice)}>
                                <Button
                                    color="amber"
                                    className="!py-1 !px-2 !text-[0.7rem] rounded-full"
                                    onClick={() => setShowUnsavouryNotice(false)}
                                    aria-expanded={!showUnsavouryNotice}
                                >
                                    Show anyway
                                </Button>
                            </Activity>

                            <Activity mode={isVisible(!showUnsavouryNotice)}>
                                <Button
                                    outline
                                    className="!py-1 !px-2 !text-[0.7rem] rounded-full border-amber-400/60"
                                    onClick={() => setShowUnsavouryNotice(true)}
                                    aria-expanded={showUnsavouryNotice}
                                >
                                    Hide again
                                </Button>
                            </Activity>
                        </div>
                    </div>
                </Activity>
            )}

            <Activity mode={isVisible(!containsMature || !showUnsavouryNotice)}>
                {/* Post body */}
                <div className="whitespace-normal break-words text-sm leading-relaxed">
                    <Markdown>{body}</Markdown>
                </div>
            </Activity>
        </>
    )
}

interface ThreadPostMediaProps {
    assets?: FeedPostData['assets']
}

function ThreadPostMedia({assets}: ThreadPostMediaProps) {
    if (!assets || assets.length === 0) return null

    return (
        <div className="mt-3 max-w-lg">
            <MediaGallery assets={assets}/>
        </div>
    )
}

interface ThreadPostActionsProps {
    postId: string
    reactions?: FeedPostData['reactions']
    commentCount?: number
    canInteract: boolean
    showReplyForm?: boolean
    onToggleReply?: () => void
}

function ThreadPostActions({
                               postId,
                               reactions,
                               commentCount,
                               canInteract,
                               showReplyForm,
                               onToggleReply,
                           }: ThreadPostActionsProps) {
    if (!canInteract) return null

    return (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
                <ServerReactionStack
                    size="sm"
                    entityId={postId}
                    allowAdd={true}
                    max={10}
                    initialReactions={reactions}
                />
            </div>

            {showReplyForm !== undefined && onToggleReply && (
                <button
                    type="button"
                    onClick={onToggleReply}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                    aria-expanded={showReplyForm}
                >
                    <ChatBubbleLeftIcon className="h-4 w-4"/>
                    <span>{showReplyForm ? 'Cancel' : 'Reply'}</span>
                    <span className="text-[0.7rem] text-muted-foreground">• {commentCount}</span>
                </button>
            )}
        </div>
    )
}

interface ThreadPostReplyFormProps {
    value: string
    isSubmitting: boolean
    disabled: boolean
    onChange: (value: string) => void
    onSubmit: (event: FormEvent) => void
}

function ThreadPostReplyForm({value, isSubmitting, disabled, onChange, onSubmit}: ThreadPostReplyFormProps) {
    return (
        <form onSubmit={onSubmit} className="mt-3">
            <div className="flex gap-2">
                <div className="mt-1 hidden sm:block">
                    <div className="h-7 w-7 rounded-full bg-muted"/>
                </div>
                <div
                    className="flex-1 rounded-2xl border px-3 py-1 text-sm shadow-sm transition focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-md dark:focus-within:border-indigo-400">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Start replying...."
                        className="min-h-[2.25rem] w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                        disabled={disabled}
                        aria-label="Write a reply"
                        rows={1}
                    />
                    <div className="mt-1 flex items-center justify-end gap-2">
                        <Button
                            type="submit"
                            disabled={!value.trim() || disabled}
                            color="indigo"
                            className="rounded-full px-3 text-xs"
                        >
                            {isSubmitting ? <LoadingCircle/> : 'Reply'}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default function ThreadPost({
                                       post,
                                       signedInUser,
                                       onDelete,
                                       onComment,
                                       isRoot = true,
                                       depth = 0,
                                       onDeleteComment,
                                   }: ThreadPostProps) {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)

    const isAuthor = post.user?.id === signedInUser?.id
    const showNested = depth < MAX_THREAD_DEPTH

    const handleSubmitReply = useCallback(
        async (e: FormEvent) => {
            e.preventDefault()
            if (!replyText.trim() || isSubmittingReply || !signedInUser) return

            setIsSubmittingReply(true)

            try {
                const {data, error} = await vg.howl({id: post.id}).comment.post({
                    body: replyText.trim(),
                })

                if (error) {
                    const errorMessage = error.value
                        ? `${error.status}: ${error.value.summary}`
                        : 'Something went wrong'
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
        },
        [isSubmittingReply, onComment, post.id, replyText, signedInUser],
    )

    const handleToggleReply = useCallback(() => {
        setShowReplyForm((prev) => !prev)
    }, [])

    const handleNestedDelete = useCallback(
        (commentId: string) => {
            if (onDeleteComment) {
                onDeleteComment(commentId, post.id)
            }
        },
        [onDeleteComment, post.id],
    )

    const commentCount = post.comments?.length || 0

    const depthTintClass =
        depth === 0
            ? 'bg-card'
            : depth === 1
                ? 'bg-muted'
                : 'bg-muted/80'

    const innerPaddingClass = isRoot ? 'px-4 py-2 sm:px-5' : 'px-3 py-3 sm:px-4 sm:py-3'

    // noinspection OverlyComplexBooleanExpressionJS
    return (
        <div className={`relative flex w-full gap-3 ${isRoot ? '' : 'pt-3'}`}>
            {/* Left column: avatar + thread line */}
            <div className="relative flex w-12 flex-col items-center">
                <div className="z-10">
                    <UserAvatar
                        user={post.user}
                        size={depth > 0 ? 'md' : 'lg'}
                        className="rounded-full shadow-sm transition-transform duration-150 hover:scale-[1.02]"
                    />
                </div>

                {/* Pole linking both avatars */}
                <div className="absolute inset-y-0 left-1/2 -z-10 w-px -translate-x-1/2 bg-border"/>

                {post.pack && (
                    <Link
                        href={`/p/${post.pack.slug}`}
                        className="relative mt-3 inline-flex items-center justify-center"
                    >
                        <AvatarButton
                            src={post.pack.images?.avatar}
                            alt={post.pack.display_name}
                            initials={post.pack.display_name[0]}
                            className="aspect-square h-8 w-8 rounded-lg border border-border bg-background shadow-sm"
                            square
                        />
                    </Link>
                )}

                {/* Vertical connector for nested threads */}
                {depth > 0 && (
                    <div
                        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-px -translate-x-1/2 bg-border"/>
                )}
            </div>

            {/* Right column: card content */}
            <div className="flex-1 min-w-0">
                <ThreadPostHeader post={post} isAuthor={isAuthor} onDelete={onDelete}/>
                <Card
                    className={`relative group max-w-full! overflow-hidden rounded-2xl! border border-border/60 ${depthTintClass} transition-shadow hover:shadow-sm`}
                >
                    <div className={innerPaddingClass}>
                        {/* Body and media (with mature gating) */}
                        <ThreadPostBody body={post.body} tags={post.tags}/>
                        <ThreadPostMedia assets={post.assets}/>

                        {/* Actions */}
                        <ThreadPostActions
                            postId={post.id}
                            reactions={post.reactions}
                            commentCount={commentCount}
                            canInteract={Boolean(isRoot && signedInUser)}
                            showReplyForm={showReplyForm}
                            onToggleReply={handleToggleReply}
                        />

                        {/* Reply form */}
                        {showReplyForm && signedInUser && (
                            <ThreadPostReplyForm
                                value={replyText}
                                isSubmitting={isSubmittingReply}
                                disabled={isSubmittingReply}
                                onChange={setReplyText}
                                onSubmit={handleSubmitReply}
                            />
                        )}
                    </div>
                </Card>

                {/* Nested comments as thread continuation */}
                {showNested && post.comments && post.comments.length > 0 && (
                    <ThreadComments comments={post.comments} handleNestedDelete={handleNestedDelete}/>
                )}
            </div>
        </div>
    )
}

function ThreadComments({comments, handleNestedDelete}: {
    comments?: FeedPostData[];
    handleNestedDelete?: (commentId: string) => void
}) {
    const {user: signedInUser} = useUserAccountStore()

    return (
        <div className="flex flex-col bg-card ring ring-muted mx-4 rounded-b-2xl px-4 py-2 gap-2">
            {comments?.map((comment) => (
                <>
                    <div className="flex group px-2 py-1 gap-2 hover:bg-muted rounded-2xl" key={comment.id}>
                        <UserAvatar size="sm" user={comment.user} className="mt-1.5 rounded-full!"/>

                        <div className="flex flex-col w-full">
                            <UserInfoCol user={comment.user} className="flex">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Link
                                        href={`/@${comment.user?.username}/`}
                                        className="truncate font-semibold text-sm text-foreground"
                                    >
                                        {comment.user?.display_name || comment.user?.username}
                                    </Link>
                                    {comment.user?.type && (
                                        <BentoStaffBadge
                                            type={comment.user?.type}
                                            className="relative inline-flex h-4 w-4 shrink-0"
                                            width={16}
                                            height={16}
                                        />
                                    )}
                                    {comment.user?.badge && (
                                        <BentoGenericUnlockableBadge
                                            type={comment.user?.badge}
                                            className="relative inline-flex h-4 w-4 shrink-0"
                                            width={16}
                                            height={16}
                                        />
                                    )}
                                </div>

                                <div className="flex items-center ml-1 gap-1 flex-1 text-xs text-muted-foreground">
                                    <Text className="truncate" alt>
                                        @{comment.user?.username}
                                    </Text>
                                    <span className="text-[0.6rem]">•</span>
                                    <Link href={`/p/${comment.pack?.slug || 'universe'}/all/${comment.id}`}
                                          className="text-muted-foreground hover:underline">
                                        <time suppressHydrationWarning>{formatRelativeTime(comment.created_at)}</time>
                                    </Link>

                                    {comment.user?.id === signedInUser?.id && (
                                        <>
                                            <span className="text-[0.6rem]">•</span>
                                            <span className="text-red-500 font-medium">You</span>

                                            <div className="grow flex-1"/>

                                            <Button
                                                plain
                                                type="button"
                                                onClick={() => handleNestedDelete && handleNestedDelete(comment.id)}
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors p-0"
                                                aria-label="Delete comment"
                                            >
                                                <TrashIcon className="w-4 h-4"/>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </UserInfoCol>

                            <ThreadPostBody body={comment.body} tags={comment.tags}/>
                            <ThreadPostActions
                                postId={comment.id}
                                reactions={comment.reactions}
                                canInteract={Boolean(signedInUser)}
                            />
                        </div>
                    </div>
                </>
            ))}
        </div>
    )
}

/**
 * <div className="mt-3 space-y-2 pl-4">
 *                         {post.comments.map((comment) => (
 *                             <ThreadPost
 *                                 key={comment.id}
 *                                 post={comment}
 *                                 signedInUser={signedInUser}
 *                                 onDelete={() => handleNestedDelete(comment.id)}
 *                                 onComment={onComment}
 *                                 isRoot={false}
 *                                 depth={depth + 1}
 *                                 onDeleteComment={onDeleteComment}
 *                             />
 *                         ))}
 *
 *                         {/* Show more comments indicator
 }
 *
 {
 depth >= MAX_THREAD_DEPTH - 1 && post.comments.length > 0 && (
 * <div className="mt-2 flex items-center gap-1 text-xs text-indigo-500">
 * <ChevronRightIcon className="h-4 w-4"/>
 * <span>Continue thread</span>
 * </div>
 *
 )
 }
 *                     </div>
 */
