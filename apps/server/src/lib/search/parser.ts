import debug from 'debug';
import { Aggregation, ColumnSelector, ExpressionNode, ParsedQuery, QueryValue, Statement, WhereNode } from './types';
import { isValidTable } from './schema';

const logParser = debug('vg:search:parser');
const logValue = debug('vg:search:parser:value');
const logWhere = debug('vg:search:parser:where');

/**
 * Strip `//` line comments from a query string while preserving newlines and keeping
 * `//` that appear inside double-quoted string literals.
 */
const stripLineComments = (input: string): string => {
    if (logParser.enabled) {
        const preview = input.length > 200 ? input.slice(0, 200) + '…' : input;
        logParser('stripLineComments inputLen=%d preview="%s"', input.length, preview);
    }
    let result = '';
    let inString = false;
    let escape = false;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        const next = input[i + 1];

        if (!inString && ch === '/' && next === '/') {
            // Skip until end of line but keep the newline itself (if any)
            while (i < input.length && input[i] !== '\n') {
                i++;
            }
            if (i < input.length && input[i] === '\n') {
                result += '\n';
            }
            continue;
        }

        result += ch;

        if (inString) {
            if (escape) {
                escape = false;
            } else if (ch === '\\') {
                escape = true;
            } else if (ch === '"') {
                inString = false;
            }
        } else if (ch === '"') {
            inString = true;
            escape = false;
        }
    }

    if (logParser.enabled) {
        logParser('stripLineComments outputLen=%d', result.length);
    }

    return result;
};

/**
 * Remove a single pair of outer square brackets if present while keeping inner whitespace.
 * Used to normalize pipeline segments that are enclosed in [] for easier downstream parsing.
 */
const trimOuterBrackets = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed.slice(1, -1).trim();
    return trimmed;
};

/**
 * Parse an aggregation prefix at the start of a segment, e.g. `COUNT()`.
 * Returns the aggregation token (upper-cased) and the remaining unparsed segment.
 */
const parseAggregation = (segment: string): { aggregation?: Aggregation; rest: string } => {
    const aggMatch = segment.match(/^(COUNT|UNIQUE|FIRST|LAST)\(\)\s*/i);
    if (aggMatch) {
        return { aggregation: aggMatch[1].toUpperCase() as Aggregation, rest: segment.slice(aggMatch[0].length) };
    }
    return { rest: segment };
};

/**
 * Parse an `AS` projection from a segment.
 * Supports single column, comma-delimited columns, or `*` to project all columns.
 */
const parseAsColumn = (segment: string): { asColumn?: string; asColumns?: string[]; asAll?: boolean; rest: string } => {
    const match = segment.match(/^AS\s+([A-Za-z0-9_\.\*]+(?:\s*,\s*[A-Za-z0-9_\.\*]+)*)\s*/i);
    if (match) {
        const raw = match[1].trim();
        if (raw === '*') {
            return { asAll: true, rest: segment.slice(match[0].length) };
        }
        const columns = raw.split(',').map((c) => c.trim()).filter(Boolean);
        return {
            asColumn: columns.length === 1 ? columns[0] : undefined,
            asColumns: columns.length > 1 ? columns : undefined,
            rest: segment.slice(match[0].length)
        };
    }
    return { rest: segment };
};

/**
 * Detect a variable assignment of the form `$var[:target]=[ ... ]` or `$var[:target]=@PAGE(...)`.
 * Returns the variable name, optional target key, and the raw inner query text to parse later.
 */
