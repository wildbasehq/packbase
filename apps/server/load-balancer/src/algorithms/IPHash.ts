import Debug from 'debug';
import { ServerInstance } from '../core/InstanceManager';
import { LoadBalancingAlgorithm } from './LoadBalancingAlgorithm';
import crypto from 'node:crypto';

const log = Debug('vg:lb:algorithm:ip-hash');

/**
 * IP Hash load balancing algorithm
 * Provides session affinity by consistently routing requests from the same client IP to the same server
 */
export class IPHash implements LoadBalancingAlgorithm {
  public readonly name: string = 'ip-hash';
  
  // Cache of IP to instance index mappings
  private ipCache: Map<string, number> = new Map();
  
  // Maximum size of the IP cache to prevent memory leaks
  private readonly maxCacheSize: number = 10000;

  /**
   * Create a new IPHash instance
   * @param maxCacheSize Optional maximum size for the IP cache
   */
  constructor(maxCacheSize?: number) {
    if (maxCacheSize && maxCacheSize > 0) {
      this.maxCacheSize = maxCacheSize;
    }
  }

  /**
   * Get the next server instance using IP hash algorithm
   * @param instances Available server instances
   * @param clientIp Client IP address
   * @returns The selected server instance or null if no instances are available
   */
  public getNextInstance(instances: ServerInstance[], clientIp?: string): ServerInstance | null {
    if (!instances || instances.length === 0) {
      log('No instances available');
      return null;
    }

    // If no client IP is provided, fall back to round-robin
    if (!clientIp) {
      log('No client IP provided, falling back to round-robin');
      const randomIndex = Math.floor(Math.random() * instances.length);
      return instances[randomIndex];
    }

    // Check if we already have a mapping for this IP
    if (this.ipCache.has(clientIp) && this.ipCache.get(clientIp)! < instances.length) {
      const cachedIndex = this.ipCache.get(clientIp)!;
      log(`Using cached mapping for IP ${clientIp} -> instance index ${cachedIndex}`);
      return instances[cachedIndex];
    }

    // Generate a hash of the client IP
    const hash = this.hashIP(clientIp);
    
    // Map the hash to an instance index
    const index = hash % instances.length;
    
    // Cache the mapping
    this.cacheIPMapping(clientIp, index);
    
    log(`Mapped IP ${clientIp} to instance ${instances[index].id} (index ${index})`);
    return instances[index];
  }

  /**
   * Hash a client IP address to a number
   * @param ip The client IP address
   * @returns A numeric hash
   */
  private hashIP(ip: string): number {
    // Create a hash of the IP
    const hash = crypto.createHash('md5').update(ip).digest('hex');
    
    // Convert the first 8 characters of the hash to a number
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Cache the mapping of an IP to an instance index
   * @param ip The client IP address
   * @param index The instance index
   */
  private cacheIPMapping(ip: string, index: number): void {
    // If cache is full, remove oldest entries
    if (this.ipCache.size >= this.maxCacheSize) {
      const keysToDelete = Array.from(this.ipCache.keys()).slice(0, Math.floor(this.maxCacheSize * 0.2));
      for (const key of keysToDelete) {
        this.ipCache.delete(key);
      }
      log(`Cache full, removed ${keysToDelete.length} oldest entries`);
    }
    
    this.ipCache.set(ip, index);
  }

  /**
   * Clear the IP cache
   */
  public clearCache(): void {
    this.ipCache.clear();
    log('IP cache cleared');
  }

  /**
   * Get the current size of the IP cache
   * @returns The number of entries in the cache
   */
  public getCacheSize(): number {
    return this.ipCache.size;
  }
}

export default IPHash;