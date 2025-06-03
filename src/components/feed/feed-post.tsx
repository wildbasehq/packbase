/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed-post.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { vg } from '@/lib/api'
import { useUserAccountStore } from '@/lib/state'
import { FeedPostData, FeedPostProps } from './types/post'
import ThreadPost from './thread-post'

export default function FeedPost({ post, onDelete, postState }: FeedPostProps) {
    const [postContent, setPostContent] = useState<FeedPostData>(post)
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
        <div className="w-full">
            <ThreadPost
                post={postContent}
                signedInUser={signedInUser}
                onDelete={handleDelete}
                onComment={handleComment}
                isRoot={true}
                depth={0}
            />
        </div>
    )
}
