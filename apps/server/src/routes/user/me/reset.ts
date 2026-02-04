import {YapockType} from '@/index'
import {HTTPError} from '@/lib/http-error'
import requiresToken from '@/utils/identity/requires-token'

export default (app: YapockType) =>
    app.post(
        '',
        async ({user}) => {
            // Ensure the request is authenticated / authorized
            requiresToken(user)

            const userId = user.sub as string

            const hasPostsInUniverse = await prisma.posts.findFirst({
                where: {
                    user_id: userId,
                    tenant_id: '00000000-0000-0000-0000-000000000000'
                }
            })

            if (!hasPostsInUniverse) throw HTTPError.forbidden({summary: 'No howls in Universe.'})

            await prisma.$transaction(async (tx) => {
                // 1. Find all posts authored by this user in Universe
                const userPosts = await tx.posts.findMany({
                    where: {user_id: userId, tenant_id: '00000000-0000-0000-0000-000000000000'},
                    select: {id: true},
                })

                const userPostIds = userPosts.map((p) => p.id)

                if (userPostIds.length === 0) return

                // 2. Delete:
                //    - all posts authored by this user
                //    - any "howling_alongside" replies whose parent is one of the user's posts
                await tx.posts.deleteMany({
                    where: {
                        OR: [
                            {
                                id: {in: userPostIds},
                            },
                            {
                                content_type: 'howling_alongside',
                                parent: {in: userPostIds},
                            },
                        ],
                    },
                })
            })

            return
        },
    );