import {YapockType} from '@/index'
import {FeedController} from '@/lib/FeedController'
import {HTTPError} from '@/lib/HTTPError'
import {HowlResponse} from '@/models/defs'
import requiresAccount from '@/utils/identity/requires-account'
import requiresToken from '@/utils/identity/requires-token'
import {t} from 'elysia'

// Initialize a shared instance of controllers
const feedController = new FeedController()

export default (app: YapockType) =>
    app.get(
        '',
        async ({set, params: {id}, query: {page = 1}, user}) => {
            // Check for maintenance mode
            if (process.env.MAINTENANCE) {
                set.status = 503
                return {
                    error: 'Service Unavailable',
                    message: 'The service is currently undergoing maintenance. Please try again later.',
                }
            }

            await requiresAccount({set, user})

            try {
                // Special handling for home feed - requires authentication
                if (id === 'universe:home') {
                    await requiresToken({set, user})
                }

                // Get feed data
                return await feedController.getFeed(id, user?.sub, Number(page))
            } catch (error) {
                // Handle errors
                const httpError = error instanceof HTTPError ? error : HTTPError.fromError(error, 'Error fetching feed')

                set.status = httpError.status
                return httpError.toJSON()
            }
        },
        {
            detail: {
                description: 'Get a list of posts',
                tags: ['Feed'],
            },
            params: t.Object({
                id: t.String(),
            }),
            query: t.Optional(
                t.Object({
                    page: t.Optional(t.Number()),
                }),
            ),
            response: {
                200: t.Object({
                    data: t.Array(HowlResponse),
                    has_more: t.Boolean(),
                }),
                404: t.Null(),
                422: t.Object(
                    {},
                    {
                        additionalProperties: t.Any(),
                    },
                ),
                503: t.Optional(
                    t.Object({
                        error: t.String(),
                        message: t.String(),
                    }),
                ),
            },
        },
    );
