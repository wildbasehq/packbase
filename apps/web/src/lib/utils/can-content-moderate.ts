import {UserProfileBasic} from '@/lib'

export function canContentModerate(user: UserProfileBasic) {
    return user.is_content_moderator
}