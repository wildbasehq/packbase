import {API_URL} from "@/lib";

export function getAvatar(id: string) {
    return `${API_URL}/user/${id}/avatar`
}