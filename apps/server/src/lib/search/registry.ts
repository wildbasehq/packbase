import debug from 'debug'
import {z} from 'zod'
import {FunctionCategory, FunctionDefinition, PipelineDataType} from './types'

const logRegistry = debug('vg:search:registry')

/**
 * Registry for search functions that can be used in query pipelines.
 * Supports both namespaced (e.g., agg.COUNT) and non-namespaced (e.g., COUNT) lookups.
 */
export class FunctionRegistry {
    /** Map of function key to definition. Key format: "name" or "namespace.name" */
    private functions: Map<string, FunctionDefinition> = new Map()

    /** Map of namespace to function names within that namespace */
    private namespaces: Map<string, Set<string>> = new Map()

    /** Whether the registry has been initialized */
    private initialized = false

    /**
     * Register a function definition in the registry.
     * Functions can be registered with or without a namespace.
     */
    register<TArgs, TInput, TOutput>(definition: FunctionDefinition<TArgs, TInput, TOutput>): void {
        const {name, namespace} = definition

        // Validate the definition
        this.validateDefinition(definition)

        // Register with full key (namespace.name or just name)
        const fullKey = namespace ? `${namespace}.${name}` : name

        if (this.functions.has(fullKey)) {
            logRegistry('Warning: Overwriting existing function %s', fullKey)
        }

        this.functions.set(fullKey, definition as FunctionDefinition)

        // Also register without namespace for convenience lookups
        if (namespace) {
            // Track namespace
            if (!this.namespaces.has(namespace)) {
                this.namespaces.set(namespace, new Set())
            }
            this.namespaces.get(namespace)!.add(name)

            // Register short name if not already taken by a non-namespaced function
            if (!this.functions.has(name)) {
                this.functions.set(name, definition as FunctionDefinition)
            }
        }

        logRegistry('Registered function: %s (category: %s, input: %s, output: %s)',
            fullKey, definition.category, definition.inputType, definition.outputType)
    }

    /**
     * Resolve a function by name, supporting both namespaced and non-namespaced lookups.
     *
     * @param name - Function name (e.g., "COUNT", "agg.COUNT", "loader.BULKPOSTLOAD")
     * @returns The function definition or undefined if not found
     */
    resolveFunction(name: string): FunctionDefinition | undefined {
        // Try exact match first (handles both "name" and "namespace.name")
        console.log(this.functions)
        const exact = this.functions.get(name)
        if (exact) {
            logRegistry('Resolved function %s (exact match)', name)
            return exact
        }

        // Try case-insensitive match
        const upperName = name.toUpperCase()
        for (const [key, def] of this.functions) {
            if (key.toUpperCase() === upperName) {
                logRegistry('Resolved function %s -> %s (case-insensitive)', name, key)
                return def
            }
        }

        logRegistry('Function not found: %s', name)
        return undefined
    }

    /**
     * Check if a function exists in the registry.
     */
    hasFunction(name: string): boolean {
        return this.resolveFunction(name) !== undefined
    }

    /**
     * Get all registered functions.
     */
    getAllFunctions(): FunctionDefinition[] {
        // Deduplicate since functions may be registered under multiple keys
        const seen = new Set<string>()
        const result: FunctionDefinition[] = []

        for (const def of this.functions.values()) {
            const key = def.namespace ? `${def.namespace}.${def.name}` : def.name
            if (!seen.has(key)) {
                seen.add(key)
                result.push(def)
            }
        }

        return result
    }

    /**
     * Get all functions in a specific category.
     */
    getFunctionsByCategory(category: FunctionCategory): FunctionDefinition[] {
        return this.getAllFunctions().filter(def => def.category === category)
    }

    /**
     * Get all functions in a specific namespace.
     */
    getFunctionsByNamespace(namespace: string): FunctionDefinition[] {
        const names = this.namespaces.get(namespace)
        if (!names) return []

        return Array.from(names)
            .map(name => this.functions.get(`${namespace}.${name}`))
            .filter((def): def is FunctionDefinition => def !== undefined)
    }

    /**
     * Get all registered namespaces.
     */
    getNamespaces(): string[] {
        return Array.from(this.namespaces.keys())
    }

