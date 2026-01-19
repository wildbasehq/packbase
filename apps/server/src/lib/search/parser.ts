import debug from 'debug'
import {isValidTable, Schemas} from './schema'
import {registry} from './registry'
import {
    ColumnSelector,
    ExpressionNode,
    FunctionCall,
    ParsedQuery,
    Projection,
    QueryValue,
    Statement,
    WhereNode
} from './types'

const logParser = debug('vg:search:parser')
const logValue = debug('vg:search:parser:value')
const logWhere = debug('vg:search:parser:where')
const logPipeline = debug('vg:search:parser:pipeline')

// ============================================================================
// Comment Stripping
// ============================================================================

/**
 * Strip `//` line comments from a query string while preserving newlines and keeping
 * `//` that appear inside double-quoted string literals.
 */
const stripLineComments = (input: string): string => {
    if (logParser.enabled) {
        const preview = input.length > 200 ? input.slice(0, 200) + '…' : input
        logParser('stripLineComments inputLen=%d preview="%s"', input.length, preview)
    }
    let result = ''
    let inString = false
    let escape = false

    for (let i = 0; i < input.length; i++) {
        const ch = input[i]
        const next = input[i + 1]

        if (!inString && ch === '/' && next === '/') {
            // Skip until end of line but keep the newline itself (if any)
            while (i < input.length && input[i] !== '\n') {
                i++
            }
            if (i < input.length && input[i] === '\n') {
                result += '\n'
            }
            continue
        }

        result += ch

        if (inString) {
            if (escape) {
                escape = false
            } else if (ch === '\\') {
                escape = true
            } else if (ch === '"') {
                inString = false
            }
        } else if (ch === '"') {
            inString = true
            escape = false
        }
    }

    if (logParser.enabled) {
        logParser('stripLineComments outputLen=%d', result.length)
    }

    return result
}

// ============================================================================
// Pipeline Splitting
// ============================================================================

/**
 * Split a query string on `|` pipe characters at the top level,
 * respecting bracket/parenthesis nesting and quoted strings.
 */
const splitPipeline = (input: string): string[] => {
    const parts: string[] = []
    let current = ''
    let depth = 0
    let inString = false
    let escape = false

    for (let i = 0; i < input.length; i++) {
        const ch = input[i]

        // Handle string literals
        if (inString) {
            current += ch
            if (escape) {
                escape = false
            } else if (ch === '\\') {
                escape = true
            } else if (ch === '"') {
                inString = false
            }
            continue
        }

        if (ch === '"') {
            inString = true
            current += ch
            continue
        }

        // Track nesting depth
        if (ch === '[' || ch === '(') {
            depth++
            current += ch
            continue
        }
        if (ch === ']' || ch === ')') {
            depth--
            current += ch
            continue
        }

        // Split on | at top level
        if (ch === '|' && depth === 0) {
            if (current.trim()) {
                parts.push(current.trim())
            }
            current = ''
            continue
        }

        current += ch
    }

    if (current.trim()) {
        parts.push(current.trim())
    }

    if (logPipeline.enabled) {
        logPipeline('splitPipeline parts=%d', parts.length)
    }

    return parts
}

// ============================================================================
// Variable Assignment Parsing
// ============================================================================

/**
 * Detect a variable assignment of the form `$var[:target]=...`.
 * Returns the variable name, optional target key, and the raw inner query text.
 */
const parseVariableAssignment = (input: string): { name: string; targetKey?: string; inner: string } | null => {
    const match = input.match(/^\$([A-Za-z_][A-Za-z0-9_]*)(?::([A-Za-z0-9_]+))?\s*=\s*(.*)$/s)
    if (!match) return null
    return {name: match[1], targetKey: match[2], inner: match[3]}
}

// ============================================================================
// Projection (AS clause) Parsing
// ============================================================================

/**
 * Parse a trailing `AS` projection clause.
 * Supports single column, comma-delimited columns, or `*` for all columns.
 */
const parseProjection = (input: string): { projection?: Projection; rest: string } => {
    // Check for trailing AS clause
    const match = input.match(/^(.*)\s+AS\s+([A-Za-z0-9_\.\*]+(?:\s*,\s*[A-Za-z0-9_\.\*]+)*)\s*$/is)
    if (!match) {
        return {rest: input}
    }

    const raw = match[2].trim()
    const rest = match[1].trim()

    if (raw === '*') {
        return {projection: {all: true}, rest}
    }

    const columns = raw.split(',').map(c => c.trim()).filter(Boolean)
    return {projection: {columns}, rest}
}

