import {CompressedLRUCache} from '@/utils/compressed-cache'
import {PrismaClient} from '@prisma/client'
import {z} from 'zod'

// ============================================================================
// Schema Types (duplicated to avoid circular imports)
// ============================================================================

/** Narrowed representation of the scalar types supported by the search layer. */
export type ColumnType =
    'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'json'
    | 'bigint'
    | 'string_array'
    | 'number_array'
    | 'json_array';

/** Metadata for a single column on a table. */
export type TableColumn = {
    name: string;
    type: ColumnType;
    isID: boolean;
    isOptional: boolean;
};

/** Schema description for an entire table keyed by column name. */
export type TableSchema = {
    name: string;
    columns: Record<string, TableColumn>;
};

// ============================================================================
// Query Value Types
// ============================================================================

/**
 * Supported literal/variable value shapes the parser can emit for WHERE clauses.
 */
export type QueryValue =
    | { type: 'string'; value: string; caseSensitive: boolean; prefix?: boolean; suffix?: boolean }
    | { type: 'list'; items: { value: string; or?: boolean; not?: boolean }[]; caseSensitive: boolean }
    | { type: 'date'; value: { from?: string; to?: string } }
    | { type: 'empty' }
    | { type: 'not_empty' }
    | { type: 'variable'; name: string; key?: string; mode: 'ANY' | 'ALL' | 'ONE' };

// ============================================================================
// AST Node Types
// ============================================================================

/** Column selector optionally constrained to specific columns (undefined => all). */
export type ColumnSelector = {
    table: string;
    columns?: string[]; // undefined means all columns
};

/** AST node representing a single WHERE clause variant. */
export type WhereNode =
    | { kind: 'basic'; selector: ColumnSelector; value: QueryValue }
    | { kind: 'relation'; direction: 'forward' | 'backward'; from: string; to: string }
    | { kind: 'group'; children: ExpressionNode[] };

/** Boolean expression tree with AND/OR/NOT over atoms. */
export type ExpressionNode =
    | { op: 'AND' | 'OR'; left: ExpressionNode; right: ExpressionNode }
    | { op: 'NOT'; expr: ExpressionNode }
    | { op: 'ATOM'; where: WhereNode };

// ============================================================================
// Function System Types
// ============================================================================

/** Category of a search function */
export type FunctionCategory = 'aggregation' | 'transform' | 'loader';

/** Input/Output type for pipeline validation */
export type PipelineDataType =
    | 'any'
    | 'rows'           // Array of database rows
    | 'values'         // Array of primitive values (ids, strings, etc.)
    | 'posts'          // Array of enriched post objects
    | 'count'          // Single number (count result)
    | 'unknown';

/**
 * Definition of a search function that can be registered in the function registry.
 */
export interface FunctionDefinition<TArgs = any, TInput = any, TOutput = any> {
    /** Function name (e.g., 'COUNT', 'PAGE') */
    name: string;

    /** Optional namespace for organization (e.g., 'agg' for agg.COUNT) */
    namespace?: string;

    /** Category of the function */
    category: FunctionCategory;

    /** Zod schema for validating function arguments */
    argsSchema: z.ZodSchema<TArgs>;

    /** Expected input type from previous pipeline stage */
    inputType: PipelineDataType;

    /** Output type produced by this function */
    outputType: PipelineDataType;

    /** Human-readable description of the function */
    description: string;

    /** Execute the function with validated arguments and context */
    execute(args: TArgs, context: ExecutionContext): Promise<TOutput>;
}

// ============================================================================
// Pipeline Types
// ============================================================================

/** A single function call in the pipeline */
export interface FunctionCall {
    /** Full function name as parsed (e.g., 'COUNT' or 'agg.COUNT') */
    rawName: string;

    /** Resolved function name without namespace */
    name: string;

    /** Optional namespace prefix */
    namespace?: string;

    /** Parsed and validated arguments */
    args: Record<string, any>;

    /** Raw argument tokens for debugging */
    rawArgs: string[];
}

