/**
 * Manages caching of setting values with expiration
 */
export class CacheManager {
    private cache = new Map<string, { value: any; expiresAt: number }>()
    private readonly cleanupInterval: NodeJS.Timeout

    constructor(private expirationMs: number) {
        // Periodic cleanup
        this.cleanupInterval = setInterval(() => this.cleanupExpired(), expirationMs / 2)
    }

    get(key: string): any | undefined {
        const entry = this.cache.get(key)
        if (!entry) return undefined

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key)
            return undefined
        }

        return entry.value
    }

    set(key: string, value: any): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.expirationMs,
        })
    }

    delete(key: string): void {
        this.cache.delete(key)
    }

    clearForIdentifier(identifier: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(identifier)) {
                this.cache.delete(key)
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval)
        this.cache.clear()
    }

    private cleanupExpired(): void {
        const now = Date.now()
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key)
            }
        }
    }
}
