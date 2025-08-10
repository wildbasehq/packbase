/**
 * Query executor for the search API
 * Executes queries represented by AST nodes against the database
 */

import {PrismaClient} from '@prisma/client'
import {
    QueryNode, WhereClauseNode, TableRefNode, ColumnRefNode, ExpressionNode,
    NodeType, AndExprNode, OrExprNode, NotExprNode, EqualsExprNode,
    GreaterThanExprNode, LessThanExprNode, GreaterThanEqualsExprNode,
    LessThanEqualsExprNode, BetweenExprNode, ExistsExprNode, SortExprNode,
    WildcardExprNode, FuzzyExprNode, ExactExprNode, CaseExprNode,
    StringLiteralNode, NumberLiteralNode, BooleanLiteralNode,
    SearchResult, SearchError
} from './types'

// Import Prisma client
import prisma from '@/db/prisma'

export class SearchExecutionError extends Error {
    code: string
    details?: any

    constructor(message: string, code: string = 'EXECUTION_ERROR', details?: any) {
        super(message)
        this.name = 'SearchExecutionError'
        this.code = code
        this.details = details
    }
}

/**
 * Map of valid table names to their ID field names
 * This ensures we only query tables that exist and have UUID IDs
 */
const VALID_TABLES: Record<string, { idField: string, searchableFields: string[] }> = {
    'packs': {
        idField: 'id',
        searchableFields: ['display_name', 'slug', 'description']
    },
    'packs_pages': {
        idField: 'id',
        searchableFields: ['title', 'slug']
    },
    'posts': {
        idField: 'id',
        searchableFields: ['content_type', 'body', 'tenant_id', 'channel_id']
    },
    'profiles': {
        idField: 'id',
        searchableFields: ['username', 'bio', 'slug', 'display_name']
    },
    'user_themes': {
        idField: 'id',
        searchableFields: ['name', 'html', 'css']
    }
}

/**
 * Executor class for search queries
 */
export class QueryExecutor {
    private namedQueries: Map<string, QueryNode> = new Map()
    private allowedTables?: string[]

    /**
     * Create a new QueryExecutor
     * @param allowedTables Optional list of tables that are allowed to be searched
     */
    constructor(allowedTables?: string[]) {
        this.allowedTables = allowedTables?.map(table => table.toLowerCase())
    }

    /**
     * Execute a search query
     * @param query The query node to execute
     * @returns Array of search results (UUIDs)
     */
    async execute(query: QueryNode): Promise<SearchResult[]> {
        try {
            let results: SearchResult[] = []

            // Check if the whereClause is an OR expression between WHERE clauses
            if (query.whereClause.type === NodeType.OR_EXPR) {
                // Execute both sides of the OR and combine the results
                const orExpr = query.whereClause as OrExprNode

                // Execute left side
                let leftResults: SearchResult[] = []
                if (orExpr.left.type === NodeType.WHERE_CLAUSE) {
                    leftResults = await this.executeWhereClause(orExpr.left as WhereClauseNode)
                } else if (orExpr.left.type === NodeType.OR_EXPR) {
                    // Recursively handle nested OR expressions
                    const nestedQuery: QueryNode = {
                        type: NodeType.QUERY,
                        whereClause: orExpr.left,
                        position: orExpr.left.position
                    }
                    leftResults = await this.execute(nestedQuery)
                }

                // Execute right side
                let rightResults: SearchResult[] = []
                if (orExpr.right.type === NodeType.WHERE_CLAUSE) {
                    rightResults = await this.executeWhereClause(orExpr.right as WhereClauseNode)
                } else if (orExpr.right.type === NodeType.OR_EXPR) {
                    // Recursively handle nested OR expressions
                    const nestedQuery: QueryNode = {
                        type: NodeType.QUERY,
                        whereClause: orExpr.right,
                        position: orExpr.right.position
                    }
                    rightResults = await this.execute(nestedQuery)
                }

                // Combine the results
                results = [...leftResults, ...rightResults]
            } else {
                // Process a single WHERE clause
                results = await this.executeWhereClause(query.whereClause)
            }

            // Apply sorting if specified
            if (query.sortExpr) {
                return this.applySorting(results, query.sortExpr)
            }

            return results
        } catch (error) {
            if (error instanceof SearchExecutionError) {
                throw error
            }

            throw new SearchExecutionError(
                error instanceof Error ? error.message : String(error),
                'UNEXPECTED_ERROR',
                error
            )
        }
    }