// ============================================================================
// Function Call Parsing
// ============================================================================

/**
 * Parse a function call of the form `FUNC(arg1, arg2)` or `namespace.FUNC(arg1)`.
 * Validates that the function exists in the registry.
 */
const parseFunctionCall = (segment: string): FunctionCall => {
    const trimmed = segment.trim()
    
    // Match function name (with optional namespace) and arguments
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)\s*\(\s*(.*?)\s*\)$/s)
    if (!match) {
        throw new Error(`Invalid function call syntax: ${trimmed}`)
    }

    const rawName = match[1]
    const argsStr = match[2]

    // Parse namespace.name or just name
    let namespace: string | undefined
    let name: string
    
    if (rawName.includes('.')) {
        const parts = rawName.split('.')
        namespace = parts[0]
        name = parts[1]
    } else {
        name = rawName
    }

    // Resolve function from registry
    const funcDef = registry.resolveFunction(rawName)
    if (!funcDef) {
        throw new Error(`Unknown function: ${rawName}`)
    }

    // Parse arguments
    const rawArgs = parseArguments(argsStr)
    const args = validateAndParseArgs(rawArgs, funcDef)

    if (logPipeline.enabled) {
        logPipeline('parseFunctionCall name=%s namespace=%s args=%o', name, namespace, args)
    }

    return {
        rawName,
        name: funcDef.name,  // Use canonical name from definition
        namespace: funcDef.namespace,
        args,
        rawArgs
    }
}

/**
 * Parse comma-separated arguments, respecting nested parentheses and quoted strings.
 */
const parseArguments = (argsStr: string): string[] => {
    if (!argsStr.trim()) return []

    const args: string[] = []
    let current = ''
    let depth = 0
    let inString = false
    let escape = false

    for (let i = 0; i < argsStr.length; i++) {
        const ch = argsStr[i]

        if (inString) {
            current += ch
            if (escape) {
                escape = false
            } else if (ch === '\\') {
                escape = true
            } else if (ch === '"') {
                inString = false
            }
            continue
        }

        if (ch === '"') {
            inString = true
            current += ch
            continue
        }

        if (ch === '(' || ch === '[') {
            depth++
            current += ch
            continue
        }

        if (ch === ')' || ch === ']') {
            depth--
            current += ch
            continue
        }

        if (ch === ',' && depth === 0) {
            args.push(current.trim())
            current = ''
            continue
        }

        current += ch
    }

    if (current.trim()) {
        args.push(current.trim())
    }

    return args
}

/**
 * Validate and parse arguments against a function's Zod schema.
 * Supports positional arguments and variable references.
 */
const validateAndParseArgs = (rawArgs: string[], funcDef: any): Record<string, any> => {
    const schema = funcDef.argsSchema
    
    // Get schema shape to map positional args
    const shape = schema._def?.shape?.() || {}
    const keys = Object.keys(shape)
    
    // Build args object from positional arguments
    const argsObj: Record<string, any> = {}
    
    for (let i = 0; i < rawArgs.length; i++) {
        const arg = rawArgs[i]
        const key = keys[i]
        
        if (!key && rawArgs.length > 0) {
            // If we have args but no schema keys, this might be an error
            // or the function uses a different schema structure
            continue
        }
        
        if (key) {
            argsObj[key] = parseArgValue(arg)
        }
    }
    
    // Validate with Zod
    try {
        return schema.parse(argsObj)
    } catch (e: any) {
        throw new Error(`Invalid arguments for ${funcDef.name}: ${e.message}`)
    }
}

/**
 * Parse a single argument value (number, string, variable reference).
 */
const parseArgValue = (arg: string): any => {
    const trimmed = arg.trim()
    
    // Variable reference
    if (trimmed.startsWith('$')) {
        return trimmed  // Keep as variable reference for runtime resolution
    }
    
    // Quoted string
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1)
    }
    
    // Number
    const num = Number(trimmed)
    if (!isNaN(num)) {
        return num
    }
    
    // Boolean
    if (trimmed.toLowerCase() === 'true') return true
    if (trimmed.toLowerCase() === 'false') return false
    
    // Plain string
    return trimmed
}

// ============================================================================
// Value Parsing (for WHERE clauses)
// ============================================================================

