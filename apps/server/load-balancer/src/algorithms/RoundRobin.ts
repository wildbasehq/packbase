import Debug from 'debug';
import { ServerInstance } from '../core/InstanceManager';
import { LoadBalancingAlgorithm } from './LoadBalancingAlgorithm';

const log = Debug('vg:lb:algorithm:round-robin');

/**
 * Round Robin load balancing algorithm
 * Distributes requests evenly across all available instances in a circular order
 */
export class RoundRobin implements LoadBalancingAlgorithm {
  private currentIndex: number = 0;
  public readonly name: string = 'round-robin';

  /**
   * Get the next server instance using round-robin algorithm
   * @param instances Available server instances
   * @returns The selected server instance or null if no instances are available
   */
  public getNextInstance(instances: ServerInstance[]): ServerInstance | null {
    if (!instances || instances.length === 0) {
      log('No instances available');
      return null;
    }

    // If we've reached the end of the array, start over
    if (this.currentIndex >= instances.length) {
      this.currentIndex = 0;
    }

    const instance = instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % instances.length;

    log(`Selected instance ${instance.id} (index ${this.currentIndex - 1})`);
    return instance;
  }

  /**
   * Reset the round-robin counter
   */
  public reset(): void {
    this.currentIndex = 0;
    log('Round-robin counter reset');
  }
}

export default RoundRobin;