    /**
     * Execute a WHERE clause
     * @param whereClause The WHERE clause to execute
     * @returns Array of search results
     */
    private async executeWhereClause(whereClause: WhereClauseNode): Promise<SearchResult[]> {
        const tableName = whereClause.table.name.toLowerCase()

        // Validate table name
        if (!VALID_TABLES[tableName]) {
            throw new SearchExecutionError(
                `Invalid table name: ${tableName}`,
                'INVALID_TABLE'
            )
        }

        // Check if table is in the allowlist
        if (this.allowedTables && this.allowedTables.length > 0 && !this.allowedTables.includes(tableName)) {
            throw new SearchExecutionError(
                `Table '${tableName}' is not in the allowed tables list`,
                'TABLE_NOT_ALLOWED'
            )
        }

        // Get table configuration
        const tableConfig = VALID_TABLES[tableName]

        // Check if column is searchable
        if (whereClause.column && !tableConfig.searchableFields.includes(whereClause.column.name)) {
            throw new SearchExecutionError(
                `Column '${whereClause.column.name}' is not searchable`,
                'COLUMN_NOT_SEARCHABLE'
            )
        }

        // Build the query
        const query: any = {}

        // Add condition to the query
        const condition = await this.buildCondition(whereClause.condition, tableName, whereClause.column?.name)

        // Execute the query
        try {
            // Use Prisma's findMany with the constructed query
            const queryResult = await (prisma as any)[tableName].findMany({
                where: condition,
                select: {
                    [tableConfig.idField]: true
                },
                orderBy: {
                    'created_at': 'desc'
                }
            })

            // Map results to SearchResult objects
            return queryResult.map((item: any) => ({
                id: item[tableConfig.idField],
                table: tableName
            }))
        } catch (error) {
            throw new SearchExecutionError(
                `Error executing query on table ${tableName}: ${error instanceof Error ? error.message : String(error)}`,
                'QUERY_EXECUTION_ERROR',
                error
            )
        }
    }

