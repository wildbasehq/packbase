import {YapockType} from '@/index'
import Baozi from '@/lib/events'
import {HTTPError} from '@/lib/http-error'
import {getSelf} from '@/routes/user/me'

/** Hop-by-hop headers that should not be forwarded (RFC 2616 §13.5.1) */
const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade'
])

/** Headers to skip only on requests */
const REQUEST_SKIP_HEADERS = new Set([...HOP_BY_HOP_HEADERS, 'host'])

/** Filters headers, excluding hop-by-hop headers */
function filterHeaders(headers: Headers, skipSet: Set<string>): Headers {
    const filtered = new Headers()
    for (const [key, value] of headers) {
        if (!skipSet.has(key.toLowerCase())) {
            filtered.set(key, value)
        }
    }

    return filtered
}

/** Normalizes and validates a path to prevent SSRF attacks */
function sanitizePath(path: string | undefined, baseUrl: URL): URL {
    let requestedPath = path ?? '/'

    // Disallow absolute URLs or values that look like they start with a scheme
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(requestedPath)) {
        requestedPath = '/'
    }

    // Ensure leading slash so it is treated as a path on the base origin
    if (!requestedPath.startsWith('/')) {
        requestedPath = '/' + requestedPath
    }

    const resolvedUrl = new URL(requestedPath, baseUrl)

    // Enforce same-origin
    if (resolvedUrl.origin !== baseUrl.origin) {
        return new URL('/', baseUrl)
    }

    return resolvedUrl
}

/** Generates Open Graph meta tags HTML */
function generateOgMetaTags(og: Record<string, string>): string {
    return Object.entries(og)
        .map(([key, value]) => {
            const property = Bun.escapeHTML(`og:${key}`)
            const content = Bun.escapeHTML(value)
            return `    <meta property="${property}" content="${content}" />`
        })
        .join('\n')
}

/**
 * User front-end proxy. Fetches Packbase from some other URL, injects meta og, then serves it.
 */
export default (app: YapockType) =>
    app
        .get('/*', async ({user, path, request}) => {
            const baseUrlEnv = process.env.PACKBASE_FRONTEND_URL
            if (!baseUrlEnv) throw HTTPError.serverError({
                summary: 'SSR Proxy is unavailable. API is online.'
            })

            let response: Response
            try {
                const baseUrl = new URL(baseUrlEnv)
                const finalUrl = sanitizePath(path, baseUrl)
                response = await fetch(finalUrl.toString(), {
                    headers: filterHeaders(request.headers, REQUEST_SKIP_HEADERS)
                })
            } catch (error) {
                console.error('Error proxying Packbase frontend request', {
                    error,
                    path,
                    baseUrlEnv
                })
                let errorHTML: string
                try {
                    errorHTML = await Bun.file(new URL('../_ui-error.html', import.meta.url)).text()
                } catch (fileError) {
                    console.error('Failed to load UI error page HTML', {fileError})
                    errorHTML =
                        '<!doctype html><html><head><meta charset="utf-8"><title>Service error</title></head><body><h1>Something went wrong</h1><p>We were unable to load the error page. Please try again later.</p></body></html>'
                }
                return new Response(errorHTML, {
                    headers: {'Content-Type': 'text/html; charset=utf-8'}
                })
            }

            const contentType = response.headers.get('content-type')

            let body: string | ReadableStream<string> = response.body

            if (contentType?.includes('text/html')) {
                // For HTML, process and inject meta tags
                body = await response.text()

                const meta = await Baozi.trigger('OPENGRAPH', {path})

                if (meta?.og) {
                    const metaTags = generateOgMetaTags(meta.og)
                    body = body.replace('</head>', `${metaTags}\n  </head>`)
                }

                const contextualJSON = await Baozi.trigger('ADDITIONAL_CONTEXT', {
                    request,
                    context: {
                        user: await getSelf(user)
                    }
                })

                // Append into a script tag
                if (contextualJSON) {
                    const json = JSON.stringify(contextualJSON.context || {})

                    const script = `<script id="__ADDITIONAL_CONTEXT" type="application/json">${json}</script>`
                    body = body.replace('</head>', `${script}\n  </head>`)
                }
            }

            return new Response(body, {
                status: response.status,
                headers: filterHeaders(response.headers, HOP_BY_HOP_HEADERS)
            })
        })