const parseVariableAssignment = (input: string): { name: string; targetKey?: string; inner: string } | null => {
    // Allow starting with [ (normal query) or @ (page wrapper)
    const match = input.match(/^\$([A-Za-z_][A-Za-z0-9_]*)(?::([A-Za-z0-9_]+))?\s*=\s*([\[@].*)$/s);
    if (!match) return null;
    return { name: match[1], targetKey: match[2], inner: match[3] };
};

/**
 * Split a full query string into pipeline segments separated by top-level bracketed expressions.
 * Maintains association between trailing "AS" clauses and the preceding bracketed block.
 * Also respects parentheses for @PAGE(...) grouping.
 */
const splitPipeline = (input: string): string[] => {
    const parts: string[] = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];

        // Check for @PAGE start to treat it as a segment starter
        const isPageStart = ch === '@' && input.slice(i).toUpperCase().startsWith('@PAGE');

        // If we're about to start a new bracketed group while not nested,
        // flush the previous accumulator (this keeps trailing "AS <col>" with the group).
        if ((ch === '[' || isPageStart) && depth === 0 && current.trim()) {
            parts.push(current.trim());
            current = '';
        }

        current += ch;

        if (ch === '[' || ch === '(') depth++;
        else if (ch === ']' || ch === ')') depth--;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
};

/**
 * Parse a @PAGE(skip, take, [Query]) wrapper.
 * Returns the skip/take values and the inner query string (including any trailing AS).
 */
const parsePageWrapper = (input: string): { skip?: string | number; take?: string | number; inner: string } => {
    const trimmed = input.trim();
    if (!trimmed.toUpperCase().startsWith('@PAGE')) {
        return { inner: input };
    }

    // Find the closing parenthesis for @PAGE(...)
    let depth = 0;
    let endIdx = -1;
    const startIdx = trimmed.indexOf('(');
    if (startIdx === -1) throw new Error("Invalid @PAGE syntax: missing parenthesis");

    for (let i = startIdx; i < trimmed.length; i++) {
        if (trimmed[i] === '(') depth++;
        else if (trimmed[i] === ')') {
            depth--;
            if (depth === 0) {
                endIdx = i;
                break;
            }
        }
    }

    if (endIdx === -1) throw new Error("Unclosed @PAGE");

    const argsContent = trimmed.slice(startIdx + 1, endIdx);
    const trailing = trimmed.slice(endIdx + 1);

    // Expect: skip, take, [Query]
    // We find the first two commas to separate skip and take
    const firstComma = argsContent.indexOf(',');
    const secondComma = argsContent.indexOf(',', firstComma + 1);

    if (firstComma === -1 || secondComma === -1) {
        throw new Error("Invalid @PAGE arguments. Expected: @PAGE(skip, take, [Query])");
    }

    const skipRaw = argsContent.slice(0, firstComma).trim();
    const takeRaw = argsContent.slice(firstComma + 1, secondComma).trim();
    const queryRaw = argsContent.slice(secondComma + 1).trim();

    const parseNumOrVar = (val: string) => {
        if (val.startsWith('$')) return val;
        const num = parseInt(val, 10);
        if (isNaN(num)) return val; // Fallback to string if not a valid number, though likely invalid
        return num;
    };

    return {
        skip: parseNumOrVar(skipRaw),
        take: parseNumOrVar(takeRaw),
        inner: queryRaw + trailing
    };
};

/**
 * Parse the value portion of a WHERE atom. Supports
 * - ("text"[:i|s]) with optional wildcards *prefix/suffix
 * - lists of quoted values: ("foo" "~bar" "-baz" [:i|s])
 * - ("from".."to") date ranges
 * - (EMPTY) / (NOT EMPTY)
 * - ($var[:key] -> ANY|ALL|ONE) variable references
 */
