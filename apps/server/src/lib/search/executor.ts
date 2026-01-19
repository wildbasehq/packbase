import prisma from '@/db/prisma'
import {HTTPError} from '@/lib/HTTPError'
import debug from 'debug'
import {makeCacheKey, withQueryCache} from './cache'
import {registry} from './registry'
import {getColumn, getDefaultIdColumn, Relations, Schemas} from './schema'
import {
    ExecutionContext,
    ExpressionNode,
    FunctionCall,
    PipelineDataType,
    QueryValue,
    Statement,
    VariableValue,
    WhereNode
} from './types'
import {ensureAllColumnsAllowed, ensureColumnsWhitelisted, ensureTableWhitelisted} from './whitelist'

const logExec = debug('vg:search:executor')
const logPrisma = debug('vg:search:executor:prisma')
const logPred = debug('vg:search:executor:predicate')
const logPipeline = debug('vg:search:executor:pipeline')

// ============================================================================
// Query Cost Tracking
// ============================================================================

/**
 * Calculate complexity overhead based on total number of keys and array items in a where clause.
 */
const calculateComplexity = (where: any | null): number => {
    if (!where) return 0

    let count = 0
    const traverse = (obj: any) => {
        if (!obj) return

        if (Array.isArray(obj)) {
            count += obj.length
            obj.forEach(traverse)
        } else if (typeof obj === 'object') {
            const keys = Object.keys(obj)
            count += keys.length
            for (const key of keys) {
                traverse(obj[key])
            }
        } else if (typeof obj === 'string') {
            count += obj.length
        }
    }

    traverse(where)
    return count
}

/**
 * Track a database query in the meter.
 */
const trackQuery = (ctx: ExecutionContext, where: any | null, addModifier?: number) => {
    const complexity = calculateComplexity(where)
    let cost = 1 + complexity
    
    if (ctx.loop) {
        cost *= 1 + ctx.loop.index
    }

    cost += Object.keys(ctx.variables).length

    ctx.meter.count++
    ctx.meter.cost += cost + (addModifier || 0)

    if (logExec.enabled) {
        logExec('trackQuery: count=%d complexity=%d cost=%d total=%d', ctx.meter.count, complexity, cost, ctx.meter.cost)
    }

    if (ctx.meter.cost > 1024) {
        throw HTTPError.payloadTooLarge({
            summary: 'Query too complex',
        })
    }
}

// ============================================================================
// Predicate Building
// ============================================================================

type Predicate = (record: Record<string, any>) => boolean;

const buildStringPredicate = (value: string, caseSensitive: boolean, prefix?: boolean, suffix?: boolean): Predicate => {
    if (logPred.enabled) {
        logPred('buildStringPredicate value="%s" caseSensitive=%s prefix=%s suffix=%s', value, caseSensitive, !!prefix, !!suffix)
    }
    return (recordValue: any) => {
        if (typeof recordValue !== 'string') return false
        const target = caseSensitive ? recordValue : recordValue.toLowerCase()
        const needle = caseSensitive ? value : value.toLowerCase()
        if (prefix) return target.startsWith(needle)
        if (suffix) return target.endsWith(needle)
        return target.includes(needle)
    }
}

const buildDatePredicate = (from?: string, to?: string): Predicate => {
    return (recordValue: any) => {
        if (!recordValue) return false
        const ts = new Date(recordValue).getTime()
        if (Number.isNaN(ts)) return false
        if (from && ts < new Date(from).getTime()) return false
        if (to && ts > new Date(to).getTime()) return false
        return true
    }
}

