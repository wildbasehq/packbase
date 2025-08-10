import Debug from 'debug';
import ConfigManager from '../config/ConfigManager';
import { LoadBalancerConfig } from '../config/ConfigManager';
import {Server, ServerWebSocket} from 'bun'

const log = {
  info: Debug('vg:lb:cluster:info'),
  error: Debug('vg:lb:cluster:error'),
  debug: Debug('vg:lb:cluster:debug'),
};

export type ClusterRole = 'parent' | 'child';

export interface ClusterNodeInfo {
  id: string;
  role: ClusterRole;
  url: string;
  instanceCount: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastSeen: number;
}

export interface ClusterMessage {
  type: 'heartbeat' | 'config-sync' | 'status-update' | 'command';
  senderId: string;
  timestamp: number;
  payload: any;
}

interface ChildNodeConnection {
  ws: ServerWebSocket<{ nodeId?: string }>;
  info: ClusterNodeInfo;
}

export class ClusterManager {
  private static instance: ClusterManager;
  private configManager: ConfigManager;
  private nodeId: string;
  private role: ClusterRole = 'parent';
  private parentUrl: string | null = null;
  private syncInterval: number = 30; // seconds
  private syncIntervalId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;

  // WebSocket server for parent node
  private server: Server | null = null;

  // WebSocket client for child node
  private parentConnection: WebSocket | null = null;

  // Connected child nodes (for parent)
  private childNodes: Map<string, ChildNodeConnection> = new Map();

