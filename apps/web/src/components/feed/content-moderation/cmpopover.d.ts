import {FeedPostData} from '@/src/components'

export interface ContentModerationPopoverProps {
    post: FeedPostData,
    onAction?: (reason?: string) => void
}