/**
 * Cloudflare Worker for SSR HTML injection.
 * Fetches context from the backend API and injects Open Graph meta tags
 * and additional context into HTML responses.
 *
 * @see https://developers.cloudflare.com/workers/static-assets/
 */

/// <reference types="@cloudflare/workers-types" />

interface Env {
    VITE_YAPOCK_URL: string
    ASSETS: Fetcher
}

interface ContextResponse {
    og: Record<string, string> | null
    context: Record<string, unknown>
}

interface MaintenanceResponse {
    maintenance: string
}

/**
 * Escape HTML special characters for safe attribute values
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Generate Open Graph meta tags HTML string
 */
function generateOgMetaTags(og: Record<string, string>): string {
    return Object.entries(og)
        .map(([key, value]) => {
            // link: prefix renders as <link> tags instead of <meta>
            if (key.startsWith('link:')) {
                const rel = escapeHtml(key.slice(5))
                // Support JSON value with extra attributes (type, title, etc.)
                try {
                    const parsed = JSON.parse(value)
                    if (typeof parsed === 'object' && parsed.href) {
                        const href = escapeHtml(parsed.href)
                        const extras = Object.entries(parsed)
                            .filter(([k]) => k !== 'href')
                            .map(([k, v]) => `${escapeHtml(k)}="${escapeHtml(String(v))}"`)
                            .join(' ')
                        return `<link rel="${rel}" href="${href}"${extras ? ' ' + extras : ''} />`
                    }
                } catch {
                    // Not JSON — fall through to simple link
                }
                const href = escapeHtml(value)
                return `<link rel="${rel}" href="${href}" />`
            }
            const escaped = escapeHtml(key)
            const content = escapeHtml(value)
            // twitter: and theme-color use "name"; everything else uses "property"
            const attr = key.startsWith('twitter:') || key === 'theme-color' ? 'name' : 'property'
            return `<meta ${attr}="${escaped}" content="${content}" />`
        })
        .join('\n    ')
}

/**
 * HTMLRewriter handler that injects content inside </head>
 */
function createHeadInjector(og: Record<string, string> | null, context: Record<string, unknown> | null | undefined): HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    const ogTags = og ? generateOgMetaTags(og) : ''
    const contextScript = context && Object.keys(context).length > 0
        ? `<script id="__ADDITIONAL_CONTEXT" type="application/json">${JSON.stringify(context)}</script>`
        : ''

    return {
        element(element: HTMLRewriterTypes.Element) {
            if (ogTags) {
                element.append(ogTags, {html: true})
            }
            if (contextScript) {
                element.append(contextScript, {html: true})
            }
        }
    }
}

/**
 * Fetch context from the backend API
 */
async function fetchContext(
    backendUrl: string,
    path: string,
    request: Request
): Promise<ContextResponse | MaintenanceResponse | null> {
    const contextUrl = new URL('/context', backendUrl)
    contextUrl.searchParams.set('path', path)

    // Forward auth headers and cookies
    const headers = new Headers()

    const authorization = request.headers.get('Authorization')
    if (authorization) {
        headers.set('Authorization', authorization)
    }

    const cookie = request.headers.get('Cookie')
    if (cookie) {
        headers.set('Cookie', cookie)
    }

    try {
        const response = await fetch(contextUrl.toString(), {
            method: 'GET',
            headers
        })

        if (!response.ok) {
            // Check for maintenance mode in error response
            try {
                const errorData = await response.json() as any
                if (errorData?.maintenance) {
                    console.log('maintenance mode', errorData?.maintenance)
                    return {maintenance: errorData.maintenance}
                }
            } catch {
                // Ignore JSON parse errors on error responses
            }

            console.error(`Context fetch failed: ${response.status}`)
            return null
        }

        return await response.json() as ContextResponse
    } catch (error) {
        console.error('Failed to fetch context:', error)
        return null
    }
}

/**
 * Serve the error page
 */
async function serveErrorPage(env: Env, maintenanceMessage?: string): Promise<Response> {
    try {
        const errorResponse = await env.ASSETS.fetch(new Request('http://fakehost/_ui-error.html'))
        let html = await errorResponse.text()

        const heading = maintenanceMessage ? 'Packbase is in Maintenance Mode' : 'Packbase is Temporarily Unavailable'
        const message = maintenanceMessage || 'Something\'s stopping Packbase from connecting properly. This is on our end - your internet is working just fine.'

        html = html
            .replace('{{ErrorHeading}}', heading)
            .replace('{{ErrorMessage}}', message)

        return new Response(html, {
            status: 503,
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            }
        })
    } catch {
        return new Response(
            '<!doctype html><html><head><meta charset="utf-8"><title>Service error</title></head><body><h1>Something went wrong</h1><p>We were unable to load the error page. Please try again later.</p></body></html>',
            {
                status: 503,
                headers: {'Content-Type': 'text/html; charset=utf-8'}
            }
        )
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url)

        // Serve static assets first
        const response = await env.ASSETS.fetch(request)

        // Only process HTML responses
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('text/html')) {
            return response
        }

        // Check if backend URL is configured
        if (!env.VITE_YAPOCK_URL) {
            console.error('VITE_YAPOCK_URL not configured')
            return response
        }

        // Fetch context from backend
        const contextData = await fetchContext(env.VITE_YAPOCK_URL, url.pathname, request)

        // Handle maintenance mode
        if (contextData && 'maintenance' in contextData) {
            return serveErrorPage(env, (contextData as MaintenanceResponse).maintenance)
        }

        // If context fetch failed, serve error page
        if (contextData === null) {
            return serveErrorPage(env)
        }

        const data = contextData as ContextResponse

        // Use HTMLRewriter to inject OG tags and context
        const rewriter = new HTMLRewriter()
            // @ts-ignore - IDE says this is fine, build says its not. Whatever.
            .on('head', createHeadInjector(data.og, data.context))

        return rewriter.transform(response)
    }
} satisfies ExportedHandler<Env>
