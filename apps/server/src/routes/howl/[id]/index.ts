import {YapockType} from '@/index'
import {deletePost, getPost} from '@/lib/api/post'
import Baozi from '@/lib/events'
import {ErrorTypebox} from '@/lib/http-error'
import {stripHtml} from '@/utils/strip-html'
import {t} from 'elysia'

/**
 * HOW THE FUCK DOES DISCORD GET AVATAR.ICON_URL?
 * 
 * WHY do they refuse to document how they unfurl their embeds?
 * It's clearly not fucking standard.
 */
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
            const displayName = howl.user.display_name || howl.user.username
            const canonicalUrl = `https://packbase.app${path}`

            // --- Always present ---
            og['og:url'] = canonicalUrl
            og['og:site_name'] = 'Packbase'
            og['og:type'] = 'website'
            og['theme-color'] = '#6d5bff'

            // --- Description ---
            let description = stripHtml(howl.body, 200)
            if (howl.warning) {
                const reason = (howl.warning as { reason?: string })?.reason
                if (reason) {
                    description = `⚠️ ${reason}${description ? ' — ' + description : ''}`
                }
            }
            if (description) {
                og['og:description'] = description
            }

            // --- Site icon (Discord uses favicon as embed author icon) ---
            if (avatar) {
                og['link:icon'] = avatar
            }

            // --- oEmbed discovery ---
            const oembedUrl = `${process.env.VITE_YAPOCK_URL || 'https://packbase.app'}/howl/${howlId}/oembed`
            og['link:alternate'] = JSON.stringify({
                href: oembedUrl,
                type: 'application/json+oembed',
                title: displayName,
            })

            // --- Video (takes priority over images) ---
            if (videoAsset?.data?.url) {
                const videoUrl = new URL(videoAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()
                og['og:video'] = videoUrl
                og['og:video:type'] = 'video/mp4'
                if (videoAsset.data.width) og['og:video:width'] = String(videoAsset.data.width)
                if (videoAsset.data.height) og['og:video:height'] = String(videoAsset.data.height)

                if (imageAsset?.data?.url) {
                    og['og:image'] = new URL(imageAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()
                } else if (avatar) {
                    og['og:image'] = avatar
                }

                og['twitter:card'] = 'player'
            }
            // --- Image (no video) ---
            else if (imageAsset?.data?.url) {
                const imageUrl = new URL(imageAsset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString()
                og['og:image'] = imageUrl
                if (imageAsset.data.width) og['og:image:width'] = String(imageAsset.data.width)
                if (imageAsset.data.height) og['og:image:height'] = String(imageAsset.data.height)
                og['twitter:card'] = 'summary_large_image'
            }
            // --- Text only ---
            else {
                if (avatar) {
                    og['og:image'] = avatar
                }
                og['twitter:card'] = 'summary'
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
