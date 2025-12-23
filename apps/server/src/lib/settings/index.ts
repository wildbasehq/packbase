// ./apps/server/src/lib/settings/index.ts

import {promises as fs} from 'fs'
import {join} from 'path'
import {AuditLogger} from './audit-logger'
import {CacheManager} from './cache-manager'
import {ConditionEvaluator} from './conditions'
import {PrismaDatabaseAdapter} from './database-adapter'
import type {SettingDefinition, SettingSchema, SettingsOptions, SettingValue, ValidationResult} from './types'
import {SettingValidator} from './validators'

/**
 * Settings management system that handles configuration for different data models
 * with schema-based validation, conditional access, and audit logging.
 *
 * @example
 * ```typescript
 * const settings = new Settings({ enableAuditLogging: true }, dbAdapter);
 *
 * // Load settings for a user
 * const userSettings = await settings.loadSettings(userObject);
 *
 * // Update a setting
 * await settings.updateSetting(userObject, 'theme', 'dark');
 * ```
 */
export class Settings {
    private schemas = new Map<string, SettingSchema>()
    private cacheManager: CacheManager
    private auditLogger: AuditLogger
    private readonly dbAdapter?: PrismaDatabaseAdapter
    private options: Required<SettingsOptions>

    constructor(options: SettingsOptions = {}, dbAdapter?: PrismaDatabaseAdapter) {
        this.options = {
            enableAuditLogging: true,
            cacheSchemas: true,
            strictValidation: true,
            allowSchemaInheritance: true,
            cacheExpirationMs: 5 * 60 * 1000,
            schemasPath: join(__dirname, 'schemas'),
            ...options,
        }

        this.dbAdapter = dbAdapter || new PrismaDatabaseAdapter(prisma)
        this.cacheManager = new CacheManager(this.options.cacheExpirationMs)
        this.auditLogger = new AuditLogger(this.options.enableAuditLogging)
    }

    /**
     * Loads and caches a schema for a specific model type.
     * Supports schema inheritance via the 'extends' property.
     *
     * @param modelType - The type of model (e.g., 'user', 'organization')
     * @returns The loaded and processed schema
     * @throws Error if schema file is not found or invalid
     */
    async loadSchema(modelType: string): Promise<SettingSchema> {
        const cacheKey = modelType.toLowerCase()

        // Return cached schema if available
        if (this.options.cacheSchemas && this.schemas.has(cacheKey)) {
            return this.schemas.get(cacheKey)!
        }

        const schema = await this.loadSchemaFromFile(modelType)

        // Handle schema inheritance
        if (this.options.allowSchemaInheritance && schema.extends) {
            const parentSchema = await this.loadSchema(schema.extends)
            schema.settings = {...parentSchema.settings, ...schema.settings}
        }

        // Validate and cache
        this.validateSchema(schema)

        if (this.options.cacheSchemas) {
            this.schemas.set(cacheKey, schema)
        }

        return schema
    }

    /**
     * Retrieves all accessible settings for a model object.
     * Settings are filtered based on conditional access rules.
     *
     * @param modelObject - The model instance to load settings for
     * @returns Array of accessible setting definitions
     */
    async loadSettings<T extends Record<string, any>>(modelObject: T): Promise<SettingDefinition[]> {
        const schema = await this.getSchemaForModel(modelObject)

        return Object.entries(schema.settings)
            .filter(([_, definition]) => this.checkAccess(modelObject, definition))
            .map(([key, definition]) => ({
                key,
                ...definition,
            }))
    }

    /**
     * Gets a specific setting value with caching support.
     *
     * @param modelObject - The model instance
     * @param settingKey - The setting key to retrieve
     * @returns The setting value (from database or default)
     * @throws Error if setting doesn't exist or access is denied
     */
    async getSetting<T extends Record<string, any>>(modelObject: T, settingKey: string): Promise<any> {
        const {definition} = await this.getSettingDefinition(modelObject, settingKey)

        this.assertAccess(modelObject, definition, settingKey)

        // Try database first if configured
        if (this.dbAdapter && definition.db) {
            const cachedValue = await this.getCachedOrFetch(modelObject, settingKey, definition)
            return cachedValue ?? definition.default
        }

        return definition.default
    }

    /**
     * Updates a setting value with validation and permission checks.
     *
     * @param modelObject - The model instance
     * @param settingKey - The setting key to update
     * @param value - The new value
     * @param internal - Whether this is an internal update (bypasses userModifiable check)
     * @returns Success status
     * @throws Error for validation failures or permission issues
     */
    async updateSetting<T extends Record<string, any>>(modelObject: T, settingKey: string, value: any, internal = false): Promise<boolean> {
        const {schema, definition} = await this.getSettingDefinition(modelObject, settingKey)

        // Permission checks
        this.assertAccess(modelObject, definition, settingKey)
        this.assertModifiable(definition, settingKey, internal)

        // Validate and sanitize
        const sanitizedValue = this.validateAndSanitize(settingKey, value, definition)

        // Get old value for audit
        const oldValue = await this.getSetting(modelObject, settingKey)

        // Persist the change
        await this.persistSetting(modelObject, definition, sanitizedValue)

        // Audit log
        this.auditLogger.log({
            modelType: schema.model,
            modelObject,
            settingKey,
            oldValue,
            newValue: sanitizedValue,
            internal,
        })

        return true
    }

