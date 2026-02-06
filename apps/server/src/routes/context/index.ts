import { YapockType } from '@/index'
import Baozi from '@/lib/events'
import { HTTPError } from '@/lib/http-error'
import { getSelf } from '@/routes/user/me'
import { t } from 'elysia'

/**
 * Context endpoint for SSR injection.
 * Returns Open Graph metadata and user context for the Cloudflare Worker to inject into HTML.
 */
export default (app: YapockType) =>
    app.get(
        '',
        async ({ user, query }) => {
            const path = query.path || '/'

            // Maintenance?
            if (process.env.MAINTENANCE) {
                throw new HTTPError({
                    status: 503,
                    summary: 'Server is in maintenance mode.',
                    maintenance: process.env.MAINTENANCE
                })
            }

            // Trigger OPENGRAPH event for path-specific meta tags
            const ogResult = await Baozi.trigger('OPENGRAPH', { path })
            const og = ogResult?.og || null

            // Build user context if authenticated
            let context: Record<string, unknown> = {}

            if (user) {
                context.user = await getSelf(user)

                // Trigger ADDITIONAL_CONTEXT to allow other modules to enrich
                const enriched = await Baozi.trigger('ADDITIONAL_CONTEXT', {
                    request: null,
                    context
                })

                if (enriched?.context) {
                    context = enriched.context
                }
            }

            return {
                og,
                context
            }
        },
        {
            detail: {
                description: 'Get SSR injection context',
                tags: ['Context']
            },
            query: t.Object({
                path: t.Optional(t.String())
            }),
            response: {
                200: t.Object({
                    og: t.Union([
                        t.Record(t.String(), t.String()),
                        t.Null()
                    ]),
                    context: t.Record(t.String(), t.Any())
                })
            }
        }
    )
