import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import {parseQuery} from '@/lib/search/parser'
import {SearchAPI} from '@/routes/search'
import {t} from 'elysia'

export default (app: YapockType) =>
    app
        // Get a folder by id
        .get(
            '',
            async ({user, params, query}) => {
                const {id} = params as { id: string }
                const {page} = query
                const pageNum = page ? parseInt(page) : 1
                const offset = ((pageNum - 1) * 20).toString()

                if (offset > '10000') {
                    throw HTTPError.badRequest({
                        summary: 'Offset too high',
                        detail: 'Offset cannot be higher than 10,000, or the database will cry',
                    })
                }
                const folder = await prisma.folders.findFirst({where: {id}})
                if (!folder) {
                    throw HTTPError.notFound({
                        summary: 'Folder not found',
                    })
                }

                // Is it a valid whskrd request?
                let isWhskrdRequest = false
                try {
                    const parsed = parseQuery(folder.query, user?.sub)
                    isWhskrdRequest = !!parsed
                } catch (_) {
                    // gross
                    isWhskrdRequest = false
                }

                if (isWhskrdRequest) {
                    // Delegate to search API
                    return SearchAPI({
                        query: {
                            q: folder.query,
                        },
                        user,
                    })
                } else {
                    // Assume tags
                    // @todo tag search in whskrd is broken. replace when fixed
                    // const parsed = `[Where posts:tags (${tags.map(tag => `"${tag}"`).join(', ')})]`
                    return SearchAPI({
                        query: {
                            q: `tags: ${folder.query}`
                        },
                        user,
                        offset: parseInt(offset),
                        howlIDs: folder.howl_ids
                    })
                }
            },
            {
                query: t.Object({
                    page: t.Optional(t.String())
                }),
                detail: {
                    description: 'Query a folder by id',
                    tags: ['Folders'],
                },
            }
        )