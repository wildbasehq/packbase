// src/components/feed/PostActions.tsx
import {useState} from 'react'
import {HandThumbUpIcon, PaperAirplaneIcon, XMarkIcon} from '@heroicons/react/20/solid'
import {toast} from 'sonner'
import {vg} from '@/lib/api'
import {useUserAccountStore} from '@/lib/states'
import {FeedPostData} from './types/post'
import {Button} from '@/components/shared/experimental-button-rework'
import {LoadingSpinner} from './loading-spinner'

interface PostActionsProps {
    post: FeedPostData;
    onComment: (comment: FeedPostData) => void;
}

export default function PostActions({post, onComment}: PostActionsProps) {
    const {user} = useUserAccountStore()
    const [commentText, setCommentText] = useState('')
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [isSubmittingReaction, setIsSubmittingReaction] = useState(false)

    const hasReacted = post.reactions?.['0']?.includes(user?.id)
    const reactionCount = post.reactions?.['0']?.length || 0

    // Handle reaction (like/unlike)
    const handleReaction = async () => {
        if (isSubmittingReaction) return
        setIsSubmittingReaction(true)

        try {
            const howlReact = vg.howl({id: post.id}).react
            const {error} = await (hasReacted
                ? howlReact.delete({slot: 0})
                : howlReact.post({slot: 0}))

            if (error) {
                const errorMessage = error.value
                    ? `${error.status}: ${error.value.summary}`
                    : 'Something went wrong'

                toast.error(errorMessage)
                return
            }

            // Update local state
            if (!post.reactions) {
                post.reactions = {'0': []}
            }

            if (hasReacted) {
                post.reactions['0'] = post.reactions['0'].filter(id => id !== user?.id)
                toast.success('Reaction removed')
            } else {
                post.reactions['0'].push(user!.id)
                toast.success('Liked!')
            }
        } catch (err) {
            toast.error('Failed to update reaction')
            console.error(err)
        } finally {
            setIsSubmittingReaction(false)
        }
    }

    // Handle comment submission
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!commentText.trim() || isSubmittingComment) return
        setIsSubmittingComment(true)

        try {
            const {data, error} = await vg.howl({id: post.id}).comment.post({
                body: commentText.trim()
            })

            if (error) {
                const errorMessage = error.value
                    ? `${error.status}: ${error.value.summary}`
                    : 'Something went wrong'

                toast.error(errorMessage)
                return
            }

            // Add comment to the UI
            onComment({
                id: data.id,
                body: commentText.trim(),
                user: user!,
                created_at: new Date().toISOString()
            })

            // Reset form
            setCommentText('')
            toast.success('Comment added')
        } catch (err) {
            toast.error('Failed to add comment')
            console.error(err)
        } finally {
            setIsSubmittingComment(false)
        }
    }

    return (
        <div className="flex items-center gap-2 border-t border-neutral-200 dark:border-neutral-800 px-5 py-3">
            {/* Like button */}
            <Button
                plain
                onClick={handleReaction}
                disabled={isSubmittingReaction}
                className="flex items-center gap-1.5 rounded-full py-1.5 px-3 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
                {isSubmittingReaction ? (
                    <LoadingSpinner size="small"/>
                ) : hasReacted ? (
                    <XMarkIcon className="h-4 w-4 text-neutral-500"/>
                ) : (
                    <HandThumbUpIcon className="h-4 w-4"/>
                )}
                {reactionCount > 0 && (
                    <span className="text-xs font-medium">{reactionCount}</span>
                )}
            </Button>

            {/* Comment form */}
            <form onSubmit={handleSubmitComment} className="relative flex-1">
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-3 pr-10 text-sm placeholder:text-neutral-500 focus:border-neutral-300 focus:outline-none focus:ring-0 dark:border-neutral-800 dark:bg-neutral-900 dark:placeholder:text-neutral-600 dark:focus:border-neutral-700"
                />
                <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 dark:hover:text-neutral-300"
                >
                    {isSubmittingComment ? (
                        <LoadingSpinner size="small"/>
                    ) : (
                        <PaperAirplaneIcon className="h-4 w-4"/>
                    )}
                </button>
            </form>
        </div>
    )
}