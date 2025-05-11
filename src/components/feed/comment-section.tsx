// src/components/feed/CommentSection.tsx
import { useState } from 'react'
import { FeedPostData } from './types/post'
import CommentItem from './comment-item'

interface CommentSectionProps {
    comments: FeedPostData[]
    postContent: FeedPostData
    setPostContent: React.Dispatch<React.SetStateAction<FeedPostData>>
    postState?: [FeedPostData[], React.Dispatch<React.SetStateAction<FeedPostData[]>>]
}

export default function CommentSection({ comments, postContent, setPostContent, postState }: CommentSectionProps) {
    // Control how many comments to show in the feed preview
    const MAX_PREVIEW_COMMENTS = 3
    const [showAllComments, setShowAllComments] = useState(false)

    const visibleComments = showAllComments ? comments : comments.slice(0, MAX_PREVIEW_COMMENTS)

    const hasMoreComments = comments.length > MAX_PREVIEW_COMMENTS

    return (
        <div className="border-t border-neutral-200 dark:border-neutral-800 px-3 py-1.5 sm:px-5 sm:py-2">
            <ul className="space-y-1 sm:space-y-0">
                {visibleComments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postContent={postContent}
                        setPostContent={setPostContent}
                        postState={postState}
                    />
                ))}
            </ul>

            {hasMoreComments && !showAllComments && (
                <button
                    onClick={() => setShowAllComments(true)}
                    className="mt-1 px-2 py-2 sm:py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                >
                    Show all {comments.length} comments
                </button>
            )}

            {/*{hasMoreComments && showAllComments && (*/}
            {/*    <button*/}
            {/*        className="mt-1 px-2 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"*/}
            {/*    >*/}
            {/*        View conversation*/}
            {/*    </button>*/}
            {/*)}*/}
        </div>
    )
}
