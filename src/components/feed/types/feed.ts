// src/components/feed/types/feed.ts
import {FeedPostData} from './post'

export type FeedViewType = 1 | 2; // 1 = Grid, 2 = List

export interface FeedViewOption {
    id: FeedViewType;
    name: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    unavailable?: boolean;
}

export interface FeedProps {
    packID?: string;
    initialView?: FeedViewType;
}

export interface FeedState {
    posts: FeedPostData[];
    isLoading: boolean;
    hasMore: boolean;
    currentPage: number;
    error: Error | null;
}

export interface FeedHeaderProps {
    onViewChange: () => void;
    postsCount: number;
    hasMore: boolean;
}

export interface FeedViewControlsProps {
    onClose: () => void;
    currentView: FeedViewType;
    onViewChange: (view: FeedViewType) => void;
}

export interface FeedListProps {
    posts: FeedPostData[];
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    onPostDelete: (postId: string) => void;
    viewType: FeedViewType;
}

export interface FeedLoadingProps {
    message?: string | React.ReactNode;
    isMasonry?: boolean;
}

export interface FeedEmptyProps {
    message?: string;
}

export interface FeedMaintenanceProps {
    message?: string;
}

export interface FeedErrorProps {
    error: Error;
}