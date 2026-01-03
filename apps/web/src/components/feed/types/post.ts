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
    howling?: 'echo' | 'alongside'
    actor?: UserProfileBasic
    reactions?: Reaction[]
    assets?: Asset[]
    comments?: FeedPostData[]
    classification?: {
        label: string
        rheoAgrees: boolean
        rationale: string
    }
    tags?: string[]
}

export interface FeedPostProps {
    post: FeedPostData
    postState?: [FeedPostData[], Dispatch<SetStateAction<FeedPostData[]>>]
    onDelete?: () => void
}
