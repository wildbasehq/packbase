import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import {t} from 'elysia'
import {XMLParser} from 'fast-xml-parser'

type NewsItem = {
    href: string;
    title: string;
    summary: string;
    image: string;
    created_at: string;
};

const FEED_URL = 'https://work.wildbase.xyz/phame/blog/feed/1/'

function findImgSrc(node: any): string {
    if (!node) return ''
    if (Array.isArray(node)) {
        for (const child of node) {
            const r = findImgSrc(child)
            if (r) return r
        }
        return ''
    }
    if (typeof node === 'object') {
        if (node.img) {
            const imgs = Array.isArray(node.img) ? node.img : [node.img]
            for (const img of imgs) {
                if (img && typeof img === 'object') {
                    const src = img.src || img['@_src']
                    if (typeof src === 'string' && src) return src
                }
            }
        }
        for (const key of Object.keys(node)) {
            const r = findImgSrc((node as any)[key])
            if (r) return r
        }
    }
    return ''
}

function findAnchorImage(node: any): string {
    if (!node) return ''
    if (Array.isArray(node)) {
        for (const child of node) {
            const r = findAnchorImage(child)
            if (r) return r
        }
        return ''
    }
    if (typeof node === 'object') {
        if (node.a) {
            const anchors = Array.isArray(node.a) ? node.a : [node.a]
            for (const a of anchors) {
                const cls = (a && (a.class || a.className)) as string | undefined
                if (cls && cls.includes('phabricator-remarkup-embed-image')) {
                    const fromImg = findImgSrc(a)
                    if (fromImg) return fromImg
                }
                const deeper = findAnchorImage(a)
                if (deeper) return deeper
            }
        }
        for (const key of Object.keys(node)) {
            const r = findAnchorImage((node as any)[key])
            if (r) return r
        }
    }
    return ''
}

function extractFirstEmbeddedImage(content: unknown): string {
    try {
        if (typeof content === 'string') {
            const anchorPattern = /<a\s+[^>]*class=["'][^"']*phabricator-remarkup-embed-image[^"']*["'][^>]*>([\s\S]*?)<\/a>/i
            const anchorMatch = content.match(anchorPattern)
            if (!anchorMatch) return ''
            const inner = anchorMatch[1]
            const imgPattern = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i
            const imgMatch = inner.match(imgPattern)
            return imgMatch ? imgMatch[1] : ''
        }
        if (content && typeof content === 'object') {
            return findAnchorImage(content)
        }
        return ''
    } catch (_) {
        return ''
    }
}

async function fetchFeed(): Promise<NewsItem[]> {
    const res = await fetch(FEED_URL, {
        headers: {
            'User-Agent': 'PackbaseServer/1.0 (+news)',
        },
    })
    if (!res.ok) {
        throw HTTPError.serverError({summary: `Failed to fetch feed (${res.status})`})
    }
    const xml = await res.text()

    const parser = new XMLParser({ignoreAttributes: false, attributeNamePrefix: ''})
    const data = parser.parse(xml)

    // sometimes entry is a single object, not an array
    if (data?.feed?.entry && !Array.isArray(data.feed.entry)) {
        data.feed.entry = [data.feed.entry]
    }

    const items = data?.feed?.entry || []

    return await Promise.all(
        items.map(async (it): Promise<NewsItem> => {
            const link = it.link
            let href = ''
            if (Array.isArray(link)) {
                const alt = link.find((l: any) => l && (l.rel === 'alternate' || l.href))
                href = (alt?.href || '').toString()
            } else if (link && typeof link === 'object' && link.href) {
                href = link.href.toString()
            } else if (typeof link === 'string') {
                href = link.toString()
            } else if (it.guid) {
                href = (typeof it.guid === 'object' ? it.guid['#text'] : it.guid)?.toString() || ''
            }

            const title = (it.title?.['#text'] || it.title || '').toString()
            const summary = (it.summary?.['#text'] || it.summary || it.subtitle || it.description || '').toString()
            const content = it['content:encoded'] ?? it.content ?? it.description ?? ''
            const imageURL = extractFirstEmbeddedImage(content)
            // Fetch image from imageURL
            const image =
                imageURL && imageURL.startsWith('https://prox.packbase.app/')
                    ? 'data:image/png;base64,' +
                    (await fetch(imageURL)
                        .then((res) => res.arrayBuffer())
                        .then((buffer) => Buffer.from(buffer).toString('base64')))
                    : ''
            const createdAt = (it.updated?.['#text'] || it.updated || it.published?.['#text'] || it.published || '').toString()

            return {href, title, summary, image, created_at: createdAt}
        }),
    )
}

export default (app: YapockType) =>
    app.get(
        '',
        async ({set, query: {onlyRecent = false}}) => {
            try {
                const items = await fetchFeed()

                // If onlyRecent is true, return only the most recent 4 items by 30 days
                if (onlyRecent === 'true') {
                    return items.filter((item) => new Date(item.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).slice(0, 4)
                }
                return items
            } catch (e: any) {
                set.status = 500
                throw HTTPError.serverError({summary: 'Error fetching news', cause: e})
            }
        },
        {
            detail: {
                description: 'Fetch Packbase news feed and normalize entries',
                tags: ['News'],
            },
            response: t.Array(
                t.Object({
                    href: t.String(),
                    title: t.String(),
                    summary: t.String(),
                    image: t.String(),
                    created_at: t.String(),
                }),
            ),
            query: t.Object({
                onlyRecent: t.Optional(t.String()),
            }),
        },
    );
