// src/components/feed/CommentItem.tsx
import {useState} from 'react'
import {toast} from 'sonner'
import {ChatBubbleLeftIcon, TrashIcon} from '@heroicons/react/24/outline'
import {vg} from '@/lib/api'
import {useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import Link from '@/components/shared/link'
import {FeedPostData} from './types/post'
import {formatRelativeTime} from '@/lib/utils/date'

interface CommentItemProps {
    comment: FeedPostData;
    postContent: FeedPostData;
    setPostContent: React.Dispatch<React.SetStateAction<FeedPostData>>;
    postState?: [FeedPostData[], React.Dispatch<React.SetStateAction<FeedPostData[]>>];
    onClick?: () => void;
    level?: number;
}

export default function CommentItem({
                                        comment,
                                        postContent,
                                        setPostContent,
                                        postState,
                                        onClick,
                                        level = 0
                                    }: CommentItemProps) {
    const {user: currentUser} = useUserAccountStore()
    const [showReplyForm, setShowReplyForm] = useState(false)

    const isAuthor = comment.user.id === currentUser?.id
    const hasNestedComments = comment.comments && comment.comments.length > 0

    // Limit the depth of nested comments in the feed view
    const MAX_VISIBLE_DEPTH = 2
    const showNested = level < MAX_VISIBLE_DEPTH

    // Control how many nested comments to show
    const MAX_NESTED_COMMENTS = 1
    const visibleNestedComments = showNested && hasNestedComments
        ? comment.comments!.slice(0, MAX_NESTED_COMMENTS)
        : []

    const hasMoreNestedComments = hasNestedComments && comment.comments!.length > MAX_NESTED_COMMENTS

    const handleDeleteComment = async () => {
        try {
            const {error} = await vg.howl({id: comment.id}).delete()

            if (error) {
                const errorMessage = error.value
                    ? `${error.status}: ${error.value.summary}`
                    : 'Something went wrong'

                toast.error(errorMessage)
                return
            }

            // Update local state
            const updatedComments = postContent.comments?.filter(c => c.id !== comment.id) || []
            const updatedPostContent = {...postContent, comments: updatedComments}

            setPostContent(updatedPostContent)

            // Update the feed state if available
            if (postState) {
                const [posts, setPosts] = postState
                const updatedPosts = posts.map(p =>
                    p.id === postContent.id ? updatedPostContent : p
                )
                setPosts(updatedPosts)
            }

            toast.success('Comment deleted')
        } catch (err) {
            toast.error('Failed to delete comment')
            console.error(err)
        }
    }

    // Indentation based on comment nesting level
    const indentClass = level === 0 ? 'ml-0' : 'ml-6 pl-2 border-l border-neutral-200 dark:border-neutral-800'

    return (
        <li className={`py-2 ${indentClass}`}>
            <div className="group relative">
                {/* Comment content */}
                <div className="flex gap-2" onClick={onClick}>
                    <div className="flex-shrink-0 pt-0.5">
                        <UserAvatar
                            user={comment.user}
                            size="sm"
                            className="rounded-full"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/@${comment.user.username}/`}
                                className="text-sm font-medium text-neutral-800 hover:underline dark:text-neutral-300 text-default"
                            >
                                {comment.user.display_name || comment.user.username}
                            </Link>

                            <span className="text-xs text-neutral-500 dark:text-neutral-500">
                ·
              </span>

                            <time
                                dateTime={comment.created_at}
                                className="text-xs text-neutral-500 dark:text-neutral-500"
                            >
                                {formatRelativeTime(comment.created_at)}
                            </time>
                        </div>

                        <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 break-words">
                            {comment.body}
                        </div>

                        {/* Comment actions */}
                        {/*<div className="mt-1 flex items-center gap-3">*/}
                        {/*    <button*/}
                        {/*        onClick={(e) => {*/}
                        {/*            e.stopPropagation()*/}
                        {/*            setShowReplyForm(!showReplyForm)*/}
                        {/*        }}*/}
                        {/*        className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"*/}
                        {/*    >*/}
                        {/*        Reply*/}
                        {/*    </button>*/}
                        {/*</div>*/}
                    </div>
                </div>

                {/* Delete button (visible on hover) */}
                {isAuthor && (
                    <div className="absolute right-0 top-0 hidden group-hover:block">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteComment()
                            }}
                            className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                        >
                            <TrashIcon className="h-4 w-4"/>
                        </button>
                    </div>
                )}

                {/* Nested comments */}
                {visibleNestedComments.length > 0 && (
                    <div className="mt-2">
                        {visibleNestedComments.map(nestedComment => (
                            <CommentItem
                                key={nestedComment.id}
                                comment={nestedComment}
                                postContent={postContent}
                                setPostContent={setPostContent}
                                postState={postState}
                                onClick={onClick}
                                level={level + 1}
                            />
                        ))}

                        {hasMoreNestedComments && (
                            <button
                                onClick={onClick}
                                className="mt-1 ml-8 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
                            >
                <span className="flex items-center gap-1">
                  <ChatBubbleLeftIcon className="h-3 w-3"/>
                    {comment.comments!.length - MAX_NESTED_COMMENTS} more {comment.comments!.length - MAX_NESTED_COMMENTS === 1 ? 'reply' : 'replies'}
                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </li>
    )
}