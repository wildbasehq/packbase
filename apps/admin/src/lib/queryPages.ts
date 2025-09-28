import adminSql from '@/lib/adminSql'

export type QueryColumn = {
    key: string
    header: string
}

export type QueryPage = {
    id: string
    slug: string
    title: string
    description?: string
    sql: string
    mapping: QueryColumn[]
    custom_js?: string
    delete_key?: string
    delete_sql?: string
    created_at?: string
    updated_at?: string
}

export type UpsertQueryPageInput = {
    id?: string
    slug: string
    title: string
    description?: string
    sql: string
    mapping: QueryColumn[]
    custom_js?: string
    delete_key?: string
    delete_sql?: string
}

const TABLE_NAME = 'admin_query_pages'

export async function listQueryPages(): Promise<Pick<QueryPage, 'id' | 'slug' | 'title' | 'description' | 'updated_at'>[]> {
    const res = await adminSql({
        query: `SELECT id, slug, title, description, updated_at FROM ${TABLE_NAME} ORDER BY updated_at DESC`,
    })
    if (!res.ok || res.type !== 'query') return []
    return res.rows as any
}

export async function getQueryPageBySlug(slug: string): Promise<QueryPage | null> {
    const res = await adminSql({
        query: `SELECT id, slug, title, description, sql, mapping, custom_js, delete_key, delete_sql, created_at, updated_at FROM ${TABLE_NAME} WHERE slug = $1 LIMIT 1`,
        params: [slug],
    })
    if (!res.ok || res.type !== 'query') return null
    const [row] = (res.rows as any[]) || []
    return row || null
}

export async function upsertQueryPage(input: UpsertQueryPageInput): Promise<QueryPage> {
    const id = input.id || crypto.randomUUID()
    const res = await adminSql({
        query: `
            INSERT INTO ${TABLE_NAME} (id, slug, title, description, sql, mapping, custom_js, delete_key, delete_sql)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                sql = EXCLUDED.sql,
                mapping = EXCLUDED.mapping,
                custom_js = EXCLUDED.custom_js,
                delete_key = EXCLUDED.delete_key,
                delete_sql = EXCLUDED.delete_sql,
                updated_at = NOW()
            RETURNING id, slug, title, description, sql, mapping, created_at, updated_at
        `,
        params: [
            id,
            input.slug,
            input.title,
            input.description || null,
            input.sql,
            JSON.stringify(input.mapping),
            input.custom_js || null,
            input.delete_key || null,
            input.delete_sql || null,
        ],
    })
    if (!res.ok) throw new Error((res as any).error || 'Failed to upsert query page')
    // get rows
    const res2 = await adminSql({
        query: `SELECT id, slug, title, description, sql, mapping, custom_js, delete_key, delete_sql, created_at, updated_at FROM ${TABLE_NAME} WHERE id = $1 LIMIT 1`,
        params: [id],
    })
    if (!res2.ok || res2.type !== 'query') throw new Error((res2 as any).error || 'Failed to get query page')
    const [row] = (res2.rows as any[]) || []
    return row as QueryPage
}

export async function deleteQueryPage(id: string): Promise<boolean> {
    const res = await adminSql({ query: `DELETE FROM ${TABLE_NAME} WHERE id = $1`, params: [id] })
    return !!res.ok
}
