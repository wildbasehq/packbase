import clerkClient from '@/db/auth'

export default async function getClerkAvatar(clerkID: string): Promise<string> {
    const clerkUser = await clerkClient.users.getUser(clerkID)

    if (!clerkUser) {
        return null
    }

    if (clerkUser?.imageUrl) return clerkUser.imageUrl
}