import {TableColumn, TableSchema} from './schema';

export type QueryValue =
    | { type: 'string'; value: string; caseSensitive: boolean; prefix?: boolean; suffix?: boolean }
    | { type: 'date'; value: { from?: string; to?: string } }
    | { type: 'empty' }
    | { type: 'not_empty' }
    | { type: 'variable'; name: string; key?: string; mode: 'ANY' | 'ALL' | 'ONE' };

export type ColumnSelector = {
    table: string;
    columns?: string[]; // undefined means all columns
};

export type WhereNode =
    | { kind: 'basic'; selector: ColumnSelector; value: QueryValue }
    | { kind: 'relation'; direction: 'forward' | 'backward'; from: string; to: string }
    | { kind: 'group'; children: ExpressionNode[] };

export type ExpressionNode =
    | { op: 'AND' | 'OR'; left: ExpressionNode; right: ExpressionNode }
    | { op: 'NOT'; expr: ExpressionNode }
    | { op: 'ATOM'; where: WhereNode };

export type Aggregation = 'COUNT' | 'UNIQUE' | 'FIRST' | 'LAST';

export type Assignment = {
    name: string;
    targetKey?: string;
    query: ExpressionNode;
    asColumn?: string; // legacy single-column support
    asColumns?: string[]; // preferred multi-column support
    asAll?: boolean; // AS *
    aggregation?: Aggregation;
};

export type Statement = Assignment | {
    type: 'expression';
    expr: ExpressionNode;
    asColumn?: string; // legacy single-column support
    asColumns?: string[]; // preferred multi-column support
    asAll?: boolean; // AS *
    aggregation?: Aggregation
};

export type VariableValue = {
    values: any[];
    column?: TableColumn;
    columns?: TableColumn[];
    ids?: any[];
    table?: string;
};

export type ExecutionContext = {
    schemas: Record<string, TableSchema>;
    variables: Record<string, VariableValue>;
    allowedTables?: string[];
    relationChecks?: WeakMap<WhereNode, (record: Record<string, any>) => boolean>;
    loop?: { variable: string; value: any; index: number };
};

export type ParsedQuery = {
    statements: Statement[];
};
