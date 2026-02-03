import {YapockType} from '@/index'
import {HTTPError} from '@/lib/http-error'
import getClerkAvatar from '@/utils/get-clerk-avatar'
import {fetch} from 'bun'

export default (app: YapockType) =>
    app.get(
        '',
        async ({params}) => {
            let userID = params.username

            const user = await prisma.profiles.findFirst({
                where: {
                    OR: [{id: userID}, {username: userID}]
                },
                select: {owner_id: true}
            })

            if (!user) {
                throw HTTPError.notFound({summary: 'User not found.'})
            }

            const avatarUrl = await getClerkAvatar(user.owner_id)

            if (!avatarUrl) {
                throw HTTPError.notFound({summary: 'User has no avatar.'})
            }

            return await fetch(avatarUrl)
        })
