import {Aggregation, ColumnSelector, ExpressionNode, ParsedQuery, QueryValue, Statement, WhereNode} from './types';
import {isValidTable} from './schema';

const trimOuterBrackets = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed.slice(1, -1).trim();
    return trimmed;
};

const parseAggregation = (segment: string): { aggregation?: Aggregation; rest: string } => {
    const aggMatch = segment.match(/^(COUNT|UNIQUE|FIRST|LAST)\(\)\s*/i);
    if (aggMatch) {
        return {aggregation: aggMatch[1].toUpperCase() as Aggregation, rest: segment.slice(aggMatch[0].length)};
    }
    return {rest: segment};
};

const parseAsColumn = (segment: string): { asColumn?: string; asColumns?: string[]; rest: string } => {
    const match = segment.match(/^AS\s+([A-Za-z0-9_\.]+(?:\s*,\s*[A-Za-z0-9_\.]+)*)\s*/i);
    if (match) {
        const columns = match[1].split(',').map((c) => c.trim()).filter(Boolean);
        return {
            asColumn: columns.length === 1 ? columns[0] : undefined,
            asColumns: columns.length > 1 ? columns : undefined,
            rest: segment.slice(match[0].length)
        };
    }
    return {rest: segment};
};

const parseVariableAssignment = (input: string): { name: string; inner: string } | null => {
    const match = input.match(/^\$([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\[.*)$/s);
    if (!match) return null;
    return {name: match[1], inner: match[2]};
};

const splitPipeline = (input: string): string[] => {
    const parts: string[] = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];

        // If we're about to start a new bracketed group while not nested,
        // flush the previous accumulator (this keeps trailing "AS <col>" with the group).
        if (ch === '[' && depth === 0 && current.trim()) {
            parts.push(current.trim());
            current = '';
        }

        current += ch;

        if (ch === '[') depth++;
        else if (ch === ']') depth--;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
};

const parseValue = (raw: string): QueryValue => {
    const trimmed = raw.trim();
    if (/^\(\s*EMPTY\s*\)$/i.test(trimmed)) return {type: 'empty'};
    if (/^\(\s*NOT\s+EMPTY\s*\)$/i.test(trimmed)) return {type: 'not_empty'};

    const variableMatch = trimmed.match(/^\(\s*\$([A-Za-z_][A-Za-z0-9_]*)(?::([A-Za-z0-9_\.]+))?\s*->\s*(ANY|ALL)\s*\)$/i);
    if (variableMatch) {
        return {
            type: 'variable',
            name: variableMatch[1],
            key: variableMatch[2],
            mode: variableMatch[3].toUpperCase() as 'ANY' | 'ALL'
        };
    }

    const stringMatch = trimmed.match(/^\(\s*"([\s\S]*)"\s*(?::([is]))?\s*\)$/i);
    if (stringMatch) {
        const text = stringMatch[1];
        const flag = stringMatch[2];
        const prefix = text.startsWith('*');
        const suffix = text.endsWith('*');
        const core = text.replace(/^\*/, '').replace(/\*$/, '');
        return {
            type: 'string',
            value: core,
            caseSensitive: flag === 's',
            prefix: prefix ? true : undefined,
            suffix: suffix ? true : undefined
        };
    }

    const rangeMatch = trimmed.match(/^\(\s*"([^"]+)"\s*\.\.\s*"?([^"\)]*)"?\s*\)$/);
    if (rangeMatch) {
        const from = rangeMatch[1] || undefined;
        const to = rangeMatch[2] || undefined;
        return {type: 'date', value: {from: from || undefined, to: to || undefined}};
    }

    throw new Error(`Unsupported value: ${raw}`);
};

const parseColumnSelector = (segment: string): ColumnSelector => {
    const match = segment.match(/^Where\s+([A-Za-z0-9_\.]+)(?::([A-Za-z0-9_,\.]+))?/i);
    if (!match) throw new Error(`Invalid Where clause: ${segment}`);
    const table = match[1];
    if (!isValidTable(table)) throw new Error(`Unknown table: ${table}`);
    const cols = match[2]?.split(',').map((c) => c.trim()).filter(Boolean);
    return {table, columns: cols?.length ? cols : undefined};
};

const parseRelation = (segment: string): WhereNode | null => {
    const relMatch = segment.match(/^Where\s+([A-Za-z0-9_]+)\s*(->|<-)\s*([A-Za-z0-9_]+)/i);
    if (relMatch) {
        return {
            kind: 'relation',
            direction: relMatch[2] === '->' ? 'forward' : 'backward',
            from: relMatch[1],
            to: relMatch[3],
        };
    }
    return null;
};

const parseAtom = (segment: string): WhereNode => {
    const relation = parseRelation(segment);
    if (relation) return relation;
    const valueMatch = segment.match(/\(.*\)$/s);
    if (!valueMatch) throw new Error(`Missing value in clause: ${segment}`);
    const valueStr = valueMatch[0];
    const selectorStr = segment.slice(0, segment.length - valueStr.length).trim();
    const selector = parseColumnSelector(selectorStr);
    const value = parseValue(valueStr);
    return {kind: 'basic', selector, value};
};

const splitTopLevel = (input: string, delimiters: string[]): string[] => {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '[' || ch === '(') depth++;
        if (ch === ']' || ch === ')') depth--;
        const nextTwo = input.slice(i, i + 3).toUpperCase();
        const nextThree = input.slice(i, i + 4).toUpperCase();
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
    return parts;
};

