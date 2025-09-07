/**
 * Query executor for the search API
 * Executes queries represented by AST nodes against the database
 *
 * Features:
 * - Supports UUID prefix in searchable fields (e.g., 'uuid:id' for exact UUID matching)
 * - Type-safe table and column validation
 * - Robust error handling with specific error codes
 * - Full-text search across configurable fields
 * - Support for complex expressions (AND, OR, NOT, comparisons, wildcards, fuzzy search)
 */

import { PrismaClient } from '@prisma/client';
import {
    QueryNode,
    WhereClauseNode,
    TableRefNode,
    ColumnRefNode,
    ExpressionNode,
    NodeType,
    AndExprNode,
    OrExprNode,
    NotExprNode,
    EqualsExprNode,
    GreaterThanExprNode,
    LessThanExprNode,
    GreaterThanEqualsExprNode,
    LessThanEqualsExprNode,
    BetweenExprNode,
    ExistsExprNode,
    SortExprNode,
    WildcardExprNode,
    FuzzyExprNode,
    ExactExprNode,
    CaseExprNode,
    StringLiteralNode,
    NumberLiteralNode,
    BooleanLiteralNode,
    SearchResult,
    SearchError,
} from './types';

// Import Prisma client
import prisma from '@/db/prisma';
import { isValidUUID } from '@/utils/dm/validation';

export class SearchExecutionError extends Error {
    readonly code: string;
    readonly details?: unknown;

    constructor(message: string, code: string = 'EXECUTION_ERROR', details?: unknown) {
        super(message);
        this.name = 'SearchExecutionError';
        this.code = code;
        this.details = details;
    }
}

