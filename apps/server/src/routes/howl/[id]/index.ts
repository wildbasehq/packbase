import {YapockType} from '@/index'
import {deletePost, getPost} from '@/lib/api/post'
import Baozi from '@/lib/events'
import {ErrorTypebox} from '@/lib/http-error'
import {stripHtml} from '@/utils/strip-html'
import {t} from 'elysia'

Baozi.on('OPENGRAPH', async (ctx) => {
    const {path} = ctx
    // Is path `/p/{pack}/{channel}/{howl-uuid}`?
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

            // --- URL & canonical ---
            og['link:canonical'] = canonicalUrl
            og['og:url'] = canonicalUrl

            // --- Discord accent color ---
            og['theme-color'] = '#6d5bff'

            // --- Title (Discord → embed author name) ---
            const displayName = howl.user.display_name || howl.user.username
            const packName = (howl.pack as any)?.display_name
            const title = packName
                ? `${displayName} (@${howl.user.username}) in ${packName}`
                : `${displayName} (@${howl.user.username})`
            og['og:title'] = title
            og['twitter:title'] = title

            // --- Site name (Discord → embed footer text) ---
            og['og:site_name'] = 'Packbase'

            // --- Description ---
            let description = stripHtml(howl.body, 200)

            // Content warning — prepend to description
            if (howl.warning) {
                const reason = (howl.warning as { reason?: string })?.reason
                if (reason) {
                    description = `⚠️ ${reason}${description ? ' — ' + description : ''}`
                }
            }

            if (description) {
                og['og:description'] = description
                og['twitter:description'] = description
            }

            // Author avatar
            if (avatar) {
                og['link:apple-touch-icon'] = avatar
            }
            // Site logo
            og['link:icon'] = 'https://packbase.app/img/logo.png'

            // oEmbed discovery — Discord fetches this for author block
            const oembedUrl = `${process.env.VITE_YAPOCK_URL || 'https://packbase.app'}/howl/${howlId}/oembed`
            og['link:alternate'] = JSON.stringify({
                href: oembedUrl,
                type: 'application/json+oembed',
                title: displayName,
            })

            // --- Video ---
            if (videoAsset?.data?.url) {
                const videoUrl = new URL(videoAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()

                og['og:type'] = 'video.other'

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

                // Video poster/thumbnail
                if (imageAsset?.data?.url) {
                    const thumbUrl = new URL(imageAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()
                    og['og:image'] = thumbUrl
                    og['twitter:image'] = thumbUrl
                } else if (avatar) {
                    og['og:image'] = avatar
                }
            }
            // --- Image (no video) ---
            else if (imageAsset?.data?.url) {
                const imageUrl = new URL(imageAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()

                og['og:type'] = 'article'
                og['og:image'] = imageUrl
                og['og:image:url'] = imageUrl
                if (imageAsset.data.width) og['og:image:width'] = String(imageAsset.data.width)
                if (imageAsset.data.height) og['og:image:height'] = String(imageAsset.data.height)
                if (imageAsset.data.name) og['og:image:alt'] = imageAsset.data.name

                og['twitter:card'] = 'summary_large_image'
                og['twitter:image'] = imageUrl
                if (imageAsset.data.name) og['twitter:image:alt'] = imageAsset.data.name
            }
            // --- Text only ---
            else {
                og['og:type'] = 'article'
                og['twitter:card'] = 'summary'
                if (avatar) {
                    og['og:image'] = avatar
                }
            }

            // --- Article metadata ---
            if (og['og:type'] === 'article') {
                og['og:article:published_time'] = howl.created_at
                og['og:article:author'] = howl.user.username
                if (howl.tags?.length > 0) {
                    og['og:article:tag'] = howl.tags.join(', ')
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
