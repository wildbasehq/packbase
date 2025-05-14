// Type definitions for search functionality

export interface SearchResult {
    id: string
    display_name: string
    description: string
    slug: string
    category?: string
    timestamp?: string
    about?: {
        bio?: string
    }
    images?: {
        avatar?: string
        header?: string
    }
    user?: {
        id: string
        username: string
        display_name: string
        space_type: string
        post_privacy: string
        images?: {
            avatar?: string
            header?: string
        }
        about?: {
            bio?: string
        }
    }
    assets?: any[]
    content_type?: string
    body?: string
    created_at?: string
}

export interface SearchApiResponse {
    results: {
        profiles: SearchResult[]
        packs: SearchResult[]
        posts: SearchResult[]
    }
    count: number
    query: string
}

export interface SearchRequestParams {
    query: string
}
