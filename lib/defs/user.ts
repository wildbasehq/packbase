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
}