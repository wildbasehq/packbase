import { SearchResult } from '@/pages/search/types'
import { Clock } from 'lucide-react'
import Link from '@/components/shared/link.tsx'

interface PostCardProps {
    post: SearchResult
}

export const PostCard = ({ post }: PostCardProps) => {
    // Format the date if available
    let formattedDate = post.timestamp

    try {
        if (post.created_at) {
            formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        }
    } catch (error) {
        console.error('Error formatting date:', error)
        // Keep the original timestamp if date parsing fails
    }

    return (
        <Link
            href={post.url || (post.user ? `/user/${post.user.slug || post.user.username}/post/${post.id}` : `/post/${post.id}`)}
            className="block h-full ring-1 rounded ring-default hover:ring-2 transition-shadow"
        >
            <div className="p-5">
                {/* Post author info if available */}
                {post.user && (
                    <div className="flex items-center gap-2 mb-3 text-default">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs overflow-hidden">
                            {post.user.display_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium">{post.user.display_name}</span>
                    </div>
                )}

                {/* Post content */}
                <p className="text-muted-foreground mb-3 line-clamp-3">{post.body || post.description}</p>

                {/* Post timestamp */}
                {(formattedDate || post.timestamp) && (
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formattedDate || post.timestamp}</span>
                    </div>
                )}
            </div>
        </Link>
    )
}
