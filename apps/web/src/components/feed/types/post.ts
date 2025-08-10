// src/components/feed/types.ts
import {UserProfileBasic} from '@/lib/defs/user'

export interface Asset {
    type: 'image' | 'video';
    data: {
        url: string;
        name?: string;
        width?: number;
        height?: number;
    };
}

export interface FeedPostData {
    id: string;
    user: UserProfileBasic;
    body: string;
    created_at: string;
    pack?: {
        id: string;
        slug: string;
        display_name: string;
        images?: {
            avatar?: string;
        };
    };
    howling?: 'echo' | 'alongside';
    actor?: UserProfileBasic;
    reactions?: Record<string, string[]>;
    assets?: Asset[];
    comments?: FeedPostData[];
}

export interface FeedPostProps {
    post: FeedPostData;
    postState?: [FeedPostData[], React.Dispatch<React.SetStateAction<FeedPostData[]>>];
    onDelete?: () => void;
}