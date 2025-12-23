import Debug from 'debug'
import {LRUCache} from 'lru-cache'

const debug = Debug('vg:rate-limit')

// Rate limit configuration
export const RATE_LIMITS = {
    PER_USER_GLOBAL: {requests: 60, windowMs: 60 * 1000}, // 60/min global per user
    PER_CHANNEL: {requests: 20, windowMs: 60 * 1000}, // 20/min per channel
} as const

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds?: number;
}

export class DMRateLimiter {
    private static instance: DMRateLimiter
    private readonly userGlobalCache: LRUCache<string, RateLimitEntry>
    private readonly channelCache: LRUCache<string, RateLimitEntry>

    private constructor() {
        // Cache for global per-user limits
        this.userGlobalCache = new LRUCache({
            max: 10000, // Max 10k users tracked
            ttl: RATE_LIMITS.PER_USER_GLOBAL.windowMs * 2, // Double window for safety
        })

        // Cache for per-channel limits (user-channel combination)
        this.channelCache = new LRUCache({
            max: 50000, // Max 50k user-channel combinations
            ttl: RATE_LIMITS.PER_CHANNEL.windowMs * 2,
        })
    }

    public static getInstance(): DMRateLimiter {
        if (!DMRateLimiter.instance) {
            DMRateLimiter.instance = new DMRateLimiter()
        }
        return DMRateLimiter.instance
    }

    /**
     * Check if a user can send a message globally (across all channels)
     */
    public checkUserGlobalLimit(userId: string): RateLimitResult {
        return this.checkLimit(
            this.userGlobalCache,
            userId,
            RATE_LIMITS.PER_USER_GLOBAL.requests,
            RATE_LIMITS.PER_USER_GLOBAL.windowMs
        )
    }

    /**
     * Check if a user can send a message to a specific channel
     */
    public checkChannelLimit(userId: string, channelId: string): RateLimitResult {
        const key = `${userId}:${channelId}`
        return this.checkLimit(
            this.channelCache,
            key,
            RATE_LIMITS.PER_CHANNEL.requests,
            RATE_LIMITS.PER_CHANNEL.windowMs
        )
    }

    /**
     * Check both global and channel limits for a user sending to a channel
     */
    public checkLimits(userId: string, channelId: string): RateLimitResult {
        const globalResult = this.checkUserGlobalLimit(userId)
        if (!globalResult.allowed) {
            debug(`User ${userId} hit global rate limit: ${globalResult.count}/${globalResult.limit}`)
            return globalResult
        }

        const channelResult = this.checkChannelLimit(userId, channelId)
        if (!channelResult.allowed) {
            debug(`User ${userId} hit channel ${channelId} rate limit: ${channelResult.count}/${channelResult.limit}`)
            return channelResult
        }

        // Return the more restrictive result (lower remaining count)
        return globalResult.remaining <= channelResult.remaining ? globalResult : channelResult
    }

    /**
     * Record a message sent (increments counters for both global and channel limits)
     */
    public recordMessage(userId: string, channelId: string): void {
        this.incrementCounter(
            this.userGlobalCache,
            userId,
            RATE_LIMITS.PER_USER_GLOBAL.windowMs
        )

        const channelKey = `${userId}:${channelId}`
        this.incrementCounter(
            this.channelCache,
            channelKey,
            RATE_LIMITS.PER_CHANNEL.windowMs
        )

        debug(`Recorded message for user ${userId} in channel ${channelId}`)
    }

    /**
     * Get current stats for debugging/monitoring
     */
    public getStats(): { userGlobalEntries: number; channelEntries: number } {
        return {
            userGlobalEntries: this.userGlobalCache.size,
            channelEntries: this.channelCache.size,
        }
    }

    private checkLimit(
        cache: LRUCache<string, RateLimitEntry>,
        key: string,
        limit: number,
        windowMs: number
    ): RateLimitResult {
        const now = Date.now()
        let entry = cache.get(key)

        // Create new entry or reset if window expired
        if (!entry || now >= entry.resetAt) {
            entry = {
                count: 0,
                resetAt: now + windowMs,
            }
            cache.set(key, entry)
        }

        const remaining = Math.max(0, limit - entry.count)
        const allowed = entry.count < limit
        const retryAfterSeconds = allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000)

        return {
            allowed,
            limit,
            remaining,
            resetAt: entry.resetAt,
            retryAfterSeconds,
        }
    }

    private incrementCounter(
        cache: LRUCache<string, RateLimitEntry>,
        key: string,
        windowMs: number
    ): void {
        const now = Date.now()
        let entry = cache.get(key)

        if (!entry || now >= entry.resetAt) {
            entry = {
                count: 1,
                resetAt: now + windowMs,
            }
        } else {
            entry.count++
        }

        cache.set(key, entry)
    }
}