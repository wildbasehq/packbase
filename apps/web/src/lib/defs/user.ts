export interface UserProfileBasic {
    id: string
    username: string
    display_name: string
    slug: string
    about?: {
        bio?: string
    }
    images?: {
        avatar?: string
        header?: string
    }
    badge?: string
    xp?: number
    type?: '1' | '2'
    is_content_moderator?: boolean
    is_staff?: boolean
}
