/**
 * Search API - Extensible Plugin Architecture
 *
 * This module provides a plugin-based search system with pipe-style syntax.
 *
 * ## Usage
 *
 * ### New Pipe Syntax
 * ```
 * [Where posts ("hello")] | PAGE(0, 20) | BULKPOSTLOAD($userId) AS title, body
 * ```
 *
 * ### Pipeline Stages
 * 1. Base WHERE query: `[Where table ("value")]`
 * 2. Function transforms: `| FUNC(args)`
 * 3. Optional projection: `AS column1, column2` or `AS *`
 *
 * ### Available Functions
 *
 * **Aggregation:**
 * - `COUNT()` - Returns count of items
 * - `UNIQUE()` - Returns unique values
 * - `FIRST()` - Returns first item only
 * - `LAST()` - Returns last item only
 *
 * **Transform:**
 * - `PAGE(skip, take)` - Apply pagination
 *
 * **Loader:**
 * - `BULKPOSTLOAD(userId?)` - Enrich post IDs with full data
 *
 * ### Variable Assignment
 * ```
 * $posts = [Where posts ("hello")] | PAGE(0, 20)
 * ```
 *
 * ## Extending
 *
 * ### Adding New Functions
 * Create a new file in `funcs/` directory:
 * ```typescript
 * import {z} from 'zod'
 * import {FunctionDefinition, ExecutionContext} from '../types'
 *
 * export const myFunction: FunctionDefinition = {
 *     name: 'MYFUNC',
 *     namespace: 'custom',  // optional
 *     category: 'transform',
 *     argsSchema: z.object({ param: z.string() }),
 *     inputType: 'rows',
 *     outputType: 'rows',
 *     description: 'My custom function',
 *     execute: async (args, ctx) => { ... }
 * }
 * ```
 *
 * ### Adding Table Extensions
 * Create a new file in `tables/` directory:
 * ```typescript
 * import {TableExtension} from '../types'
 *
 * export const myExtension: TableExtension = {
 *     tableName: 'my_table',
 *     searchWeights: { title: 2.0, body: 1.0 },
 *     aliases: { text: 'body' }
 * }
 * ```
 */

// Initialization
export {
    initializeSearchSystem,
    isSearchSystemInitialized,
    resetSearchSystem,
    getSearchDocumentation
} from './init'

// Registry
export {registry, FunctionRegistry} from './registry'

// Schema
export {
    Schemas,
    Relations,
    isValidTable,
    getColumn,
    getDefaultIdColumn,
    registerTableExtension,
    getTableExtension,
    getAllTableExtensions,
    resolveColumnAlias,
    getSearchWeight,
    loadTableExtensions,
    type TableExtension
} from './schema'

// Types
export type {
    // Core types
    FunctionDefinition,
    FunctionCategory,
    PipelineDataType,
    ExecutionContext,

    // Query types
    QueryValue,
    ColumnSelector,
    WhereNode,
    ExpressionNode,

    // Pipeline types
    FunctionCall,
    Projection,
    Statement,
    ParsedQuery,

    // Variable types
    VariableValue,
    QueryMeter,

    // Schema types
    ColumnType,
    TableColumn,
    TableSchema,

    // Legacy types
    Aggregation,
    Assignment,
    LegacyStatement
} from './types'

// Parser (new)
export {parseQuery} from './parser'

// Executor (new)
export {executeQuery} from './executor'

// Cache
export {makeCacheKey, withQueryCache} from './cache'

// Whitelist
export {
    ensureTableWhitelisted,
    ensureColumnsWhitelisted,
    ensureAllColumnsAllowed
} from './whitelist'
