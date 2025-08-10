import Debug from 'debug';
import { ServerInstance } from '../core/InstanceManager';
import { LoadBalancingAlgorithm } from './LoadBalancingAlgorithm';

const log = Debug('vg:lb:algorithm:least-connections');

/**
 * Least Connections load balancing algorithm
 * Selects the server instance with the fewest active connections
 */
export class LeastConnections implements LoadBalancingAlgorithm {
  public readonly name: string = 'least-connections';

  /**
   * Get the server instance with the least number of active connections
   * @param instances Available server instances
   * @returns The selected server instance or null if no instances are available
   */
  public getNextInstance(instances: ServerInstance[]): ServerInstance | null {
    if (!instances || instances.length === 0) {
      log('No instances available');
      return null;
    }

    // Sort instances by connection count (ascending)
    const sortedInstances = [...instances].sort((a, b) => a.connections - b.connections);
    
    // Get the instance with the least connections
    const instance = sortedInstances[0];
    
    log(`Selected instance ${instance.id} with ${instance.connections} connections`);
    return instance;
  }
}

export default LeastConnections;