    /**
     * Build a condition object for Prisma from an expression node
     * @param expr The expression node
     * @param tableName The current table name
     * @param columnName Optional column name for column-specific queries
     * @returns Prisma condition object
     */
    private async buildCondition(
        expr: ExpressionNode,
        tableName: string,
        columnName?: string
    ): Promise<any> {
        const tableConfig = VALID_TABLES[tableName]

        switch (expr.type) {
            case NodeType.AND_EXPR: {
                const andExpr = expr as AndExprNode
                const leftCondition = await this.buildCondition(andExpr.left, tableName, columnName)
                const rightCondition = await this.buildCondition(andExpr.right, tableName, columnName)

                return {
                    AND: [leftCondition, rightCondition]
                }
            }

            case NodeType.OR_EXPR: {
                const orExpr = expr as OrExprNode
                const leftCondition = await this.buildCondition(orExpr.left, tableName, columnName)
                const rightCondition = await this.buildCondition(orExpr.right, tableName, columnName)

                return {
                    OR: [leftCondition, rightCondition]
                }
            }

            case NodeType.NOT_EXPR: {
                const notExpr = expr as NotExprNode
                const condition = await this.buildCondition(notExpr.expr, tableName, columnName)

                return {
                    NOT: condition
                }
            }

            case NodeType.EQUALS_EXPR: {
                const equalsExpr = expr as EqualsExprNode
                const value = this.getLiteralValue(equalsExpr.value)

                if (columnName) {
                    // Column-specific query
                    return {
                        [columnName]: value
                    }
                } else {
                    // Full-text search across all searchable fields
                    return {
                        OR: tableConfig.searchableFields.map(field => {
                            // For UUID fields like 'id', we need to use a different approach
                            // if (field === 'id') {
                            //   return {
                            //     [field]: {
                            //       equals: String(value)
                            //     }
                            //   };
                            // }
                            // For fields that might not support contains with mode
                            if (field === 'content_type') {
                                return {
                                    [field]: {
                                        equals: String(value)
                                    }
                                }
                            }
                            // For other text fields, use contains with insensitive mode
                            return {
                                [field]: {
                                    contains: String(value),
                                    mode: 'insensitive'
                                }
                            }
                        })
                    }
                }
            }

            case NodeType.GREATER_THAN_EXPR: {
                const gtExpr = expr as GreaterThanExprNode
                const value = this.getLiteralValue(gtExpr.value)

                if (!columnName) {
                    throw new SearchExecutionError(
                        'Column name is required for comparison operators',
                        'MISSING_COLUMN'
                    )
                }

                return {
                    [columnName]: {
                        gt: value
                    }
                }
            }

            case NodeType.LESS_THAN_EXPR: {
                const ltExpr = expr as LessThanExprNode
                const value = this.getLiteralValue(ltExpr.value)

                if (!columnName) {
                    throw new SearchExecutionError(
                        'Column name is required for comparison operators',
                        'MISSING_COLUMN'
                    )
                }

                return {
                    [columnName]: {
                        lt: value
                    }
                }
            }

            case NodeType.GREATER_THAN_EQUALS_EXPR: {
                const gteExpr = expr as GreaterThanEqualsExprNode
                const value = this.getLiteralValue(gteExpr.value)

                if (!columnName) {
                    throw new SearchExecutionError(
                        'Column name is required for comparison operators',
                        'MISSING_COLUMN'
                    )
                }

                return {
                    [columnName]: {
                        gte: value
                    }
                }
            }

            case NodeType.LESS_THAN_EQUALS_EXPR: {
                const lteExpr = expr as LessThanEqualsExprNode
                const value = this.getLiteralValue(lteExpr.value)

                if (!columnName) {
                    throw new SearchExecutionError(
                        'Column name is required for comparison operators',
                        'MISSING_COLUMN'
                    )
                }

                return {
                    [columnName]: {
                        lte: value
                    }
                }
            }

            case NodeType.BETWEEN_EXPR: {
                const betweenExpr = expr as BetweenExprNode
                const startValue = this.getLiteralValue(betweenExpr.start)
                const endValue = this.getLiteralValue(betweenExpr.end)

                if (!columnName) {
                    throw new SearchExecutionError(
                        'Column name is required for BETWEEN operator',
                        'MISSING_COLUMN'
                    )
                }

                return {
                    [columnName]: {
                        gte: startValue,
                        lte: endValue
                    }
                }
            }

            case NodeType.EXISTS_EXPR: {
                if (!columnName) {
                    throw new SearchExecutionError(
                        'Column name is required for EXISTS operator',
                        'MISSING_COLUMN'
                    )
                }

                return {
                    [columnName]: {
                        not: null
                    }
                }
            }

            case NodeType.WILDCARD_EXPR: {
                const wildcardExpr = expr as WildcardExprNode
                const pattern = wildcardExpr.pattern

                // Convert wildcard pattern to regex pattern
                const regexPattern = pattern
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.')

                if (columnName) {
                    // Column-specific query
                    return {
                        [columnName]: {
                            contains: pattern.replace(/\*/g, ''),
                            mode: 'insensitive'
                        }
                    }
                } else {
                    // Full-text search across all searchable fields
                    return {
                        OR: tableConfig.searchableFields.map(field => ({
                            [field]: {
                                contains: pattern.replace(/\*/g, ''),
                                mode: 'insensitive'
                            }
                        }))
                    }
                }
            }

            case NodeType.FUZZY_EXPR: {
                const fuzzyExpr = expr as FuzzyExprNode
                const term = fuzzyExpr.term
                const distance = fuzzyExpr.distance

                // For fuzzy matching, we'll use a simplified approach with contains
                // A more sophisticated implementation would use a proper fuzzy matching algorithm
                if (columnName) {
                    // Column-specific query
                    return {
                        [columnName]: {
                            contains: term,
                            mode: 'insensitive'
                        }
                    }
                } else {
                    // Full-text search across all searchable fields
                    return {
                        OR: tableConfig.searchableFields.map(field => ({
                            [field]: {
                                contains: term,
                                mode: 'insensitive'
                            }
                        }))
                    }
                }
            }

            case NodeType.EXACT_EXPR: {
                const exactExpr = expr as ExactExprNode
                const term = exactExpr.term

                if (columnName) {
                    // Column-specific query
                    return {
                        [columnName]: term
                    }
                } else {
                    // Full-text search across all searchable fields
                    return {
                        OR: tableConfig.searchableFields.map(field => ({
                            [field]: term
                        }))
                    }
                }
            }

            case NodeType.CASE_EXPR: {
                const caseExpr = expr as CaseExprNode
                // This will be used to set the mode for subsequent queries
                // Since we're not actually executing this directly, we'll return a placeholder
                return {}
            }

            case NodeType.WHERE_CLAUSE: {
                // Handle nested query
                const nestedResults = await this.executeWhereClause(expr as WhereClauseNode)

                // Extract IDs from nested results
                const nestedIds = nestedResults.map(result => result.id)

                // Use the IDs to filter the current table
                if (columnName) {
                    return {
                        [columnName]: {
                            in: nestedIds
                        }
                    }
                } else {
                    return {
                        id: {
                            in: nestedIds
                        }
                    }
                }
            }

            default:
                throw new SearchExecutionError(
                    `Unsupported expression type: ${expr.type}`,
                    'UNSUPPORTED_EXPRESSION'
                )
        }
    }

