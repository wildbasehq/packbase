// Helper to call the server admin SQL endpoint from the admin app
// Usage:
//   const res = await adminSql({ query: 'SELECT 1 as n' })
//   if (!res.ok) throw new Error(res.error || 'Admin SQL failed')
//   console.log(res)

export type AdminSqlQuery = {
    query: string
    params?: unknown[]
}

export type AdminSqlSuccess = { ok: true; type: 'query'; rows: unknown[] } | { ok: true; type: 'execute'; affected: number }

export type AdminSqlError = {
    ok: false
    error: string
    message?: string
    code?: string
    table?: string
    whitelist?: string[]
}

export type AdminSqlResponse = AdminSqlSuccess | AdminSqlError

// Resolve API base URL from env or window location.
function getApiBase(): string {
    // Prefer explicit admin API host if provided (e.g., http://localhost:8000)
    const fromEnv =
        (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
        (
            window as unknown as {
                __API_BASE__?: string
            }
        ).__API_BASE__
    if (fromEnv) return String(fromEnv).replace(/\/$/, '')
    // Fallback to same origin
    return `${window.location.origin}`
}

async function getClerkBearerToken(): Promise<string | undefined> {
    try {
        // Prefer the global Clerk instance exposed by the Provider
        const maybeClerk = (window as unknown as { Clerk?: any }).Clerk
        if (maybeClerk?.session) {
            const token: string | null = await maybeClerk.session.getToken()
            if (token) return `Bearer ${token}`
        }
    } catch (_e) {
        console.error(_e)
    }
    return undefined
}

export async function adminSql(payload: AdminSqlQuery, options?: { signal?: AbortSignal }): Promise<AdminSqlResponse> {
    const base = getApiBase()
    const url = `${base}/admin/sql`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    // If caller passed an explicit token, use it. Otherwise attempt to fetch from Clerk.
    const authHeader = await getClerkBearerToken()
    if (authHeader) headers['Authorization'] = authHeader

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'omit',
        signal: options?.signal,
    })

    const contentType = res.headers.get('content-type') || ''
    const asJson = contentType.includes('application/json')

    if (!res.ok) {
        if (asJson) return (await res.json()) as AdminSqlError
        return { ok: false, error: `HTTP ${res.status}` }
    }

    return (asJson ? await res.json() : { error: 'Unexpected non-JSON response' }) as AdminSqlResponse
}

export default adminSql