const parseValue = (raw: string): QueryValue => {
    const trimmed = raw.trim();
    if (logValue.enabled) {
        const preview = trimmed.length > 200 ? trimmed.slice(0, 200) + '…' : trimmed;
        logValue('parseValue rawLen=%d preview="%s"', trimmed.length, preview);
    }
    if (/^\(\s*EMPTY\s*\)$/i.test(trimmed)) return { type: 'empty' };
    if (/^\(\s*NOT\s+EMPTY\s*\)$/i.test(trimmed)) return { type: 'not_empty' };

    const variableMatch = trimmed.match(/^\(\s*\$([A-Za-z_][A-Za-z0-9_]*)(?::([A-Za-z0-9_\.]+))?\s*->\s*(ANY|ALL|ONE)\s*\)$/i);
    if (variableMatch) {
        const value: QueryValue = {
            type: 'variable',
            name: variableMatch[1],
            key: variableMatch[2],
            mode: variableMatch[3].toUpperCase() as 'ANY' | 'ALL'
        };
        if (logValue.enabled) {
            logValue('parseValue variable name=%s key=%s mode=%s', value.name, value.key, value.mode);
        }
        return value;
    }

    // Lists: one or more quoted values, optional trailing :i|s flag
    const listMatch = trimmed.match(/^\(\s*((?:"[\s\S]*?"\s*)+)(?::([is]))?\s*\)$/i);
    if (listMatch) {
        const itemsRaw = listMatch[1];
        const flag = listMatch[2];
        const itemMatches = Array.from(itemsRaw.matchAll(/"([\s\S]*?)"/g));

        const firstValue = itemMatches[0]?.[1] ?? '';
        const hasSpecialPrefix = firstValue.startsWith('~') || firstValue.startsWith('-');

        if (itemMatches.length > 2 || hasSpecialPrefix) {
            const items = itemMatches.map((m) => {
                let value = m[1];
                let or = false;
                let not = false;
                if (value.startsWith('~')) {
                    or = true;
                    value = value.slice(1);
                } else if (value.startsWith('-')) {
                    not = true;
                    value = value.slice(1);
                }

                return { value, or: or ? true : undefined, not: not ? true : undefined };
            });

            if (logValue.enabled) {
                logValue('parseValue list items=%d caseSensitive=%s', items.length, flag === 's');
            }

            return { type: 'list', items, caseSensitive: flag === 's' };
        }
    }

    const stringMatch = trimmed.match(/^\(\s*"([\s\S]*)"\s*(?::([is]))?\s*\)$/i);
    if (stringMatch) {
        const text = stringMatch[1];
        const flag = stringMatch[2];
        const prefix = text.startsWith('*');
        const suffix = text.endsWith('*');
        const core = text.replace(/^\*/, '').replace(/\*$/, '');
        if (logValue.enabled) {
            logValue('parseValue string len=%d caseSensitive=%s prefix=%s suffix=%s', core.length, flag === 's', prefix, suffix);
        }
        return {
            type: 'string',
            value: core,
            caseSensitive: flag === 's',
            prefix: prefix ? true : undefined,
            suffix: suffix ? true : undefined
        };
    }

    const rangeMatch = trimmed.match(/^\(\s*"([^\"]+)"\s*\.\.\s*"?([^"\)]*)"?\s*\)$/);
    if (rangeMatch) {
        const from = rangeMatch[1] || undefined;
        const to = rangeMatch[2] || undefined;
        if (logValue.enabled) {
            logValue('parseValue date from=%s to=%s', from, to);
        }
        return { type: 'date', value: { from: from || undefined, to: to || undefined } };
    }

    if (logValue.enabled) {
        logValue('parseValue unsupported raw="%s"', trimmed);
    }
    throw new Error(`Unsupported value: ${raw}`);
};

const parseColumnSelector = (segment: string): ColumnSelector => {
    const match = segment.match(/^Where\s+([A-Za-z0-9_\.]+)(?::([A-Za-z0-9_,\.]+))?/i);
    if (!match) throw new Error(`Invalid Where clause: ${segment}`);
    const table = match[1];
    if (!isValidTable(table)) throw new Error(`Unknown table: ${table}`);
    const cols = match[2]?.split(',').map((c) => c.trim()).filter(Boolean);
    const selector: ColumnSelector = { table, columns: cols?.length ? cols : undefined };
    if (logWhere.enabled) {
        logWhere('parseColumnSelector table=%s columns=%o', selector.table, selector.columns ?? '*');
    }
    return selector;
};

/**
 * Parse a relation hop of the form `Where A -> B` (forward) or `Where A <- B` (backward).
 * Returns a relation node or null if the segment is not a relation clause.
 */
