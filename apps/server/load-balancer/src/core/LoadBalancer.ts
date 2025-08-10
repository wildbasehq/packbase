import Debug from 'debug';
import ConfigManager from '../config/ConfigManager';
import InstanceManager from './InstanceManager';
import { ProxyServer } from '../networking/ProxyServer';
import SecurityManager from '../networking/SecurityManager';
import ClusterManager from '../clustering/ClusterManager';
import { TrafficAnalyzer } from './TrafficAnalyzer';
import path from 'node:path';
import fs from 'node:fs/promises';

const log = {
  info: Debug('vg:lb:core:info'),
  error: Debug('vg:lb:core:error'),
  debug: Debug('vg:lb:core:debug'),
};

export interface LoadBalancerOptions {
  configPath?: string;
  port?: number;
  host?: string;
}

export class LoadBalancer {
  private configManager: ConfigManager;
  private instanceManager: InstanceManager;
  private proxyServer: ProxyServer | null = null;
  private securityManager: SecurityManager;
  private clusterManager: ClusterManager;
  private trafficAnalyzer: TrafficAnalyzer | null = null;
  private isRunning: boolean = false;

  constructor(options: LoadBalancerOptions = {}) {
    // Initialize ConfigManager with custom config path if provided
    this.configManager = ConfigManager.getInstance(options.configPath);

    // Get singleton instances
    this.instanceManager = InstanceManager.getInstance();
    this.securityManager = SecurityManager.getInstance();
    this.clusterManager = ClusterManager.getInstance();

    log.debug('LoadBalancer instance created');
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      log.info('Load balancer is already running');
      return;
    }

    try {
      log.info('Starting load balancer...');

      // Load configuration
      const config = await this.configManager.loadConfig();

      // Start watching for config changes
      this.configManager.startWatching();

      // Initialize security manager
      await this.securityManager.initialize();

      // Initialize instance manager
      await this.instanceManager.initialize();

      // Initialize cluster manager
      await this.clusterManager.initialize();

      // Create and start proxy server
      const proxyPort = this.getProxyPort();
      this.proxyServer = new ProxyServer({
        port: proxyPort,
        primaryAlgorithm: config.loadBalancer.algorithms['@_primary'],
        fallbackAlgorithm: config.loadBalancer.algorithms['@_fallback'],
        ssl: config.loadBalancer.security.ssl['@_enabled'] ? {
          cert: config.loadBalancer.security.ssl['@_cert'] || '',
          key: '', // Would need to be configured
        } : undefined,
      });

      await this.proxyServer.start();

      // Start resource monitoring
      this.instanceManager.startResourceMonitoring();

      // Initialize traffic analyzer
      this.trafficAnalyzer = new TrafficAnalyzer(this.instanceManager);
      this.trafficAnalyzer.start();

      this.isRunning = true;
      log.info(`Load balancer started successfully on port ${proxyPort}`);

      // Create health endpoint file if it doesn't exist
      await this.ensureHealthEndpoint();
    } catch (error) {
      log.error('Error starting load balancer:', error);
      await this.stop();
      throw new Error(`Failed to start load balancer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    log.info('Stopping load balancer...');

    // Stop traffic analyzer
    if (this.trafficAnalyzer) {
      this.trafficAnalyzer.stop();
      this.trafficAnalyzer = null;
    }

    // Stop proxy server
    if (this.proxyServer) {
      this.proxyServer.stop();
      this.proxyServer = null;
    }

    // Stop cluster manager
    this.clusterManager.shutdown();

    // Stop config watcher
    this.configManager.stopWatching();

    this.isRunning = false;
    log.info('Load balancer stopped');
  }

  private getProxyPort(): number {
    const config = this.configManager.getConfig();

    // Check if a specific proxy port is configured
    if (config.loadBalancer.ports['@_proxy'] !== undefined) {
      const proxyPort = parseInt(config.loadBalancer.ports['@_proxy'], 10);
      if (!isNaN(proxyPort)) {
        return proxyPort;
      }
      // If proxy port is invalid, log a warning and fall back to the default behavior
      log.error('Invalid proxy port configuration, falling back to default behavior');
    }

    // Fall back to the current behavior if proxy port is not set or invalid
    const portRange = config.loadBalancer.ports['@_range'];
    const [startStr, endStr] = portRange.split('-');
    // Use the port after the end of the range + 1 to avoid conflicts with server instances and cluster manager
    // (cluster manager uses the port after the end of the range)
    return parseInt(endStr, 10) + 2;
  }

  private async ensureHealthEndpoint(): Promise<void> {
    try {
      // Create a health endpoint in the src directory
      const healthEndpointPath = path.join(process.cwd(), 'src', 'routes', 'health.ts');

      // Check if it already exists
      try {
        await fs.access(healthEndpointPath);
        log.debug('Health endpoint already exists');
        return;
      } catch (error) {
        // File doesn't exist, create it
      }

      // Create the health endpoint file
      const healthEndpointContent = `
import { Elysia } from 'elysia';
import os from 'node:os';

export default new Elysia()
  .get('/health', () => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = os.loadavg()[0] / os.cpus().length; // Normalized CPU usage

    return {
      status: 'healthy',
      timestamp: Date.now(),
      metrics: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        },
        cpu: Math.round(cpuUsage * 100) / 100, // CPU load average (1 min)
        connections: 0, // This would be tracked by your application
        uptime: process.uptime(),
      },
      instance: process.env.INSTANCE_ID || 'unknown',
    };
  });
`;

      // Ensure the routes directory exists
      const routesDir = path.join(process.cwd(), 'src', 'routes');
      await fs.mkdir(routesDir, { recursive: true });

      // Write the file
      await fs.writeFile(healthEndpointPath, healthEndpointContent);

      log.info('Created health endpoint at /health');
    } catch (error) {
      log.error('Error creating health endpoint:', error);
    }
  }

  public getStats(): any {
    if (!this.isRunning) {
      return { status: 'stopped' };
    }

    const config = this.configManager.getConfig();
    const chatEnabled = config.loadBalancer.chatServer?.enabled || false;

    const stats = {
      status: 'running',
      proxy: this.proxyServer ? this.proxyServer.getStats() : null,
      mainServer: {
        total: this.instanceManager.getMainInstances().length,
        healthy: this.instanceManager.getHealthyMainInstances().length,
      },
      cluster: {
        role: this.clusterManager.getNodeRole(),
        nodes: this.clusterManager.getClusterNodes().length,
      },
      traffic: this.trafficAnalyzer ? this.trafficAnalyzer.getStats() : null,
    };

    // Add chat server stats if enabled
    if (chatEnabled) {
      stats['chatServer'] = {
        total: this.instanceManager.getChatInstances().length,
        healthy: this.instanceManager.getHealthyChatInstances().length,
      };
    }

    // For backward compatibility
    stats['instances'] = {
      total: this.instanceManager.getInstances().length,
      healthy: this.instanceManager.getHealthyInstances().length,
    };

    return stats;
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}

export default LoadBalancer;