const ERROR_CODES = {
    INVALID_TABLE: 'INVALID_TABLE',
    TABLE_NOT_ALLOWED: 'TABLE_NOT_ALLOWED',
    COLUMN_NOT_SEARCHABLE: 'COLUMN_NOT_SEARCHABLE',
    MISSING_COLUMN: 'MISSING_COLUMN',
    QUERY_EXECUTION_ERROR: 'QUERY_EXECUTION_ERROR',
    UNSUPPORTED_EXPRESSION: 'UNSUPPORTED_EXPRESSION',
    UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

interface TableConfig {
    idField: string;
    searchableFields: string[];
}

/**
 * Map of valid table names to their configuration
 * Fields with 'uuid:' prefix are treated as UUID fields requiring exact matches
 */
const VALID_TABLES: Record<string, TableConfig> = {
    packs: {
        idField: 'id',
        searchableFields: ['display_name', 'slug', 'description', 'uuid:id'],
    },
    packs_pages: {
        idField: 'id',
        searchableFields: ['title', 'slug', 'uuid:id'],
    },
    posts: {
        idField: 'id',
        searchableFields: ['content_type', 'body', 'uuid:tenant_id', 'uuid:channel_id', 'uuid:id'],
    },
    profiles: {
        idField: 'id',
        searchableFields: ['username', 'bio', 'slug', 'display_name', 'uuid:id'],
    },
    user_themes: {
        idField: 'id',
        searchableFields: ['name', 'html', 'css', 'uuid:id'],
    },
} as const;

type ValidTableName = keyof typeof VALID_TABLES;

/**
 * Executor class for search queries
 */
export class QueryExecutor {
    private readonly namedQueries = new Map<string, QueryNode>();
    private readonly allowedTables?: ReadonlySet<string>;

    constructor(allowedTables?: readonly string[]) {
        this.allowedTables = allowedTables ? new Set(allowedTables.map((table) => table.toLowerCase())) : undefined;
    }

    /**
     * Execute a search query against the database
     * @param query The query node to execute
     * @returns Promise resolving to array of search results containing IDs and table names
     * @throws SearchExecutionError when query execution fails
     */
    async execute(query: QueryNode): Promise<SearchResult[]> {
        try {
            let results: SearchResult[] = [];

            // Check if the whereClause is an OR expression between WHERE clauses
            // @ts-ignore
            if (query.whereClause.type === NodeType.OR_EXPR) {
                // Execute both sides of the OR and combine the results
                const orExpr = query.whereClause as unknown as OrExprNode;

                // Execute left side
                let leftResults: SearchResult[] = [];
                if (orExpr.left.type === NodeType.WHERE_CLAUSE) {
                    leftResults = await this.executeWhereClause(orExpr.left as WhereClauseNode);
                } else if (orExpr.left.type === NodeType.OR_EXPR) {
                    // Recursively handle nested OR expressions
                    const nestedQuery: QueryNode = {
                        type: NodeType.QUERY,
                        // @ts-ignore
                        whereClause: orExpr.left,
                        position: orExpr.left.position,
                    };
                    leftResults = await this.execute(nestedQuery);
                }

                // Execute right side
                let rightResults: SearchResult[] = [];
                if (orExpr.right.type === NodeType.WHERE_CLAUSE) {
                    rightResults = await this.executeWhereClause(orExpr.right as WhereClauseNode);
                } else if (orExpr.right.type === NodeType.OR_EXPR) {
                    // Recursively handle nested OR expressions
                    const nestedQuery: QueryNode = {
                        type: NodeType.QUERY,
                        // @ts-ignore
                        whereClause: orExpr.right,
                        position: orExpr.right.position,
                    };
                    rightResults = await this.execute(nestedQuery);
                }

                // Combine the results
                results = [...leftResults, ...rightResults];
            } else {
                // Process a single WHERE clause
                results = await this.executeWhereClause(query.whereClause);
            }

            // Apply sorting if specified
            if (query.sortExpr) {
                return this.applySorting(results, query.sortExpr);
            }

            return results;
        } catch (error) {
            if (error instanceof SearchExecutionError) {
                throw error;
            }

            throw new SearchExecutionError(error instanceof Error ? error.message : String(error), ERROR_CODES.UNEXPECTED_ERROR, error);
        }
    }

    /**
     * Execute a WHERE clause against a specific table
     * @param whereClause The WHERE clause node containing table and conditions
     * @returns Promise resolving to array of search results
     * @throws SearchExecutionError for invalid tables, columns, or query execution errors
     */
    private async executeWhereClause(whereClause: WhereClauseNode): Promise<SearchResult[]> {
        const tableName = whereClause.table.name.toLowerCase();

        this.validateTable(tableName);

        // Get table configuration
        const tableConfig = VALID_TABLES[tableName];

        if (whereClause.column) {
            this.validateColumn(whereClause.column.name, tableConfig);
        }

        // Build the query
        const query: any = {};

        // Add condition to the query
        const condition = await this.buildCondition(whereClause.condition, tableName, whereClause.column?.name);

        // Execute the query
        try {
            // Use Prisma's findMany with the constructed query
            const queryResult = await (prisma as any)[tableName].findMany({
                where: condition,
                select: {
                    [tableConfig.idField]: true,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });

            // Map results to SearchResult objects
            return queryResult.map((item: any) => ({
                id: item[tableConfig.idField],
                table: tableName,
            }));
        } catch (error) {
            throw new SearchExecutionError(
                `Error executing query on table ${tableName}: ${error instanceof Error ? error.message : String(error)}`,
                ERROR_CODES.QUERY_EXECUTION_ERROR,
                error,
            );
        }
    }

    /**
     * Build a Prisma condition object from an expression node
     * Handles different expression types (AND, OR, EQUALS, etc.) and converts them to Prisma query format
     * @param expr The expression node to convert
     * @param tableName The target table name for validation
     * @param columnName Optional specific column for targeted queries
     * @returns Promise resolving to Prisma-compatible condition object
     * @throws SearchExecutionError for unsupported expressions or missing required parameters
     */
    private async buildCondition(expr: ExpressionNode, tableName: string, columnName?: string): Promise<any> {
        const tableConfig = VALID_TABLES[tableName];

        switch (expr.type) {
            case NodeType.AND_EXPR: {
                const andExpr = expr as AndExprNode;
                const leftCondition = await this.buildCondition(andExpr.left, tableName, columnName);
                const rightCondition = await this.buildCondition(andExpr.right, tableName, columnName);

                return {
                    AND: [leftCondition, rightCondition],
                };
            }

            case NodeType.OR_EXPR: {
                const orExpr = expr as OrExprNode;
                const leftCondition = await this.buildCondition(orExpr.left, tableName, columnName);
                const rightCondition = await this.buildCondition(orExpr.right, tableName, columnName);

                return {
                    OR: [leftCondition, rightCondition],
                };
            }

            case NodeType.NOT_EXPR: {
                const notExpr = expr as NotExprNode;
                const condition = await this.buildCondition(notExpr.expr, tableName, columnName);

                return {
                    NOT: condition,
                };
            }

            case NodeType.EQUALS_EXPR: {
                const equalsExpr = expr as EqualsExprNode;
                const value = this.getLiteralValue(equalsExpr.value);

                if (columnName) {
                    return this.buildColumnCondition(columnName, value, tableConfig);
                } else {
                    return this.buildFullTextSearch(value, tableConfig);
                }
            }

            case NodeType.GREATER_THAN_EXPR: {
                const gtExpr = expr as GreaterThanExprNode;
                const value = this.getLiteralValue(gtExpr.value);

                if (!columnName) {
                    throw new SearchExecutionError('Column name is required for comparison operators', ERROR_CODES.MISSING_COLUMN);
                }

                return {
                    [columnName]: {
                        gt: value,
                    },
                };
            }

            case NodeType.LESS_THAN_EXPR: {
                const ltExpr = expr as LessThanExprNode;
                const value = this.getLiteralValue(ltExpr.value);

                if (!columnName) {
                    throw new SearchExecutionError('Column name is required for comparison operators', ERROR_CODES.MISSING_COLUMN);
                }

                return {
                    [columnName]: {
                        lt: value,
                    },
                };
            }

            case NodeType.GREATER_THAN_EQUALS_EXPR: {
                const gteExpr = expr as GreaterThanEqualsExprNode;
                const value = this.getLiteralValue(gteExpr.value);

                if (!columnName) {
                    throw new SearchExecutionError('Column name is required for comparison operators', ERROR_CODES.MISSING_COLUMN);
                }

                return {
                    [columnName]: {
                        gte: value,
                    },
                };
            }

            case NodeType.LESS_THAN_EQUALS_EXPR: {
                const lteExpr = expr as LessThanEqualsExprNode;
                const value = this.getLiteralValue(lteExpr.value);

                if (!columnName) {
                    throw new SearchExecutionError('Column name is required for comparison operators', ERROR_CODES.MISSING_COLUMN);
                }

                return {
                    [columnName]: {
                        lte: value,
                    },
                };
            }

            case NodeType.BETWEEN_EXPR: {
                const betweenExpr = expr as BetweenExprNode;
                const startValue = this.getLiteralValue(betweenExpr.start);
                const endValue = this.getLiteralValue(betweenExpr.end);

                if (!columnName) {
                    throw new SearchExecutionError('Column name is required for BETWEEN operator', ERROR_CODES.MISSING_COLUMN);
                }

                return {
                    [columnName]: {
                        gte: startValue,
                        lte: endValue,
                    },
                };
            }

            case NodeType.EXISTS_EXPR: {
                if (!columnName) {
                    throw new SearchExecutionError('Column name is required for EXISTS operator', ERROR_CODES.MISSING_COLUMN);
                }

                return {
                    [columnName]: {
                        not: null,
                    },
                };
            }

            case NodeType.WILDCARD_EXPR: {
                const wildcardExpr = expr as WildcardExprNode;
                const pattern = wildcardExpr.pattern;

                // Convert wildcard pattern to regex pattern
                const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');

                if (columnName) {
                    // Column-specific query
                    return {
                        [columnName]: {
                            contains: pattern.replace(/\*/g, ''),
                            mode: 'insensitive',
                        },
                    };
                } else {
                    // Full-text search across all searchable fields
                    return {
                        OR: tableConfig.searchableFields.map((field) => ({
                            [field]: {
                                contains: pattern.replace(/\*/g, ''),
                                mode: 'insensitive',
                            },
                        })),
                    };
                }
            }

            case NodeType.FUZZY_EXPR: {
                const fuzzyExpr = expr as FuzzyExprNode;
                const term = fuzzyExpr.term;
                const distance = fuzzyExpr.distance;

                if (columnName) {
                    return this.buildColumnCondition(columnName, term, tableConfig);
                } else {
                    return this.buildFullTextSearch(term, tableConfig);
                }
            }

            case NodeType.EXACT_EXPR: {
                const exactExpr = expr as ExactExprNode;
                const term = exactExpr.term;

                if (columnName) {
                    // Column-specific query
                    return {
                        [columnName]: term,
                    };
                } else {
                    // Full-text search across all searchable fields
                    return {
                        OR: tableConfig.searchableFields.map((field) => ({
                            [field]: term,
                        })),
                    };
                }
            }

            case NodeType.CASE_EXPR: {
                const caseExpr = expr as CaseExprNode;
                // This will be used to set the mode for subsequent queries
                // Since we're not actually executing this directly, we'll return a placeholder
                return {};
            }

            case NodeType.WHERE_CLAUSE: {
                // Handle nested query
                const nestedResults = await this.executeWhereClause(expr as WhereClauseNode);

                // Extract IDs from nested results
                const nestedIds = nestedResults.map((result) => result.id);

                // Use the IDs to filter the current table
                if (columnName) {
                    return {
                        [columnName]: {
                            in: nestedIds,
                        },
                    };
                } else {
                    return {
                        id: {
                            in: nestedIds,
                        },
                    };
                }
            }

            default:
                throw new SearchExecutionError(`Unsupported expression type: ${expr.type}`, 'UNSUPPORTED_EXPRESSION');
        }
    }

    private getLiteralValue(node: StringLiteralNode | NumberLiteralNode | BooleanLiteralNode): string | number | boolean {
        return node.value;
    }

    /**
     * Apply sorting to search results
     * @param results The search results to sort
     * @param sortExpr The sort expression
     * @returns Sorted search results
     */
    private applySorting(results: SearchResult[], sortExpr: SortExprNode): SearchResult[] {
        const field = sortExpr.field;
        const direction = sortExpr.direction;

        // Sort the results
        return [...results].sort((a, b) => {
            if (field === 'id') {
                // Sort by ID
                return direction === 'ASC' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
            } else if (field === 'table') {
                // Sort by table name
                return direction === 'ASC' ? a.table.localeCompare(b.table) : b.table.localeCompare(a.table);
            } else if (field === 'score' && a.score !== undefined && b.score !== undefined) {
                // Sort by score
                return direction === 'ASC' ? a.score - b.score : b.score - a.score;
            }

            // Default sort by ID
            return direction === 'ASC' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
        });
    }

    private validateTable(tableName: string): void {
        if (!VALID_TABLES[tableName as ValidTableName]) {
            throw new SearchExecutionError(`Invalid table name: ${tableName}`, ERROR_CODES.INVALID_TABLE);
        }

        if (this.allowedTables && !this.allowedTables.has(tableName)) {
            throw new SearchExecutionError(`Table '${tableName}' is not in the allowed tables list`, ERROR_CODES.TABLE_NOT_ALLOWED);
        }
    }

    private validateColumn(columnName: string, tableConfig: TableConfig): void {
        const isSearchable = tableConfig.searchableFields.some((field) => {
            if (field.startsWith('uuid:')) {
                return field.slice(5) === columnName;
            }
            return field === columnName;
        });

        if (!isSearchable) {
            throw new SearchExecutionError(`Column '${columnName}' is not searchable`, ERROR_CODES.COLUMN_NOT_SEARCHABLE);
        }
    }

    private isUuidField(fieldName: string, tableConfig: TableConfig): boolean {
        return tableConfig.searchableFields.includes(`uuid:${fieldName}`);
    }

    private buildColumnCondition(columnName: string, value: any, tableConfig: TableConfig): any {
        if (this.isUuidField(columnName, tableConfig)) {
            if (isValidUUID(String(value))) {
                return {
                    [columnName]: {
                        equals: String(value),
                    },
                };
            }
            return null;
        }

        if (columnName === 'content_type') {
            return {
                [columnName]: {
                    equals: String(value),
                },
            };
        }

        return {
            [columnName]: {
                contains: String(value),
                mode: 'insensitive',
            },
        };
    }

    private buildFullTextSearch(value: any, tableConfig: TableConfig): any {
        const conditions = tableConfig.searchableFields
            .map((field) => {
                const isUuidField = field.startsWith('uuid:');
                const actualFieldName = isUuidField ? field.slice(5) : field;

                if (isUuidField) {
                    if (isValidUUID(String(value))) {
                        return {
                            [actualFieldName]: {
                                equals: String(value),
                            },
                        };
                    }
                    return null;
                }

                if (actualFieldName === 'content_type') {
                    return {
                        [actualFieldName]: {
                            equals: String(value),
                        },
                    };
                }

                return {
                    [actualFieldName]: {
                        contains: String(value),
                        mode: 'insensitive',
                    },
                };
            })
            .filter((condition) => condition !== null);

        return conditions.length > 0 ? { OR: conditions } : {};
    }

    storeNamedQuery(name: string, query: QueryNode): void {
        this.namedQueries.set(name, query);
    }

    getNamedQuery(name: string): QueryNode | undefined {
        return this.namedQueries.get(name);
    }
}

/**
 * Execute a search query
 * @param query The query node to execute
 * @param allowedTables Optional list of tables that are allowed to be searched
 * @returns Array of search results (UUIDs)
 */
export async function executeQuery(query: QueryNode, allowedTables?: string[]): Promise<SearchResult[]> {
    const executor = new QueryExecutor(allowedTables);
    return await executor.execute(query);
}
