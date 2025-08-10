#!/usr/bin/env bun
import Debug from 'debug';
import { LoadBalancer } from './core/LoadBalancer';
import path from 'node:path';
import fs from 'node:fs/promises';

const log = {
  info: Debug('vg:lb:main:info'),
  error: Debug('vg:lb:main:error'),
  debug: Debug('vg:lb:main:debug'),
};

// Parse command line arguments
const args = process.argv.slice(2);
const configPath = args.find(arg => arg.startsWith('--config='))?.split('=')[1];
const port = args.find(arg => arg.startsWith('--port='))?.split('=')[1];
const host = args.find(arg => arg.startsWith('--host='))?.split('=')[1];
const help = args.includes('--help') || args.includes('-h');
const version = args.includes('--version') || args.includes('-v');

// Show help
if (help) {
  console.log(`
Voyage LB

Usage:
  bun run load-balancer [options]

Options:
  --config=<path>    Path to the configuration file (default: config/load-balancer.xml)
  --port=<port>      Port to listen on (overrides config file)
  --host=<host>      Host to listen on (overrides config file)
  --help, -h         Show this help message
  --version, -v      Show version information
  `);
  process.exit(0);
}

// Show version
if (version) {
  // Read version from package.json
  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
  fs.readFile(packageJsonPath, 'utf-8')
    .then(data => {
      const packageJson = JSON.parse(data);
      console.log(`Voyage Load Balancer v${packageJson.version}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error reading package.json:', err);
      console.log('Voyage Load Balancer (version unknown)');
      process.exit(1);
    });
} else {
  // Start the load balancer
  startLoadBalancer();
}

async function startLoadBalancer() {
  try {
    log.info('Starting Voyage Load Balancer');
    
    // Create load balancer instance
    const loadBalancer = new LoadBalancer({
      configPath: configPath,
      port: port ? parseInt(port, 10) : undefined,
      host: host,
    });
    
    // Start the load balancer
    await loadBalancer.start();
    
    // Handle process signals for graceful shutdown
    process.on('SIGINT', async () => {
      log.info('Received SIGINT, shutting down...');
      await loadBalancer.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      log.info('Received SIGTERM, shutting down...');
      await loadBalancer.stop();
      process.exit(0);
    });
    
    // Log success
    log.info('Voyage Load Balancer started successfully');
    
    // Periodically log stats
    setInterval(() => {
      const stats = loadBalancer.getStats();
      log.info('Load balancer stats:', stats);
    }, 60000); // Every minute
  } catch (error) {
    log.error('Error starting load balancer:', error);
    process.exit(1);
  }
}

// Export the LoadBalancer class for programmatic usage
export { LoadBalancer };
export * from './core/LoadBalancer';
export * from './core/InstanceManager';
export * from './core/HealthChecker';
export * from './core/TrafficAnalyzer';
export * from './config/ConfigManager';
export * from './networking/ProxyServer';
export * from './networking/SecurityManager';
export * from './clustering/ClusterManager';
export * from './algorithms/LoadBalancingAlgorithm';
export * from './algorithms/RoundRobin';
export * from './algorithms/LeastConnections';
export * from './algorithms/WeightedRoundRobin';
export * from './algorithms/IPHash';

// Default export for convenience
export default LoadBalancer;