const buildValuePredicate = (value: QueryValue, ctx: ExecutionContext, columnName?: string): Predicate => {
    if (logPred.enabled) {
        logPred('buildValuePredicate type=%s column=%s', value.type, columnName ?? '<any>')
    }
    switch (value.type) {
        case 'string':
            return buildStringPredicate(value.value, value.caseSensitive, value.prefix, value.suffix)

        case 'list': {
            const itemPredicates = value.items.map((item) => {
                const predicate = buildStringPredicate(item.value, value.caseSensitive)
                return {predicate, or: item.or, not: item.not}
            })

            return (v: any) => {
                const values = Array.isArray(v) ? v : [v]
                if (values.length === 0) return false

                const negatives = itemPredicates.filter((i) => i.not)
                if (negatives.length) {
                    const negHit = values.some((val) => negatives.some((n) => n.predicate(val)))
                    if (negHit) return false
                }

                const positives = itemPredicates.filter((i) => !i.not)
                if (!positives.length) return true

                const orItems = positives.filter((p) => p.or)
                const andItems = positives.filter((p) => !p.or)

                if (andItems.length && !andItems.every((p) => values.some((val) => p.predicate(val)))) return false
                if (orItems.length && !orItems.some((p) => values.some((val) => p.predicate(val)))) return false

                return true
            }
        }
        case 'date':
            return buildDatePredicate(value.value.from, value.value.to)
        case 'empty':
            return (v: any) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
        case 'not_empty':
            return (v: any) => !(v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0))
        case 'variable': {
            const variable = ctx.variables[value.name]
            if (!variable) return () => false

            if (value.mode === 'ONE') {
                if (!ctx.loop || ctx.loop.variable !== value.name) {
                    throw new Error(`Variable ${value.name} with ONE requires loop context`)
                }
                const current = ctx.loop.value
                const keyVal = value.key
                    ? (current && typeof current === 'object' && !Array.isArray(current) ? current[value.key] : undefined)
                    : current
                return (v: any) => v === keyVal
            }

            const sample = variable.values?.[0]
            const isObjectVar = sample && typeof sample === 'object' && !Array.isArray(sample)
            if (isObjectVar && !value.key) {
                throw new Error(`Variable ${value.name} is an object; specify a key with :<field>`)
            }

            const sourceValues = value.key
                ? variable.values
                    .map((v: any) => {
                        if (v && typeof v === 'object' && !Array.isArray(v)) return v[value.key!]
                        return undefined
                    })
                    .filter((v) => v !== undefined)
                : variable.values

            if (value.mode === 'ANY') {
                return (v: any) => sourceValues.some((x) => x === v)
            }
            return (v: any) => sourceValues.every((x) => x === v)
        }
    }
}

const buildWherePredicate = (expr: ExpressionNode, ctx: ExecutionContext): Predicate => {
    if (logPred.enabled) {
        logPred('buildWherePredicate op=%s', expr.op)
    }
    switch (expr.op) {
        case 'ATOM': {
            const where = expr.where
            if (where.kind === 'basic') {
                const predicate = buildValuePredicate(where.value, ctx, where.selector.columns?.[0])
                return (record: Record<string, any>) => {
                    const cols = where.selector.columns ?? Object.keys(record)
                    const checkFn = where.value.type === 'list' ? 'every' : 'some'
                    return cols[checkFn]((c) => predicate(record[c]))
                }
            }
            if (where.kind === 'relation') {
                const checker = ctx.relationChecks?.get(where)
                if (!checker) return () => false
                return (record) => checker(record)
            }
            return () => false
        }
        case 'NOT': {
            const inner = buildWherePredicate(expr.expr, ctx)
            return (record) => !inner(record)
        }
        case 'AND': {
            const left = buildWherePredicate(expr.left, ctx)
            const right = buildWherePredicate(expr.right, ctx)
            return (record) => left(record) && right(record)
        }
        case 'OR': {
            const left = buildWherePredicate(expr.left, ctx)
            const right = buildWherePredicate(expr.right, ctx)
            return (record) => left(record) || right(record)
        }
    }
}

// ============================================================================
// Prisma Query Building
// ============================================================================

const gatherColumns = (expr: ExpressionNode, acc: Set<string>) => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'basic' && expr.where.selector.columns) {
            expr.where.selector.columns.forEach((c) => acc.add(c))
        }
    } else if (expr.op === 'NOT') {
        gatherColumns(expr.expr, acc)
    } else {
        gatherColumns(expr.left, acc)
        gatherColumns(expr.right, acc)
    }
}

