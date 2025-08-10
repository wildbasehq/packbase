import Debug from 'debug';
import { ServerInstance } from '../core/InstanceManager';
import { LoadBalancingAlgorithm } from './LoadBalancingAlgorithm';

const log = Debug('vg:lb:algorithm:weighted-round-robin');

/**
 * Weighted Round Robin load balancing algorithm
 * Distributes requests across instances based on their weights
 */
export class WeightedRoundRobin implements LoadBalancingAlgorithm {
  public readonly name: string = 'weighted-round-robin';
  private currentIndex: number = 0;
  private currentWeight: number = 0;
  private maxWeight: number = 0;
  private gcd: number = 0;
  
  // Map to store weights for each instance ID
  private weights: Map<string, number> = new Map();

  /**
   * Create a new WeightedRoundRobin instance
   * @param instanceWeights Optional map of instance IDs to weights
   */
  constructor(instanceWeights?: Map<string, number>) {
    if (instanceWeights) {
      this.weights = new Map(instanceWeights);
    }
  }

  /**
   * Set the weight for a specific instance
   * @param instanceId The ID of the instance
   * @param weight The weight to assign (higher means more requests)
   */
  public setWeight(instanceId: string, weight: number): void {
    if (weight <= 0) {
      throw new Error('Weight must be a positive number');
    }
    this.weights.set(instanceId, weight);
    log(`Set weight ${weight} for instance ${instanceId}`);
  }

  /**
   * Get the weight for a specific instance
   * @param instanceId The ID of the instance
   * @returns The weight or 1 if not explicitly set
   */
  public getWeight(instanceId: string): number {
    return this.weights.get(instanceId) || 1;
  }

  /**
   * Calculate the greatest common divisor of two numbers
   * @param a First number
   * @param b Second number
   * @returns The GCD
   */
  private calculateGCD(a: number, b: number): number {
    return b === 0 ? a : this.calculateGCD(b, a % b);
  }

  /**
   * Calculate the GCD of multiple numbers
   * @param numbers Array of numbers
   * @returns The GCD of all numbers
   */
  private calculateMultipleGCD(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) return numbers[0];
    
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      result = this.calculateGCD(result, numbers[i]);
    }
    
    return result;
  }

  /**
   * Initialize the algorithm with the current set of instances
   * @param instances The available instances
   */
  private initialize(instances: ServerInstance[]): void {
    // Find the maximum weight and calculate GCD
    this.maxWeight = 0;
    const weights: number[] = [];
    
    for (const instance of instances) {
      const weight = this.getWeight(instance.id);
      weights.push(weight);
      if (weight > this.maxWeight) {
        this.maxWeight = weight;
      }
    }
    
    this.gcd = this.calculateMultipleGCD(weights);
    this.currentIndex = 0;
    this.currentWeight = 0;
    
    log(`Initialized with max weight ${this.maxWeight} and GCD ${this.gcd}`);
  }

  /**
   * Get the next server instance using weighted round-robin algorithm
   * @param instances Available server instances
   * @returns The selected server instance or null if no instances are available
   */
  public getNextInstance(instances: ServerInstance[]): ServerInstance | null {
    if (!instances || instances.length === 0) {
      log('No instances available');
      return null;
    }

    // If only one instance, return it
    if (instances.length === 1) {
      log(`Only one instance available, selected ${instances[0].id}`);
      return instances[0];
    }

    // Initialize if needed
    if (this.maxWeight === 0) {
      this.initialize(instances);
    }

    // Implementation of the Modified Weighted Round-Robin algorithm
    while (true) {
      this.currentIndex = (this.currentIndex + 1) % instances.length;
      
      if (this.currentIndex === 0) {
        this.currentWeight = this.currentWeight - this.gcd;
        if (this.currentWeight <= 0) {
          this.currentWeight = this.maxWeight;
          if (this.currentWeight === 0) {
            // All weights are zero, fallback to simple round-robin
            log('All weights are zero, using simple round-robin');
            return instances[0];
          }
        }
      }
      
      const instance = instances[this.currentIndex];
      const weight = this.getWeight(instance.id);
      
      if (weight >= this.currentWeight) {
        log(`Selected instance ${instance.id} with weight ${weight}`);
        return instance;
      }
    }
  }

  /**
   * Reset the algorithm state
   */
  public reset(): void {
    this.currentIndex = 0;
    this.currentWeight = 0;
    this.maxWeight = 0;
    this.gcd = 0;
    log('Weighted round-robin state reset');
  }
}

export default WeightedRoundRobin;