    /**
     * Get the value from a literal node
     * @param node The literal node
     * @returns The literal value
     */
    private getLiteralValue(node: StringLiteralNode | NumberLiteralNode | BooleanLiteralNode): any {
        return node.value
    }

    /**
     * Apply sorting to search results
     * @param results The search results to sort
     * @param sortExpr The sort expression
     * @returns Sorted search results
     */
    private applySorting(results: SearchResult[], sortExpr: SortExprNode): SearchResult[] {
        const field = sortExpr.field
        const direction = sortExpr.direction

        // Sort the results
        return [...results].sort((a, b) => {
            if (field === 'id') {
                // Sort by ID
                return direction === 'ASC'
                    ? a.id.localeCompare(b.id)
                    : b.id.localeCompare(a.id)
            } else if (field === 'table') {
                // Sort by table name
                return direction === 'ASC'
                    ? a.table.localeCompare(b.table)
                    : b.table.localeCompare(a.table)
            } else if (field === 'score' && a.score !== undefined && b.score !== undefined) {
                // Sort by score
                return direction === 'ASC'
                    ? a.score - b.score
                    : b.score - a.score
            }

            // Default sort by ID
            return direction === 'ASC'
                ? a.id.localeCompare(b.id)
                : b.id.localeCompare(a.id)
        })
    }

    /**
     * Store a named query
     * @param name The name of the query
     * @param query The query node
     */
    storeNamedQuery(name: string, query: QueryNode): void {
        this.namedQueries.set(name, query)
    }

    /**
     * Get a named query
     * @param name The name of the query
     * @returns The query node or undefined if not found
     */
    getNamedQuery(name: string): QueryNode | undefined {
        return this.namedQueries.get(name)
    }
}

/**
 * Execute a search query
 * @param query The query node to execute
 * @param allowedTables Optional list of tables that are allowed to be searched
 * @returns Array of search results (UUIDs)
 */
export async function executeQuery(query: QueryNode, allowedTables?: string[]): Promise<SearchResult[]> {
    const executor = new QueryExecutor(allowedTables)
    return await executor.execute(query)
}