/**
 * Parse the value portion of a WHERE atom. Supports:
 * - ("text"[:i|s]) with optional wildcards *prefix/suffix
 * - lists of quoted values: ("foo" "~bar" "-baz" [:i|s])
 * - ("from".."to") date ranges
 * - (EMPTY) / (NOT EMPTY)
 * - ($var[:key] -> ANY|ALL|ONE) variable references
 */
const parseValue = (raw: string): QueryValue => {
    const trimmed = raw.trim()
    if (logValue.enabled) {
        const preview = trimmed.length > 200 ? trimmed.slice(0, 200) + '…' : trimmed
        logValue('parseValue rawLen=%d preview="%s"', trimmed.length, preview)
    }
    
    if (/^\(\s*EMPTY\s*\)$/i.test(trimmed)) return {type: 'empty'}
    if (/^\(\s*NOT\s+EMPTY\s*\)$/i.test(trimmed)) return {type: 'not_empty'}

    const variableMatch = trimmed.match(/^\(\s*\$([A-Za-z_][A-Za-z0-9_]*)(?::([A-Za-z0-9_\.]+))?\s*->\s*(ANY|ALL|ONE)\s*\)$/i)
    if (variableMatch) {
        const value: QueryValue = {
            type: 'variable',
            name: variableMatch[1],
            key: variableMatch[2],
            mode: variableMatch[3].toUpperCase() as 'ANY' | 'ALL' | 'ONE'
        }
        if (logValue.enabled) {
            logValue('parseValue variable name=%s key=%s mode=%s', value.name, value.key, value.mode)
        }
        return value
    }

    // Lists: one or more quoted values, optional trailing :i|s flag
    const listMatch = trimmed.match(/^\(\s*((?:"[\s\S]*?"\s*)+)(?::([is]))?\s*\)$/i)
    if (listMatch) {
        const itemsRaw = listMatch[1]
        const flag = listMatch[2]
        const itemMatches = Array.from(itemsRaw.matchAll(/"([\s\S]*?)"/g))

        const firstValue = itemMatches[0]?.[1] ?? ''
        const hasSpecialPrefix = firstValue.startsWith('~') || firstValue.startsWith('-')

        if (itemMatches.length > 2 || hasSpecialPrefix) {
            const items = itemMatches.map((m) => {
                let value = m[1]
                let or = false
                let not = false
                if (value.startsWith('~')) {
                    or = true
                    value = value.slice(1)
                } else if (value.startsWith('-')) {
                    not = true
                    value = value.slice(1)
                }

                return {value, or: or ? true : undefined, not: not ? true : undefined}
            })

            if (logValue.enabled) {
                logValue('parseValue list items=%d caseSensitive=%s', items.length, flag === 's')
            }

            return {type: 'list', items, caseSensitive: flag === 's'}
        }
    }

    const stringMatch = trimmed.match(/^\(\s*"([\s\S]*)"\s*(?::([is]))?\s*\)$/i)
    if (stringMatch) {
        const text = stringMatch[1]
        const flag = stringMatch[2]
        const prefix = text.startsWith('*')
        const suffix = text.endsWith('*')
        const core = text.replace(/^\*/, '').replace(/\*$/, '')
        if (logValue.enabled) {
            logValue('parseValue string len=%d caseSensitive=%s prefix=%s suffix=%s', core.length, flag === 's', prefix, suffix)
        }
        return {
            type: 'string',
            value: core,
            caseSensitive: flag === 's',
            prefix: prefix ? true : undefined,
            suffix: suffix ? true : undefined
        }
    }

    const rangeMatch = trimmed.match(/^\(\s*"([^\"]+)"\s*\.\.\s*"?([^"\)]*)"?\s*\)$/)
    if (rangeMatch) {
        const from = rangeMatch[1] || undefined
        const to = rangeMatch[2] || undefined
        if (logValue.enabled) {
            logValue('parseValue date from=%s to=%s', from, to)
        }
        return {type: 'date', value: {from: from || undefined, to: to || undefined}}
    }

    if (logValue.enabled) {
        logValue('parseValue unsupported raw="%s"', trimmed)
    }
    throw new Error(`Unsupported value: ${raw}`)
}

// ============================================================================
// WHERE Clause Parsing
// ============================================================================

/**
 * Parse a column selector from a WHERE clause segment.
 */
