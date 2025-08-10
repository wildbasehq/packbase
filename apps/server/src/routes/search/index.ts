/**
 * Search API routes
 */

import {t} from 'elysia'
import {YapockType} from '@/index'
import {ErrorTypebox} from '@/utils/errors'
import {HTTPError} from '@/lib/class/HTTPError'
import {search, SearchApiError, SearchResult} from '@/lib/class/search'
import {getUser} from '@/routes/user/[username]'
import {getPack} from '@/routes/pack/[id]'
import {getPost} from '@/lib/api/post'
import {BulkPostLoader} from '@/lib/class/BulkPostLoader'
import posthog, {distinctId} from '@/utils/posthog'

const log = require('debug')('vg:search')
// Define the search response schema
const SearchResultSchema = t.Object({
    id: t.String(),
    table: t.String(),
    score: t.Optional(t.Number()),
    metadata: t.Optional(t.Record(t.String(), t.Any()))
})

// Define the search error schema
const SearchErrorSchema = t.Object({
    message: t.String(),
    code: t.String(),
    position: t.Optional(t.Object({
        line: t.Number(),
        column: t.Number()
    })),
    query: t.Optional(t.String())
})

export default (app: YapockType) => app
    .get('', async ({query, set}) => {
        const timeStart = new Date().getTime()
        try {
            // Validate query parameter
            if (!query.q) {
                return HTTPError.badRequest({
                    summary: 'Missing query parameter',
                    detail: 'The query parameter is required',
                    code: 'missing_query_parameter',
                    position: {
                        line: 1,
                        column: 1
                    }
                })
            }

            // Parse limit and offset
            const limit = query.limit ? parseInt(query.limit, 10) : 30
            const offset = query.offset ? parseInt(query.offset, 10) : undefined

            // Parse allowed tables
            let allowedTables = ['profiles', 'packs', 'posts']

            if (query.allowedTables) {
                // Filter the current array as we don't allow anything else except those above
                allowedTables = allowedTables.filter(table => query.allowedTables.includes(table))
            }

            // If query doesn't start with [, assume we should search all tables
            if (query.q.charAt(0) !== '[' && query.q.charAt(0) !== '$') {
                let newQuery = ''
                allowedTables.forEach(table => {
                    newQuery += `[Where ${table} ("${query.q}")]`
                    if (allowedTables.indexOf(table) !== allowedTables.length - 1) {
                        newQuery += ' OR '
                    } else {
                        newQuery += ' SORT BY created_at DESC'
                    }
                })

                query.q = newQuery
            }
            // Execute the search
            const results = await search(query.q, {
                limit,
                offset,
                // includeMetadata: query.includeMetadata === 'true',
                // allowedTables
            })

            let trueResults = {
                profiles: [],
                packs: [],
                posts: []
            }

            // Go through each result and get the respective data.
            for (const result of results) {
                switch (result.table) {
                    case 'profiles':
                        trueResults.profiles.push(await getUser({
                            by: 'id',
                            value: result.id,
                            scope: 'basic'
                        }))
                        break
                    case 'packs':
                        trueResults.packs.push(await getPack(result.id, 'basic'))
                        break
                }
            }

            const postIds = results
                .filter(result => result.table === 'posts') // Filters only posts
                .map(result => result.id) // Gets only the ID field.

            if (postIds.length > 0) {
                const postLoader = new BulkPostLoader()
                const postsMap = await postLoader.loadPosts(postIds)
                trueResults.posts = postIds
                    .map(id => postsMap[id])
                    .filter(post => post !== undefined)
            }

            const requestTime = new Date().getTime() - timeStart
            posthog.capture({
                distinctId,
                event: 'Viewed Feed',
                properties: {
                    fetch_time: requestTime,
                    query,
                }
            })

            log(`[${requestTime}ms] ${query.q}`)

            return {
                data: query.allowedTables.length === 1 ? trueResults[query.allowedTables[0]] : trueResults,
                count: Object.keys(trueResults).reduce((acc, key) => acc + trueResults[key].length, 0),
                query: query.q
            }
        } catch (error) {
            // Handle search errors
            if (error instanceof SearchApiError) {
                set.status = 400
                return {
                    error: {
                        message: error.message,
                        code: error.code,
                        position: error.position,
                        query: query.q
                    }
                }
            }

            // Handle other errors
            set.status = 500
            throw HTTPError.fromError(error)
        }
    }, {
        query: t.Object({
            q: t.String(),
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
            includeMetadata: t.Optional(t.String()),
            allowedTables: t.Optional(t.Array(t.String()))
        }),
        detail: {
            description: 'Search API using custom query syntax',
            tags: ['Search'],
        },
        response: {
            200: t.Object({
                data: t.Any(),
                count: t.Number(),
                query: t.String()
            }),
            400: t.Object({
                error: SearchErrorSchema
            }),
            500: ErrorTypebox
        }
    })