    /**
     * Batch updates multiple settings with transaction-like behavior.
     * All validations are performed before any updates are applied.
     *
     * @param modelObject - The model instance
     * @param updates - Object containing setting keys and their new values
     * @param internal - Whether these are internal updates
     * @returns Validation result with success status and any errors
     */
    async updateSettings<T extends Record<string, any>>(modelObject: T, updates: Record<string, any>, internal = false): Promise<ValidationResult> {
        const schema = await this.getSchemaForModel(modelObject)

        // First pass: validate all updates
        const validationResult = await this.validateBatchUpdates(modelObject, updates, schema, internal)

        if (!validationResult.success) {
            return validationResult
        }

        // Second pass: apply all updates
        for (const [key, value] of Object.entries(updates)) {
            await this.updateSetting(modelObject, key, value, internal)
        }

        return {success: true, errors: []}
    }

    /**
     * Gets only settings that can be modified by users.
     *
     * @param modelObject - The model instance
     * @returns Array of user-modifiable setting definitions
     */
    async getUserSettings<T extends Record<string, any>>(modelObject?: T): Promise<SettingDefinition[]> {
        const settings = await this.loadSettings(modelObject)
        return settings.filter((setting) => setting.userModifiable)
    }

    /**
     * Updates a setting internally, bypassing user modification checks.
     * Still validates the value and checks access conditions.
     *
     * @param modelObject - The model instance
     * @param settingKey - The setting key to update
     * @param value - The new value
     */
    async setInternalSetting<T extends Record<string, any>>(modelObject: T, settingKey: string, value: any): Promise<void> {
        await this.updateSetting(modelObject, settingKey, value, true)
    }

    /**
     * Gets setting values with metadata for display purposes.
     *
     * @param modelObject - The model instance
     * @param settingKeys - Optional array of specific keys to retrieve
     * @returns Array of setting values with metadata
     */
    async getSettingValues<T extends Record<string, any>>(modelObject: T, settingKeys?: string[]): Promise<SettingValue[]> {
        const schema = await this.getSchemaForModel(modelObject)
        const keys = settingKeys || Object.keys(schema.settings)

        return Promise.all(
            keys.map(async (key) => {
                const definition = schema.settings[key]
                if (!definition) return null

                const accessible = this.checkAccess(modelObject, definition)
                const value = accessible ? await this.getSetting(modelObject, key) : null

                return {
                    key,
                    value,
                    definition,
                    accessible,
                    modifiable: accessible && definition.userModifiable,
                }
            }),
        ).then((results) => results.filter(Boolean) as SettingValue[])
    }

    /**
     * Clears cache for a specific model instance.
     *
     * @param modelObject - The model instance
     */
    clearCacheForModel<T extends Record<string, any>>(modelObject: T): void {
        const identifier = this.getModelIdentifier(modelObject)
        this.cacheManager.clearForIdentifier(identifier)
    }

    /**
     * Gets audit logs with optional filtering.
     *
     * @param modelType - Optional model type filter
     * @param modelId - Optional model ID filter
     * @returns Filtered and sorted audit logs
     */
    getAuditLogs(modelType?: string, modelId?: string) {
        return this.auditLogger.getLogs(modelType, modelId)
    }

    // ============= Private Helper Methods =============

