import Debug from 'debug';
import { serve, type Server } from 'bun';
import {InstanceManager, ServerInstance} from '../core/InstanceManager'
import { LoadBalancingAlgorithm } from '../algorithms/LoadBalancingAlgorithm';
import SecurityManager from './SecurityManager';
import ConfigManager from '../config/ConfigManager';
import RoundRobin from '../algorithms/RoundRobin';
import LeastConnections from '../algorithms/LeastConnections';
import WeightedRoundRobin from '../algorithms/WeightedRoundRobin';
import IPHash from '../algorithms/IPHash';
import path from 'node:path';
import fs from 'node:fs/promises';

const log = {
  info: Debug('vg:lb:proxy:info'),
  error: Debug('vg:lb:proxy:error'),
  debug: Debug('vg:lb:proxy:debug'),
  request: Debug('vg:lb:proxy:request'),
};

export interface ProxyServerOptions {
  port: number;
  host?: string;
  primaryAlgorithm?: string;
  fallbackAlgorithm?: string;
  ssl?: {
    cert: string;
    key: string;
  };
}

export class ProxyServer {
  private server: Server | null = null;
  private port: number;
  private host: string;
  private primaryAlgorithm: LoadBalancingAlgorithm;
  private fallbackAlgorithm: LoadBalancingAlgorithm;
  private securityManager: SecurityManager;
  private configManager: ConfigManager;
  private algorithms: Map<string, LoadBalancingAlgorithm> = new Map();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private startTime: number = Date.now();
  private statsHistory: any[] = [];

  constructor(options: ProxyServerOptions) {
    this.port = options.port;
    this.host = options.host || '0.0.0.0';

    // Initialize algorithms
    this.algorithms.set('round-robin', new RoundRobin());
    this.algorithms.set('least-connections', new LeastConnections());
    this.algorithms.set('weighted-round-robin', new WeightedRoundRobin());
    this.algorithms.set('ip-hash', new IPHash());

    // Set primary and fallback algorithms
    const primaryName = options.primaryAlgorithm || 'round-robin';
    const fallbackName = options.fallbackAlgorithm || 'least-connections';

    this.primaryAlgorithm = this.algorithms.get(primaryName) || this.algorithms.get('round-robin')!;
    this.fallbackAlgorithm = this.algorithms.get(fallbackName) || this.algorithms.get('least-connections')!;

    // Get singleton instances
    this.securityManager = SecurityManager.getInstance();
    this.configManager = ConfigManager.getInstance();

    // Subscribe to config changes
    this.configManager.onConfigChange(this.handleConfigChange.bind(this));
  }

  private handleConfigChange(config: any): void {
    log.info('Configuration changed, updating proxy server');

    // Update algorithms
    const primaryName = config.loadBalancer.algorithms['@_primary'];
    const fallbackName = config.loadBalancer.algorithms['@_fallback'];

    if (this.algorithms.has(primaryName)) {
      this.primaryAlgorithm = this.algorithms.get(primaryName)!;
      log.info(`Primary algorithm changed to ${primaryName}`);
    }

    if (this.algorithms.has(fallbackName)) {
      this.fallbackAlgorithm = this.algorithms.get(fallbackName)!;
      log.info(`Fallback algorithm changed to ${fallbackName}`);
    }
  }

