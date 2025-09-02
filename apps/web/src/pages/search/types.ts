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
    data: {
        profiles: SearchResult[]
        packs: SearchResult[]
        posts: SearchResult[]
    }
    count: number
    query: string
}

// Raw API response that can be either object or array
export interface RawSearchApiResponse {
    data: {
        profiles: SearchResult[]
        packs: SearchResult[]
        posts: SearchResult[]
    } | SearchResult[] // Can be an array when there's only one allowed table
    count: number
    query: string
}

export interface SearchRequestParams {
    query: string
}
