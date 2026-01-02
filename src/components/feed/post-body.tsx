// src/components/feed/PostBody.tsx
import Markdown from '@/components/shared/markdown'
import {FeedPostData} from './types/post'
import MediaGallery from './media-gallery'

interface PostBodyProps {
    post: FeedPostData;
    onClick?: () => void;
}

export default function PostBody({post, onClick}: PostBodyProps) {
    return (
        <div
            className="w-full cursor-pointer px-3 py-2 sm:px-5 sm:py-4"
            onClick={onClick}
        >
            {/* Post content */}
            <div className="text-sm sm:text-base text-neutral-800 dark:text-neutral-200 break-words space-y-3 sm:space-y-4">
                <Markdown>{post.body}</Markdown>
            </div>

            {/* Media attachments */}
            {post.assets && post.assets.length > 0 && (
                <div className="mt-3 sm:mt-4">
                    <MediaGallery assets={post.assets}/>
                </div>
            )}
        </div>
    )
}
