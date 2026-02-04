import clerkClient from '@/db/auth'
import {YapockType} from '@/index'
import requiresAccount from '@/utils/identity/requires-account'
import {t} from 'elysia'

async function getUserFriends(user) {
    // Raw SQL query for optimal performance; using prisma on a large dataset is pretty slow
    let friends = (await prisma.$queryRaw`
        SELECT DISTINCT p.id,
                        p.username,
                        p.display_name,
                        p.owner_id,
                        p.last_online,
                        COALESCE(p.last_online, '1970-01-01') AS last_online_sort,
                        p.display_name                        AS display_name_sort
        FROM profiles p
                 INNER JOIN "profiles.followers" f1 ON p.id = f1.following_id
                 INNER JOIN "profiles.followers" f2 ON p.id = f2.user_id
        WHERE f1.user_id = ${user.sub}::uuid
                    AND f2.following_id = ${user.sub}::uuid
        ORDER BY last_online_sort DESC, display_name_sort
            LIMIT 100
    `) as Array<{
        id: string;
        username: string;
        display_name: string | null;
        images_avatar: string | null;
        owner_id: string;
        bio: string | null;
        last_online: Date | null;
    }>

    // Add avatar URLs
    friends = await Promise.all(
        friends.map(async (friend) => {
            const clerkUser = await clerkClient.users.getUser(friend.owner_id)
            const isOnline = friend.last_online && Date.now() - new Date(friend.last_online).getTime() < 5 * 60 * 1000

            let user: typeof friend & {
                online?: boolean;
                status?: string;
            } = friend
            user.images_avatar = `${process.env.HOSTNAME}/user/${friend.id}/avatar`
            if (clerkUser.username) user.username = clerkUser.username

            if (isOnline) {
                user.online = true
            } else if (friend.last_online) {
                const timeDiff = Date.now() - new Date(friend.last_online).getTime()
                const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))

                if (hoursAgo < 24) {
                    if (hoursAgo === 0) {
                        const minutesAgo = Math.floor(timeDiff / (1000 * 60))
                        user.status = `seen ${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
                    } else {
                        user.status = `seen ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
                    }
                }
            }
            return user
        }),
    )

    return {
        count: friends.length,
        ...(friends.length >= 100 && {
            message: 'W_TOO_MANY: You\'ve hit the 100-friend limit. Please use the search endpoint to find friends.',
        }),
        friends,
    }
}

export default (app: YapockType) =>
    app.get(
        '',
        async ({user}) => {
            await requiresAccount(user)
            return await getUserFriends(user)
        },
        {
            detail: {
                description: 'Gets the current user\'s friends (following each other)',
                tags: ['Friends'],
            },
            response: {
                200: t.Object({
                    message: t.Optional(t.String()),
                    count: t.Number(),
                    friends: t.Array(
                        t.Object({
                            id: t.String(),
                            username: t.String(),
                            display_name: t.Optional(t.String()),
                            images_avatar: t.Optional(t.String()),
                            online: t.Optional(t.Boolean()),
                            status: t.Optional(t.String()),
                        }),
                    ),
                }),
            },
        },
    );