const parseColumnSelector = (segment: string): ColumnSelector => {
    const match = segment.match(/^Where\s+([A-Za-z0-9_\.]+)(?::([A-Za-z0-9_,\.]+))?/i)
    if (!match) throw new Error(`Invalid Where clause: ${segment}`)
    const table = match[1]
    if (!isValidTable(table)) throw new Error(`Unknown table: ${table}`)
    let cols = match[2]?.split(',').map((c) => c.trim()).filter(Boolean)
    if (!cols?.length) {
        // Force all string columns if empty after filtering from schema
        cols = Schemas[table]
            ? Object.keys(Schemas[table].columns).filter(colName =>
                Schemas[table].columns[colName].type === 'string' && !Schemas[table].columns[colName].isID
            )
            : []
    }
    const selector: ColumnSelector = {table, columns: cols?.length ? cols : undefined}
    if (logWhere.enabled) {
        logWhere('parseColumnSelector table=%s columns=%o', selector.table, selector.columns ?? '*')
    }
    return selector
}

/**
 * Parse a relation hop of the form `Where A -> B` (forward) or `Where A <- B` (backward).
 */
const parseRelation = (segment: string): WhereNode | null => {
    const relMatch = segment.match(/^Where\s+([A-Za-z0-9_]+)\s*(->|<-)\s*([A-Za-z0-9_]+)/i)
    if (relMatch) {
        const node: WhereNode = {
            kind: 'relation',
            direction: relMatch[2] === '->' ? 'forward' : 'backward',
            from: relMatch[1],
            to: relMatch[3],
        }
        if (logWhere.enabled) {
            logWhere('parseRelation from=%s direction=%s to=%s', node.from, node.direction, node.to)
        }
        return node
    }
    return null
}

/**
 * Parse a single atomic WHERE clause (either relation or basic column comparison).
 */
const parseAtom = (segment: string): WhereNode => {
    // Allow atoms that omit the leading "Where" by normalizing here
    const normalized = /^Where\s+/i.test(segment.trim()) ? segment : `Where ${segment}`

    const relation = parseRelation(normalized)
    if (relation) return relation
    
    const valueMatch = normalized.match(/\(.*\)$/s)
    if (!valueMatch) throw new Error(`Missing value in clause: ${segment}`)
    
    const valueStr = valueMatch[0]
    const selectorStr = normalized.slice(0, normalized.length - valueStr.length).trim()
    const selector = parseColumnSelector(selectorStr)
    const value = parseValue(valueStr)
    const node: WhereNode = {kind: 'basic', selector, value}
    
    if (logWhere.enabled) {
        logWhere('parseAtom basic table=%s columns=%o valueType=%s', selector.table, selector.columns ?? '*', value.type)
    }
    return node
}

/**
 * Split an expression string on top-level delimiters (AND/OR) while
 * respecting bracket/parenthesis nesting.
 */
const splitTopLevel = (input: string, delimiters: string[]): string[] => {
    const parts: string[] = []
    let current = ''
    let depth = 0
    for (let i = 0; i < input.length; i++) {
        const ch = input[i]
        if (ch === '[' || ch === '(') depth++
        if (ch === ']' || ch === ')') depth--
        let matched = ''
        for (const d of delimiters) {
            const target = d.toUpperCase()
            if (input.slice(i, i + d.length).toUpperCase() === target && depth === 0) {
                matched = d
                break
            }
        }
        if (matched) {
            parts.push(current.trim())
            current = ''
            i += matched.length - 1
            continue
        }
        current += ch
    }
    if (current.trim()) parts.push(current.trim())
    if (logParser.enabled) {
        logParser('splitTopLevel delimiters=%o parts=%d', delimiters, parts.length)
    }
    return parts
}

/**
 * Recursively parse boolean expressions with NOT/AND/OR precedence.
 */