  // All known nodes in the cluster (including this node)
  private clusterNodes: Map<string, ClusterNodeInfo> = new Map();

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.nodeId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Subscribe to config changes
    this.configManager.onConfigChange(this.handleConfigChange.bind(this));
  }

  public static getInstance(): ClusterManager {
    if (!ClusterManager.instance) {
      ClusterManager.instance = new ClusterManager();
    }
    return ClusterManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load configuration
      const config = await this.configManager.loadConfig();
      this.updateConfig(config);

      // Initialize based on role
      if (this.role === 'parent') {
        await this.initializeAsParent();
      } else {
        await this.initializeAsChild();
      }

      // Add this node to the cluster nodes
      this.clusterNodes.set(this.nodeId, {
        id: this.nodeId,
        role: this.role,
        url: this.role === 'parent' ? 'localhost' : 'localhost', // Replace with actual URL
        instanceCount: 0, // Will be updated later
        healthStatus: 'healthy',
        lastSeen: Date.now(),
      });

      log.info(`Cluster manager initialized as ${this.role}`);
    } catch (error) {
      log.error('Error initializing cluster manager:', error);
      throw new Error(`Failed to initialize cluster manager: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private handleConfigChange(config: LoadBalancerConfig): void {
    log.info('Configuration changed, updating cluster manager');
    this.updateConfig(config);
  }

  private updateConfig(config: LoadBalancerConfig): void {
    const clusteringConfig = config.loadBalancer.clustering;

    // Update role
    const newRole = clusteringConfig.role as ClusterRole;
    if (newRole !== this.role) {
      log.info(`Role changed from ${this.role} to ${newRole}`);
      this.role = newRole;

      // Reinitialize with new role
      this.stopServices();
      if (this.role === 'parent') {
        this.initializeAsParent().catch(err => {
          log.error('Error initializing as parent:', err);
        });
      } else {
        this.initializeAsChild().catch(err => {
          log.error('Error initializing as child:', err);
        });
      }
    }

    // Update parent URL (for child nodes)
    if (this.role === 'child' && clusteringConfig.parentUrl) {
      this.parentUrl = clusteringConfig.parentUrl;
    }

    // Update sync interval
    this.syncInterval = clusteringConfig.syncInterval;

    // Restart sync interval if needed
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.startSyncInterval();
    }
  }

  private async initializeAsParent(): Promise<void> {
    try {
      // Start WebSocket server for child connections using Bun.serve
      this.server = Bun.serve({
        port: 8101, // Dedicated port for cluster communication
        websocket: {
          open: (ws: ServerWebSocket<{ nodeId?: string }>) => {
            log.debug('New child node connected');
            // Connection will be identified when first heartbeat message is received
          },

          message: (ws: ServerWebSocket<{ nodeId?: string }>, message: string | Buffer) => {
            try {
              const messageStr = typeof message === 'string' ? message : message.toString();
              const data = JSON.parse(messageStr) as ClusterMessage;

              // If this is the first message and it's a heartbeat, register the child node
              if (!ws.data.nodeId && data.type === 'heartbeat') {
                const childId = data.senderId;
                ws.data.nodeId = childId;

                // Store the child node
                this.childNodes.set(childId, {
                  ws,
                  info: {
                    id: childId,
                    role: 'child',
                    url: '', // Will be updated with status updates
                    instanceCount: 0,
                    healthStatus: 'healthy',
                    lastSeen: Date.now(),
                  },
                });

                // Add to cluster nodes
                this.clusterNodes.set(childId, this.childNodes.get(childId)!.info);

                log.info(`Child node ${childId} registered`);

                // Send current configuration to the new child
                this.sendConfigToChild(childId);
              }

              // Process the message
              this.handleClusterMessage(data, ws);
            } catch (error) {
              log.error('Error processing message from child node:', error);
            }
          },

          close: (ws: ServerWebSocket<{ nodeId?: string }>) => {
            const childId = ws.data.nodeId;
            if (childId) {
              log.info(`Child node ${childId} disconnected`);
              this.childNodes.delete(childId);

              // Mark as unhealthy in cluster nodes
              if (this.clusterNodes.has(childId)) {
                const nodeInfo = this.clusterNodes.get(childId)!;
                nodeInfo.healthStatus = 'unhealthy';
                nodeInfo.lastSeen = Date.now();
                this.clusterNodes.set(childId, nodeInfo);
              }
            }
          },
        },

        fetch: (req, server) => {
          // Upgrade HTTP requests to WebSocket
          const url = new URL(req.url);
          if (url.pathname === '/cluster') {
            const upgraded = server.upgrade(req);
            if (!upgraded) {
              return new Response('Upgrade failed', { status: 400 });
            }
            return undefined;
          }
          return new Response('Not found', { status: 404 });
        },
      });

      // Start heartbeat interval
      this.startHeartbeatInterval();

      // Start sync interval
      this.startSyncInterval();

      log.info(`Parent node initialized on port 8101`);
    } catch (error) {
      log.error('Error initializing as parent:', error);
      throw error;
    }
  }

  private async initializeAsChild(): Promise<void> {
    try {
      if (!this.parentUrl) {
        throw new Error('Parent URL not configured');
      }

      // Connect to parent node
      await this.connectToParent();

      // Start heartbeat interval
      this.startHeartbeatInterval();

      log.info('Child node initialized');
    } catch (error) {
      log.error('Error initializing as child:', error);
      throw error;
    }
  }

  private async connectToParent(): Promise<void> {
    if (!this.parentUrl) {
      throw new Error('Parent URL not configured');
    }

    try {
      // Close existing connection if any
      if (this.parentConnection) {
        this.parentConnection.close();
      }

      // Connect to parent WebSocket server
      const wsUrl = `ws://${this.parentUrl}:8101/cluster`;
      this.parentConnection = new WebSocket(wsUrl);

      this.parentConnection.onopen = () => {
        log.info(`Connected to parent node at ${wsUrl}`);

        // Send initial heartbeat
        this.sendHeartbeat();
      };

      this.parentConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ClusterMessage;
          this.handleClusterMessage(data);
        } catch (error) {
          log.error('Error processing message from parent node:', error);
        }
      };

      this.parentConnection.onclose = () => {
        log.info('Disconnected from parent node, will retry connection');

        // Schedule reconnection
        setTimeout(() => {
          this.connectToParent().catch(err => {
            log.error('Error reconnecting to parent:', err);
          });
        }, 5000); // 5 second delay before retry
      };

      this.parentConnection.onerror = (error) => {
        log.error('Error in parent connection:', error);
      };
    } catch (error) {
      log.error('Error connecting to parent:', error);
      throw error;
    }
  }

  private startHeartbeatInterval(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }

    this.heartbeatIntervalId = setInterval(() => {
      this.sendHeartbeat();
    }, 10000); // 10 seconds
  }

  private startSyncInterval(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(() => {
      if (this.role === 'parent') {
        this.syncConfigToChildren();
      }
    }, this.syncInterval * 1000);
  }

  private sendHeartbeat(): void {
    const message: ClusterMessage = {
      type: 'heartbeat',
      senderId: this.nodeId,
      timestamp: Date.now(),
      payload: {
        role: this.role,
        instanceCount: 0, // Will be updated with actual count
        healthStatus: 'healthy',
      },
    };

    if (this.role === 'parent') {
      // Send to all children
      for (const [childId, { ws }] of this.childNodes.entries()) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          log.error(`Error sending heartbeat to child ${childId}:`, error);
        }
      }
    } else if (this.parentConnection && this.parentConnection.readyState === WebSocket.OPEN) {
      // Send to parent
      try {
        this.parentConnection.send(JSON.stringify(message));
      } catch (error) {
        log.error('Error sending heartbeat to parent:', error);
      }
    }
  }

  private syncConfigToChildren(): void {
    if (this.role !== 'parent') return;

    const config = this.configManager.getConfig();

    const message: ClusterMessage = {
      type: 'config-sync',
      senderId: this.nodeId,
      timestamp: Date.now(),
      payload: {
        config,
      },
    };

    // Send to all children
    for (const [childId, { ws }] of this.childNodes.entries()) {
      try {
        ws.send(JSON.stringify(message));
        log.debug(`Sent config sync to child ${childId}`);
      } catch (error) {
        log.error(`Error sending config sync to child ${childId}:`, error);
      }
    }
  }

  private sendConfigToChild(childId: string): void {
    if (this.role !== 'parent') return;

    const childNode = this.childNodes.get(childId);
    if (!childNode) return;

    const config = this.configManager.getConfig();

    const message: ClusterMessage = {
      type: 'config-sync',
      senderId: this.nodeId,
      timestamp: Date.now(),
      payload: {
        config,
      },
    };

    try {
      childNode.ws.send(JSON.stringify(message));
      log.debug(`Sent config to child ${childId}`);
    } catch (error) {
      log.error(`Error sending config to child ${childId}:`, error);
    }
  }

  private handleClusterMessage(message: ClusterMessage, ws?: ServerWebSocket<{ nodeId?: string }>): void {
    // Update last seen time for the sender
    if (this.clusterNodes.has(message.senderId)) {
      const nodeInfo = this.clusterNodes.get(message.senderId)!;
      nodeInfo.lastSeen = Date.now();
      this.clusterNodes.set(message.senderId, nodeInfo);
    }

    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeat(message, ws);
        break;
      case 'config-sync':
        this.handleConfigSync(message);
        break;
      case 'status-update':
        this.handleStatusUpdate(message);
        break;
      case 'command':
        this.handleCommand(message);
        break;
      default:
        log.error(`Unknown message type: ${(message as any).type}`);
    }
  }

  private handleHeartbeat(message: ClusterMessage, ws?: ServerWebSocket<{ nodeId?: string }>): void {
    const { senderId, payload } = message;

    // Update node info
    const nodeInfo: ClusterNodeInfo = {
      id: senderId,
      role: payload.role,
      url: payload.url || '',
      instanceCount: payload.instanceCount || 0,
      healthStatus: payload.healthStatus || 'healthy',
      lastSeen: Date.now(),
    };

    // Update in cluster nodes
    this.clusterNodes.set(senderId, nodeInfo);

    // If this is a parent, update child node info
    if (this.role === 'parent' && ws) {
      const childNode = this.childNodes.get(senderId);
      if (childNode) {
        childNode.info = nodeInfo;
        this.childNodes.set(senderId, childNode);
      }
    }

    log.debug(`Received heartbeat from ${nodeInfo.role} node ${senderId}`);
  }

  private handleConfigSync(message: ClusterMessage): void {
    if (this.role === 'child') {
      // Only children should process config sync messages
      const { payload } = message;

      if (payload.config) {
        log.info('Received configuration update from parent');

        // Update local configuration
        this.configManager.updateConfig(payload.config).catch(err => {
          log.error('Error updating configuration from sync:', err);
        });
      }
    }
  }

  private handleStatusUpdate(message: ClusterMessage): void {
    const { senderId, payload } = message;

    // Update node status
    if (this.clusterNodes.has(senderId)) {
      const nodeInfo = this.clusterNodes.get(senderId)!;

      if (payload.instanceCount !== undefined) {
        nodeInfo.instanceCount = payload.instanceCount;
      }

      if (payload.healthStatus) {
        nodeInfo.healthStatus = payload.healthStatus;
      }

      this.clusterNodes.set(senderId, nodeInfo);

      log.debug(`Updated status for node ${senderId}: ${nodeInfo.healthStatus}, ${nodeInfo.instanceCount} instances`);
    }
  }

  private handleCommand(message: ClusterMessage): void {
    const { payload } = message;

    if (!payload.command) return;

    log.info(`Received command: ${payload.command}`);

    // Handle different commands
    switch (payload.command) {
      case 'restart':
        // Implement restart logic
        break;
      case 'scale':
        // Implement scaling logic
        break;
      default:
        log.error(`Unknown command: ${payload.command}`);
    }
  }

  public sendStatusUpdate(instanceCount: number, healthStatus: 'healthy' | 'degraded' | 'unhealthy'): void {
    const message: ClusterMessage = {
      type: 'status-update',
      senderId: this.nodeId,
      timestamp: Date.now(),
      payload: {
        instanceCount,
        healthStatus,
      },
    };

    if (this.role === 'child' && this.parentConnection && this.parentConnection.readyState === WebSocket.OPEN) {
      try {
        this.parentConnection.send(JSON.stringify(message));
        log.debug('Sent status update to parent');
      } catch (error) {
        log.error('Error sending status update to parent:', error);
      }
    }
  }

  public sendCommand(targetNodeId: string, command: string, params?: any): void {
    if (this.role !== 'parent') {
      log.error('Only parent nodes can send commands');
      return;
    }

    const childNode = this.childNodes.get(targetNodeId);
    if (!childNode) {
      log.error(`Child node ${targetNodeId} not found`);
      return;
    }

    const message: ClusterMessage = {
      type: 'command',
      senderId: this.nodeId,
      timestamp: Date.now(),
      payload: {
        command,
        params,
      },
    };

    try {
      childNode.ws.send(JSON.stringify(message));
      log.info(`Sent command ${command} to child ${targetNodeId}`);
    } catch (error) {
      log.error(`Error sending command to child ${targetNodeId}:`, error);
    }
  }

  public broadcastCommand(command: string, params?: any): void {
    if (this.role !== 'parent') {
      log.error('Only parent nodes can broadcast commands');
      return;
    }

    const message: ClusterMessage = {
      type: 'command',
      senderId: this.nodeId,
      timestamp: Date.now(),
      payload: {
        command,
        params,
      },
    };

    for (const [childId, { ws }] of this.childNodes.entries()) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        log.error(`Error broadcasting command to child ${childId}:`, error);
      }
    }

    log.info(`Broadcast command ${command} to all children`);
  }

  public getClusterNodes(): ClusterNodeInfo[] {
    return Array.from(this.clusterNodes.values());
  }

  public getNodeRole(): ClusterRole {
    return this.role;
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  private stopServices(): void {
    // Stop intervals
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // Stop Bun server if running
    if (this.server) {
      this.server.stop();
      this.server = null;
    }

    // Close parent connection if connected
    if (this.parentConnection) {
      this.parentConnection.close();
      this.parentConnection = null;
    }

    // Clear child nodes
    this.childNodes.clear();
  }

  public shutdown(): void {
    log.info('Shutting down cluster manager');
    this.stopServices();
  }
}

export default ClusterManager;