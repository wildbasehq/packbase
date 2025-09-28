/**
 * this shit so risky it kinda makes my pussy squirt
 *
 * Admin-only raw SQL execution. Allows any read queries.
 * Destructive queries (INSERT/UPDATE/DELETE/TRUNCATE/DROP/ALTER/CREATE/RENAME)
 * require table to be whitelisted via ADMIN_SQL_WHITELIST_TABLES.
 */
import { t } from 'elysia';
import { YapockType } from '@/index';
import prisma from '@/db/prisma';

// Very thin/naive SQL inspector. This is intentionally permissive but guards destructive ops by table whitelist.
const DESTRUCTIVE_REGEX = /\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE\s+TABLE|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE|ALTER|CREATE\s+TABLE|RENAME\s+TABLE)\b/i;

// Extract the first table name after a destructive keyword. Handles optional schema prefix: schema.table
function extractTargetTable(sql: string): string | null {
    const patterns = [
        /INSERT\s+INTO\s+([a-zA-Z0-9_\.\"]+)/i,
        /UPDATE\s+([a-zA-Z0-9_\.\"]+)/i,
        /DELETE\s+FROM\s+([a-zA-Z0-9_\.\"]+)/i,
        /TRUNCATE\s+(?:TABLE\s+)?([a-zA-Z0-9_\.\"]+)/i,
        /DROP\s+TABLE\s+IF\s+EXISTS\s+([a-zA-Z0-9_\.\"]+)/i,
        /DROP\s+TABLE\s+([a-zA-Z0-9_\.\"]+)/i,
        /ALTER\s+TABLE\s+([a-zA-Z0-9_\.\"]+)/i,
        /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_\.\"]+)/i,
        /CREATE\s+TABLE\s+([a-zA-Z0-9_\.\"]+)/i,
        /RENAME\s+TABLE\s+([a-zA-Z0-9_\.\"]+)/i,
    ];

    for (const p of patterns) {
        const m = sql.match(p);
        if (m && m[1]) {
            // Return the unquoted table name (lower-cased) without schema quotes
            const raw = m[1].replace(/\"/g, '"');
            // If schema-qualified, allow either schema.table or table in whitelist; normalize to lower
            return raw.replace(/"/g, '').toLowerCase();
        }
    }
    return null;
}

// Load whitelist from env: comma-separated list of tables allowed for destructive ops
function loadWhitelist(): Set<string> {
    const env = process.env.ADMIN_SQL_WHITELIST_TABLES || '';
    const items = env
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return new Set(items);
}

export default (app: YapockType) =>
    app.post(
        '',
        async ({ body, set, logAudit }) => {
            // Body shape: { query: string, params?: any[] }
            const { query, params } = (body || {}) as { query?: string; params?: any[] };

            if (!query || typeof query !== 'string') {
                set.status = 400;
                await logAudit({
                    action: 'VALIDATION_ERROR',
                    model_id: 'unknown',
                    model_type: 'admin.sql',
                    model_object: {
                        reason: 'Missing query',
                        params,
                    },
                });
                return { error: 'Missing query' };
            }

            // Decide whether destructive
            const isDestructive = DESTRUCTIVE_REGEX.test(query);
            if (isDestructive) {
                const table = extractTargetTable(query);
                const whitelist = loadWhitelist();

                if (!table) {
                    set.status = 400;
                    await logAudit({
                        action: 'VALIDATION_ERROR',
                        model_id: 'unknown',
                        model_type: 'admin.sql',
                        model_object: {
                            reason: 'Destructive query detected but target table could not be determined',
                            query,
                            params,
                        },
                    });
                    return { error: 'Destructive query detected but target table could not be determined' };
                }

                // Allow either schema.table or plain table. Build both variants to check.
                const [maybeSchema, maybeTable] = table.includes('.') ? table.split('.') : [undefined, table];
                const candidates = new Set<string>([table]);
                if (maybeTable) candidates.add(maybeTable);

                const allowed = Array.from(candidates).some((c) => whitelist.has(c));
                if (!allowed) {
                    set.status = 403;
                    await logAudit({
                        action: 'WHITELIST_DENY',
                        model_id: table,
                        model_type: 'admin.sql',
                        model_object: {
                            query,
                            params,
                            whitelist: Array.from(whitelist),
                        },
                    });
                    return { error: 'Table not whitelisted for destructive operations', table, whitelist: Array.from(whitelist) };
                }
            }

            try {
                // Choose correct API: executeRaw for mutations, queryRaw for selects
                const isSelect = /^\s*SELECT\b/i.test(query);
                const isWith = /^\s*WITH\b/i.test(query); // CTEs could be read or write; default to queryRaw

                // Use Unsafe variants since this endpoint explicitly allows raw queries from admins
                if (isSelect || (isWith && !isDestructive)) {
                    const result = await (params && Array.isArray(params) ? prisma.$queryRawUnsafe(query, ...params) : prisma.$queryRawUnsafe(query));
                    await logAudit({
                        action: 'READ_OK',
                        model_id: extractTargetTable(query) || 'query',
                        model_type: 'admin.sql',
                        model_object: {
                            query,
                            params,
                            isDestructive: false,
                            resultType: 'rows',
                            rowsCount: Array.isArray(result) ? result.length : undefined,
                        },
                    });
                    return { ok: true, type: 'query', rows: result };
                } else {
                    const affected = await (params && Array.isArray(params) ? prisma.$executeRawUnsafe(query, ...params) : prisma.$executeRawUnsafe(query));
                    await logAudit({
                        action: 'WRITE_OK',
                        model_id: extractTargetTable(query) || 'execute',
                        model_type: 'admin.sql',
                        model_object: {
                            query,
                            params,
                            isDestructive: true,
                            affected,
                        },
                    });
                    return { ok: true, type: 'execute', affected };
                }
            } catch (e: any) {
                set.status = 500;
                await logAudit({
                    action: 'EXEC_ERROR',
                    model_id: extractTargetTable(query) || 'unknown',
                    model_type: 'admin.sql',
                    model_object: {
                        query,
                        params,
                        isDestructive,
                        errorMessage: e?.message,
                        errorCode: e?.code,
                    },
                });
                return { error: 'Query failed', message: e?.message, code: e?.code };
            }
        },
        {
            detail: {
                description: 'Not a route. Used for Rheo automoderation.',
                hide: true,
                tags: ['Admin'],
            },
            body: t.Object({
                query: t.String(),
                params: t.Optional(t.Array(t.Any())),
            }),
            response: {
                200: t.Object({
                    ok: t.Boolean(),
                    type: t.Union([t.Literal('query'), t.Literal('execute')]),
                    rows: t.Optional(t.Array(t.Any())),
                    affected: t.Optional(t.Number()),
                }),
                400: t.Object({ error: t.String() }),
                403: t.Object({ error: t.String(), table: t.Optional(t.String()), whitelist: t.Optional(t.Array(t.String())) }),
                500: t.Object({ error: t.String(), message: t.Optional(t.String()), code: t.Optional(t.String()) }),
            },
        },
    );
