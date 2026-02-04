import {YapockType} from '@/index'
import Baozi from '@/lib/events'
import {HTTPError} from '@/lib/http-error'
import {getSelf} from '@/routes/user/me'
import {LRUCache} from 'lru-cache'

// ============================================================================
// Types
// ============================================================================

/** Cached proxy response entry */
interface ProxyCacheEntry {
    body: string
    contentType: string
    status: number
    headers: Record<string, string>
}

/** Context for HTML injection */
interface InjectionContext {
    path: string
    request: Request
    user: unknown
}

// ============================================================================
// Cache Configuration
// ============================================================================

const PROXY_CACHE_MAX_ENTRIES = parseInt(process.env.PROXY_CACHE_MAX_ENTRIES || '500', 10)
const PROXY_CACHE_MAX_BYTES = parseInt(process.env.PROXY_CACHE_MAX_BYTES || String(50 * 1024 * 1024), 10)
const PROXY_CACHE_TTL_MS = parseInt(process.env.PROXY_CACHE_TTL_MS || String(60 * 60 * 1000), 10)

const proxyCache = new LRUCache<string, ProxyCacheEntry>({
    max: PROXY_CACHE_MAX_ENTRIES,
    maxSize: PROXY_CACHE_MAX_BYTES,
    sizeCalculation: (entry) => entry.body.length,
    ttl: PROXY_CACHE_TTL_MS
})

const CACHEABLE_CONTENT_TYPES = [
    'text/html',
    'text/css',
    'text/javascript',
    'text/plain',
    'text/xml',
    'application/javascript',
    'application/json',
    'application/xml'
]

// ============================================================================
// Header Constants
// ============================================================================

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

/** Headers to skip when body has been decoded/modified */
const ENCODING_HEADERS = new Set([
    ...HOP_BY_HOP_HEADERS,
    'content-encoding',
    'content-length'
])

/** Headers to skip only on requests */
const REQUEST_SKIP_HEADERS = new Set([...HOP_BY_HOP_HEADERS, 'host'])

const FALLBACK_ERROR_HTML =
    '<!doctype html><html><head><meta charset="utf-8"><title>Service error</title></head><body><h1>Something went wrong</h1><p>We were unable to load the error page. Please try again later.</p></body></html>'

// ============================================================================
// Cache Helpers
// ============================================================================

/** Check if content type is cacheable */
function isCacheableContentType(contentType: string | null): boolean {
    if (!contentType) return false
    return CACHEABLE_CONTENT_TYPES.some((type) => contentType.includes(type))
}

/** Check if response has cache-control directives that prevent caching */
function shouldSkipCache(cacheControl: string | null): boolean {
    if (!cacheControl) return false
    const lower = cacheControl.toLowerCase()
    return lower.includes('no-store') || lower.includes('no-cache')
}

/** Generate cache key from path and version query param */
function getCacheKey(path: string, requestUrl: URL): string {
    const version = requestUrl.searchParams.get('v')
    return version ? `${path}?v=${version}` : path
}

/** Convert Headers to a plain object, filtering out specified headers */
function headersToObject(headers: Headers, skipSet: Set<string>): Record<string, string> {
    const obj: Record<string, string> = {}
    for (const [key, value] of headers) {
        if (!skipSet.has(key.toLowerCase())) {
            obj[key] = value
        }
    }
    return obj
}

/** Store a response in the cache */
function cacheResponse(
    cacheKey: string,
    body: string,
    contentType: string,
    status: number,
    headers: Headers
): void {
    proxyCache.set(cacheKey, {
        body,
        contentType,
        status,
        headers: headersToObject(headers, ENCODING_HEADERS)
    })
}

// ============================================================================
// Header Helpers
// ============================================================================

/** Filters headers, excluding specified headers */
function filterHeaders(headers: Headers, skipSet: Set<string>): Headers {
    const filtered = new Headers()
    for (const [key, value] of headers) {
        if (!skipSet.has(key.toLowerCase())) {
            filtered.set(key, value)
        }
    }
    return filtered
}

// ============================================================================
// Path & Security Helpers
// ============================================================================

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

// ============================================================================
// HTML Injection Helpers
// ============================================================================

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