const parseRelation = (segment: string): WhereNode | null => {
    const relMatch = segment.match(/^Where\s+([A-Za-z0-9_]+)\s*(->|<-)\s*([A-Za-z0-9_]+)/i);
    if (relMatch) {
        const node: WhereNode = {
            kind: 'relation',
            direction: relMatch[2] === '->' ? 'forward' : 'backward',
            from: relMatch[1],
            to: relMatch[3],
        };
        if (logWhere.enabled) {
            logWhere('parseRelation from=%s direction=%s to=%s', node.from, node.direction, node.to);
        }
        return node;
    }
    return null;
};

/**
 * Parse a single atomic WHERE clause (either relation or basic column comparison).
 * Normalizes missing leading `Where` keyword for more permissive syntax.
 */
const parseAtom = (segment: string): WhereNode => {
    // Allow atoms that omit the leading "Where" by normalizing here
    const normalized = /^Where\s+/i.test(segment.trim()) ? segment : `Where ${segment}`;

    const relation = parseRelation(normalized);
    if (relation) return relation;
    const valueMatch = normalized.match(/\(.*\)$/s);
    if (!valueMatch) throw new Error(`Missing value in clause: ${segment}`);
    const valueStr = valueMatch[0];
    const selectorStr = normalized.slice(0, normalized.length - valueStr.length).trim();
    const selector = parseColumnSelector(selectorStr);
    const value = parseValue(valueStr);
    const node: WhereNode = { kind: 'basic', selector, value };
    if (logWhere.enabled) {
        logWhere('parseAtom basic table=%s columns=%o valueType=%s', selector.table, selector.columns ?? '*', value.type);
    }
    return node;
};

/**
 * Split an expression string on top-level delimiters (AND/OR) while
 * respecting bracket/parenthesis nesting to avoid splitting inside values.
 */
const splitTopLevel = (input: string, delimiters: string[]): string[] => {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '[' || ch === '(') depth++;
        if (ch === ']' || ch === ')') depth--;
        let matched = '';
        for (const d of delimiters) {
            const target = d.toUpperCase();
            if (input.slice(i, i + d.length).toUpperCase() === target && depth === 0) {
                matched = d;
                break;
            }
        }
        if (matched) {
            parts.push(current.trim());
            current = '';
            i += matched.length - 1;
            continue;
        }
        current += ch;
    }
    if (current.trim()) parts.push(current.trim());
    if (logParser.enabled) {
        logParser('splitTopLevel delimiters=%o parts=%d', delimiters, parts.length);
    }
    return parts;
};

/**
 * Recursively parse boolean expressions with NOT/AND/OR precedence.
 * Leaves terminals as ATOM nodes handled by `parseAtom`.
 */
const parseExpression = (segment: string): ExpressionNode => {
    // Handle NOT
    if (segment.toUpperCase().startsWith('NOT ')) {
        const expr = parseExpression(segment.slice(4).trim());
        const node: ExpressionNode = { op: 'NOT', expr };
        if (logWhere.enabled) {
            logWhere('parseExpression NOT');
        }
        return node;
    }

    // Split OR at top level
    const orParts = splitTopLevel(segment, [' OR ']);
    if (orParts.length > 1) {
        if (logWhere.enabled) {
            logWhere('parseExpression OR parts=%d', orParts.length);
        }
        return orParts.slice(1).reduce<ExpressionNode>((acc, part) => ({
            op: 'OR',
            left: acc,
            right: parseExpression(part),
        }), parseExpression(orParts[0]));
    }

    // Split AND at top level
    const andParts = splitTopLevel(segment, [' AND ']);
    if (andParts.length > 1) {
        if (logWhere.enabled) {
            logWhere('parseExpression AND parts=%d', andParts.length);
        }
        return andParts.slice(1).reduce<ExpressionNode>((acc, part) => ({
            op: 'AND',
            left: acc,
            right: parseExpression(part),
        }), parseExpression(andParts[0]));
    }

    const atom = parseAtom(segment);
    if (logWhere.enabled) {
        logWhere('parseExpression ATOM kind=%s', atom.kind);
    }
    // Atom
    return { op: 'ATOM', where: atom };
};