  public async start(): Promise<void> {
    if (this.server) {
      log.info('Server already running');
      return;
    }

    try {
      // Initialize security manager
      await this.securityManager.initialize();

      // Start the server
      this.server = serve({
        port: this.port,
        hostname: this.host,
        fetch: this.handleRequest.bind(this),
        error: this.handleError.bind(this),
      });

      this.startTime = Date.now();
      log.info(`Proxy server started on ${this.host}:${this.port}`);

      // Start collecting stats for history
      this.startStatsCollection();
    } catch (error) {
      log.error('Error starting proxy server:', error);
      throw new Error(`Failed to start proxy server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private startStatsCollection(): void {
    // Collect stats every 10 seconds
    setInterval(() => {
      try {
        const instanceManager = InstanceManager.getInstance();
        if (!instanceManager) return;

        const stats = {
          timestamp: Date.now(),
          proxy: this.getStats(),
          instances: {
            total: instanceManager.getInstances().length,
            healthy: instanceManager.getHealthyInstances().length,
            main: {
              total: instanceManager.getMainInstances().length,
              healthy: instanceManager.getHealthyMainInstances().length,
            },
            chat: {
              total: instanceManager.getChatInstances().length,
              healthy: instanceManager.getHealthyChatInstances().length,
            }
          },
          // Get instance details for graphs
          instanceDetails: instanceManager.getInstances().map(instance => ({
            id: instance.id,
            type: instance.type,
            healthy: instance.healthy,
            connections: instance.connections,
            cpu: instance.cpu,
            memory: instance.memory,
            uptime: Date.now() - instance.startTime
          }))
        };

        // Add to history, keeping last 360 entries (1 hour at 10s intervals)
        this.statsHistory.push(stats);
        if (this.statsHistory.length > 360) {
          this.statsHistory.shift();
        }
      } catch (error) {
        log.error('Error collecting stats:', error);
      }
    }, 10000);
  }

  public stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
      log.info('Proxy server stopped');
    }
  }

  private async handleRequest(request: Request): Promise<Response> {
    this.requestCount++;
    const startTime = performance.now();

    log.debug(`Received request: ${request.method} ${request.url}`);
    log.debug(`Request headers: ${JSON.stringify(Object.fromEntries(request.headers.entries()))}`);

    try {
      // Parse the URL
      const url = new URL(request.url);

      // Check if this is a request to the stats dashboard
      if (url.pathname === '/stats' || url.pathname.startsWith('/stats/')) {
        return this.handleStatsDashboard(request, url);
      }

      // Check if this is a GET request to /chat endpoint
      if (request.method === 'GET' && url.pathname === '/chat') {
        log.debug('Chat endpoint requested, returning balanced chat server URL');

        // Get CORS headers
        const corsHeaders = this.securityManager.getCorsHeaders(request.headers.get('origin') || undefined);

        // Get available instances
        const instances = await this.getAvailableChatInstances();
        if (!instances || instances.length === 0) {
          return new Response(JSON.stringify({
            error: 'Service Unavailable',
            message: 'No chat servers available'
          }), {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            },
          });
        }

        // Get client IP
        const clientIp = this.getClientIP(request);

        // Select chat server instance using load balancing algorithm
        const instance = this.primaryAlgorithm.getNextInstance(instances, clientIp, url.pathname) || 
                         this.fallbackAlgorithm.getNextInstance(instances, clientIp, url.pathname);

        if (!instance) {
          return new Response(JSON.stringify({
            error: 'Service Unavailable',
            message: 'Failed to select chat server'
          }), {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            },
          });
        }

        // Return the chat server URL
        return new Response(JSON.stringify({
          url: `ws://localhost:${instance.port}/ws/chat`,
          serverId: instance.id
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
        });
      }

      // Get client IP
      const clientIp = this.getClientIP(request);

      // Check security (rate limiting, IP blocking, etc.)
      const securityCheck = this.securityManager.checkRateLimit(clientIp, request.url);
      if (!securityCheck.allowed) {
        log.debug(`Request blocked by rate limit: ${clientIp} -> ${request.url}`);

        // Get CORS headers
        const corsHeaders = this.securityManager.getCorsHeaders(request.headers.get('origin') || undefined);

        const headers = new Headers({
          'Content-Type': 'application/json',
        });

        // Add CORS headers
        Object.entries(corsHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });

        if (securityCheck.resetAt) {
          headers.set('X-RateLimit-Reset', securityCheck.resetAt.toString());
        }

        if (securityCheck.retryAfter) {
          headers.set('Retry-After', securityCheck.retryAfter.toString());
        }

