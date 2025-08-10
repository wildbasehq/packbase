import Debug from 'debug';
import { ServerInstance } from './InstanceManager';

const log = {
  info: Debug('vg:lb:health:info'),
  error: Debug('vg:lb:health:error'),
  debug: Debug('vg:lb:health:debug'),
};

export class HealthChecker {
  private healthCheckInterval: number = 10000; // 10 seconds
  private healthCheckTimeout: number = 5000; // 5 seconds
  private healthCheckPath: string = '/health';
  private healthCheckIntervalId: NodeJS.Timeout | null = null;
  private consecutiveFailuresThreshold: number = 3;
  private consecutiveFailures: Map<string, number> = new Map();
  private circuitBreakerTimeout: number = 30000; // 30 seconds
  private circuitBreakers: Map<string, { openedAt: number, reopenAttempts: number }> = new Map();

  constructor(options?: {
    interval?: number;
    timeout?: number;
    path?: string;
    failuresThreshold?: number;
    circuitBreakerTimeout?: number;
  }) {
    if (options) {
      this.healthCheckInterval = options.interval ?? this.healthCheckInterval;
      this.healthCheckTimeout = options.timeout ?? this.healthCheckTimeout;
      this.healthCheckPath = options.path ?? this.healthCheckPath;
      this.consecutiveFailuresThreshold = options.failuresThreshold ?? this.consecutiveFailuresThreshold;
      this.circuitBreakerTimeout = options.circuitBreakerTimeout ?? this.circuitBreakerTimeout;
    }
  }

  public startHealthChecks(instances: Map<string, ServerInstance>): void {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }

    this.healthCheckIntervalId = setInterval(() => {
      this.checkAllInstances(instances);
    }, this.healthCheckInterval);

    log.info(`Health checks started with interval ${this.healthCheckInterval}ms`);
  }

  public stopHealthChecks(): void {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
      log.info('Health checks stopped');
    }
  }

  private async checkAllInstances(instances: Map<string, ServerInstance>): Promise<void> {
    // Check circuit breakers first to see if any should be reset
    this.checkCircuitBreakers();

    // Check all instances
    for (const [id, instance] of instances.entries()) {
      try {
        // Skip instances with open circuit breakers
        if (this.circuitBreakers.has(id)) {
          continue;
        }

        const isHealthy = await this.checkInstanceHealth(instance);
        
        if (isHealthy) {
          // Reset consecutive failures counter on success
          this.consecutiveFailures.set(id, 0);
          
          // Update instance health status if it changed
          if (!instance.healthy) {
            log.info(`Instance ${id} is now healthy`);
            instance.healthy = true;
          }
        } else {
          // Increment consecutive failures counter
          const failures = (this.consecutiveFailures.get(id) || 0) + 1;
          this.consecutiveFailures.set(id, failures);
          
          log.debug(`Instance ${id} health check failed (${failures}/${this.consecutiveFailuresThreshold})`);
          
          // If we've reached the threshold, mark as unhealthy and open circuit breaker
          if (failures >= this.consecutiveFailuresThreshold) {
            log.info(`Instance ${id} marked as unhealthy after ${failures} consecutive failures`);
            instance.healthy = false;
            this.openCircuitBreaker(id);
          }
        }
      } catch (error) {
        log.error(`Error checking health for instance ${id}:`, error);
      }
    }
  }

  public async checkInstanceHealth(instance: ServerInstance): Promise<boolean> {
    try {
      // Skip if circuit breaker is open
      if (this.circuitBreakers.has(instance.id)) {
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);

      try {
        const response = await fetch(`http://localhost:${instance.port}${this.healthCheckPath}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        // Check if response is OK (200-299)
        if (response.ok) {
          try {
            // Try to parse response as JSON
            const data: {
              status?: string,
              message?: string,
              connections?: number,
              cpu?: number,
              memory?: number,
            } = await response.json();
            
            // Update instance metrics if available in response
            if (data && typeof data === 'object') {
              if (data.connections !== undefined) {
                instance.connections = data.connections;
              }
              if (data.cpu !== undefined) {
                instance.cpu = data.cpu;
              }
              if (data.memory !== undefined) {
                instance.memory = data.memory;
              }
            }
            
            return true;
          } catch (e) {
            // If JSON parsing fails, still consider it healthy if status is OK
            return true;
          }
        } else {
          log.debug(`Health check failed for instance ${instance.id}: HTTP ${response.status}`);
          return false;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          log.debug(`Health check timed out for instance ${instance.id}`);
        } else {
          log.debug(`Health check failed for instance ${instance.id}: ${error.message}`);
        }
        
        return false;
      }
    } catch (error) {
      log.error(`Unexpected error in health check for instance ${instance.id}:`, error);
      return false;
    }
  }

  private openCircuitBreaker(instanceId: string): void {
    const now = Date.now();
    
    // If circuit breaker is already open, increment reopen attempts
    if (this.circuitBreakers.has(instanceId)) {
      const breaker = this.circuitBreakers.get(instanceId)!;
      breaker.reopenAttempts += 1;
      
      // Exponential backoff for circuit breaker timeout
      const backoffFactor = Math.pow(2, Math.min(breaker.reopenAttempts, 5)); // Max 32x backoff
      const timeout = this.circuitBreakerTimeout * backoffFactor;
      
      log.info(`Circuit breaker for instance ${instanceId} reopened with ${timeout}ms timeout (attempt ${breaker.reopenAttempts})`);
      
      this.circuitBreakers.set(instanceId, {
        openedAt: now,
        reopenAttempts: breaker.reopenAttempts,
      });
    } else {
      // First time opening circuit breaker
      log.info(`Circuit breaker opened for instance ${instanceId} with ${this.circuitBreakerTimeout}ms timeout`);
      
      this.circuitBreakers.set(instanceId, {
        openedAt: now,
        reopenAttempts: 1,
      });
    }
  }

  private checkCircuitBreakers(): void {
    const now = Date.now();
    
    for (const [instanceId, breaker] of this.circuitBreakers.entries()) {
      // Calculate timeout with exponential backoff
      const backoffFactor = Math.pow(2, Math.min(breaker.reopenAttempts - 1, 5)); // Max 32x backoff
      const timeout = this.circuitBreakerTimeout * backoffFactor;
      
      // Check if circuit breaker timeout has elapsed
      if (now - breaker.openedAt >= timeout) {
        log.info(`Circuit breaker for instance ${instanceId} closed after ${timeout}ms, allowing health checks`);
        this.circuitBreakers.delete(instanceId);
      }
    }
  }

  public getCircuitBreakerStatus(instanceId: string): { isOpen: boolean, remainingMs: number } | null {
    const breaker = this.circuitBreakers.get(instanceId);
    if (!breaker) {
      return null;
    }
    
    const now = Date.now();
    const backoffFactor = Math.pow(2, Math.min(breaker.reopenAttempts - 1, 5));
    const timeout = this.circuitBreakerTimeout * backoffFactor;
    const elapsed = now - breaker.openedAt;
    const remaining = Math.max(0, timeout - elapsed);
    
    return {
      isOpen: true,
      remainingMs: remaining,
    };
  }
}

export default HealthChecker;