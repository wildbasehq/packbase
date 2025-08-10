import { XMLParser, XMLValidator, XMLBuilder } from 'fast-xml-parser';
import { z } from 'zod';
import fs from 'node:fs/promises';
import Debug from 'debug';
import path from 'node:path';

const log = {
  info: Debug('vg:lb:config:info'),
  error: Debug('vg:lb:config:error'),
};

// Zod schema for load balancer configuration
const InstancesSchema = z.object({
  '@_min': z.coerce.number().int().positive(),
  '@_max': z.coerce.number().int().positive(),
  '@_thresholdMax': z.coerce.number().optional(),
  '@_thresholdMin': z.coerce.number().optional(),
  '@_cleanupInterval': z.coerce.number().int().positive().optional().default(300), // Default to 5 minutes (300 seconds)
});

const PortsSchema = z.object({
  '@_range': z.string().regex(/^\d+-\d+$/),
  '@_proxy': z.string().optional(),
});

const AlgorithmsSchema = z.object({
  '@_primary': z.enum(['round-robin', 'least-connections', 'weighted-round-robin', 'ip-hash']),
  '@_fallback': z.enum(['round-robin', 'least-connections', 'weighted-round-robin', 'ip-hash']),
});

const ChatPortsSchema = z.object({
  '@_range': z.string().regex(/^\d+-\d+$/),
});

const RateLimitSchema = z.object({
  '@_requests': z.coerce.number().int().positive(),
  '@_window': z.coerce.number().int().positive(),
});

const CorsSchema = z.object({
  '@_enabled': z.coerce.boolean(),
  '@_allowedOrigins': z.string().optional(),
  '@_allowedMethods': z.string().optional(),
  '@_allowedHeaders': z.string().optional(),
  '@_exposedHeaders': z.string().optional(),
  // Support both property names for backward compatibility
  '@_credentials': z.coerce.boolean().optional(),
  '@_allowCredentials': z.coerce.boolean().optional(),
  '@_maxAge': z.string().optional()
});

const SslSchema = z.object({
  '@_enabled': z.coerce.boolean(),
  '@_cert': z.string().optional(),
});

const SecuritySchema = z.object({
  rateLimit: RateLimitSchema,
  cors: CorsSchema,
  ssl: SslSchema,
});

const ClusteringSchema = z.object({
  role: z.enum(['parent', 'child']),
  parentUrl: z.string().optional(),
  syncInterval: z.coerce.number().int().positive(),
});

const LoadBalancerSchema = z.object({
  loadBalancer: z.object({
    instances: InstancesSchema,
    ports: PortsSchema,
    algorithms: AlgorithmsSchema,
    security: SecuritySchema,
    clustering: ClusteringSchema,
    chatServer: z.object({
      enabled: z.coerce.boolean().default(true),
      instances: InstancesSchema,
      ports: ChatPortsSchema,
    }).optional(),
  }),
});

export type LoadBalancerConfig = z.infer<typeof LoadBalancerSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private config: LoadBalancerConfig | null = null;
  private configPath: string;
  private watcher: any = null;
  private parser: XMLParser;
  private builder: XMLBuilder;
  private onConfigChangeCallbacks: Array<(config: LoadBalancerConfig) => void> = [];

  private constructor(configPath: string) {
    this.configPath = configPath;
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  public static getInstance(configPath?: string): ConfigManager {
    if (!ConfigManager.instance) {
      const defaultPath = path.join(process.cwd(), 'config', 'load-balancer.xml');
      ConfigManager.instance = new ConfigManager(configPath || defaultPath);
    }
    return ConfigManager.instance;
  }

  public async loadConfig(): Promise<LoadBalancerConfig> {
    try {
      // Check if config file exists, if not, create it from default
      try {
        await fs.access(this.configPath);
      } catch (error) {
        log.info(`Config file not found at ${this.configPath}, creating from default template`);
        const defaultConfigPath = path.join(__dirname, 'default-config.xml');
        const defaultConfig = await fs.readFile(defaultConfigPath, 'utf-8');

        // Ensure directory exists
        const configDir = path.dirname(this.configPath);
        await fs.mkdir(configDir, { recursive: true });

        await fs.writeFile(this.configPath, defaultConfig);
      }

      // Read and parse config file
      const xmlData = await fs.readFile(this.configPath, 'utf-8');

      // Validate XML syntax
      const validationResult = XMLValidator.validate(xmlData);
      if (validationResult !== true) {
        throw new Error(`Invalid XML syntax: ${JSON.stringify(validationResult)}`);
      }

      // Parse XML to JSON
      const parsedConfig = this.parser.parse(xmlData);

      // Validate against Zod schema
      this.config = LoadBalancerSchema.parse(parsedConfig);

      log.info('Configuration loaded successfully');

      return this.config;
    } catch (error) {
      log.error('Error loading configuration:', error);
      throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getConfig(): LoadBalancerConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  public async updateConfig(newConfig: LoadBalancerConfig): Promise<void> {
    try {
      // Validate against schema
      LoadBalancerSchema.parse(newConfig);

      // Convert to XML
      const xmlData = this.builder.build(newConfig);

      // Write to file
      await fs.writeFile(this.configPath, xmlData);

      // Update in-memory config
      this.config = newConfig;

      // Notify listeners
      this.notifyConfigChange();

      log.info('Configuration updated successfully');
    } catch (error) {
      log.error('Error updating configuration:', error);
      throw new Error(`Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public onConfigChange(callback: (config: LoadBalancerConfig) => void): void {
    this.onConfigChangeCallbacks.push(callback);
  }

  private notifyConfigChange(): void {
    if (!this.config) return;

    for (const callback of this.onConfigChangeCallbacks) {
      try {
        callback(this.config);
      } catch (error) {
        log.error('Error in config change callback:', error);
      }
    }
  }

  public startWatching(): void {
    if (this.watcher) return;

    // Watch for file changes
    const watchDir = path.dirname(this.configPath);
    const watchFile = path.basename(this.configPath);

    try {
      // Use Node.js fs.watch API
      const watcher = fs.watch(watchDir);

      (async () => {
        try {
          for await (const event of watcher) {
            if (event.filename === watchFile) {
              log.info('Configuration file changed, reloading');
              try {
                await this.loadConfig();
                this.notifyConfigChange();
              } catch (error) {
                log.error('Error reloading configuration:', error);
              }
            }
          }
        } catch (error) {
          log.error('Error watching configuration file:', error);
        }
      })();

      this.watcher = watcher;
      log.info(`Watching for changes to ${this.configPath}`);
    } catch (error) {
      log.error('Error setting up config file watcher:', error);
    }
  }

  public stopWatching(): void {
    if (this.watcher) {
      this.watcher = null;
      log.info('Stopped watching configuration file');
    }
  }

  // Helper method to interpolate environment variables in config values
  public interpolateEnvVars(): void {
    if (!this.config) return;

    const interpolate = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(/\${([^}]+)}/g, (_, varName) => {
            return process.env[varName] || '';
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          interpolate(obj[key]);
        }
      }
    };

    interpolate(this.config);
  }
}

export default ConfigManager;
