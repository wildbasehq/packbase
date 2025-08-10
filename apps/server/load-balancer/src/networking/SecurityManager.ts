import Debug from 'debug';
import { LRUCache } from 'lru-cache';
import ConfigManager from '../config/ConfigManager';

const log = {
  info: Debug('vg:lb:security:info'),
  error: Debug('vg:lb:security:error'),
  debug: Debug('vg:lb:security:debug'),
};

export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

export interface CorsConfig {
  enabled: boolean;
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
}

export interface SslConfig {
  enabled: boolean;
  cert?: string;
  key?: string;
}

export interface SecurityConfig {
  rateLimit: RateLimitConfig;
  cors: CorsConfig;
  ssl: SslConfig;
  ipBlacklist?: string[];
  ipWhitelist?: string[];
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockExpires?: number;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private configManager: ConfigManager;
  private config: SecurityConfig;

  // Rate limiting
  private rateLimitCache: LRUCache<string, RateLimitEntry>;
  private readonly rateLimitCacheOptions = {
    max: 100000, // Maximum number of entries
    ttl: 1000 * 60 * 60, // 1 hour TTL
  };

  // IP blocking
  private blockedIPs: Set<string> = new Set();
  private whitelistedIPs: Set<string> = new Set();

  // Automatic IP blocking
  private suspiciousIPs: Map<string, { count: number, firstSeen: number }> = new Map();
  private readonly suspiciousThreshold = 10; // Number of rate limit violations before auto-blocking
  private readonly suspiciousTimeWindow = 1000 * 60 * 10; // 10 minutes

