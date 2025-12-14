import {TableColumn, TableSchema} from './schema';

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

/** Aggregations applicable to projection results. */
export type Aggregation = 'COUNT' | 'UNIQUE' | 'FIRST' | 'LAST';

/** Variable assignment statement for pipeline outputs. */
export type Assignment = {
    name: string;
    targetKey?: string;
    query: ExpressionNode;
    asColumn?: string; // legacy single-column support
    asColumns?: string[]; // preferred multi-column support
    asAll?: boolean; // AS *
    aggregation?: Aggregation;
};

/** Expression-only statement (no variable target). */
export type Statement = Assignment | {
    type: 'expression';
    expr: ExpressionNode;
    asColumn?: string; // legacy single-column support
    asColumns?: string[]; // preferred multi-column support
    asAll?: boolean; // AS *
    aggregation?: Aggregation
};

/** Runtime storage for materialized variable values and metadata. */
export type VariableValue = {
    values: any[];
    column?: TableColumn;
    columns?: TableColumn[];
    ids?: any[];
    table?: string;
};

/** Execution-time context passed through predicate/build phases. */
export type ExecutionContext = {
    schemas: Record<string, TableSchema>;
    variables: Record<string, VariableValue>;
    allowedTables?: string[];
    relationChecks?: WeakMap<WhereNode, (record: Record<string, any>) => boolean>;
    loop?: { variable: string; value: any; index: number };
};

/** Parsed search query consisting of one or more statements. */
export type ParsedQuery = {
    statements: Statement[];
};
