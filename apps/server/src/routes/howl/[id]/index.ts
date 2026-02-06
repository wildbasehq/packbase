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

            const assets = howl.assets as { type: string; data: { url: string; name?: string; width?: number; height?: number } }[]
            const imageAsset = assets?.find(a => a.type === 'image')
            const videoAsset = assets?.find(a => a.type === 'video')
            const avatar = howl.user.images?.avatar
            const canonicalUrl = `https://packbase.app${path}`

            // --- OpenGraph core ---
            og['og:type'] = videoAsset ? 'video.other' : 'article'
            og['og:url'] = canonicalUrl

            // Title — "Display Name (@username) in Pack Name"
            const displayName = howl.user.display_name || howl.user.username
            const packName = (howl.pack as any)?.display_name
            const title = packName
                ? `${displayName} (@${howl.user.username}) in ${packName}`
                : `${displayName} (@${howl.user.username})`
            og['og:site_name'] = title

            // Description — strip HTML, truncate
            let description = ''
            if (howl.body) {
                const stripped = howl.body
                    .replace(/<[^>]*>/g, '')   // strip HTML tags
                    .replace(/&[^;]+;/g, ' ')  // strip HTML entities
                    .replace(/\s+/g, ' ')      // collapse whitespace
                    .trim()
                description = stripped.length > 200
                    ? stripped.slice(0, 197) + '...'
                    : stripped
                og['og:description'] = description
            }

            // Content warning — prepend to description
            if (howl.warning) {
                const reason = (howl.warning as { reason?: string })?.reason
                if (reason) {
                    description = `⚠️ ${reason}${description ? ' — ' + description : ''}`
                    og['og:description'] = description
                }
            }

            // --- Video ---
            if (videoAsset?.data?.url) {
                const videoUrl = new URL(videoAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()

                // OpenGraph video tags
                og['og:video'] = videoUrl
                og['og:video:url'] = videoUrl
                og['og:video:secure_url'] = videoUrl
                og['og:video:type'] = 'video/mp4'
                if (videoAsset.data.width) og['og:video:width'] = String(videoAsset.data.width)
                if (videoAsset.data.height) og['og:video:height'] = String(videoAsset.data.height)

                // Twitter player card — Discord uses this for inline video playback
                og['twitter:card'] = 'player'
                og['twitter:player'] = videoUrl
                if (videoAsset.data.width) og['twitter:player:width'] = String(videoAsset.data.width)
                if (videoAsset.data.height) og['twitter:player:height'] = String(videoAsset.data.height)
                og['twitter:player:stream'] = videoUrl
                og['twitter:player:stream:content_type'] = 'video/mp4'
            }

            // --- Image ---
            if (imageAsset?.data?.url) {
                const imageUrl = new URL(imageAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()
                og['og:image'] = imageUrl
                og['og:image:url'] = imageUrl
                if (imageAsset.data.width) og['og:image:width'] = String(imageAsset.data.width)
                if (imageAsset.data.height) og['og:image:height'] = String(imageAsset.data.height)
                if (imageAsset.data.name) og['og:image:alt'] = imageAsset.data.name

                og['twitter:image'] = imageUrl
                if (imageAsset.data.name) og['twitter:image:alt'] = imageAsset.data.name

                if (!og['twitter:card']) {
                    og['twitter:card'] = 'summary_large_image'
                }
            }

            // Author avatar — always set as twitter:image so Discord
            // shows it as the small thumbnail beside the embed text,
            // even when a video or image asset is the main media.
            if (avatar) {
                og['twitter:image'] = avatar
                if (!og['og:image']) og['og:image'] = avatar
                if (!og['twitter:card']) og['twitter:card'] = 'summary'
                og['link:apple-touch-icon'] = avatar
            }

            // --- Twitter explicit tags (Discord reads these directly) ---
            og['twitter:site'] = 'Packbase'
            og['twitter:title'] = title
            if (description) og['twitter:description'] = description

            // --- Article metadata ---
            if (!videoAsset) {
                og['og:article:published_time'] = howl.created_at
                og['og:article:author'] = howl.user.username
            }
            if (howl.tags?.length > 0) {
                og['og:article:tag'] = howl.tags.join(', ')
            }

            // --- Discord accent color ---
            og['theme-color'] = '#6d5bff'

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