  private constructor() {
    this.configManager = ConfigManager.getInstance();

    // Default configuration
    this.config = {
      rateLimit: {
        requests: 1000,
        window: 60,
      },
      cors: {
        enabled: true,
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['*'],
        allowCredentials: true,
        maxAge: 86400,
      },
      ssl: {
        enabled: false,
      },
    };

    // Initialize rate limit cache
    this.rateLimitCache = new LRUCache(this.rateLimitCacheOptions);

    // Subscribe to config changes
    this.configManager.onConfigChange(this.handleConfigChange.bind(this));
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load configuration
      const config = await this.configManager.loadConfig();
      this.updateConfig(config);

      // Initialize IP blacklist and whitelist
      if (this.config.ipBlacklist) {
        for (const ip of this.config.ipBlacklist) {
          this.blockedIPs.add(ip);
        }
      }

      if (this.config.ipWhitelist) {
        for (const ip of this.config.ipWhitelist) {
          this.whitelistedIPs.add(ip);
        }
      }

      log.info('Security manager initialized');
    } catch (error) {
      log.error('Error initializing security manager:', error);
      throw new Error(`Failed to initialize security manager: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private handleConfigChange(config: any): void {
    log.info('Configuration changed, updating security manager');
    this.updateConfig(config);
  }

  private updateConfig(config: any): void {
    // Extract security config from the loaded configuration
    const securityConfig = config.loadBalancer.security;

    // Helper function to convert string to array, handling wildcard
    const parseStringToArray = (value: string | undefined): string[] => {
      if (!value) return ['*'];
      if (value === '*') return ['*'];
      return value.split(',').map(item => item.trim());
    };

    this.config = {
      rateLimit: {
        requests: securityConfig.rateLimit['@_requests'],
        window: securityConfig.rateLimit['@_window'],
      },
      cors: {
        enabled: securityConfig.cors['@_enabled'],
        allowedOrigins: parseStringToArray(securityConfig.cors['@_allowedOrigins']),
        allowedMethods: parseStringToArray(securityConfig.cors['@_allowedMethods']),
        allowedHeaders: parseStringToArray(securityConfig.cors['@_allowedHeaders']),
        // Check both property names for backward compatibility
        allowCredentials: securityConfig.cors['@_allowCredentials'] !== undefined 
          ? securityConfig.cors['@_allowCredentials'] 
          : (securityConfig.cors['@_credentials'] !== undefined ? securityConfig.cors['@_credentials'] : true),
        maxAge: securityConfig.cors['@_maxAge'] ? parseInt(securityConfig.cors['@_maxAge']) : undefined,
      },
      ssl: {
        enabled: securityConfig.ssl['@_enabled'],
        cert: securityConfig.ssl['@_cert'],
      },
    };

    log.debug('Updated security configuration:', this.config);
  }

  /**
   * Check if a request should be rate limited
   * @param ip Client IP address
   * @param path Request path (optional, for path-specific rate limiting)
   * @returns Object indicating if the request is allowed and when the limit resets
   */
  public checkRateLimit(ip: string, path?: string): { allowed: boolean, resetAt?: number, retryAfter?: number } {
    // Whitelist check
    if (this.whitelistedIPs.has(ip)) {
      return { allowed: true };
    }

    // Blacklist check
    if (this.blockedIPs.has(ip)) {
      return { allowed: false };
    }

    const key = path ? `${ip}:${path}` : ip;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = this.rateLimitCache.get(key);
    if (!entry) {
      entry = {
        count: 0,
        resetAt: now + (this.config.rateLimit.window * 1000),
        blocked: false,
      };
      this.rateLimitCache.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blocked) {
      if (entry.blockExpires && now >= entry.blockExpires) {
        // Block expired, reset
        entry.blocked = false;
        entry.blockExpires = undefined;
      } else {
        return {
          allowed: false,
          resetAt: entry.resetAt,
          retryAfter: entry.blockExpires ? Math.ceil((entry.blockExpires - now) / 1000) : undefined,
        };
      }
    }

    // Check if window has expired
    if (now >= entry.resetAt) {
      // Reset counter for new window
      entry.count = 1;
      entry.resetAt = now + (this.config.rateLimit.window * 1000);
      this.rateLimitCache.set(key, entry);
      return { allowed: true, resetAt: entry.resetAt };
    }

    // Increment counter
    entry.count++;

    // Check if over limit
    if (entry.count > this.config.rateLimit.requests) {
      // Mark as blocked
      entry.blocked = true;

      // Block for twice the window time
      entry.blockExpires = now + (this.config.rateLimit.window * 2000);

      // Track suspicious activity
      this.trackSuspiciousIP(ip);

      log.info(`Rate limit exceeded for ${key}, blocked until ${new Date(entry.blockExpires).toISOString()}`);

      return {
        allowed: false,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.blockExpires - now) / 1000),
      };
    }

    // Update cache
    this.rateLimitCache.set(key, entry);

    return {
      allowed: true,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Track suspicious IP activity for potential auto-blocking
   * @param ip Client IP address
   */
  private trackSuspiciousIP(ip: string): void {
    const now = Date.now();

    // Get or create tracking entry
    let entry = this.suspiciousIPs.get(ip);
    if (!entry) {
      entry = { count: 1, firstSeen: now };
      this.suspiciousIPs.set(ip, entry);
      return;
    }

    // Check if outside time window
    if (now - entry.firstSeen > this.suspiciousTimeWindow) {
      // Reset tracking
      entry.count = 1;
      entry.firstSeen = now;
      this.suspiciousIPs.set(ip, entry);
      return;
    }

    // Increment count
    entry.count++;

    // Check if threshold exceeded
    if (entry.count >= this.suspiciousThreshold) {
      log.info(`Auto-blocking IP ${ip} after ${entry.count} rate limit violations in ${this.suspiciousTimeWindow / 1000} seconds`);
      this.blockIP(ip);
      this.suspiciousIPs.delete(ip);
    } else {
      this.suspiciousIPs.set(ip, entry);
    }
  }

  /**
   * Block an IP address
   * @param ip IP address to block
   */
  public blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    log.info(`Blocked IP: ${ip}`);
  }

  /**
   * Unblock an IP address
   * @param ip IP address to unblock
   */
  public unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    log.info(`Unblocked IP: ${ip}`);
  }

  /**
   * Check if an IP is blocked
   * @param ip IP address to check
   * @returns True if the IP is blocked
   */
  public isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Add an IP to the whitelist
   * @param ip IP address to whitelist
   */
  public whitelistIP(ip: string): void {
    this.whitelistedIPs.add(ip);
    // Remove from blocked list if present
    this.blockedIPs.delete(ip);
    log.info(`Whitelisted IP: ${ip}`);
  }

  /**
   * Remove an IP from the whitelist
   * @param ip IP address to remove from whitelist
   */
  public unwhitelistIP(ip: string): void {
    this.whitelistedIPs.delete(ip);
    log.info(`Removed IP from whitelist: ${ip}`);
  }

  /**
   * Check if an IP is whitelisted
   * @param ip IP address to check
   * @returns True if the IP is whitelisted
   */
  public isIPWhitelisted(ip: string): boolean {
    return this.whitelistedIPs.has(ip);
  }

  /**
   * Get CORS headers based on configuration
   * @param origin Request origin
   * @returns Object with CORS headers
   */
  public getCorsHeaders(origin?: string): Record<string, string> {
    if (!this.config.cors.enabled) {
      return {};
    }

    log.debug('CORS config:', this.config.cors);

    const headers: Record<string, string> = {};

    // Handle allowed origins
    if (this.config.cors.allowedOrigins) {
      if (this.config.cors.allowedOrigins.includes('*')) {
        headers['Access-Control-Allow-Origin'] = origin || '*';
      } else if (origin && this.config.cors.allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
      }
    }

    // Add other CORS headers
    if (this.config.cors.allowedMethods) {
      headers['Access-Control-Allow-Methods'] = this.config.cors.allowedMethods.join(', ');
    }

    if (this.config.cors.allowedHeaders) {
      headers['Access-Control-Allow-Headers'] = this.config.cors.allowedHeaders.join(', ');
    }

    if (this.config.cors.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (this.config.cors.maxAge) {
      headers['Access-Control-Max-Age'] = this.config.cors.maxAge.toString();
    }

    return headers;
  }

  /**
   * Get SSL configuration
   * @returns SSL configuration object
   */
  public getSSLConfig(): SslConfig {
    return this.config.ssl;
  }

  /**
   * Get rate limit configuration
   * @returns Rate limit configuration object
   */
  public getRateLimitConfig(): RateLimitConfig {
    return this.config.rateLimit;
  }

  /**
   * Get current rate limit statistics
   * @returns Object with rate limit statistics
   */
  public getRateLimitStats(): { totalEntries: number, blockedEntries: number } {
    let blockedCount = 0;

    for (const entry of this.rateLimitCache.values()) {
      if (entry.blocked) {
        blockedCount++;
      }
    }

    return {
      totalEntries: this.rateLimitCache.size,
      blockedEntries: blockedCount,
    };
  }
}

export default SecurityManager;
