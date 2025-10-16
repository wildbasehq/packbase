/**
 * Search API routes
 */

import {t} from 'elysia';
import {YapockType} from '@/index';
import {ErrorTypebox} from '@/utils/errors';
import {HTTPError} from '@/lib/HTTPError';
import {search, SearchApiError} from '@/lib/search';
import {getUser} from '@/routes/user/[username]';
import {getPack} from '@/routes/pack/[id]';
import {BulkPostLoader} from '@/lib/BulkPostLoader';
import posthog, {distinctId} from '@/utils/posthog';

const log = require('debug')('vg:search');

/**
 * Search posts by tags
 * @param tags Array of tags to search for
 * @returns Array of posts matching the tags
 */
async function searchTags(tags: string[]): Promise<any[]> {
    return prisma.posts.findMany({
        where: {
            tags: {
                hasEvery: tags,
            },
        },
        orderBy: {
            created_at: 'desc',
        },
    });
}

// Define the search response schema
const SearchResultSchema = t.Object({
    id: t.String(),
    table: t.String(),
    score: t.Optional(t.Number()),
    metadata: t.Optional(t.Record(t.String(), t.Any())),
});

// Define the search error schema
const SearchErrorSchema = t.Object({
    message: t.String(),
    code: t.String(),
    position: t.Optional(
        t.Object({
            line: t.Number(),
            column: t.Number(),
        }),
    ),
    query: t.Optional(t.String()),
});

const SearchAPI = (app: YapockType) =>
    app.get(
        '',
        async ({query, set, user}) => {
            const timeStart = new Date().getTime();
            try {
                // Validate query parameter
                if (!query.q) {
                    return HTTPError.badRequest({
                        summary: 'Missing query parameter',
                        detail: 'The query parameter is required',
                        code: 'missing_query_parameter',
                        position: {
                            line: 1,
                            column: 1,
                        },
                    });
                }

                // Parse limit and offset
                const limit = query.limit ? parseInt(query.limit, 10) : 30;
                const calculateOffset = () => {
                    if (query.offset) {
                        return parseInt(query.offset, 10);
                    }

                    if (query.page && query.page !== '1') {
                        return parseInt(query.page, 10) * limit;
                    }

                    return 0;
                };

                const offset = calculateOffset();

                // Check if query is a tag search
                if (query.q.startsWith('[tag ')) {
                    const tagMatch = query.q.match(/^\[tag (.+)]$/);
                    if (tagMatch) {
                        const tagsString = tagMatch[1];
                        const tags = tagsString.split(',').map(tag => tag.trim());

                        const posts = await searchTags(tags);
                        const postLoader = new BulkPostLoader();
                        const postIds = posts.map(post => post.id);
                        const postsMap = await postLoader.loadPosts(postIds, user?.sub);
                        const trueResults = postIds.map((id) => postsMap[id]).filter((post) => post !== undefined);

                        const requestTime = new Date().getTime() - timeStart;
                        posthog.capture({
                            distinctId,
                            event: 'Viewed Feed',
                            properties: {
                                fetch_time: requestTime,
                                query,
                            },
                        });

                        log(`[${requestTime}ms] ${query.q}`);

                        return {
                            data: {
                                posts: trueResults
                            },
                            count: trueResults.length,
                            query: query.q,
                            pages: Math.ceil(trueResults.length / limit),
                            has_more: trueResults.length > limit,
                        };
                    }
                }

                // Parse allowed tables
                let allowedTables = ['profiles', 'packs', 'posts'];

                if (query.allowedTables) {
                    // Filter the current array as we don't allow anything else except those above
                    allowedTables = allowedTables.filter((table) => query.allowedTables.includes(table));
                }

                // If query doesn't start with [, assume we should search all tables
                if (query.q.charAt(0) !== '[' && query.q.charAt(0) !== '$') {
                    let newQuery = '';
                    allowedTables.forEach((table) => {
                        newQuery += `[Where ${table} ("${query.q}")]`;
                        if (allowedTables.indexOf(table) !== allowedTables.length - 1) {
                            newQuery += ' OR ';
                        } else {
                            newQuery += ' SORT BY created_at DESC';
                        }
                    });

                    query.q = newQuery;
                }
                // Execute the search
                const results = await search(query.q, {
                    limit: limit + 1,
                    offset,
                    // includeMetadata: query.includeMetadata === 'true',
                    // allowedTables
                });

                let trueResults = {
                    profiles: [],
                    packs: [],
                    posts: [],
                };

                // Go through each result and get the respective data.
                for (const result of results) {
                    switch (result.table) {
                        case 'profiles':
                            trueResults.profiles.push(
                                await getUser({
                                    by: 'id',
                                    value: result.id,
                                    scope: 'basic',
                                }),
                            );
                            break;
                        case 'packs':
                            trueResults.packs.push(await getPack(result.id, 'basic'));
                            break;
                    }
                }

                const postIds = results
                    .filter((result) => result.table === 'posts') // Filters only posts
                    .map((result) => result.id); // Gets only the ID field.

                if (postIds.length > 0) {
                    const postLoader = new BulkPostLoader();
                    const postsMap = await postLoader.loadPosts(postIds, user?.sub);
                    trueResults.posts = postIds.map((id) => postsMap[id]).filter((post) => post !== undefined);
                }

                const requestTime = new Date().getTime() - timeStart;
                posthog.capture({
                    distinctId,
                    event: 'Viewed Feed',
                    properties: {
                        fetch_time: requestTime,
                        query,
                    },
                });

                log(`[${requestTime}ms] ${query.q}`);

                // Removes classification from the results
                if (query.allowedTables?.includes('posts')) {
                    trueResults.posts = trueResults.posts.map((post) => {
                        delete post.classification;
                        return post;
                    });
                }

                return {
                    data: query.allowedTables?.length === 1 ? trueResults[query.allowedTables[0]] : trueResults,
                    count: Object.keys(trueResults).reduce((acc, key) => acc + trueResults[key].length, 0),
                    query: query.q,
                    pages: Math.ceil(results.length / limit),
                    has_more: results.length > limit,
                };
            } catch (error) {
                // Handle search errors
                if (error instanceof SearchApiError) {
                    set.status = 400;
                    return {
                        error: {
                            message: error.message,
                            code: error.code,
                            position: error.position,
                            query: query.q,
                        },
                    };
                }

                // Handle other errors
                set.status = 500;
                throw HTTPError.fromError(error);
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
                tags: ['Search'],
            },
            response: {
                200: t.Object({
                    data: t.Any(),
                    count: t.Number(),
                    query: t.String(),
                    pages: t.Optional(t.Number()),
                    has_more: t.Optional(t.Boolean()),
                }),
                400: t.Object({
                    error: SearchErrorSchema,
                }),
                500: ErrorTypebox,
            },
        },
    );

export default SearchAPI;