/** Inject OG meta tags and additional context into HTML */
async function injectHtmlContent(html: string, ctx: InjectionContext): Promise<string> {
    let body = html

    // Inject Open Graph meta tags
    const meta = await Baozi.trigger('OPENGRAPH', {path: ctx.path})
    if (meta?.og) {
        const metaTags = generateOgMetaTags(meta.og)
        body = body.replace('</head>', `${metaTags}\n  </head>`)
    }

    // Inject additional context as JSON script tag
    const contextualJSON = await Baozi.trigger('ADDITIONAL_CONTEXT', {
        request: ctx.request,
        context: {
            user: await getSelf(ctx.user)
        }
    })

    if (contextualJSON) {
        const json = JSON.stringify(contextualJSON.context || {})
        const script = `<script id="__ADDITIONAL_CONTEXT" type="application/json">${json}</script>`
        body = body.replace('</head>', `${script}\n  </head>`)
    }

    return body
}

// ============================================================================
// Error Handling
// ============================================================================

/** Load and return error HTML response */
async function getErrorHtmlResponse(): Promise<Response> {
    let errorHTML: string
    try {
        errorHTML = await Bun.file(new URL('../_ui-error.html', import.meta.url)).text()
    } catch (fileError) {
        console.error('Failed to load UI error page HTML', {fileError})
        errorHTML = FALLBACK_ERROR_HTML
    }
    return new Response(errorHTML, {
        headers: {'Content-Type': 'text/html; charset=utf-8'}
    })
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * User front-end proxy. Fetches Packbase from some other URL, injects meta og, then serves it.
 */
export default (app: YapockType) =>
    app.get('/*', async ({user, path, request}) => {
        const baseUrlEnv = process.env.PACKBASE_FRONTEND_URL
        if (!baseUrlEnv) {
            throw HTTPError.serverError({
                summary: 'SSR Proxy is unavailable. API is online.'
            })
        }

        const requestUrl = new URL(request.url)
        const cacheKey = getCacheKey(path, requestUrl)
        const cached = proxyCache.get(cacheKey)

        // Serve cached non-HTML responses immediately
        if (cached && !cached.contentType.includes('text/html')) {
            return new Response(cached.body, {
                status: cached.status,
                headers: cached.headers
            })
        }

        // Serve cached HTML with fresh injections
        if (cached && cached.contentType.includes('text/html')) {
            const body = await injectHtmlContent(cached.body, {path, request, user})
            return new Response(body, {
                status: cached.status,
                headers: cached.headers
            })
        }

        // Fetch from upstream
        let response: Response
        try {
            const baseUrl = new URL(baseUrlEnv)
            const finalUrl = sanitizePath(path, baseUrl)
            response = await fetch(finalUrl.toString(), {
                headers: filterHeaders(request.headers, REQUEST_SKIP_HEADERS)
            })
        } catch (error) {
            console.error('Error proxying Packbase frontend request', {error, path, baseUrlEnv})
            return getErrorHtmlResponse()
        }

        const contentType = response.headers.get('content-type')
        const cacheControl = response.headers.get('cache-control')
        const canCache = !shouldSkipCache(cacheControl) && response.ok

        // Handle cacheable non-HTML text responses
        if (isCacheableContentType(contentType) && !contentType!.includes('text/html') && canCache) {
            const textBody = await response.text()
            cacheResponse(cacheKey, textBody, contentType || '', response.status, response.headers)
            return new Response(textBody, {
                status: response.status,
                headers: headersToObject(response.headers, ENCODING_HEADERS)
            })
        }

        // Handle HTML responses
        if (contentType?.includes('text/html')) {
            const originalBody = await response.text()

            // Cache the original HTML (without injections)
            if (canCache) {
                cacheResponse(cacheKey, originalBody, contentType, response.status, response.headers)
            }

            // Inject dynamic content
            const body = await injectHtmlContent(originalBody, {path, request, user})
            return new Response(body, {
                status: response.status,
                headers: headersToObject(response.headers, ENCODING_HEADERS)
            })
        }

        // Pass through other responses as-is
        return new Response(response.body, {
            status: response.status,
            headers: filterHeaders(response.headers, ENCODING_HEADERS)
        })
    })
