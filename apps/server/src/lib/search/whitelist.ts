import debug from 'debug';
import whitelistJSON from './whitelist.json'

const logWhitelist = debug('vg:search:whitelist');

/** Mapping of table name -> allowed column names. */
export type TableColumnWhitelist = Record<string, string[]>;

// Default whitelist derived externally (can be generated from schemas).
export const whitelist: TableColumnWhitelist = whitelistJSON

/** Retrieve the allowed columns for a given table, if any. */
export const getWhitelistedColumns = (table: string): string[] | undefined => whitelist[table];

/** Assert that a table is present in the whitelist. */
export const ensureTableWhitelisted = (table: string) => {
    if (!whitelist[table]) throw new Error(`Table ${table} is not allowed`);
    logWhitelist(`Table ${table} is allowed`);
};

/**
 * Assert that all requested columns belong to the whitelist for the table.
 * Honors the special sentinel value `ALLOW_ALL_COLUMNS` to bypass per-column checks.
 */
export const ensureColumnsWhitelisted = (table: string, columns: string[]) => {
    ensureTableWhitelisted(table);
    const allowed = whitelist[table] ?? [];

    // If table explicitly allows all columns, skip per-column enforcement
    if (allowed.includes('ALLOW_ALL_COLUMNS')) return;

    const missing = columns.filter((c) => !allowed.includes(c));
    if (missing.length) throw new Error(`Columns ${missing.join(', ')} are not allowed on table ${table}`);
    logWhitelist(`Columns ${columns.join(', ')} are allowed on table ${table}`);
};

/**
 * Assert that the table permits projecting all columns at once (via the ALLOW_ALL_COLUMNS marker).
 */
export const ensureAllColumnsAllowed = (table: string) => {
    // If table has "ALLOW_ALL_COLUMNS" in whitelist, allow all columns
    if (!whitelist[table]?.includes('ALLOW_ALL_COLUMNS')) {
        // We don't check the size of the whitelist columns.
        // This is so we can still allow querying all columns, but disallow querying all at once.
        throw new Error(`Accessing all columns on table ${table} is not allowed`);
    }
    logWhitelist(`All columns are allowed on table ${table}`);
};
