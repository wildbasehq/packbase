/**
 * Search API routes
 */

import {YapockType} from '@/index'
import {executeQuery} from '@/lib/search/executor'
import {parseQuery} from '@/lib/search/parser'
import {t} from 'elysia'

const log = require('debug')('vg:search')

const SearchAPI = (app: YapockType) =>
    app.get(
        '',
        async ({query, user, set}) => {
            const timeStart = Date.now()
            try {
                const {q, allowedTables} = query
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
                set.status = 400
                return {
                    error: 'INVALID_QUERY',
                    message: error?.message ?? 'Failed to process search query',
                }
            }
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

export default SearchAPI
