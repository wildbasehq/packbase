import {YapockType} from '@/index'
import {deletePost, getPost} from '@/lib/api/post'
import Baozi from '@/lib/events'
import {ErrorTypebox} from '@/lib/http-error'
import {t} from 'elysia'

Baozi.on('OPENGRAPH', async (ctx) => {
    const {path} = ctx
    // Is path `/p/{pack}/{channel}/{howl-uuid}?
    const match = path.match(/^\/p\/([^\/]+)\/([^\/]+)\/([^\/]+)$/)
    if (match) {
        const [, , , howlId] = match

        let howl: Awaited<ReturnType<typeof getPost>>
        try {
            howl = await getPost(howlId)
        } catch {
            return ctx
        }

        if (howl) {
            const og: Record<string, string> = {}

            // Type
            og['og:type'] = 'article'
            og['og:site_name'] = 'Packbase'

            // URL
            og['og:url'] = `https://packbase.app${path}`

            // Title — "Display Name (@username) in Pack Name"
            const displayName = howl.user.display_name || howl.user.username
            const packName = (howl.pack as any)?.display_name
            og['og:title'] = packName
                ? `${displayName} (@${howl.user.username}) in ${packName}`
                : `${displayName} (@${howl.user.username})`

            // Description — strip HTML, truncate
            if (howl.body) {
                const stripped = howl.body
                    .replace(/<[^>]*>/g, '')   // strip HTML tags
                    .replace(/&[^;]+;/g, ' ')  // strip HTML entities
                    .replace(/\s+/g, ' ')      // collapse whitespace
                    .trim()
                og['og:description'] = stripped.length > 200
                    ? stripped.slice(0, 197) + '...'
                    : stripped
            }

            // Image — first image asset, fall back to author avatar
            const assets = howl.assets as { type: string; data: { url: string; name?: string } }[]
            const imageAsset = assets?.find(a => a.type === 'image')
            const videoAsset = assets?.find(a => a.type === 'video')
            const avatar = howl.user.images?.avatar

            if (imageAsset?.data?.url) {
                og['og:image'] = new URL(imageAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()
                if (imageAsset.data.name) {
                    og['og:image:alt'] = imageAsset.data.name
                }
                og['twitter:card'] = 'summary_large_image'
            }

            if (avatar) {
                if (!og['og:image']) {
                    og['og:image'] = avatar
                }
                if (!og['twitter:card']) {
                    og['twitter:card'] = 'summary'
                }
                og['twitter:image'] = avatar
            }

            // Video
            if (videoAsset?.data?.url) {
                og['og:video'] = new URL(videoAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()
                og['og:video:type'] = 'video/mp4'
            }

            // Article metadata
            og['og:article:published_time'] = howl.created_at
            og['og:article:author'] = howl.user.username
            if (howl.tags?.length > 0) {
                og['og:article:tag'] = howl.tags.join(', ')
            }

            // Content warning — prepend to description
            if (howl.warning) {
                const reason = (howl.warning as { reason?: string })?.reason
                if (reason) {
                    og['og:description'] = `⚠️ ${reason}${og['og:description'] ? ' — ' + og['og:description'] : ''}`
                }
            }

            return {path, og}
        }
    }

    return ctx
})

export default (app: YapockType) =>
    app
        // @ts-ignore - Not sure what's going on here
        .get(
            '',
            async ({params, set}) => {
                const {id} = params
                const post = await getPost(id)
                if (!post) {
                    set.status = 400
                    return
                }

                return post
            },
            {
                detail: {
                    description: 'Get a specific post',
                    tags: ['Howl'],
                },
                params: t.Object({
                    id: t.String({
                        description: 'Howl ID',
                    }),
                }),
                response: {
                    404: t.Null(),
                },
            },
        )
        // @ts-ignore - Not sure what's going on here
        .delete('', deletePost, {
            detail: {
                description: 'Remove a howl',
                tags: ['Howl'],
            },
            params: t.Object({
                id: t.String({
                    description: 'Howl ID',
                }),
            }),
            response: {
                204: t.Void(),
                404: t.Any(),
                403: ErrorTypebox,
                400: ErrorTypebox,
            },
        });
