// src/components/feed/FeedPost.tsx
import { useState } from 'react'
import { useModal } from '@/components/modal/provider'
import { toast } from 'sonner'
import { vg } from '@/lib/api'
import { useUserAccountStore } from '@/lib/state'
import Card from '@/components/shared/card'
import { FeedPostData, FeedPostProps } from './types/post'
import PostHeader from './post-header'
import PostBody from './post-body'
import PostActions from './post-actions'
import CommentSection from './comment-section'

export default function FeedPost({ post, onDelete, postState }: FeedPostProps) {
    const [postContent, setPostContent] = useState<FeedPostData>(post)
    const { show } = useModal()
    const { user: signedInUser } = useUserAccountStore()

    const handleDelete = async () => {
        try {
            const { error } = await vg.howl({ id: postContent.id }).delete()

            if (error) {
                const errorMessage = error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'

                toast.error(errorMessage)
                return
            }

            onDelete?.()
            toast.success('Post deleted')
        } catch (err) {
            toast.error('Failed to delete post')
            console.error(err)
        }
    }

    const handleComment = (comment: FeedPostData) => {
        const newPostContent = { ...postContent }
        if (!newPostContent.comments) newPostContent.comments = []
        newPostContent.comments.push(comment)
        setPostContent(newPostContent)

        if (postState) {
            const [posts, setPosts] = postState
            setPosts(posts.map(p => (p.id === postContent.id ? newPostContent : p)))
        }
    }

    return (
        <Card className="w-full overflow-hidden">
            <div className="flex flex-col">
                <PostHeader post={postContent} signedInUser={signedInUser} onDelete={handleDelete} />

                <PostBody
                    post={postContent}
                    // onClick={openPostDetail}
                />

                {signedInUser && !signedInUser.anonUser && <PostActions post={postContent} onComment={handleComment} />}

                {postContent.comments && postContent.comments.length > 0 && (
                    <CommentSection
                        comments={postContent.comments}
                        postContent={postContent}
                        setPostContent={setPostContent}
                        postState={postState}
                    />
                )}
            </div>
        </Card>
    )
}
