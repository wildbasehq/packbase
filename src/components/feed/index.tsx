/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/index.tsx
// Main feed components
export { default as Feed } from './feed'
export { default as FeedList } from './feed-list'
export { default as FeedAnnouncement } from './feed-announcement'

// Thread-based components
export { default as ThreadPost } from './thread-post'
export { default as FloatingComposeButton } from './floating-compose-button'

// State components
export { default as FeedLoading } from './feed-loading'
export { default as FeedEmpty } from './feed-empty'
export { default as FeedError } from './feed-error'
export { default as FeedMaintenance } from './feed-maintenance'

// Post components
export { default as FeedPost } from './feed-post'
export { default as MediaGallery } from './media-gallery'
export { default as ImageOverlay } from './image-overlay'

// Legacy components (kept for compatibility but may be removed)
export { default as FeedHeader } from './feed-header'
export { default as FeedViewControls } from './feed-view-controls'
export { default as PostHeader } from './post-header'
export { default as PostBody } from './post-body'
export { default as PostActions } from './post-actions'
export { default as CommentSection } from './comment-section'
export { default as CommentItem } from './comment-item'

// Types
export * from './types/feed'
export * from './types/post'
