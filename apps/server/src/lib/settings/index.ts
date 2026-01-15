import {FeedController} from '@/lib/FeedController'
import {readFileSync} from 'fs'
import {join} from 'path'
import prisma from '../../db/prisma'
import {AuditLogger} from './audit-logger'
import type {AuditLog} from './types'

/**
 * Schema definition structure from JSON files
 */
interface SettingDefinition {
    type: 'string' | 'boolean' | 'number' | 'object' | 'array';
    values?: string[];
    default: any;
    userModifiable: boolean;
    description: string;
    category: string;
}

interface SchemaDefinition {
    model: string;
    version: string;
    settings: Record<string, SettingDefinition>;
}

/**
 * Options for Settings class initialization
 */
interface SettingsOptions {
    /** The ID of the model instance (e.g., user ID, profile ID) */
    modelId?: string;
    /** Enable audit logging for setting changes */
    auditLog?: boolean;
    /** User ID for audit trail (optional) */
    currentUserId?: string;
    /** Whether changes are internal (not user-initiated) */
    internal?: boolean;
    /** Cache settings in memory (default: true) */
    cache?: boolean;
}

/**
 * Extract the setting value type from the definition
 */
type InferSettingType<T extends SettingDefinition> =
    T['type'] extends 'string' ? string :
        T['type'] extends 'boolean' ? boolean :
            T['type'] extends 'number' ? number :
                T['type'] extends 'object' ? Record<string, any> :
                    T['type'] extends 'array' ? any[] :
                        any;

/**
 * Generate a type-safe settings object from schema
 */
type InferSettingsFromSchema<T extends SchemaDefinition> = {
    [K in keyof T['settings']]: InferSettingType<T['settings'][K]>
};

/**
 * Type-safe settings manager for fetching/storing settings from Prisma database
 *
 * @example
 * ```typescript
 * const userSettings = new Settings('user', { userId: '123' });
 * await userSettings.init('user-profile-id');
 *
 * // Get a setting
 * const privacy = await userSettings.get('post_privacy');
 *
 * // Set a setting
 * await userSettings.set('post_privacy', 'friends');
 *
 * // Get all settings
 * const all = await userSettings.getAll();
 * ```
 */
export class Settings<SchemaName extends string = string> {
    private static globalCache: Map<string, Map<string, any>> = new Map()
    private schema: SchemaDefinition
    private schemaName: SchemaName
    private modelId?: string
    private auditLogger?: AuditLogger
    private options: Required<SettingsOptions>

    /**
     * Creates a new Settings instance
     * @param schemaName - Name of the schema file (without .json extension)
     * @param options - Configuration options
     */
    constructor(schemaName: SchemaName, options: SettingsOptions = {}) {
        this.schemaName = schemaName
        // Set default options
        this.options = {
            modelId: options.modelId ?? undefined,
            auditLog: options.auditLog ?? false,
            currentUserId: options.currentUserId,
            internal: options.internal ?? false,
            cache: options.cache ?? true,
        }

        // Load schema from file
        const schemaPath = join(__dirname, 'schemas', `${schemaName}.json`)
        try {
            const schemaContent = readFileSync(schemaPath, 'utf-8')
            this.schema = JSON.parse(schemaContent) as SchemaDefinition
        } catch (error) {
            throw new Error(`Failed to load schema '${schemaName}': ${error}`)
        }

        // Initialize with modelId if provided
        if (this.options.modelId) {
            this.initPromise = this.init(this.options.modelId).catch(err => {
                console.error(`Failed to initialize Settings: ${err}`)
            })
        }

        // Initialize audit logger if enabled
        if (this.options.auditLog) {
            this.auditLogger = new AuditLogger(true)
        }
    }

    private get cacheKey(): string {
        return `${this.schemaName}:${this.modelId}`
    }

    private get cache(): Map<string, any> {
        let cache = Settings.globalCache.get(this.cacheKey)
        if (!cache) {
            cache = new Map()
            Settings.globalCache.set(this.cacheKey, cache)
        }
        return cache
    }