/**
 * Parse a full search query string into a sequence of statements.
 * Supports semicolon-separated statements, pipeline segments, leading/trailing AS, and variable assignment.
 */
export const parseQuery = (input: string): ParsedQuery => {
    if (logParser.enabled) {
        const preview = input.length > 200 ? input.slice(0, 200) + '…' : input;
        logParser('parseQuery rawLen=%d preview="%s"', input.length, preview);
    }
    const statements: Statement[] = [];
    const cleaned = stripLineComments(input);
    const segments = cleaned.split(/;+/).map((s) => s.trim()).filter(Boolean);
    if (logParser.enabled) {
        logParser('parseQuery segments=%d', segments.length);
    }
    for (const raw of segments) {
        const assign = parseVariableAssignment(raw);
        const targetName = assign?.name;
        const targetKey = assign?.targetKey;
        const body = assign ? assign.inner : raw;
        if (logParser.enabled && assign) {
            logParser('parseQuery assignment name=%s targetKey=%s', targetName, targetKey);
        }
        const pipelineParts = splitPipeline(body);
        if (!pipelineParts.length) continue;

        if (logParser.enabled) {
            logParser('parseQuery pipelineParts=%d', pipelineParts.length);
        }

        pipelineParts.forEach((part, idx) => {
            const { skip, take, inner } = parsePageWrapper(part);

            // Support trailing "AS <column>" after the bracketed expression
            let trailingAs: string | undefined;
            let trailingAsColumns: string[] | undefined;
            let trimmedPart = inner;
            const trailingMatch = trimmedPart.match(/^(.*\])\s+AS\s+([A-Za-z0-9_\.\*]+(?:\s*,\s*[A-Za-z0-9_\.\*]+)*)\s*$/i);
            if (trailingMatch) {
                trimmedPart = trailingMatch[1];
                const rawAs = trailingMatch[2].trim();
                if (rawAs === '*') {
                    trailingAs = undefined;
                    trailingAsColumns = ['*'];
                } else {
                    const cols = rawAs.split(',').map((c) => c.trim()).filter(Boolean);
                    trailingAs = cols.length === 1 ? cols[0] : undefined;
                    trailingAsColumns = cols.length > 1 ? cols : undefined;
                }
                if (logParser.enabled) {
                    logParser('parseQuery trailing AS columns=%o', trailingAsColumns ?? trailingAs);
                }
            }

            let remaining = trimOuterBrackets(trimmedPart); // inner content

            const { aggregation, rest: aggRest } = parseAggregation(remaining);
            remaining = aggRest;
            const {
                asColumn: leadingAs,
                asColumns: leadingAsColumns,
                asAll: leadingAsAll,
                rest
            } = parseAsColumn(remaining);
            const asColumn = leadingAs || trailingAs;
            let asColumns = leadingAsColumns || trailingAsColumns;
            const asAll = leadingAsAll || (asColumns?.[0] === '*' ? true : undefined);
            if (asAll) asColumns = undefined;
            remaining = rest;

            if (logParser.enabled) {
                logParser('parseQuery segment idx=%d aggregation=%s asColumn=%s asColumns=%o asAll=%s',
                    idx,
                    aggregation,
                    asColumn,
                    asColumns,
                    asAll,
                );
            }

            const expr = parseExpression(remaining.trim());

            const isLast = idx === pipelineParts.length - 1;
            if (targetName && isLast) {
                statements.push({ name: targetName, targetKey, query: expr, asColumn, asColumns, asAll, aggregation, skip, take });
            } else {
                statements.push({ type: 'expression', expr, asColumn, asColumns, asAll, aggregation, skip, take });
            }
        });
    }
    if (logParser.enabled) {
        logParser('parseQuery statements=%d', statements.length);
    }
    return { statements };
};
