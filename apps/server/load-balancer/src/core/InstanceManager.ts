import Debug from 'debug';
import { spawn, type ChildProcess } from 'node:child_process';
import os from 'node:os';
import ConfigManager from '../config/ConfigManager';
import { HealthChecker } from './HealthChecker';

const log = {
    info: Debug('vg:lb:instance:info'),
    error: Debug('vg:lb:instance:error'),
    debug: Debug('vg:lb:instance:debug'),
};

export type ServerType = 'main' | 'chat';

export interface ServerInstance {
    id: string;
    type: ServerType;
    process: ChildProcess;
    port: number;
    startTime: number;
    healthy: boolean;
    connections: number;
    cpu: number;
    memory: number;
}

export class InstanceManager {
    private static instance: InstanceManager;
    private instances: Map<string, ServerInstance> = new Map();
    private mainInstances: Map<string, ServerInstance> = new Map();
    private chatInstances: Map<string, ServerInstance> = new Map();
    private availableMainPorts: number[] = [];
    private availableChatPorts: number[] = [];
    private configManager: ConfigManager;
    private healthChecker: HealthChecker;
    private isScaling: boolean = false;
    private isChatScaling: boolean = false;
    private cooldownPeriod: number = 1; // 30 seconds cooldown between scaling operations
    private lastScaleTime: number = 0;
    private lastChatScaleTime: number = 0;
    private mainCleanupInterval: NodeJS.Timeout | null = null;
    private chatCleanupInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.configManager = ConfigManager.getInstance();
        this.healthChecker = new HealthChecker();

