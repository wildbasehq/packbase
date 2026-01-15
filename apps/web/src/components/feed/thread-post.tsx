/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {DeleteHowl} from '@/components/feed/content-moderation/delete-howl'
import {IssueWarning} from '@/components/feed/content-moderation/issue-warning'
import {RehowlIcon} from '@/components/icons/rehowl'
import {Alert, AlertDescription, Button, Divider} from '@/components/shared'
import Card from '@/components/shared/card'
import Link from '@/components/shared/link'
import Markdown from '@/components/shared/markdown'
import {Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import UserInfoCol from '@/components/shared/user/info-col'
import {cn, isVisible, useUserAccountStore} from '@/lib'
import {vg} from '@/lib/api'
import {UserProfileBasic} from '@/lib/defs/user'
import {canContentModerate} from '@/lib/utils/can-content-moderate'
import {formatRelativeTime} from '@/lib/utils/date'
import {BentoGenericUnlockableBadge, BentoStaffBadge} from '@/lib/utils/pak'
import {AvatarButton, Editor, FeedPostData, LoadingCircle} from '@/src/components'
import {ExclamationTriangleIcon} from '@heroicons/react/20/solid'
import {ChatBubbleLeftIcon} from '@heroicons/react/24/outline'
import {JSONContent} from '@tiptap/react'
import {Activity, FormEvent, useCallback, useState} from 'react'
import {TbLineDotted} from 'react-icons/tb'
import {toast} from 'sonner'
import {MediaGallery} from '.'
import {ServerReactionStack} from '../ui/reaction-stack'

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
    onDelete?: () => void
    /** Callback when a new comment is created under this post */
    onComment?: (comment: FeedPostData) => void
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

function ThreadPostUserInfoCol({user, post, showAvatar}: {
    user: UserProfileBasic,
    showAvatar?: boolean,
    post?: FeedPostData,
}) {
    return (
        <UserInfoCol user={user} className="flex min-w-0 gap-0.5">
            {showAvatar && (
                <div className="size-7">
                    <UserAvatar size="sm" user={user} className="rounded-full!"/>
                </div>
            )}
            <div className="flex items-center gap-1.5 min-w-0">
                <Link
                    href={`/@${user?.username}/`}
                    className="truncate font-semibold text-sm text-foreground"
                >
                    {user?.display_name || user?.username}
                </Link>
                {user?.type && (
                    <BentoStaffBadge
                        type={user?.type}
                        className="relative inline-flex h-4 w-4 shrink-0"
                        width={16}
                        height={16}
                    />
                )}
                {user?.badge && (
                    <BentoGenericUnlockableBadge
                        type={user?.badge}
                        className="relative inline-flex h-4 w-4 shrink-0"
                        width={16}
                        height={16}
                    />
                )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Text size="xs" className="truncate ml-0.5" alt>
                    • @{user?.username}
                </Text>
                {post?.pack && (
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
    )
}

function ThreadPostHeader({post, isAuthor, onDelete}: ThreadPostHeaderProps) {
    const {user} = useUserAccountStore()

    return (
        <div
            className="flex items-start justify-between px-4 pt-1 -mb-4 mr-4 bg-linear-to-b from-body to-neutral-100 dark:to-n-7 rounded-t-xl h-12 bg-gradient-neutral-200 dark:bg-gradient-n-7">
            <div className="flex min-w-0 items-center gap-2">
                {/* Name + badges */}
                <ThreadPostUserInfoCol user={post.user} post={post}/>
            </div>


            {/* Actions */}
            <div className="flex gap-2">
                {/* Issue Tag Replacement */}
                {canContentModerate(user) && (
                    <>
                        {/*<IssueTagReplacement post={post}/>*/}

                        <IssueWarning post={post}/>
                    </>
                )}

                {/*
                Delete button. Not in it's own component as I'm not sure where to classify it.
                (content moderation? but regular usrs can use this dialog.)
                */}

                {(isAuthor || (post.user.id !== user.id && canContentModerate(user))) && (
                    <DeleteHowl post={post} onAction={onDelete}/>
                )}
            </div>
        </div>
    )
}

interface ThreadPostBodyProps {
    body: string | JSONContent
}

function ThreadPostBody({body}: ThreadPostBodyProps) {
    const useTipTap = typeof body === 'object'

    if (useTipTap) {
        return (
            <div className="whitespace-normal wrap-break-word text-sm leading-relaxed">
                <Editor readOnly defaultValue={body}/>
            </div>
        )
    }

    return (
        <>
            {/* Post body */}
            <div className="whitespace-normal wrap-break-word text-sm leading-relaxed">
                <Markdown>{body}</Markdown>
            </div>
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
    canRehowl?: boolean
    showReplyForm?: boolean
    onToggleReply?: () => void
}

function ThreadPostActions({
                               postId,
                               reactions,
                               commentCount,
                               canInteract,
                               canRehowl,
                               showReplyForm,
                               onToggleReply,
                           }: ThreadPostActionsProps) {
    if (!canInteract) return null

    const rehowl = () => {
        vg.howl({id: postId}).rehowl.post().then(({status, error}) => {
            if (status === 404) {
                toast.error('Failed to rehowl: Howl not found')
                return
            }

            if (error) {
                toast.error(error.value.summary)
                return
            }

            toast.success('Rehowled! But you\'ll need to reload to see it!', {
                dismissible: false,
                duration: Infinity
            })
        }).catch((err) => {
            toast.error('Failed to rehowl: ' + err.message)
        })
    }

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

            <div>
                {canRehowl && (
                    <button
                        type="button"
                        onClick={() => rehowl()}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                        aria-expanded={showReplyForm}
                    >
                        <RehowlIcon className="h-4 w-4"/>
                        <span>{showReplyForm ? 'Cancel' : 'Rehowl'}</span>
                    </button>
                )}

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
                    className="flex-1 rounded-2xl border px-3 py-1 text-sm shadow-sm transition focus-within:border-indigo-400 focus-within:shadow-md dark:focus-within:border-indigo-400">
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

    const tags = post?.tags
    const containsMature = hasMatureTags(tags)
    const [showUnsavouryNotice, setShowUnsavouryNotice] = useState<boolean>(containsMature)

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
                        href={`/p/${post.pack?.slug}`}
                        className="relative mt-3 inline-flex items-center justify-center"
                    >
                        <AvatarButton
                            src={post.pack?.images?.avatar}
                            alt={post.pack?.display_name}
                            initials={post.pack?.display_name[0]}
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
                {post.rehowled_by && (
                    <div className="flex items-center ml-4 mr-8 gap-1.5 text-xs text-muted-foreground mb-2">
                        <RehowlIcon className="h-4 w-4"/>{' '}
                        rehowled by{' '}
                        <ThreadPostUserInfoCol user={post.rehowled_by} post={post}/>
                        <div className="grow"/>
                        {post.rehowled_by.id === signedInUser?.id && (
                            // @ts-ignore
                            <DeleteHowl post={{
                                id: post.id + 'rehowl',
                                user: post.rehowled_by
                            }} onAction={onDelete}/>
                        )}
                    </div>
                )}

                <ThreadPostHeader post={post} isAuthor={isAuthor} onDelete={onDelete}/>
                <Card
                    className={`relative group max-w-full! overflow-hidden rounded-xl! border border-border/60 ${depthTintClass} transition-shadow hover:shadow-sm`}
                >
                    <div className={innerPaddingClass}>
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
                            {/* Body and media (with mature gating) */}
                            <ThreadPostBody body={post.body}/>

                            {/* User received a warning? */}
                            {post.warning && (
                                <Alert className="p-2 rounded mb-2" variant="destructive">
                                    <div className="flex gap-2 items-center">
                                        <ThreadPostUserInfoCol showAvatar user={{
                                            id: '549329ff-74dd-4ac9-85b1-d33f5c73d8ac',
                                            username: 'packbase',
                                            slug: 'packbase',
                                            display_name: 'Packbase Staff',
                                            type: '2'
                                        }}/>
                                    </div>
                                    <Divider className="my-2"/>
                                    <AlertDescription>
                                        @{post.user?.username} received a warning for the contents of this Howl.
                                    </AlertDescription>

                                    <AlertDescription className="text-foreground">
                                        {post.warning.reason}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <ThreadPostMedia assets={post.assets}/>
                        </Activity>

                        {/* Actions */}
                        <ThreadPostActions
                            postId={post.id}
                            reactions={post.reactions}
                            commentCount={commentCount}
                            canInteract={Boolean(isRoot && signedInUser)}
                            canRehowl={Boolean(post.allow_rehowl)}
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
        <div className="flex flex-col bg-card ring ring-muted mx-4 rounded-b-xl p-2 gap-2">
            {comments?.map((comment) => (
                <>
                    <div className={cn('flex group px-2 py-1 gap-2 rounded-xl', comment.content_type === 'howling_echo' ? 'hover:bg-muted/50' : 'hover:bg-muted')}
                         key={comment.id}>
                        {comment.content_type === 'howling_echo' && (
                            <div className="flex shrink text-muted-foreground items-center gap-1">
                                <TbLineDotted className="h-4 w-4"/>
                                <RehowlIcon className="h-4 w-4"/>
                            </div>
                        )}

                        <div className="size-7">
                            <UserAvatar size="sm" user={comment.user} className="rounded-full!"/>
                        </div>

                        <div className="flex flex-col w-full justify-center">
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
                                    {comment.content_type === 'howling_echo' && (
                                        <Text alt size="xs">
                                            rehowled{' '}
                                            <time suppressHydrationWarning>{formatRelativeTime(comment.created_at)}</time>
                                            {' '}
                                            ago
                                        </Text>
                                    )}

                                    {comment.content_type !== 'howling_echo' && (
                                        <>
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

                                                    <DeleteHowl post={comment} onAction={() => handleNestedDelete && handleNestedDelete(comment.id)}/>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </UserInfoCol>

                            {comment.content_type !== 'howling_echo' && (
                                <>
                                    <ThreadPostBody body={comment.body}/>
                                    <ThreadPostActions
                                        postId={comment.id}
                                        reactions={comment.reactions}
                                        canInteract={Boolean(signedInUser)}
                                    />
                                </>
                            )}
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
