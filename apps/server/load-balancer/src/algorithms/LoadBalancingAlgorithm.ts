import { ServerInstance } from '../core/InstanceManager';

export interface LoadBalancingAlgorithm {
  /**
   * Get the next server instance to handle a request
   * @param instances Available server instances
   * @param clientIp Optional client IP address for algorithms that use it
   * @param path Optional request path for algorithms that use it
   * @returns The selected server instance or null if no instances are available
   */
  getNextInstance(
    instances: ServerInstance[],
    clientIp?: string,
    path?: string
  ): ServerInstance | null;
  
  /**
   * Name of the algorithm
   */
  readonly name: string;
}

export default LoadBalancingAlgorithm;