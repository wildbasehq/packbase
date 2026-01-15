/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {vg} from '@/lib/api'
import {useUserAccountStore} from '@/lib/state'
import {useState} from 'react'
import {toast} from 'sonner'
import type {FeedPostData, FeedPostProps} from '.'
import {ThreadPost} from '.'

export default function FeedPost({post, onDelete, postState}: FeedPostProps) {
    const [postContent, setPostContent] = useState<FeedPostData>(post)
    const {user: signedInUser} = useUserAccountStore()

    const handleDelete = async (reason?: string) => {
        try {
            const {error} = await vg.howl({id: postContent.id}).delete({
                reason: typeof reason === 'string' ? reason : undefined
            })

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

    const handleDeleteComment = (commentId: string) => {
        try {
            const {error} = vg.howl({id: commentId}).delete()

            if (error) {
                const errorMessage = error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong'
                toast.error(errorMessage)
                return
            }

            toast.success('Comment deleted')

            const newPostContent = {...postContent}
            if (newPostContent.comments) {
                newPostContent.comments = newPostContent.comments.filter(c => c.id !== commentId)
                setPostContent(newPostContent)
            }

            if (postState) {
                const [posts, setPosts] = postState
                setPosts(posts.map(p => (p.id === postContent.id ? newPostContent : p)))
            }
        } catch (err) {
            toast.error('Failed to delete comment')
            console.error(err)
        }
    }

    const handleComment = (comment: FeedPostData) => {
        const newPostContent = {...postContent}
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
                onDeleteComment={handleDeleteComment}
                isRoot={true}
                depth={0}
            />
        </div>
    )
}
