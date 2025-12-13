import {Statement} from './types';

const CACHE_TTL_MS = 5 * 60 * 1000;
// Cache results for         ^ 5 Minutes

type CacheEntry<T> = {
    expiresAt: number;
    value: Promise<T>;
};

const cache = new Map<string, CacheEntry<any>>();

/**
 * Build a deterministic cache key for a parsed query and optional allowlist.
 * The allowlist is sorted to avoid key changes due to argument order.
 */
export const makeCacheKey = (statements: Statement[], allowedTables?: string[]): string => {
    const normalizedAllowed = allowedTables ? [...allowedTables].sort() : undefined;
    return JSON.stringify({statements, allowedTables: normalizedAllowed});
};

const getCached = <T>(key: string): Promise<T> | undefined => {
    const entry = cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return undefined;
    }
    return entry.value as Promise<T>;
};

const setCached = <T>(key: string, value: Promise<T>) => {
    cache.set(key, {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
};

/**
 * Return a cached value when available; otherwise compute, cache, and return it.
 * If computation fails, the cache entry is discarded to avoid storing errors.
 */
export const withQueryCache = async <T>(key: string, compute: () => Promise<T>): Promise<T> => {
    const cached = getCached<T>(key);
    if (cached) return cached;

    const promise = compute();
    setCached(key, promise);

    try {
        return await promise;
    } catch (error) {
        cache.delete(key);
        throw error;
    }
};

/** Clear all cached search results (primarily for tests). */
export const clearQueryCache = () => cache.clear();

/** Exposed for tests to align expectations with implementation. */
export const QUERY_CACHE_TTL_MS = CACHE_TTL_MS;