const needsAllColumns = (expr: ExpressionNode): boolean => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'basic' && !expr.where.selector.columns) return true
        return false
    }
    if (expr.op === 'NOT') return needsAllColumns(expr.expr)
    return needsAllColumns(expr.left) || needsAllColumns(expr.right)
}

const collectRelationNodes = (expr: ExpressionNode, acc: WhereNode[] = []): WhereNode[] => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'relation') acc.push(expr.where)
    } else if (expr.op === 'NOT') {
        collectRelationNodes(expr.expr, acc)
    } else {
        collectRelationNodes(expr.left, acc)
        collectRelationNodes(expr.right, acc)
    }
    return acc
}

const buildPrismaWhere = (expr: ExpressionNode, ctx: ExecutionContext, table?: string): any | null => {
    if (logPrisma.enabled) {
        logPrisma('buildPrismaWhere table=%s op=%s', table ?? '<unknown>', expr.op)
    }
    switch (expr.op) {
        case 'ATOM': {
            const where = expr.where
            if (where.kind !== 'basic') return null
            if (!where.selector.columns || where.selector.columns.length === 0) {
                return null
            }

            const columns = where.selector.columns
            const value = where.value

            const buildColumnCondition = (column: string): any | null => {
                const columnMeta = table ? getColumn(table, column) : undefined
                const columnType = columnMeta?.type

                if (logPrisma.enabled) {
                    logPrisma('ATOM where pushdown attempt table=%s column=%s type=%s valueType=%s', table, column, columnType, value.type)
                }

                if (value.type === 'string') {
                    if (columnType === 'string' && value.value.length === 36 && value.value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
                        return {[column]: value.value}
                    }

                    if (!value.prefix && !value.suffix && ['number', 'bigint', 'boolean', 'date'].includes(columnType || '')) {
                        return {[column]: value.value}
                    }

                    if (columnType === 'string') {
                        const mode = value.caseSensitive ? undefined : 'insensitive'
                        if (value.prefix) return {[column]: {startsWith: value.value, mode}}
                        if (value.suffix) return {[column]: {endsWith: value.value, mode}}
                        return {[column]: {contains: value.value, mode}}
                    }

                    return null
                }

                if (value.type === 'date') {
                    if (columnType !== 'date') return null

                    const filters: Record<string, any> = {}
                    if (value.value.from) filters.gte = new Date(value.value.from).toISOString()
                    if (value.value.to) filters.lte = new Date(value.value.to).toISOString()
                    if (Object.keys(filters).length) return {[column]: filters}
                    return null
                }

                return null
            }

            const columnConditions = columns
                .map(buildColumnCondition)
                .filter((cond): cond is NonNullable<typeof cond> => cond !== null)

            if (columnConditions.length === 0) {
                return null
            }

            if (columnConditions.length === 1) {
                return columnConditions[0]
            }

            return {OR: columnConditions}
        }
        case 'AND': {
            const left = buildPrismaWhere(expr.left, ctx, table)
            const right = buildPrismaWhere(expr.right, ctx, table)
            if (logPrisma.enabled) {
                logPrisma('AND pushdown left=%s right=%s', !!left, !!right)
            }
            if (left && right) return {AND: [left, right]}
            return null
        }
        case 'OR': {
            const left = buildPrismaWhere(expr.left, ctx, table)
            const right = buildPrismaWhere(expr.right, ctx, table)
            if (logPrisma.enabled) {
                logPrisma('OR pushdown left=%s right=%s', !!left, !!right)
            }
            if (left && right) return {OR: [left, right]}
            return null
        }
        case 'NOT':
            if (logPrisma.enabled) {
                logPrisma('NOT not pushed down')
            }
            return null
    }
}

// ============================================================================
// Relation Resolvers
// ============================================================================

const findRelationMeta = (from: string, to: string, direction: 'forward' | 'backward') => {
    if (direction === 'forward') {
        return Relations.find((r) => r.from === from && r.to === to)
    }
    return Relations.find((r) => r.from === to && r.to === from)
}