    private async loadSchemaFromFile(modelType: string): Promise<SettingSchema> {
        try {
            const schemaPath = join(this.options.schemasPath, `${modelType}.json`)
            const content = await fs.readFile(schemaPath, 'utf-8')
            return JSON.parse(content)
        } catch (error) {
            throw new Error(`Failed to load schema for "${modelType}": ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    private async getSchemaForModel<T extends Record<string, any>>(modelObject: T): Promise<SettingSchema> {
        const modelType = this.getModelType(modelObject)
        return this.loadSchema(modelType)
    }

    private async getSettingDefinition<T extends Record<string, any>>(modelObject: T, settingKey: string) {
        const schema = await this.getSchemaForModel(modelObject)
        const definition = schema.settings[settingKey]

        if (!definition) {
            throw new Error(`Setting "${settingKey}" not found for model "${schema.model}"`)
        }

        return {schema, definition}
    }

    private checkAccess<T extends Record<string, any>>(modelObject: T, definition: SettingDefinition): boolean {
        if (!definition.condition) return true
        return ConditionEvaluator.evaluate(definition.condition, modelObject)
    }

    private assertAccess<T extends Record<string, any>>(modelObject: T, definition: SettingDefinition, settingKey: string): void {
        if (!this.checkAccess(modelObject, definition)) {
            throw new Error(`Access denied to setting "${settingKey}"`)
        }
    }

    private assertModifiable(definition: SettingDefinition, settingKey: string, internal: boolean): void {
        if (!internal && !definition.userModifiable) {
            throw new Error(`Setting "${settingKey}" is not user-modifiable`)
        }
    }

    private validateAndSanitize(key: string, value: any, definition: SettingDefinition): any {
        const validation = SettingValidator.validateSetting(key, value, definition)

        if (!validation.success) {
            const errors = validation.errors.map((e) => e.message).join('; ')
            throw new Error(`Validation failed for "${key}": ${errors}`)
        }

        return SettingValidator.sanitizeValue(value, definition)
    }

    private async getCachedOrFetch<T extends Record<string, any>>(modelObject: T, settingKey: string, definition: SettingDefinition): Promise<any> {
        const identifier = this.getModelIdentifier(modelObject)
        const cacheKey = `${definition.db}:${identifier}:${settingKey}`

        // Check cache
        const cached = this.cacheManager.get(cacheKey)
        if (cached !== undefined) return cached

        // Fetch from database
        const value = await this.fetchFromDatabase(modelObject, definition)

        // Cache the result
        this.cacheManager.set(cacheKey, value)

        return value
    }

    private async fetchFromDatabase<T extends Record<string, any>>(modelObject: T, definition: SettingDefinition): Promise<any> {
        if (!this.dbAdapter || !definition.db) return null

        const [table, column] = definition.db.split('.')
        const whereCondition = this.buildWhereCondition(modelObject)

        try {
            return await this.dbAdapter.getSetting(table, column, whereCondition)
        } catch (error) {
            console.warn(`Failed to fetch setting from database:`, error)
            return null
        }
    }

    private async persistSetting<T extends Record<string, any>>(modelObject: T, definition: SettingDefinition, value: any): Promise<void> {
        if (!this.dbAdapter || !definition.db) return

        const [table, column] = definition.db.split('.')
        const whereCondition = this.buildWhereCondition(modelObject)

        await this.dbAdapter.updateSetting(table, column, value, whereCondition)

        // Invalidate cache
        const identifier = this.getModelIdentifier(modelObject)
        const cacheKey = `${definition.db}:${identifier}`
        this.cacheManager.delete(cacheKey)
    }

    private async validateBatchUpdates<T extends Record<string, any>>(
        modelObject: T,
        updates: Record<string, any>,
        schema: SettingSchema,
        internal: boolean,
    ): Promise<ValidationResult> {
        const errors: Array<{ field: string; message: string; code: string }> = []
        const definitions: Record<string, SettingDefinition> = {}

        for (const [key, value] of Object.entries(updates)) {
            const definition = schema.settings[key]

            if (!definition) {
                errors.push({
                    field: key,
                    message: `Setting "${key}" not found`,
                    code: 'NOT_FOUND',
                })
                continue
            }

            if (!this.checkAccess(modelObject, definition)) {
                errors.push({
                    field: key,
                    message: `Access denied to setting "${key}"`,
                    code: 'ACCESS_DENIED',
                })
                continue
            }

            if (!internal && !definition.userModifiable) {
                errors.push({
                    field: key,
                    message: `Setting "${key}" is not user-modifiable`,
                    code: 'NOT_MODIFIABLE',
                })
                continue
            }

            definitions[key] = definition
        }

        if (errors.length > 0) {
            return {success: false, errors}
        }

        // Validate all values
        return SettingValidator.validateSettings(updates, definitions)
    }

    private validateSchema(schema: SettingSchema): void {
        if (!schema.model) {
            throw new Error('Schema must have a model field')
        }

        if (!schema.settings || typeof schema.settings !== 'object') {
            throw new Error('Schema must have a settings object')
        }

        for (const [key, definition] of Object.entries(schema.settings)) {
            const errors = SettingValidator.validateSettingDefinition(key, definition)
            if (errors.length > 0) {
                const messages = errors.map((e) => e.message).join('; ')
                throw new Error(`Invalid setting definition for "${key}": ${messages}`)
            }

            if (definition.condition && !ConditionEvaluator.validateCondition(definition.condition)) {
                throw new Error(`Invalid condition for setting "${key}"`)
            }
        }
    }

    private getModelType<T extends Record<string, any>>(modelObject: T): string {
        return (modelObject.type || modelObject.model || modelObject.constructor.name).toLowerCase()
    }

    private getModelIdentifier<T extends Record<string, any>>(modelObject: T): string {
        return modelObject.id || modelObject._id || modelObject.userId || modelObject.user_id
    }

    private buildWhereCondition<T extends Record<string, any>>(modelObject: T): Record<string, any> {
        const id = this.getModelIdentifier(modelObject)
        if (!id) {
            throw new Error('Unable to determine unique identifier for database operations')
        }
        return {id}
    }
}