        // Subscribe to config changes
        this.configManager.onConfigChange(this.handleConfigChange.bind(this));
    }

    public static getInstance(skipInstanceCreation = false): InstanceManager {
        if (!InstanceManager.instance && !skipInstanceCreation) {
            InstanceManager.instance = new InstanceManager();
        }
        return InstanceManager.instance || null;
    }

    public async initialize(): Promise<void> {
        try {
            // Load configuration
            const config = await this.configManager.loadConfig();

            // Initialize available ports for main server
            this.initializeMainPorts(config.loadBalancer.ports['@_range']);

            // Start initial main server instances
            const minMainInstances = config.loadBalancer.instances['@_min'];
            await this.ensureMainInstanceCount(minMainInstances);

            // Start health checking for all instances
            this.healthChecker.startHealthChecks(this.instances);

            // Start cleanup intervals
            const mainCleanupInterval = config.loadBalancer.instances['@_cleanupInterval'] || 300;
            this.startMainInstanceCleanup(mainCleanupInterval);

            if (config.loadBalancer.chatServer?.enabled) {
                const chatCleanupInterval = config.loadBalancer.chatServer.instances['@_cleanupInterval'] || 300;
                this.startChatInstanceCleanup(chatCleanupInterval);
            }

            log.info(`Instance manager initialized with ${this.mainInstances.size} main instances and ${this.chatInstances.size} chat instances`);
        } catch (error) {
            log.error('Error initializing instance manager:', error);
            throw new Error(`Failed to initialize instance manager: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private initializeMainPorts(portRange: string): void {
        const [startStr, endStr] = portRange.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end) || start >= end) {
            throw new Error(`Invalid main server port range: ${portRange}`);
        }

        this.availableMainPorts = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        log.debug(`Initialized main server port range: ${start}-${end}`);
    }

    private initializeChatPorts(portRange: string): void {
        const [startStr, endStr] = portRange.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end) || start >= end) {
            throw new Error(`Invalid chat server port range: ${portRange}`);
        }

        this.availableChatPorts = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        log.debug(`Initialized chat server port range: ${start}-${end}`);
    }

    private async handleConfigChange(config: any): Promise<void> {
        log.info('Configuration changed, updating instance manager');

        // Update main server port range if changed
        this.initializeMainPorts(config.loadBalancer.ports['@_range']);

        // Adjust main server instance count if min/max changed
        const minMainInstances = config.loadBalancer.instances['@_min'];
        const currentMainCount = this.mainInstances.size;

        if (currentMainCount < minMainInstances) {
            await this.scaleUpMain(minMainInstances - currentMainCount);
        } else if (currentMainCount > config.loadBalancer.instances['@_max']) {
            await this.scaleDownMain(currentMainCount - config.loadBalancer.instances['@_max']);
        }

        // Update main instance cleanup interval
        const mainCleanupInterval = config.loadBalancer.instances['@_cleanupInterval'] || 300;
        this.startMainInstanceCleanup(mainCleanupInterval);
    }

    public async ensureInstanceCount(count: number): Promise<void> {
        // For backward compatibility, this now delegates to ensureMainInstanceCount
        await this.ensureMainInstanceCount(count);
    }

    public async ensureMainInstanceCount(count: number): Promise<void> {
        const currentCount = this.mainInstances.size;

        if (currentCount < count) {
            await this.scaleUpMain(count - currentCount);
        } else if (currentCount > count) {
            await this.scaleDownMain(currentCount - count);
        }
    }

    public async scaleUp(count: number): Promise<void> {
        // For backward compatibility, this now delegates to scaleUpMain
        await this.scaleUpMain(count);
    }

    public async scaleUpMain(count: number): Promise<void> {
        if (this.isScaling) {
            log.info('Main server scaling operation already in progress, skipping');
            return;
        }

        const now = Date.now();
        if (now - this.lastScaleTime < this.cooldownPeriod) {
            log.info('Main server in cooldown period, skipping scale up');
            return;
        }

        this.isScaling = true;
        this.lastScaleTime = now;

        try {
            const config = this.configManager.getConfig();
            const maxInstances = config.loadBalancer.instances['@_max'];

            // Ensure we don't exceed max instances
            const currentCount = this.mainInstances.size;
            const targetCount = Math.min(currentCount + count, maxInstances);
            const actualScaleCount = targetCount - currentCount;

            if (actualScaleCount <= 0) {
                log.info(`Main server already at maximum instance count (${maxInstances}), not scaling up`);
                return;
            }

            log.info(`Scaling up main server by ${actualScaleCount} instances (${currentCount} -> ${targetCount})`);

            // Start new instances
            for (let i = 0; i < actualScaleCount; i++) {
                await this.startMainInstance();
            }
        } catch (error) {
            log.error('Error scaling up main server:', error);
        } finally {
            this.isScaling = false;
        }
    }

    public async scaleDown(count: number): Promise<void> {
        // For backward compatibility, this now delegates to scaleDownMain
        await this.scaleDownMain(count);
    }

    public async scaleDownMain(count: number): Promise<void> {
        if (this.isScaling) {
            log.info('Main server scaling operation already in progress, skipping');
            return;
        }

        const now = Date.now();
        if (now - this.lastScaleTime < this.cooldownPeriod) {
            log.info('Main server in cooldown period, skipping scale down');
            return;
        }

        this.isScaling = true;
        this.lastScaleTime = now;

        try {
            const config = this.configManager.getConfig();
            const minInstances = config.loadBalancer.instances['@_min'];

            // Ensure we don't go below min instances
            const currentCount = this.mainInstances.size;
            const targetCount = Math.max(currentCount - count, minInstances);
            const actualScaleCount = currentCount - targetCount;

            if (actualScaleCount <= 0) {
                log.info(`Main server already at minimum instance count (${minInstances}), not scaling down`);
                return;
            }

            log.info(`Scaling down main server by ${actualScaleCount} instances (${currentCount} -> ${targetCount})`);

            // Find instances to stop (prefer unhealthy or least busy)
            const instancesToStop = Array.from(this.mainInstances.values())
                .filter((instance) => !instance.healthy || instance.connections === 0)
                .sort((a, b) => {
                    // Prioritize unhealthy instances
                    if (a.healthy !== b.healthy) {
                        return a.healthy ? 1 : -1;
                    }
                    // Then prioritize instances with fewer connections
                    return a.connections - b.connections;
                })
                .slice(0, actualScaleCount);

            // If we don't have enough unhealthy or idle instances, take the least busy ones
            if (instancesToStop.length < actualScaleCount) {
                const remainingCount = actualScaleCount - instancesToStop.length;
                const busyInstances = Array.from(this.mainInstances.values())
                    .filter((instance) => instance.healthy && instance.connections > 0)
                    .sort((a, b) => a.connections - b.connections)
                    .slice(0, remainingCount);

                instancesToStop.push(...busyInstances);
            }

            // Stop instances
            for (const instance of instancesToStop) {
                await this.stopInstance(instance.id);
            }
        } catch (error) {
            log.error('Error scaling down main server:', error);
        } finally {
            this.isScaling = false;
        }
    }

    public async scaleDownChat(count: number): Promise<void> {
        if (this.isChatScaling) {
            log.info('Chat server scaling operation already in progress, skipping');
            return;
        }

        const now = Date.now();
        if (now - this.lastChatScaleTime < this.cooldownPeriod) {
            log.info('Chat server in cooldown period, skipping scale down');
            return;
        }

        this.isChatScaling = true;
        this.lastChatScaleTime = now;

        try {
            const config = this.configManager.getConfig();
            if (!config.loadBalancer.chatServer?.enabled) {
                log.info('Chat server is disabled, not scaling down');
                return;
            }

            const minInstances = config.loadBalancer.chatServer.instances['@_min'];

            // Ensure we don't go below min instances
            const currentCount = this.chatInstances.size;
            const targetCount = Math.max(currentCount - count, minInstances);
            const actualScaleCount = currentCount - targetCount;

            if (actualScaleCount <= 0) {
                log.info(`Chat server already at minimum instance count (${minInstances}), not scaling down`);
                return;
            }

            log.info(`Scaling down chat server by ${actualScaleCount} instances (${currentCount} -> ${targetCount})`);

            // Find instances to stop (prefer unhealthy or least busy)
            const instancesToStop = Array.from(this.chatInstances.values())
                .filter((instance) => !instance.healthy || instance.connections === 0)
                .sort((a, b) => {
                    // Prioritize unhealthy instances
                    if (a.healthy !== b.healthy) {
                        return a.healthy ? 1 : -1;
                    }
                    // Then prioritize instances with fewer connections
                    return a.connections - b.connections;
                })
                .slice(0, actualScaleCount);

            // If we don't have enough unhealthy or idle instances, take the least busy ones
            if (instancesToStop.length < actualScaleCount) {
                const remainingCount = actualScaleCount - instancesToStop.length;
                const busyInstances = Array.from(this.chatInstances.values())
                    .filter((instance) => instance.healthy && instance.connections > 0)
                    .sort((a, b) => a.connections - b.connections)
                    .slice(0, remainingCount);

                instancesToStop.push(...busyInstances);
            }

            // Stop instances
            for (const instance of instancesToStop) {
                await this.stopInstance(instance.id);
            }
        } catch (error) {
            log.error('Error scaling down chat server:', error);
        } finally {
            this.isChatScaling = false;
        }
    }

    private async startInstance(): Promise<ServerInstance | null> {
        // For backward compatibility, this now delegates to startMainInstance
        return this.startMainInstance();
    }

    private async startMainInstance(): Promise<ServerInstance | null> {
        try {
            // Get an available port
            const port = this.getNextAvailableMainPort();
            if (port === null) {
                throw new Error('No available ports for main server');
            }

            // Generate a unique ID for the instance
            const id = `main-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            log.info(`Starting new main server instance ${id} on port ${port}`);

            // Start the server process
            const serverProcess = spawn('bun', ['run', 'src/index.ts'], {
                env: {
                    ...process.env,
                    PORT: port.toString(),
                    INSTANCE_ID: id,
                },
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false,
            });

            // Create instance object
            const instance: ServerInstance = {
                id,
                type: 'main',
                process: serverProcess,
                port,
                startTime: Date.now(),
                healthy: false, // Will be updated by health checker
                connections: 0,
                cpu: 0,
                memory: 0,
            };

            // Set up logging for the instance
            serverProcess.stdout?.on('data', (data) => {
                log.debug(`[${id}] ${data.toString().trim()}`);
            });

            serverProcess.stderr?.on('data', (data) => {
                log.error(`[${id}] ${data.toString().trim()}`);
            });

            // Handle process exit
            serverProcess.on('exit', (code, signal) => {
                log.info(`Main server instance ${id} exited with code ${code} and signal ${signal}`);
                this.mainInstances.delete(id);
                this.instances.delete(id);
                this.releaseMainPort(port);

                // Auto-restart if it wasn't intentionally stopped
                if (code !== 0 && this.mainInstances.size < this.configManager.getConfig().loadBalancer.instances['@_min']) {
                    log.info(`Auto-restarting main server instance to maintain minimum count`);
                    this.startMainInstance().catch((err) => {
                        log.error('Error auto-restarting main server instance:', err);
                    });
                }
            });

            // Store the instance
            this.mainInstances.set(id, instance);
            this.instances.set(id, instance); // For backward compatibility

            // Wait for the instance to start up
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Main server instance ${id} failed to start within timeout`));
                }, 10000); // 10 second timeout

                const checkInterval = setInterval(async () => {
                    try {
                        const isHealthy = await this.healthChecker.checkInstanceHealth(instance);
                        if (isHealthy) {
                            clearInterval(checkInterval);
                            clearTimeout(timeout);
                            instance.healthy = true;
                            resolve();
                        }
                    } catch (error) {
                        // Ignore errors during startup checks
                    }
                }, 500);

                // Also resolve if the process outputs a specific message
                serverProcess.stdout?.on('data', (data) => {
                    if (data.toString().includes('Server OK')) {
                        clearInterval(checkInterval);
                        clearTimeout(timeout);
                        instance.healthy = true;
                        resolve();
                    }
                });
            });

            log.info(`Main server instance ${id} started successfully on port ${port}`);
            return instance;
        } catch (error) {
            log.error('Error starting main server instance:', error);
            return null;
        }
    }

    private async stopInstance(id: string): Promise<boolean> {
        // Check in main instances first
        let instance = this.mainInstances.get(id);
        let instanceType: ServerType = 'main';

        // If not found in main instances, check in chat instances
        if (!instance) {
            instance = this.chatInstances.get(id);
            instanceType = 'chat';
        }

        // If still not found, check in the combined instances map (for backward compatibility)
        if (!instance) {
            instance = this.instances.get(id);
            instanceType = instance?.type || 'main';
        }

        if (!instance) {
            log.error(`Instance ${id} not found`);
            return false;
        }

        log.info(`Stopping ${instanceType} instance ${id}`);

        try {
            // Send SIGTERM to allow graceful shutdown
            instance.process.kill('SIGTERM');

            // Wait for process to exit
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    // Force kill if it doesn't exit gracefully
                    instance!.process.kill('SIGKILL');
                    resolve();
                }, 5000); // 5 second timeout for graceful shutdown

                instance.process.once('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });

            // Clean up
            if (instanceType === 'main') {
                this.mainInstances.delete(id);
                this.releaseMainPort(instance.port);
            } else if (instanceType === 'chat') {
                this.chatInstances.delete(id);
                this.releaseChatPort(instance.port);
            }

            // Also remove from combined instances map
            this.instances.delete(id);

            log.info(`${instanceType.charAt(0).toUpperCase() + instanceType.slice(1)} instance ${id} stopped successfully`);
            return true;
        } catch (error) {
            log.error(`Error stopping ${instanceType} instance ${id}:`, error);
            return false;
        }
    }

    private getNextAvailableMainPort(): number | null {
        if (this.availableMainPorts.length === 0) {
            return null;
        }
        return this.availableMainPorts.shift() || null;
    }

    private getNextAvailableChatPort(): number | null {
        if (this.availableChatPorts.length === 0) {
            return null;
        }
        return this.availableChatPorts.shift() || null;
    }

    private releaseMainPort(port: number): void {
        this.availableMainPorts.push(port);
    }

    private releaseChatPort(port: number): void {
        this.availableChatPorts.push(port);
    }

    // For backward compatibility
    private getNextAvailablePort(): number | null {
        return this.getNextAvailableMainPort();
    }

    // For backward compatibility
    private releasePort(port: number): void {
        this.releaseMainPort(port);
    }

    public getInstances(): ServerInstance[] {
        // Combine main and chat instances
        return [...Array.from(this.mainInstances.values()), ...Array.from(this.chatInstances.values())];
    }

    public getMainInstances(): ServerInstance[] {
        return Array.from(this.mainInstances.values());
    }

    public getChatInstances(): ServerInstance[] {
        return Array.from(this.chatInstances.values());
    }

    public getHealthyInstances(): ServerInstance[] {
        return this.getInstances().filter((instance) => instance.healthy);
    }

    public getHealthyMainInstances(): ServerInstance[] {
        return this.getMainInstances().filter((instance) => instance.healthy);
    }

    public getHealthyChatInstances(): ServerInstance[] {
        return this.getChatInstances().filter((instance) => instance.healthy);
    }

    public updateInstanceMetrics(id: string, metrics: Partial<ServerInstance>): void {
        // Check in main instances first
        let instance = this.mainInstances.get(id);
        if (instance) {
            Object.assign(instance, metrics);
            return;
        }

        // Then check in chat instances
        instance = this.chatInstances.get(id);
        if (instance) {
            Object.assign(instance, metrics);
            return;
        }

        // For backward compatibility, check in the combined instances map
        instance = this.instances.get(id);
        if (instance) {
            Object.assign(instance, metrics);
        }
    }

    public async analyzeResourceUsage(): Promise<void> {
        // Get current system metrics
        const cpuCount = os.cpus().length;
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();

        const memoryUsage = (totalMemory - freeMemory) / totalMemory;

        // Analyze main server instances
        await this.analyzeMainServerResourceUsage(memoryUsage, cpuCount);
    }

    private async analyzeMainServerResourceUsage(memoryUsage: number, cpuCount: number): Promise<void> {
        // Get average connections per main instance
        const mainInstances = this.getHealthyMainInstances();
        const totalMainConnections = mainInstances.reduce((sum, instance) => sum + instance.connections, 0);
        const avgMainConnections = mainInstances.length > 0 ? totalMainConnections / mainInstances.length : 0;

        log.debug(`Main server metrics - CPU cores: ${cpuCount}, Memory usage: ${(memoryUsage * 100).toFixed(2)}%, Avg connections: ${avgMainConnections.toFixed(2)}`);

        // Scale based on resource usage
        const config = this.configManager.getConfig();
        const currentMainCount = this.mainInstances.size;
        const maxMainInstances = config.loadBalancer.instances['@_max'];
        const minMainInstances = config.loadBalancer.instances['@_min'];
        const thresholdMax = config.loadBalancer.instances['@_thresholdMax'];
        const thresholdMin = config.loadBalancer.instances['@_thresholdMin'];

        // Scale up if:
        // 1. Memory usage is high (>80%)
        // 2. Average connections per instance is high (>100)
        // 3. We're not already at max instances
        if ((memoryUsage > (thresholdMax || 0.8) || avgMainConnections > 100) && currentMainCount < maxMainInstances) {
            log.info(`High main server resource usage detected, scaling up`);
            await this.scaleUpMain(1);
        }

        // Scale down if:
        // 1. Memory usage is low (<50%)
        // 2. Average connections per instance is low (<20)
        // 3. We're not already at min instances
        if (memoryUsage < (thresholdMin || 0.5) && avgMainConnections < 20 && currentMainCount > minMainInstances) {
            log.info(`Low main server resource usage detected, scaling down`);
            await this.scaleDownMain(1);
        }
    }

    public startResourceMonitoring(interval: number = 60000): void {
        setInterval(() => {
            this.analyzeResourceUsage().catch((err) => {
                log.error('Error analyzing resource usage:', err);
            });
        }, interval);

        log.info(`Started resource monitoring with interval ${interval}ms`);
    }

    /**
     * Starts the cleanup interval for main instances
     * @param intervalSeconds Interval in seconds between cleanup checks
     */
    private startMainInstanceCleanup(intervalSeconds: number): void {
        // Clear existing interval if any
        if (this.mainCleanupInterval) {
            clearInterval(this.mainCleanupInterval);
            this.mainCleanupInterval = null;
        }

        // Start new interval if a positive interval is provided
        if (intervalSeconds > 0) {
            log.info(`Starting main instance cleanup with interval of ${intervalSeconds} seconds`);
            this.mainCleanupInterval = setInterval(() => {
                this.cleanupMainInstances();
            }, intervalSeconds * 1000);
        }
    }

    /**
     * Starts the cleanup interval for chat instances
     * @param intervalSeconds Interval in seconds between cleanup checks
     */
    private startChatInstanceCleanup(intervalSeconds: number): void {
        // Clear existing interval if any
        if (this.chatCleanupInterval) {
            clearInterval(this.chatCleanupInterval);
            this.chatCleanupInterval = null;
        }

        // Start new interval if a positive interval is provided
        if (intervalSeconds > 0) {
            log.info(`Starting chat instance cleanup with interval of ${intervalSeconds} seconds`);
            this.chatCleanupInterval = setInterval(() => {
                this.cleanupChatInstances();
            }, intervalSeconds * 1000);
        }
    }

    /**
     * Checks for idle main instances and scales down if necessary
     */
    private async cleanupMainInstances(): Promise<void> {
        try {
            // Skip if we're already scaling or in cooldown period
            if (this.isScaling || Date.now() - this.lastScaleTime < this.cooldownPeriod) {
                return;
            }

            const config = this.configManager.getConfig();
            const minInstances = config.loadBalancer.instances['@_min'];
            const currentCount = this.mainInstances.size;

            // Don't scale below minimum
            if (currentCount <= minInstances) {
                return;
            }

            // Find idle instances (healthy but with no connections)
            const idleInstances = Array.from(this.mainInstances.values()).filter((instance) => instance.healthy && instance.connections === 0);

            // If we have idle instances, scale down by 1
            if (idleInstances.length > 0) {
                log.info(`Found ${idleInstances.length} idle main instances, scaling down by 1`);
                await this.scaleDownMain(1);
            }
        } catch (error) {
            log.error('Error cleaning up main instances:', error);
        }
    }

    /**
     * Checks for idle chat instances and scales down if necessary
     */
    private async cleanupChatInstances(): Promise<void> {
        try {
            // Skip if we're already scaling or in cooldown period
            if (this.isChatScaling || Date.now() - this.lastChatScaleTime < this.cooldownPeriod) {
                return;
            }

            const config = this.configManager.getConfig();

            // Skip if chat server is not enabled
            if (!config.loadBalancer.chatServer?.enabled) {
                return;
            }

            const minInstances = config.loadBalancer.chatServer.instances['@_min'];
            const currentCount = this.chatInstances.size;

            // Don't scale below minimum
            if (currentCount <= minInstances) {
                return;
            }

            // Find idle instances (healthy but with no connections)
            const idleInstances = Array.from(this.chatInstances.values()).filter((instance) => instance.healthy && instance.connections === 0);

            // If we have idle instances, scale down by 1
            if (idleInstances.length > 0) {
                log.info(`Found ${idleInstances.length} idle chat instances, scaling down by 1`);
                await this.scaleDownChat(1);
            }
        } catch (error) {
            log.error('Error cleaning up chat instances:', error);
        }
    }
}

export default InstanceManager;
