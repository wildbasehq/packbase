import {YapockType} from '@/index'
import Baozi from '@/lib/events'
import {getSelf} from '@/routes/user/me'
import {getUserPacks} from '@/routes/user/me/packs'
import {t} from 'elysia'

/**
 * Context endpoint for SSR injection.
 * Returns Open Graph metadata and user context for the Cloudflare Worker to inject into HTML.
 */
export default (app: YapockType) =>
    app.get(
        '',
        async ({user, query}) => {
            const path = query.path || '/'

            // Trigger OPENGRAPH event for path-specific meta tags
            const ogResult = await Baozi.trigger('OPENGRAPH', {path})
            const og = ogResult?.og || null

            // Build user context if authenticated
            let context: Record<string, unknown> = {}

            if (user) {
                const selfData = await getSelf(user)
                context.user = selfData

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
