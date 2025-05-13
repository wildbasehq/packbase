// Type definitions for search functionality

export interface SearchResult {
    id: string
    title: string
    description: string
    url: string
    category?: string
    timestamp?: string
    user?: {
        id: string
        username: string
        slug: string
        display_name: string
        space_type: string
        post_privacy: string
    }
    assets?: any[]
    content_type?: string
    body?: string
    created_at?: string

    // user only possible
    username?: string
    slug?: string
    display_name?: string
    space_type?: string
    post_privacy?: string
    avatar?: string
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
