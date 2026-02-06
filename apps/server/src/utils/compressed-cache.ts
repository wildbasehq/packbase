import {LRUCache} from 'lru-cache'
import * as zlib from 'zlib'

// Brotli compression options
const BROTLI_COMPRESS_OPTIONS: zlib.BrotliOptions = {
    params: {
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        [zlib.constants.BROTLI_PARAM_QUALITY]: process.env.BROTLI_QUALITY ? parseInt(process.env.BROTLI_QUALITY, 10) : 4,
    },
}

const DISABLE_COMPRESSION = !!process.env.DONT_CACHE_MEMORY

/**
 * A compressed LRU cache wrapper that stores data as Brotli-compressed buffers.
 * Uses Brotli at max quality for ~20-30% better compression than gzip.
 * If DONT_CACHE_MEMORY env var is set, compression is disabled.
 */
export class CompressedLRUCache<K extends string | number, V> {
    private cache: LRUCache<K, Buffer | V>

    constructor(options: LRUCache.Options<K, Buffer | V, any>) {
        this.cache = new LRUCache<K, Buffer | V>(options)
    }

    /**
     * Store a value in the cache, compressing it with Brotli.
     */
    set(key: K, value: V): this {
        if (DISABLE_COMPRESSION) {
            this.cache.set(key, value)
        } else {
            const json = JSON.stringify(value)
            const compressed = zlib.brotliCompressSync(json, BROTLI_COMPRESS_OPTIONS)
            this.cache.set(key, compressed)
        }
        return this
    }

    /**
     * Retrieve and decompress a value from the cache.
     */
    get(key: K): V | undefined {
        const cached = this.cache.get(key)
        if (!cached) return undefined

        if (DISABLE_COMPRESSION) {
            return cached as V
        }

        const json = zlib.brotliDecompressSync(cached as Buffer).toString()
        return JSON.parse(json) as V
    }

    /**
     * Check if a key exists in the cache.
     */
    has(key: K): boolean {
        return this.cache.has(key)
    }

    /**
     * Delete a key from the cache.
     */
    delete(key: K): boolean {
        return this.cache.delete(key)
    }

    /**
     * Iterate over all entries in the cache.
     * Note: Values are decompressed on access.
     */
    forEach(callback: (value: V, key: K, cache: this) => void): void {
        this.cache.forEach((cached, key) => {
            if (DISABLE_COMPRESSION) {
                callback(cached as V, key, this)
            } else {
                const json = zlib.brotliDecompressSync(cached as Buffer).toString()
                const value = JSON.parse(json) as V
                callback(value, key, this)
            }
        })
    }

    /**
     * Clear all entries from the cache.
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * Get the number of items in the cache.
     */
    get size(): number {
        return this.cache.size
    }

    get max(): number {
        return this.cache.max
    }
}