const buildRelationResolvers = async (relations: WhereNode[], rows: any[], ctx: ExecutionContext) => {
    const checks = new WeakMap<WhereNode, (record: Record<string, any>) => boolean>()
    if (logExec.enabled) {
        logExec('buildRelationResolvers: relations=%d rows=%d', relations.length, rows.length)
    }
    for (const rel of relations) {
        if (rel.kind !== 'relation') continue
        const meta = findRelationMeta(rel.from, rel.to, rel.direction)
        if (!meta) {
            if (logExec.enabled) {
                logExec('No relation meta found for %s %s %s', rel.from, rel.direction, rel.to)
            }
            checks.set(rel, () => false)
            continue
        }

        const keyFields = rel.direction === 'forward' ? meta.fromFields : meta.toFields
        const targetFields = rel.direction === 'forward' ? meta.toFields : meta.fromFields
        const targetTable = rel.direction === 'forward' ? meta.to : meta.from

        const keyTuples: string[][] = []
        for (const row of rows) {
            const values = keyFields.map((f) => row[f])
            if (values.some((v) => v === undefined || v === null)) continue
            keyTuples.push(values.map((v) => `${v}`))
        }

        if (logExec.enabled) {
            logExec('Relation %s %s %s keyTuples=%d', rel.from, rel.direction, rel.to, keyTuples.length)
        }

        if (keyTuples.length === 0) {
            checks.set(rel, () => false)
            continue
        }

        const tupleKey = (vals: string[]) => vals.join('|')
        const uniqueTuples = Array.from(new Set(keyTuples.map(tupleKey))).map((key) => key.split('|'))
        const whereClauses = uniqueTuples.map((vals) => Object.fromEntries(targetFields.map((f, idx) => [f, vals[idx]])))

        const relationWhere = {OR: whereClauses}
        trackQuery(ctx, relationWhere)

        const targetRows = await (prisma as any)[targetTable].findMany({
            where: relationWhere,
            select: Object.fromEntries(targetFields.map((f) => [f, true])),
        })

        if (logExec.enabled) {
            logExec('Relation %s %s %s targetRows=%d', rel.from, rel.direction, rel.to, targetRows.length)
        }

        const existing = new Set<string>()
        for (const row of targetRows) {
            const vals = targetFields.map((f) => row[f])
            if (vals.some((v) => v === undefined || v === null)) continue
            existing.add(tupleKey(vals.map((v) => `${v}`)))
        }

        checks.set(rel, (record: Record<string, any>) => {
            const vals = keyFields.map((f) => record[f])
            if (vals.some((v) => v === undefined || v === null)) return false
            return existing.has(tupleKey(vals.map((v) => `${v}`)))
        })
    }
    return checks
}

// ============================================================================
// Table Inference
// ============================================================================

const findTable = (expr: ExpressionNode): string | null => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'basic') return expr.where.selector.table
        if (expr.where.kind === 'relation') return expr.where.from
    } else {
        if (expr.op === 'NOT') return findTable(expr.expr)
        return findTable(expr.left) || findTable(expr.right)
    }
    return null
}

// ============================================================================
// Base Query Execution
// ============================================================================

/**
 * Execute the base WHERE query and return raw rows.
 */