/** Projection specification for final output shaping */
export interface Projection {
    /** Project all columns */
    all?: boolean;

    /** Specific columns to project */
    columns?: string[];
}

/** A complete parsed statement with pipeline */
export interface Statement {
    /** The base WHERE query */
    query: ExpressionNode;

    /** Pipeline of function calls to apply */
    pipeline: FunctionCall[];

    /** Optional projection (AS clause) */
    projection?: Projection;

    /** Optional variable assignment name */
    variableName?: string;

    /** Optional target key for nested assignment */
    targetKey?: string;
}

/** Parsed search query consisting of one or more statements. */
export interface ParsedQuery {
    statements: Statement[];
}

// ============================================================================
// Execution Context Types
// ============================================================================

/** Runtime storage for materialized variable values and metadata. */
export interface VariableValue {
    values: any[];
    column?: TableColumn;
    columns?: TableColumn[];
    ids?: any[];
    table?: string;
    dataType?: PipelineDataType;
}

/** Query meter to track database query complexity. */
export interface QueryMeter {
    count: number;
    cost: number;
}

/**
 * Execution context passed through pipeline stages.
 */
export interface ExecutionContext {
    /** Prisma client instance */
    prisma: PrismaClient;

    /** Table schemas from Prisma DMMF */
    schemas: CompressedLRUCache<string, TableSchema>;

    /** Stored variable values */
    variables: Record<string, VariableValue>;

    /** Input results from previous pipeline stage */
    inputResults: any[];

    /** Input data type from previous stage */
    inputType: PipelineDataType;

    /** Current user ID for permission checks */
    userId?: string;

    /** Additional metadata */
    metadata: Record<string, any>;

    /** Allowed tables for this query */
    allowedTables?: string[];

    /** Relation checks cache */
    relationChecks?: WeakMap<WhereNode, (record: Record<string, any>) => boolean>;

    /** Loop context for iterating over variable values */
    loop?: { variable: string; value: any; index: number };

    /** Query meter for cost tracking */
    meter: QueryMeter;

    /** Inferred table from query */
    table?: string;

    /** Has more results available (for pagination) */
    hasMore?: boolean;
}

// ============================================================================
// Table Extension Types
// ============================================================================

/**
 * Extension configuration for a table to customize search behavior.
 */
export interface TableExtension {
    /** Name of the table this extension applies to */
    tableName: string;

    /** Search weights for ranking results by column */
    searchWeights?: Record<string, number>;

    /** Column name aliases for convenience */
    aliases?: Record<string, string>;

    /** Custom validators for column values */
    validators?: Record<string, z.ZodSchema>;

    /** Default sort order */
    defaultSort?: {
        column: string;
        direction: 'asc' | 'desc';
    };

    /** Columns to exclude from wildcard selection */
    excludeFromSelect?: string[];

    /** Column type overrides (useful for array types not detected by Prisma DMMF) */
    columnTypes?: Record<string, ColumnType>;
}

// ============================================================================
// Legacy Type Aliases (for backward compatibility during migration)
// ============================================================================

/** @deprecated Use FunctionCategory instead */
export type Aggregation = 'COUNT' | 'UNIQUE' | 'FIRST' | 'LAST';

/** @deprecated Use Statement instead */
export type Assignment = {
    name: string;
    targetKey?: string;
    query: ExpressionNode;
    asColumn?: string;
    asColumns?: string[];
    asAll?: boolean;
    aggregation?: Aggregation;
    skip?: number | string;
    take?: number | string;
};

// Legacy Statement type for backward compatibility
export type LegacyStatement = Assignment | {
    type: 'expression';
    expr: ExpressionNode;
    asColumn?: string;
    asColumns?: string[];
    asAll?: boolean;
    aggregation?: Aggregation
    skip?: number | string;
    take?: number | string;
} | {
    type: 'bulkpostload';
    expr: ExpressionNode;
    asColumn?: string;
    currentUserId?: string;
    name?: string;
    targetKey?: string;
    skip?: number | string;
    take?: number | string;
};