const parseExpression = (segment: string): ExpressionNode => {
    // Handle NOT
    if (segment.toUpperCase().startsWith('NOT ')) {
        const expr = parseExpression(segment.slice(4).trim())
        const node: ExpressionNode = {op: 'NOT', expr}
        if (logWhere.enabled) {
            logWhere('parseExpression NOT')
        }
        return node
    }

    // Split OR at top level
    const orParts = splitTopLevel(segment, [' OR '])
    if (orParts.length > 1) {
        if (logWhere.enabled) {
            logWhere('parseExpression OR parts=%d', orParts.length)
        }
        return orParts.slice(1).reduce<ExpressionNode>((acc, part) => ({
            op: 'OR',
            left: acc,
            right: parseExpression(part),
        }), parseExpression(orParts[0]))
    }

    // Split AND at top level
    const andParts = splitTopLevel(segment, [' AND '])
    if (andParts.length > 1) {
        if (logWhere.enabled) {
            logWhere('parseExpression AND parts=%d', andParts.length)
        }
        return andParts.slice(1).reduce<ExpressionNode>((acc, part) => ({
            op: 'AND',
            left: acc,
            right: parseExpression(part),
        }), parseExpression(andParts[0]))
    }

    const atom = parseAtom(segment)
    if (logWhere.enabled) {
        logWhere('parseExpression ATOM kind=%s', atom.kind, atom)
    }
    return {op: 'ATOM', where: atom}
}

// ============================================================================
// Query Stage Parsing
// ============================================================================

/**
 * Remove outer square brackets from a string if present.
 */
const trimOuterBrackets = (input: string): string => {
    const trimmed = input.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return trimmed.slice(1, -1).trim()
    }
    return trimmed
}

/**
 * Check if a string looks like a WHERE clause (starts with [ or contains "Where").
 */
const isWhereClause = (segment: string): boolean => {
    const trimmed = segment.trim()
    return trimmed.startsWith('[') || /^Where\s+/i.test(trimmed)
}

/**
 * Check if a string looks like a function call.
 */
const isFunctionCall = (segment: string): boolean => {
    const trimmed = segment.trim()
    return /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?\s*\(/.test(trimmed)
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse a full search query string into a sequence of statements.
 * 
 * New syntax: `[Where table ("value")] | FUNC(args) | FUNC(args) AS column`
 * 
 * Example:
 * ```
 * $posts = [Where posts ("hello")] | PAGE(0, 20) | BULKPOSTLOAD($userId) AS title, body
 * ```
 */
export const parseQuery = (input: string, userId?: string): ParsedQuery => {
    if (logParser.enabled) {
        const preview = input.length > 200 ? input.slice(0, 200) + '…' : input
        logParser('parseQuery rawLen=%d preview="%s"', input.length, preview)
    }
    
    const statements: Statement[] = []
    const cleaned = stripLineComments(input)
    const segments = cleaned.split(/;+/).map(s => s.trim()).filter(Boolean)
    
    if (logParser.enabled) {
        logParser('parseQuery segments=%d', segments.length)
    }

    for (const raw of segments) {
        // Check for variable assignment
        const assign = parseVariableAssignment(raw)
        const variableName = assign?.name
        const targetKey = assign?.targetKey
        const body = assign ? assign.inner : raw

        // Check for trailing AS projection
        const {projection, rest: bodyWithoutAs} = parseProjection(body)

        // Split into pipeline stages
        const stages = splitPipeline(bodyWithoutAs)
        
        if (stages.length === 0) continue

        // First stage must be a WHERE clause
        const firstStage = stages[0]
        if (!isWhereClause(firstStage)) {
            throw new Error(`Query must start with a WHERE clause: ${firstStage}`)
        }

        // Parse the WHERE expression
        const whereContent = trimOuterBrackets(firstStage)
        const query = parseExpression(whereContent)

        // Parse remaining stages as function calls
        const pipeline: FunctionCall[] = []
        for (let i = 1; i < stages.length; i++) {
            const stage = stages[i]
            
            if (!isFunctionCall(stage)) {
                throw new Error(`Expected function call at pipeline stage ${i + 1}: ${stage}`)
            }
            
            const funcCall = parseFunctionCall(stage)
            pipeline.push(funcCall)
        }

        // Build the statement
        const statement: Statement = {
            query,
            pipeline,
            projection,
            variableName,
            targetKey
        }

        // Add userId to context if provided
        if (userId) {
            // Find BULKPOSTLOAD calls and inject userId if not already specified
            for (const call of pipeline) {
                if (call.name === 'BULKPOSTLOAD' && !call.args.userId) {
                    call.args.userId = userId
                }
            }
        }

        statements.push(statement)

        if (logParser.enabled) {
            logParser('parseQuery statement: variableName=%s pipeline=%d functions projection=%o',
                variableName, pipeline.length, projection)
        }
    }

    if (logParser.enabled) {
        logParser('parseQuery statements=%d', statements.length)
    }

    return {statements}
}