const executeBaseQuery = async (stmt: Statement, ctx: ExecutionContext): Promise<any[]> => {
    const expr = stmt.query
    
    // Determine table from query
    const table = findTable(expr)
    if (!table) throw new Error('Unable to infer table from query')
    
    ctx.table = table
    
    if (logExec.enabled) {
        logExec('executeBaseQuery table=%s allowedTables=%o', table, ctx.allowedTables)
    }
    
    ensureTableWhitelisted(table)
    if (ctx.allowedTables && !ctx.allowedTables.includes(table)) {
        if (logExec.enabled) {
            logExec('Table %s not in allowedTables, aborting', table)
        }
        throw new Error('Table not allowed')
    }

    // Determine columns to select
    const idColumn = getDefaultIdColumn(table)?.name || 'id'
    const neededColumns = new Set<string>([idColumn])
    
    // Add projection columns if specified
    if (stmt.projection?.columns) {
        stmt.projection.columns.forEach(c => neededColumns.add(c))
    }
    
    let selectAll = stmt.projection?.all || needsAllColumns(expr)
    gatherColumns(expr, neededColumns)

    const relationNodes = collectRelationNodes(expr)
    for (const rel of relationNodes) {
        if (rel.kind !== 'relation') continue
        const meta = findRelationMeta(rel.from, rel.to, rel.direction)
        if (!meta) continue
        meta.fromFields.forEach((f) => neededColumns.add(f))
        meta.toFields.forEach((f) => neededColumns.add(f))
    }

    if (selectAll) {
        ensureAllColumnsAllowed(table)
        const schema = Schemas[table]
        if (!schema) throw new Error(`Unknown schema for table ${table}`)
        Object.keys(schema.columns).forEach((c) => neededColumns.add(c))
    } else {
        ensureColumnsWhitelisted(table, Array.from(neededColumns))
    }

    if (logExec.enabled) {
        logExec('executeBaseQuery neededColumns=%o selectAll=%s', Array.from(neededColumns), selectAll)
    }

    const select = Object.fromEntries(Array.from(neededColumns).map((c) => [c, true]))
    const prismaWhere = buildPrismaWhere(expr, ctx, table)

    if (logPrisma.enabled) {
        logPrisma('Prisma findMany table=%s selectKeys=%o where=%o', table, Object.keys(select), prismaWhere)
    }

    // Get orderBy from schema
    const schema = Schemas[table]
    const hasCreatedAt = schema?.columns['created_at']
    const orderBy = hasCreatedAt ? {created_at: 'desc' as const} : undefined

    // Track query
    trackQuery(ctx, {
        ...prismaWhere,
        select,
        orderBy,
        take: 100
    })

    // Execute query with reasonable limit
    const rows = await (prisma as any)[table].findMany({
        select,
        where: prismaWhere ?? undefined,
        orderBy,
        take: 100
    })

    if (logPrisma.enabled) {
        logPrisma('Prisma findMany table=%s rows=%d', table, rows.length)
    }

    // Build relation resolvers if needed
    if (relationNodes.length) {
        if (logExec.enabled) {
            logExec('executeBaseQuery building relation resolvers for %d relations', relationNodes.length)
        }
        ctx.relationChecks = await buildRelationResolvers(relationNodes, rows, ctx)
    }

    // Apply in-memory filtering
    const predicate = buildWherePredicate(expr, ctx)
    const filtered = rows.filter((r: any) => predicate(r))
    
    if (logExec.enabled) {
        logExec('executeBaseQuery filtered rows=%d (from %d)', filtered.length, rows.length)
    }

    return filtered
}

// ============================================================================
// Pipeline Execution
// ============================================================================

/**
 * Execute a single pipeline function.
 */
const executePipelineFunction = async (
    funcCall: FunctionCall,
    ctx: ExecutionContext,
    stageIndex: number
): Promise<any[]> => {
    const funcDef = registry.resolveFunction(funcCall.name)
    if (!funcDef) {
        throw new Error(`Pipeline stage ${stageIndex + 1}: Unknown function "${funcCall.name}"`)
    }

    if (logPipeline.enabled) {
        logPipeline('executePipelineFunction stage=%d func=%s inputCount=%d', 
            stageIndex + 1, funcCall.name, ctx.inputResults.length)
    }

    // Resolve variable references in args
    const resolvedArgs = resolveVariableArgs(funcCall.args, ctx)

    try {
        const result = await funcDef.execute(resolvedArgs, ctx)
        
        // Update context for next stage
        ctx.inputResults = result
        ctx.inputType = funcDef.outputType
        
        if (logPipeline.enabled) {
            logPipeline('executePipelineFunction stage=%d func=%s outputCount=%d outputType=%s',
                stageIndex + 1, funcCall.name, result.length, funcDef.outputType)
        }

        return result
    } catch (error: any) {
        throw new Error(`Pipeline stage ${stageIndex + 1} (${funcCall.name}) failed: ${error.message}`)
    }
}

/**
 * Resolve variable references in function arguments.
 */
