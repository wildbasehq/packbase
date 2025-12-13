import whitelistJSON from './whitelist.json'

export type TableColumnWhitelist = Record<string, string[]>;

// Default whitelist: allow all known tables/columns from the Prisma schema.
// Object.fromEntries(Object.entries(Schemas).map(([table, schema]) => [table, Object.keys(schema.columns)]))
export const whitelist: TableColumnWhitelist = whitelistJSON

export const getWhitelistedColumns = (table: string): string[] | undefined => whitelist[table];

export const ensureTableWhitelisted = (table: string) => {
    if (!whitelist[table]) throw new Error(`Table ${table} is not allowed`);
};

export const ensureColumnsWhitelisted = (table: string, columns: string[]) => {
    ensureTableWhitelisted(table);
    const allowed = whitelist[table] ?? [];
    const missing = columns.filter((c) => !allowed.includes(c));
    if (missing.length || !whitelist[table]?.includes('ALLOW_ALL_COLUMNS')) throw new Error(`Columns ${missing.join(', ')} are not allowed on table ${table}`);
};

export const ensureAllColumnsAllowed = (table: string) => {
    // If table has "ALLOW_ALL_COLUMNS" in whitelist, allow all columns
    if (!whitelist[table]?.includes('ALLOW_ALL_COLUMNS')) {
        // We don't check the size of the whitelist columns.
        // This is so we can still allow querying all columns, but disallow querying all at once.
        throw new Error(`Accessing all columns on table ${table} is not allowed`);
    }
};
