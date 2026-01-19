import debug from 'debug'
import {z} from 'zod'
import {registry} from './registry'
import {loadTableExtensions, getAllTableExtensions} from './schema'
import {FunctionDefinition} from './types'

const logInit = debug('vg:search:init')

/** Whether the search system has been initialized */
let initialized = false

/** Initialization promise for deduplication */
let initPromise: Promise<void> | null = null

/**
 * Zod schema for validating function definitions at load time.
 */
const FunctionDefinitionSchema = z.object({
    name: z.string().min(1),
    namespace: z.string().optional(),
    category: z.enum(['aggregation', 'transform', 'loader']),
    argsSchema: z.instanceof(z.ZodType),
    inputType: z.enum(['any', 'rows', 'values', 'posts', 'count', 'unknown']),
    outputType: z.enum(['any', 'rows', 'values', 'posts', 'count', 'unknown']),
    description: z.string(),
    execute: z.function()
})

/**
 * Load and register all function plugins from the funcs/ directory.
 */
const loadFunctionPlugins = async (): Promise<void> => {
    logInit('Loading function plugins...')
    
    // Import all functions from the funcs directory
    const funcs = await import('./funcs')
    
    let loadedCount = 0
    
    for (const [exportName, exportValue] of Object.entries(funcs)) {
        // Skip the default export and index
        if (exportName === 'default') continue
        
        const funcDef = exportValue as FunctionDefinition
        
        // Validate the function definition
        try {
            // Basic validation - check required properties exist
            if (!funcDef || typeof funcDef !== 'object') {
                logInit('Skipping invalid export %s: not an object', exportName)
                continue
            }
            
            if (!funcDef.name || !funcDef.execute) {
                logInit('Skipping invalid export %s: missing name or execute', exportName)
                continue
            }
            
            // Register the function
            registry.register(funcDef)
            loadedCount++
            
            const fullName = funcDef.namespace 
                ? `${funcDef.namespace}.${funcDef.name}` 
                : funcDef.name
            
            logInit('Loaded function: %s (category: %s)', fullName, funcDef.category)
        } catch (err: any) {
            logInit('Failed to load function %s: %s', exportName, err.message)
        }
    }
    
    logInit('Loaded %d function plugins', loadedCount)
}

/**
 * Generate documentation markdown for all registered functions.
 */
const generateFunctionDocs = (): string => {
    const docs = registry.generateDocumentation()
    logInit('Generated function documentation (%d bytes)', docs.length)
    return docs
}

/**
 * Log startup summary of loaded components.
 */
const logStartupSummary = (): void => {
    const functions = registry.getAllFunctions()
    const namespaces = registry.getNamespaces()
    const extensions = getAllTableExtensions()
    
    console.log('\n=== Search System Initialized ===')
    console.log(`Functions: ${functions.length}`)
    
    if (namespaces.length > 0) {
        console.log(`Namespaces: ${namespaces.join(', ')}`)
    }
    
    // Group functions by category
    const byCategory = new Map<string, string[]>()
    for (const func of functions) {
        const list = byCategory.get(func.category) || []
        const name = func.namespace ? `${func.namespace}.${func.name}` : func.name
        list.push(name)
        byCategory.set(func.category, list)
    }
    
    for (const [category, names] of byCategory) {
        console.log(`  ${category}: ${names.join(', ')}`)
    }
    
    if (extensions.length > 0) {
        console.log(`Table Extensions: ${extensions.map(e => e.tableName).join(', ')}`)
    }
    
    console.log('=================================\n')
}

/**
 * Initialize the search system.
 * Loads all function plugins and table extensions.
 * Safe to call multiple times - will only initialize once.
 */
export const initializeSearchSystem = async (): Promise<void> => {
    // Return immediately if already initialized
    if (initialized) {
        return
    }
    
    // If initialization is in progress, wait for it
    if (initPromise) {
        return initPromise
    }
    
    // Start initialization
    initPromise = (async () => {
        try {
            logInit('Initializing search system...')
            const startTime = Date.now()
            
            // Load function plugins
            await loadFunctionPlugins()
            
            // Load table extensions
            await loadTableExtensions()
            
            // Mark registry as initialized
            registry.markInitialized()
            
            // Log summary
            const elapsed = Date.now() - startTime
            logInit('Search system initialized in %dms', elapsed)
            
            // Log detailed startup summary
            logStartupSummary()
            
            initialized = true
        } catch (err) {
            initPromise = null
            throw err
        }
    })()
    
    return initPromise
}

/**
 * Check if the search system has been initialized.
 */
export const isSearchSystemInitialized = (): boolean => {
    return initialized
}

/**
 * Reset the search system (for testing).
 */
export const resetSearchSystem = (): void => {
    registry.clear()
    initialized = false
    initPromise = null
    logInit('Search system reset')
}

/**
 * Get the generated function documentation.
 */
export const getSearchDocumentation = (): string => {
    if (!initialized) {
        throw new Error('Search system not initialized. Call initializeSearchSystem() first.')
    }
    return generateFunctionDocs()
}

// Export singleton instances for use throughout the application
export {registry} from './registry'
export {Schemas, Relations, getAllTableExtensions, getTableExtension} from './schema'
