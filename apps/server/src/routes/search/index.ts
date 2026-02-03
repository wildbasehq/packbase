/**
 * Search API routes
 */

import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/http-error'
import {executeQuery} from '@/lib/search/executor'
import {parseQuery} from '@/lib/search/parser'
import {t} from 'elysia'

const log = require('debug')('vg:search')

const SearchEndpoint = (app: YapockType) =>
    app.get(
        '',
        async ({query, user}) => {
            return SearchAPI({query, user})
        },
        {
            query: t.Object({
                q: t.String(),
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                offset: t.Optional(t.String()),
                includeMetadata: t.Optional(t.String()),
                allowedTables: t.Optional(t.Array(t.String())),
            }),
            detail: {
                description: 'Search API using custom query syntax',
                /**
                 * Examples:
                 *  - Basic contains match (case-insensitive):
                 *    [Where posts ("hello")]
                 *
                 *  - Prefix/suffix wildcards and case-sensitive:
                 *    [Where posts:body ("*World":s)]
                 *
                 *  - Date range:
                 *    [Where posts:created_at ("2024-01-01".."2024-12-31")]
                 *
                 *  - Column selection with AS:
                 *    [Where posts ("hello")] AS body
                 *
                 *  - Aggregation:
                 *    COUNT()[Where posts ("hello")]
                 *
                 *  - Variables and reuse:
                 *    $tags = [Where posts:tags ("news")]; [Where posts:tags ($tags->ANY)]
                 */
                tags: ['Search'],
            }
        },
    )

export async function SearchAPI({query, user, howlIDs, offset, user_id}: {
    query: Record<string, any>
    user?: { sub: string; id: string }
    howlIDs?: string[]
    offset?: number
    user_id?: string
}) {
    const timeStart = Date.now()
    try {
        const {q} = query as {
            q: string
            page?: string
            limit?: string
            offset?: string
            includeMetadata?: string
        }

        if (q.startsWith('tags:')) {
            const tags = q.substring(5).split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
            const {hasEvery, hasSome, exclude} = tags.reduce<{ hasEvery: string[]; hasSome: string[]; exclude: string[] }>(
                (acc, tag) => {
                    if (tag.startsWith('~')) acc.hasSome.push(tag.substring(1))
                    else if (tag.startsWith('-')) acc.exclude.push(tag.substring(1))
                    else acc.hasEvery.push(tag)
                    return acc
                },
                {hasEvery: [], hasSome: [], exclude: []}
            )

            // Use prisma to fetch posts with those tags
            const where: any = {}
            if (hasEvery.length) where.tags = {...(where.tags ?? {}), hasEvery}
            if (hasSome.length) where.tags = {...(where.tags ?? {}), hasSome}
            if (exclude.length) where.NOT = {tags: {hasSome: exclude}}

            // user_id filter
            if (user_id) {
                where.user_id = user_id
            }

            // Check howl_ids, if present, make sure they're included regardless of tags
            if (howlIDs && howlIDs.length > 0) {
                where.OR = [
                    {id: {in: howlIDs}}
                ]
            }

            const posts = await prisma.$transaction(async (tx) =>
                tx.posts.findMany({
                    where,
                    include: {
                        user: true
                    },
                    skip: offset || 0,
                    take: 21, // fetch one extra to check for hasMore
                    orderBy: {
                        created_at: 'desc',
                    },
                })
            )

            return {
                results: posts.slice(0, 20),
                total: posts.length,
                has_more: posts.length > 20,
            }
        }

        const parsed = parseQuery(q, user?.sub)
        const {
            variables,
            ...result
        } = await executeQuery(parsed.statements)

        const timeEnd = Date.now() - timeStart

        return {
            ...result,
            variables,
            ms: timeEnd
        }
    } catch (error: any) {
        log(error)
        throw HTTPError.badRequest({
            error: 'INVALID_QUERY',
            summary: error?.message ?? 'Failed to process search query',
        })
    }
}

export default SearchEndpoint
