import {Statement} from './types';
import debug from 'debug';

const logCache = debug('vg:search:cache');

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
    const key = JSON.stringify({statements, allowedTables: normalizedAllowed});
    logCache('Computed cache key: %s', key);
    return key;
};

const getCached = <T>(key: string): Promise<T> | undefined => {
    const entry = cache.get(key);
    if (!entry) {
        logCache('Cache miss for key: %s', key);
        return undefined;
    }
    if (Date.now() > entry.expiresAt) {
        logCache('Cache expired for key: %s', key);
        cache.delete(key);
        return undefined;
    }
    logCache('Cache hit for key: %s', key);
    return entry.value as Promise<T>;
};

const setCached = <T>(key: string, value: Promise<T>) => {
    cache.set(key, {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
    logCache('Inserted key into cache: %s', key);
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
        logCache('Error occurred, invalidating cache key: %s', key);
        cache.delete(key);
        throw error;
    }
};

/** Clear all cached search results (primarily for tests). */
export const clearQueryCache = (key?: string) => {
    if (key) {
        if (key.startsWith('~')) {
            // Find any key that contains the substring after '~'
            const substring = key.slice(1);
            for (const existingKey of cache.keys()) {
                if (existingKey.includes(substring)) {
                    cache.delete(existingKey);
                    logCache('Cleared cache for key: %s', existingKey);
                }
            }
            return;
        }
        
        cache.delete(key);
        logCache('Cleared cache for key: %s', key);
        return;
    }

    cache.clear();
    logCache('Cleared all cache');
};

/** Exposed for tests to align expectations with implementation. */
export const QUERY_CACHE_TTL_MS = CACHE_TTL_MS;