const resolveVariableArgs = (args: Record<string, any>, ctx: ExecutionContext): Record<string, any> => {
    const resolved: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(args)) {
        if (typeof value === 'string' && value.startsWith('$')) {
            const varName = value.slice(1)
            const variable = ctx.variables[varName]
            resolved[key] = variable?.values?.[0] ?? undefined
        } else {
            resolved[key] = value
        }
    }

    resolved.userId = ctx.userId
    
    return resolved
}

/**
 * Apply projection to final results.
 */
const applyProjection = (results: any[], stmt: Statement, ctx: ExecutionContext): any[] => {
    const projection = stmt.projection
    if (!projection) {
        // Default: return IDs
        const idColumn = getDefaultIdColumn(ctx.table || '')?.name || 'id'
        return results.map(r => typeof r === 'object' && r !== null ? r[idColumn] : r)
    }

    if (projection.all) {
        return results.map(r => ({...r}))
    }

    if (projection.columns?.length) {
        return results.map(r => {
            if (typeof r !== 'object' || r === null) return r
            return Object.fromEntries(projection.columns!.map(c => [c, r[c]]))
        })
    }

    return results
}

// ============================================================================
// Statement Execution
// ============================================================================

/**
 * Execute a single statement with its full pipeline.
 */
const executeStatement = async (stmt: Statement, ctx: ExecutionContext): Promise<{
    name?: string;
    values: any[];
    hasMore?: boolean;
}> => {
    if (logExec.enabled) {
        logExec('executeStatement start pipeline=%d funcs variableName=%s',
            stmt.pipeline.length, stmt.variableName)
    }

    // Execute base WHERE query
    let results = await executeBaseQuery(stmt, ctx)
    
    // Initialize context for pipeline
    ctx.inputResults = results
    ctx.inputType = 'rows' as PipelineDataType

    // Execute pipeline functions in order
    for (let i = 0; i < stmt.pipeline.length; i++) {
        results = await executePipelineFunction(stmt.pipeline[i], ctx, i)
    }

    // Apply projection to final results
    const projectedResults = applyProjection(results, stmt, ctx)

    // Store in variables if named
    const variableValue: VariableValue = {
        values: projectedResults,
        table: ctx.table,
        dataType: ctx.inputType
    }

    if (stmt.variableName) {
        ctx.variables[stmt.variableName] = variableValue
        ctx.variables['_prev'] = variableValue
        return {name: stmt.variableName, values: projectedResults, hasMore: ctx.hasMore}
    }

    ctx.variables['_prev'] = variableValue
    return {values: projectedResults, hasMore: ctx.hasMore}
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Execute a parsed query consisting of one or more statements.
 */
export const executeQuery = async (statements: Statement[], userId?: string) => {
    // Generate cache key from statements
    const key = makeCacheKey(statements as any)

    if (logExec.enabled) {
        logExec('executeQuery start statements=%d cacheKeyLen=%d', statements.length, key.length)
    }

    return withQueryCache(key, async () => {
        const ctx: ExecutionContext = {
            prisma,
            schemas: Schemas,
            variables: {},
            inputResults: [],
            inputType: 'unknown',
            userId,
            metadata: {},
            meter: {count: 0, cost: 0}
        }

        const results: any[] = []

        for (const stmt of statements) {
            try {
                const res = await executeStatement(stmt, ctx)
                results.push(res)
            } catch (err: any) {
                if (logExec.enabled) {
                    logExec('executeStatement error: %s', err?.message ?? err)
                }
                if (err.message?.includes('Unknown argument `contains`')) {
                    throw HTTPError.badRequest({
                        summary: 'Trying to search column with unsupported type. Are you trying to search a UUID/JSON/Date/Etc. with partial string matching?',
                    })
                }
                throw err
            }
        }

        const returnObj: any = {
            variables: ctx.variables,
            meter: {
                count: ctx.meter.count,
                cost: ctx.meter.cost
            }
        }

        for (const res of results) {
            const name = (res as any).name || 'result'
            returnObj[name] = (res as any).values

            if ((res as any).hasMore !== undefined) {
                returnObj[`${name}_has_more`] = (res as any).hasMore
            }
        }

        return returnObj
    })
}