    private initPromise: Promise<void> | null = null

    /**
     * Wait for initialization to complete
     */
    async waitForInit(): Promise<void> {
        if (this.initPromise) {
            await this.initPromise
        }
    }

    /**
     * Initialize the settings manager with a specific model instance
     * @param modelId - The ID of the model instance (e.g., user ID, profile ID)
     */
    async init(modelId: string): Promise<void> {
        this.modelId = modelId

        // Pre-load cache if enabled
        if (this.options.cache) {
            await this.loadCache()
        }
    }

    /**
     * Get a setting value
     * @param key - The setting key
     * @param defaultValue - The default value to return if setting is not found
     * @returns The setting value or default if not set
     */
    get<K extends keyof SchemaDefinition['settings']>(key: K & string, defaultValue?: any): any {
        this.ensureInitialized()

        // Check cache
        if (this.options.cache && this.cache.has(key)) {
            return this.cache.get(key)
        }

        const definition = this.schema.settings[key]
        if (!definition) {
            if (defaultValue === undefined) {
                throw new Error(`Setting '${key}' not found in schema`)
            } else {
                console.warn(
                    `Setting '${key}' not found in schema. Returning default value instead. ` +
                    `This is likely a bug in the settings schema. Please check the schema file.`
                )

                return defaultValue
            }
        }

        // Since we are synchronous now, we expect everything to be in cache if it's there in the DB.
        // If not in cache, we return default value.
        return definition.default
    }

    /**
     * Set a setting value
     * @param key - The setting key
     * @param value - The new value
     */
    async set<K extends keyof SchemaDefinition['settings']>(
        key: K & string,
        value: any
    ): Promise<void> {
        this.ensureInitialized()

        const definition = this.schema.settings[key]
        if (!definition) {
            throw new Error(`Setting '${key}' not found in schema`)
        }

        // Validate value
        this.validateValue(key, value, definition)

        // Get old value for audit log
        const oldValue = this.get(key)

        // Update in database
        await this.updateInDatabase(key, value, definition)

        // Update cache
        if (this.options.cache) {
            this.cache.set(key, value)

            // Find any key that has the modelId and delete.
            // userFeedCache = Record
            FeedController.userFeedCache.forEach((value, key) => {
                if (key.includes(this.modelId)) {
                    FeedController.userFeedCache.delete(key)
                }
            })
        }

        // Log the change
        if (this.auditLogger) {
            const modelObject = await this.fetchModelObject()
            this.auditLogger.log({
                modelType: this.schema.model,
                modelObject,
                settingKey: key,
                oldValue,
                newValue: value,
                userId: this.options.currentUserId,
                internal: this.options.internal,
            })
        }
    }

    /**
     * Get all settings as an object
     * @returns Object with all settings and their values
     */
    getAll(): Record<string, any> {
        this.ensureInitialized()

        const result: Record<string, any> = {}

        for (const key in this.schema.settings) {
            result[key] = this.get(key)
        }

        return result
    }

    /**
     * Set multiple settings at once
     * @param settings - Object with setting keys and values
     */
    async setMany(settings: Partial<Record<keyof SchemaDefinition['settings'], any>>): Promise<void> {
        this.ensureInitialized()

        for (const [key, value] of Object.entries(settings)) {
            await this.set(key, value)
        }
    }

    /**
     * Reset a setting to its default value
     * @param key - The setting key
     */
    async reset<K extends keyof SchemaDefinition['settings']>(key: K & string): Promise<void> {
        this.ensureInitialized() // Ensure it's here
        const definition = this.schema.settings[key]
        if (!definition) {
            throw new Error(`Setting '${key}' not found in schema`)
        }

        await this.set(key, definition.default)
    }

    /**
     * Reset all settings to their defaults
     */
    async resetAll(): Promise<void> {
        for (const key in this.schema.settings) {
            await this.reset(key)
        }
    }

