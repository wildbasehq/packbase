import clerkClient from '@/db/auth'

// const clerkAvatarCache = new Map<string, string>()
export default async function getClerkAvatar(clerkID: string): Promise<string> {
    // if (clerkAvatarCache.has(clerkID)) {
    //     return clerkAvatarCache.get(clerkID)
    // }

    const clerkUser = await clerkClient.users.getUser(clerkID)

    if (!clerkUser) {
        return null
    }

    if (clerkUser?.imageUrl) {
        // clerkAvatarCache.set(clerkID, clerkUser.imageUrl)
        return clerkUser.imageUrl
    }

    return null
}