const parseExpression = (segment: string): ExpressionNode => {
    // Handle NOT
    if (segment.toUpperCase().startsWith('NOT ')) {
        return {op: 'NOT', expr: parseExpression(segment.slice(4).trim())};
    }

    // Split OR at top level
    const orParts = splitTopLevel(segment, [' OR ']);
    if (orParts.length > 1) {
        return orParts.slice(1).reduce<ExpressionNode>((acc, part) => ({
            op: 'OR',
            left: acc,
            right: parseExpression(part),
        }), parseExpression(orParts[0]));
    }

    // Split AND at top level
    const andParts = splitTopLevel(segment, [' AND ']);
    if (andParts.length > 1) {
        return andParts.slice(1).reduce<ExpressionNode>((acc, part) => ({
            op: 'AND',
            left: acc,
            right: parseExpression(part),
        }), parseExpression(andParts[0]));
    }

    // Atom
    return {op: 'ATOM', where: parseAtom(segment)};
};

export const parseQuery = (input: string): ParsedQuery => {
    const statements: Statement[] = [];
    const segments = input.split(/;+/).map((s) => s.trim()).filter(Boolean);
    for (const raw of segments) {
        const assign = parseVariableAssignment(raw);
        const targetName = assign?.name;
        const body = assign ? assign.inner : raw;
        const pipelineParts = splitPipeline(body);
        if (!pipelineParts.length) continue;

        pipelineParts.forEach((part, idx) => {
            // Support trailing "AS <column>" after the bracketed expression
            let trailingAs: string | undefined;
            let trailingAsColumns: string[] | undefined;
            let trimmedPart = part;
            const trailingMatch = trimmedPart.match(/^(.*\])\s+AS\s+([A-Za-z0-9_\.]+(?:\s*,\s*[A-Za-z0-9_\.]+)*)\s*$/i);
            if (trailingMatch) {
                trimmedPart = trailingMatch[1];
                const cols = trailingMatch[2].split(',').map((c) => c.trim()).filter(Boolean);
                trailingAs = cols.length === 1 ? cols[0] : undefined;
                trailingAsColumns = cols.length > 1 ? cols : undefined;
            }

            let remaining = trimOuterBrackets(trimmedPart); // inner content

            const {aggregation, rest: aggRest} = parseAggregation(remaining);
            remaining = aggRest;
            const {asColumn: leadingAs, asColumns: leadingAsColumns, rest} = parseAsColumn(remaining);
            const asColumn = leadingAs || trailingAs;
            const asColumns = leadingAsColumns || trailingAsColumns;
            remaining = rest;

            const expr = parseExpression(remaining.trim());

            const isLast = idx === pipelineParts.length - 1;
            if (targetName && isLast) {
                statements.push({name: targetName, query: expr, asColumn, asColumns, aggregation});
            } else {
                statements.push({type: 'expression', expr, asColumn, asColumns, aggregation});
            }
        });
    }
    return {statements};
};
