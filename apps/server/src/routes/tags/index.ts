import {t} from 'elysia'
import {YapockType} from '@/index'

export default (app: YapockType) => app
    .get('', async () => {
        const tags = await prisma.posts_statistics.findFirst({
            where: {
                type: 'tags'
            }
        })

        return [
            // Alphabetical order
            ...(tags?.tags ?? []).toSorted((a: string, b: string) => a.localeCompare(b))
        ]
    }, {
        detail: {
            description: 'Gets all known tags.',
            tags: ['Server']
        },
        response: {
            200: t.Array(t.String())
        }
    })