        return new Response(JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
        }), {
          status: 429,
          headers,
        });
      }

      // Add CORS headers if needed
      const corsHeaders = this.securityManager.getCorsHeaders(request.headers.get('origin') || undefined);

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // Get available instances
      const instances = await this.getAvailableInstances();
      if (!instances || instances.length === 0) {
        log.error('No available instances to handle request');
        return new Response(JSON.stringify({
          error: 'Service Unavailable',
          message: 'No available instances',
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Select instance using load balancing algorithm
      let instance = this.primaryAlgorithm.getNextInstance(instances, clientIp, new URL(request.url).pathname);

      // If primary algorithm fails, use fallback
      if (!instance) {
        log.debug(`Primary algorithm ${this.primaryAlgorithm.name} failed to select an instance, using fallback ${this.fallbackAlgorithm.name}`);
        instance = this.fallbackAlgorithm.getNextInstance(instances, clientIp, new URL(request.url).pathname);

        if (!instance) {
          log.error('Both primary and fallback algorithms failed to select an instance');
          return new Response(JSON.stringify({
            error: 'Service Unavailable',
            message: 'Load balancing failed',
          }), {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Increment connection count for the selected instance
      instance.connections++;

      // Forward the request to the selected instance
      const targetUrl = new URL(request.url);
      targetUrl.host = `localhost:${instance.port}`;

      log.request(`${request.method} ${request.url} -> Instance ${instance.id} (${instance.port})`);

      // Clone the request with the new URL
      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: request.signal,
      });

      // Add proxy headers
      proxyRequest.headers.set('X-Forwarded-For', clientIp);
      proxyRequest.headers.set('X-Forwarded-Proto', targetUrl.protocol.replace(':', ''));
      proxyRequest.headers.set('X-Forwarded-Host', request.headers.get('host') || '');
      proxyRequest.headers.set('X-Forwarded-Port', this.port.toString());

      // Send the request to the target instance
      const response = await fetch(proxyRequest);

      // Create a new response with the target response and add CORS headers
      const proxyResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Add CORS headers to the response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        proxyResponse.headers.set(key, value);
      });

      // Add proxy information headers
      proxyResponse.headers.set('X-Proxy-Server', 'Voyage-LoadBalancer');

      // Decrement connection count when done
      instance.connections--;

      // Log request completion
      const duration = performance.now() - startTime;
      log.debug(`Request completed in ${duration.toFixed(2)}ms: ${request.method} ${request.url} -> ${response.status}`);

      return proxyResponse;
    } catch (error) {
      this.errorCount++;
      log.error(`Error handling request: ${error instanceof Error ? error.message : String(error)}`);

      // Get CORS headers even in error cases
      const corsHeaders = this.securityManager.getCorsHeaders(request.headers.get('origin') || undefined);

      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  }

  private handleError(error: Error, request?: Request): Response {
    this.errorCount++;
    log.error(`Server error: ${error.message}`);

    // Get CORS headers if we have a request
    const corsHeaders = request 
      ? this.securityManager.getCorsHeaders(request.headers.get('origin') || undefined)
      : {}; // Default empty headers if no request available

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  private getClientIP(request: Request): string {
    // Try to get IP from headers first (for when behind another proxy)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // Get the first IP in the list (client IP)
      return forwardedFor.split(',')[0].trim();
    }

    // Fallback to remote address if available
    const remoteAddr = request.headers.get('x-real-ip') || '127.0.0.1';
    return remoteAddr;
  }

  private async getAvailableInstances(): Promise<ServerInstance[]> {
    return InstanceManager.getInstance()?.getHealthyMainInstances() || []
  }

  private async getAvailableChatInstances(): Promise<ServerInstance[]> {
    return InstanceManager.getInstance()?.getHealthyChatInstances() || []
  }

  private async handleStatsDashboard(request: Request, url: URL): Promise<Response> {
    try {
      // Get CORS headers
      const corsHeaders = this.securityManager.getCorsHeaders(request.headers.get('origin') || undefined);

      // API endpoint for stats data
      if (url.pathname === '/stats/api/data') {
        const instanceManager = InstanceManager.getInstance();
        if (!instanceManager) {
          return new Response(JSON.stringify({ error: 'Instance manager not available' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Return current stats
        return new Response(JSON.stringify({
          current: {
            proxy: this.getStats(),
            instances: {
              total: instanceManager.getInstances().length,
              healthy: instanceManager.getHealthyInstances().length,
              main: {
                total: instanceManager.getMainInstances().length,
                healthy: instanceManager.getHealthyMainInstances().length,
              },
              chat: {
                total: instanceManager.getChatInstances().length,
                healthy: instanceManager.getHealthyChatInstances().length,
              }
            },
            instanceDetails: instanceManager.getInstances().map(instance => ({
              id: instance.id,
              type: instance.type,
              healthy: instance.healthy,
              connections: instance.connections,
              cpu: instance.cpu,
              memory: instance.memory,
              uptime: Date.now() - instance.startTime
            }))
          },
          history: this.statsHistory
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // API endpoint for stats data (limited history)
      if (url.pathname === '/stats/api/data/recent') {
        // Return only the most recent 60 entries (10 minutes at 10s intervals)
        const recentHistory = this.statsHistory.slice(-60);

        return new Response(JSON.stringify({
          history: recentHistory
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Serve static files from the stats dashboard
      const staticFilesDir = path.join(process.cwd(), 'load-balancer', 'src', 'html');

      // Default to index.html for the root path
      let filePath = url.pathname === '/stats' 
        ? path.join(staticFilesDir, 'index.html')
        : path.join(staticFilesDir, url.pathname.replace('/stats/', ''));

      try {
        // Check if the file exists
        await fs.access(filePath);

        // Read the file
        const content = await fs.readFile(filePath);

        // Determine content type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'text/plain';

        switch (ext) {
          case '.html':
            contentType = 'text/html';
            break;
          case '.css':
            contentType = 'text/css';
            break;
          case '.js':
            contentType = 'application/javascript';
            break;
          case '.json':
            contentType = 'application/json';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.svg':
            contentType = 'image/svg+xml';
            break;
        }

        // Return the file content
        return new Response(content, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            ...corsHeaders
          }
        });
      } catch (error) {
        // If it's not the index file or we couldn't create it, return 404
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    } catch (error) {
      log.error('Error handling stats dashboard request:', error);

      const corsHeaders = this.securityManager.getCorsHeaders(request.headers.get('origin') || undefined);

      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  public getStats(): {
    uptime: number;
    requestCount: number;
    errorCount: number;
    errorRate: number;
  } {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

    return {
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate,
    };
  }

  public resetStats(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    log.info('Proxy server stats reset');
  }
}

export default ProxyServer;
