// src/components/feed/types.ts
import {Reaction} from '@/components/ui/reaction-stack'
import {UserProfileBasic} from '@/lib/defs/user'
import {JSONContent} from '@tiptap/react'
import {Dispatch, SetStateAction} from 'react'

export interface Asset {
    type: 'image' | 'video'
    data: {
        url: string
        name?: string
        width?: number
        height?: number
    }
}

export interface FeedPostData {
    id: string
    rehowl_id?: string
    user: UserProfileBasic
    body: string | JSONContent
    created_at: string
    pack?: {
        id: string
        slug: string
        display_name: string
        images?: {
            avatar?: string
        }
    }
    content_type?: 'markdown' | 'rich' | 'howling_alongside' | 'howling_echo'
    allow_rehowl?: boolean
    rehowled_by?: UserProfileBasic
    actor?: UserProfileBasic
    reactions?: Reaction[]
    assets?: Asset[]
    comments?: FeedPostData[]
    warning?: {
        reason: string
    }
    tags?: string[]
}

export interface FeedPostProps {
    post: FeedPostData
    postState?: [FeedPostData[], Dispatch<SetStateAction<FeedPostData[]>>]
    onDelete?: () => void
}
