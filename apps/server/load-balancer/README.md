# Voyage Load Balancer

A dynamic load balancer for Bun applications with advanced features for scaling, security, and high availability.

## Features

- **Dynamic Instance Management**: Automatically scales server instances based on traffic patterns and resource usage
- **Multiple Load Balancing Algorithms**:
  - Round Robin
  - Least Connections
  - Weighted Round Robin
  - IP Hash (session affinity)
- **Security Features**:
  - Rate limiting with configurable thresholds
  - DDoS protection with automatic IP blocking
  - IP whitelisting/blacklisting
  - CORS configuration
  - SSL/TLS termination
- **Clustering & High Availability**:
  - Parent-child architecture
  - Configuration synchronization
  - Automatic failover
  - Heartbeat monitoring
- **Health Monitoring**:
  - Real-time health checks
  - Circuit breaker pattern
  - Automatic recovery
- **Traffic Analysis**:
  - Real-time metrics collection
  - Predictive scaling
  - Configurable scaling triggers

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Voyage-load-balancer.git

# Install dependencies
cd Voyage-load-balancer
bun install
```

## Configuration

The load balancer is configured using an XML file. A default configuration is provided at `config/load-balancer.xml`.

Example configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<loadBalancer>
  <instances min="2" max="10" />
  <ports range="8000-8100" />
  <algorithms primary="round-robin" fallback="least-connections" />
  <security>
    <rateLimit requests="1000" window="60" />
    <cors enabled="true" />
    <ssl enabled="true" cert="path/to/cert" />
  </security>
  <clustering>
    <role>parent</role>
    <parentUrl>https://parent-lb.example.com</parentUrl>
    <syncInterval>30</syncInterval>
  </clustering>
</loadBalancer>
```

## Usage

### Command Line

```bash
# Start with default configuration
bun run load-balancer

# Start with custom configuration
bun run load-balancer --config=path/to/config.xml

# Start on a specific port
bun run load-balancer --port=8080

# Show help
bun run load-balancer --help
```

### Programmatic Usage

```typescript
import { LoadBalancer } from 'Voyage-load-balancer';

// Create a load balancer instance
const loadBalancer = new LoadBalancer({
  configPath: 'path/to/config.xml',
  port: 8080,
  host: '0.0.0.0',
});

// Start the load balancer
await loadBalancer.start();

// Get statistics
const stats = loadBalancer.getStats();
console.log(stats);

// Stop the load balancer
await loadBalancer.stop();
```

## Architecture

The load balancer consists of several components:

1. **ConfigManager**: Handles XML configuration parsing and validation
2. **InstanceManager**: Manages server instances and scaling
3. **HealthChecker**: Monitors instance health and implements circuit breaker
4. **ProxyServer**: Handles HTTP/HTTPS proxying between clients and instances
5. **SecurityManager**: Implements security features like rate limiting
6. **ClusterManager**: Coordinates between parent and child nodes
7. **TrafficAnalyzer**: Analyzes traffic patterns for scaling decisions
8. **LoadBalancingAlgorithms**: Implements various load balancing strategies

## Health Endpoint

The load balancer automatically creates a health endpoint at `/health` in your application. This endpoint returns information about the instance's health, including memory usage, CPU usage, and connection count.

## Development

### Building

```bash
# Build the project
bun run build
```

### Testing

```bash
# Run tests
bun test
```

## License

MIT