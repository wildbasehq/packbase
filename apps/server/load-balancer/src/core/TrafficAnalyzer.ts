import Debug from 'debug';
import InstanceManager from './InstanceManager';

const log = {
  info: Debug('vg:lb:traffic:info'),
  error: Debug('vg:lb:traffic:error'),
  debug: Debug('vg:lb:traffic:debug'),
};

export interface TrafficStats {
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  peakRequestsPerSecond: number;
  lastUpdated: number;
}

export class TrafficAnalyzer {
  private instanceManager: InstanceManager;
  private analyzeIntervalId: NodeJS.Timeout | null = null;
  private analyzeInterval: number = 60000; // 1 minute
  private requestCounts: number[] = [];
  private responseTimes: number[] = [];
  private errorCounts: number[] = [];
  private stats: TrafficStats = {
    requestsPerSecond: 0,
    averageResponseTime: 0,
    errorRate: 0,
    peakRequestsPerSecond: 0,
    lastUpdated: Date.now(),
  };
  private isRunning: boolean = false;
  private lastScaleAction: number = 0;
  private scaleCooldown: number = 300000; // 5 minutes
  private predictionWindow: number = 5; // Number of intervals to use for prediction

  constructor(instanceManager: InstanceManager, options?: { analyzeInterval?: number, scaleCooldown?: number }) {
    this.instanceManager = instanceManager;
    
    if (options) {
      if (options.analyzeInterval) {
        this.analyzeInterval = options.analyzeInterval;
      }
      if (options.scaleCooldown) {
        this.scaleCooldown = options.scaleCooldown;
      }
    }
    
    log.debug('TrafficAnalyzer created');
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.analyzeIntervalId = setInterval(() => {
      this.analyzeTraffic();
    }, this.analyzeInterval);
    
    this.isRunning = true;
    log.info(`Traffic analyzer started with interval ${this.analyzeInterval}ms`);
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    if (this.analyzeIntervalId) {
      clearInterval(this.analyzeIntervalId);
      this.analyzeIntervalId = null;
    }
    
    this.isRunning = false;
    log.info('Traffic analyzer stopped');
  }

  public recordRequest(responseTime: number, isError: boolean = false): void {
    // Record request count
    this.requestCounts.push(1);
    
    // Record response time
    this.responseTimes.push(responseTime);
    
    // Record error if applicable
    if (isError) {
      this.errorCounts.push(1);
    }
  }

  private analyzeTraffic(): void {
    try {
      const now = Date.now();
      const elapsedSeconds = (now - this.stats.lastUpdated) / 1000;
      
      // Calculate requests per second
      const totalRequests = this.requestCounts.reduce((sum, count) => sum + count, 0);
      const requestsPerSecond = totalRequests / elapsedSeconds;
      
      // Calculate average response time
      const totalResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0);
      const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
      
      // Calculate error rate
      const totalErrors = this.errorCounts.reduce((sum, count) => sum + count, 0);
      const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
      
      // Update peak requests per second if higher
      const peakRequestsPerSecond = Math.max(this.stats.peakRequestsPerSecond, requestsPerSecond);
      
      // Update stats
      this.stats = {
        requestsPerSecond,
        averageResponseTime,
        errorRate,
        peakRequestsPerSecond,
        lastUpdated: now,
      };
      
      log.debug(`Traffic stats: ${requestsPerSecond.toFixed(2)} req/s, ${averageResponseTime.toFixed(2)}ms avg response, ${(errorRate * 100).toFixed(2)}% errors`);
      
      // Reset counters
      this.requestCounts = [];
      this.responseTimes = [];
      this.errorCounts = [];
      
      // Check if scaling is needed
      this.checkScaling();
    } catch (error) {
      log.error('Error analyzing traffic:', error);
    }
  }

  private checkScaling(): void {
    const now = Date.now();
    
    // Check if we're in cooldown period
    if (now - this.lastScaleAction < this.scaleCooldown) {
      log.debug('In scale cooldown period, skipping scaling check');
      return;
    }
    
    // Get current instances
    const instances = this.instanceManager.getInstances();
    const healthyInstances = this.instanceManager.getHealthyInstances();
    
    // Calculate target instances based on traffic
    const targetInstances = this.calculateTargetInstances();
    
    if (targetInstances > instances.length) {
      // Need to scale up
      const scaleDiff = targetInstances - instances.length;
      log.info(`Traffic analysis suggests scaling up by ${scaleDiff} instances`);
      
      this.instanceManager.scaleUp(scaleDiff).then(() => {
        this.lastScaleAction = Date.now();
      }).catch(err => {
        log.error('Error scaling up:', err);
      });
    } else if (targetInstances < instances.length && targetInstances >= healthyInstances.length * 0.7) {
      // Need to scale down, but ensure we don't go below 70% of healthy instances
      const scaleDiff = instances.length - targetInstances;
      log.info(`Traffic analysis suggests scaling down by ${scaleDiff} instances`);
      
      this.instanceManager.scaleDown(scaleDiff).then(() => {
        this.lastScaleAction = Date.now();
      }).catch(err => {
        log.error('Error scaling down:', err);
      });
    }
  }

  private calculateTargetInstances(): number {
    // Get current instances
    const instances = this.instanceManager.getInstances();
    
    // Simple calculation based on current requests per second
    // Assuming each instance can handle 100 requests per second
    const requestsPerInstance = 100;
    const baseTargetInstances = Math.ceil(this.stats.requestsPerSecond / requestsPerInstance);
    
    // Add buffer for spikes (20%)
    const bufferedTargetInstances = Math.ceil(baseTargetInstances * 1.2);
    
    // Predict future traffic based on trend
    const predictedInstances = this.predictFutureInstances(bufferedTargetInstances);
    
    // Ensure we have at least 2 instances for high availability
    return Math.max(2, predictedInstances);
  }

  private predictFutureInstances(currentTarget: number): number {
    // This is a simple linear prediction based on recent traffic patterns
    // In a real implementation, this could use more sophisticated algorithms
    
    // For now, just return the current target
    return currentTarget;
  }

  public getStats(): TrafficStats {
    return { ...this.stats };
  }
}

export default TrafficAnalyzer;