    /**
     * Get the schema definition for a setting
     * @param key - The setting key
     * @returns The setting definition
     */
    getDefinition<K extends keyof SchemaDefinition['settings']>(key: K & string): SettingDefinition {
        const definition = this.schema.settings[key]
        if (!definition) {
            throw new Error(`Setting '${key}' not found in schema`)
        }
        return definition
    }

    /**
     * Get all setting definitions
     * @returns The complete schema
     */
    getSchema(): SchemaDefinition {
        return this.schema
    }

    /**
     * Get audit logs for this model instance
     * @returns Array of audit log entries
     */
    getAuditLogs(): AuditLog[] {
        if (!this.auditLogger) {
            throw new Error('Audit logging is not enabled')
        }
        return this.auditLogger.getLogs(this.schema.model, this.modelId)
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        Settings.globalCache.delete(this.cacheKey)
    }


    /**
     * Clear all caches
     */
    static clearAllCaches(): void {
        Settings.globalCache.clear()
    }


    /**
     * Update a value in the database
     */
    private async updateInDatabase(key: string, value: any, definition: SettingDefinition): Promise<void> {
        if (!this.modelId) return

        // Fetch current data
        const record = await prisma.settings.findUnique({
            where: {user_id: this.modelId},
            select: {data: true},
        })

        const currentData = (record?.data as Record<string, any>) || {}
        const newData = {...currentData, [key]: value}

        // Upsert the record
        await prisma.settings.upsert({
            where: {user_id: this.modelId},
            create: {
                user_id: this.modelId,
                data: newData,
            },
            update: {
                data: newData,
            },
        })
    }

    /**
     * Fetch the complete model object for audit logging
     */
    private async fetchModelObject(): Promise<any> {
        const model = prisma[this.schema.model]
        if (!model) {
            return {id: this.modelId, type: this.schema.model}
        }

        return await model.findUnique({
            where: {id: this.modelId},
        })
    }

    /**
     * Load all settings into cache
     */
    private async loadCache(): Promise<void> {
        if (!this.modelId) return

        // Fetch all settings for this user in one query
        const record = await prisma.settings.findUnique({
            where: {user_id: this.modelId},
            select: {data: true},
        })

        const data = (record?.data as Record<string, any>) || {}

        for (const key in this.schema.settings) {
            const definition = this.schema.settings[key]
            this.cache.set(key, data[key] ?? definition.default)
        }
    }

    /**
     * Validate a value against the setting definition
     */
    private validateValue(key: string, value: any, definition: SettingDefinition): void {
        // Type validation
        const actualType = Array.isArray(value) ? 'array' : typeof value
        const expectedType = definition.type === 'object' ? 'object' :
            definition.type === 'array' ? 'array' :
                definition.type

        if (actualType !== expectedType) {
            throw new Error(
                `Invalid type for setting '${key}': expected ${expectedType}, got ${actualType}`
            )
        }

        // Enum validation for string types
        if (definition.type === 'string' && definition.values) {
            if (!definition.values.includes(value)) {
                throw new Error(
                    `Invalid value for setting '${key}': must be one of [${definition.values.join(', ')}]`
                )
            }
        }

        // Additional validation can be added here (min/max for numbers, etc.)
    }

    /**
     * Ensure the settings manager is initialized
     */
    private ensureInitialized(): void {
        if (!this.modelId) {
            throw new Error('Settings manager not initialized. Call init() first.')
        }
    }
}

/**
 * Create a type-safe Settings instance for a specific schema
 * @param schemaName - Name of the schema file
 * @param options - Configuration options
 */
export async function createSettings<T extends string>(
    schemaName: T,
    options: SettingsOptions = {}
): Promise<Settings<T>> {
    const settings = new Settings(schemaName, options)
    if (options.modelId) {
        await settings.waitForInit()
    }
    return settings
}

export type {SettingsOptions, SettingDefinition, SchemaDefinition}