    /**
     * Validate that a pipeline is compatible (input/output types match).
     *
     * @param functionNames - Array of function names in pipeline order
     * @param initialInputType - The input type from the base query
     * @returns Validation result with errors if incompatible
     */
    validatePipeline(functionNames: string[], initialInputType: PipelineDataType = 'rows'): {
        valid: boolean;
        errors: string[];
        outputType: PipelineDataType;
    } {
        const errors: string[] = []
        let currentType: PipelineDataType = initialInputType

        for (let i = 0; i < functionNames.length; i++) {
            const funcName = functionNames[i]
            const func = this.resolveFunction(funcName)

            if (!func) {
                errors.push(`Stage ${i + 1}: Unknown function "${funcName}"`)
                continue
            }

            // Check input type compatibility
            if (func.inputType !== 'any' && func.inputType !== currentType) {
                errors.push(
                    `Stage ${i + 1}: Function "${funcName}" expects input type "${func.inputType}" ` +
                    `but received "${currentType}" from previous stage`
                )
            }

            // Update current type for next stage
            currentType = func.outputType
        }

        return {
            valid: errors.length === 0,
            errors,
            outputType: currentType
        }
    }

    /**
     * Generate documentation for all registered functions.
     */
    generateDocumentation(): string {
        const functions = this.getAllFunctions()
        const lines: string[] = ['# Search Functions Reference\n']

        // Group by category
        const byCategory = new Map<FunctionCategory, FunctionDefinition[]>()
        for (const func of functions) {
            const list = byCategory.get(func.category) || []
            list.push(func)
            byCategory.set(func.category, list)
        }

        for (const [category, funcs] of byCategory) {
            lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Functions\n`)

            for (const func of funcs) {
                const fullName = func.namespace ? `${func.namespace}.${func.name}` : func.name
                lines.push(`### ${fullName}\n`)
                lines.push(func.description)
                lines.push('')
                lines.push(`- **Category:** ${func.category}`)
                lines.push(`- **Input Type:** ${func.inputType}`)
                lines.push(`- **Output Type:** ${func.outputType}`)

                // Generate args documentation from Zod schema
                const argsDoc = this.zodSchemaToMarkdown(func.argsSchema)
                if (argsDoc) {
                    lines.push(`- **Arguments:**`)
                    lines.push(argsDoc)
                }

                lines.push('')
            }
        }

        return lines.join('\n')
    }

    /**
     * Mark the registry as initialized.
     */
    markInitialized(): void {
        this.initialized = true
        logRegistry('Registry initialized with %d functions', this.functions.size)
    }

    /**
     * Check if the registry has been initialized.
     */
    isInitialized(): boolean {
        return this.initialized
    }

    /**
     * Clear all registered functions (useful for testing).
     */
    clear(): void {
        this.functions.clear()
        this.namespaces.clear()
        this.initialized = false
        logRegistry('Registry cleared')
    }

    /**
     * Validate a function definition before registration.
     */
    private validateDefinition(definition: FunctionDefinition): void {
        if (!definition.name || typeof definition.name !== 'string') {
            throw new Error('Function definition must have a name')
        }

        if (!definition.category) {
            throw new Error(`Function ${definition.name}: category is required`)
        }

        if (!definition.argsSchema) {
            throw new Error(`Function ${definition.name}: argsSchema is required`)
        }

        if (typeof definition.execute !== 'function') {
            throw new Error(`Function ${definition.name}: execute must be a function`)
        }

        if (!definition.inputType) {
            throw new Error(`Function ${definition.name}: inputType is required`)
        }

        if (!definition.outputType) {
            throw new Error(`Function ${definition.name}: outputType is required`)
        }
    }

    /**
     * Convert a Zod schema to markdown documentation.
     */
    private zodSchemaToMarkdown(schema: z.ZodSchema): string {
        try {
            // Get the schema shape if it's an object
            if (schema instanceof z.ZodObject) {
                const shape = schema.shape
                const lines: string[] = []

                for (const [key, value] of Object.entries(shape)) {
                    const zodType = value as z.ZodTypeAny
                    const typeName = this.getZodTypeName(zodType)
                    const isOptional = zodType.isOptional()

                    lines.push(`  - \`${key}\`: ${typeName}${isOptional ? ' (optional)' : ''}`)
                }

                return lines.join('\n')
            }

            // Empty object schema
            if (schema instanceof z.ZodObject && Object.keys(schema.shape).length === 0) {
                return '  - None'
            }

            return ''
        } catch {
            return ''
        }
    }

    /**
     * Get a human-readable name for a Zod type.
     */
    private getZodTypeName(schema: z.ZodTypeAny): string {
        if (schema instanceof z.ZodString) return 'string'
        if (schema instanceof z.ZodNumber) return 'number'
        if (schema instanceof z.ZodBoolean) return 'boolean'
        if (schema instanceof z.ZodArray) return 'array'
        if (schema instanceof z.ZodObject) return 'object'
        if (schema instanceof z.ZodOptional) return this.getZodTypeName(schema.unwrap())
        if (schema instanceof z.ZodDefault) return this.getZodTypeName(schema.removeDefault())
        return 'unknown'
    }
}

/** Singleton instance of the function registry */
export const registry = new FunctionRegistry()
