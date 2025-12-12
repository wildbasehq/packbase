import prisma from '@/db/prisma';
import {ExecutionContext, ExpressionNode, QueryValue, Statement, VariableValue, WhereNode} from './types';
import {getColumn, getDefaultIdColumn, Relations, Schemas} from './schema';

type Predicate = (record: Record<string, any>) => boolean;

const buildStringPredicate = (value: string, caseSensitive: boolean, prefix?: boolean, suffix?: boolean): Predicate => {
    return (recordValue: any) => {
        if (typeof recordValue !== 'string') return false;
        const target = caseSensitive ? recordValue : recordValue.toLowerCase();
        const needle = caseSensitive ? value : value.toLowerCase();
        if (prefix) return target.startsWith(needle);
        if (suffix) return target.endsWith(needle);
        return target.includes(needle);
    };
};

const buildDatePredicate = (from?: string, to?: string): Predicate => {
    return (recordValue: any) => {
        if (!recordValue) return false;
        const ts = new Date(recordValue).getTime();
        if (Number.isNaN(ts)) return false;
        if (from && ts < new Date(from).getTime()) return false;
        if (to && ts > new Date(to).getTime()) return false;
        return true;
    };
};

const buildValuePredicate = (value: QueryValue, ctx: ExecutionContext, columnName?: string): Predicate => {
    switch (value.type) {
        case 'string':
            return buildStringPredicate(value.value, value.caseSensitive, value.prefix, value.suffix);
        case 'date':
            return buildDatePredicate(value.value.from, value.value.to);
        case 'empty':
            return (v: any) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
        case 'not_empty':
            return (v: any) => !(v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0));
        case 'variable': {
            const variable = ctx.variables[value.name];
            if (!variable) return () => false;

            // If variable values are objects, require a key to be specified
            const sample = variable.values?.[0];
            const isObjectVar = sample && typeof sample === 'object' && !Array.isArray(sample);
            if (isObjectVar && !value.key) {
                throw new Error(`Variable ${value.name} is an object; specify a key with :<field>`);
            }

            const sourceValues = value.key
                ? variable.values
                    .map((v: any) => {
                        if (v && typeof v === 'object' && !Array.isArray(v)) return v[value.key!];
                        return undefined;
                    })
                    .filter((v) => v !== undefined)
                : variable.values;

            if (value.mode === 'ANY') {
                return (v: any) => sourceValues.some((x) => x === v);
            }
            return (v: any) => sourceValues.every((x) => x === v);
        }
    }
};

const buildWherePredicate = (expr: ExpressionNode, ctx: ExecutionContext): Predicate => {
    switch (expr.op) {
        case 'ATOM': {
            const where = expr.where;
            if (where.kind === 'basic') {
                const predicate = buildValuePredicate(where.value, ctx, where.selector.columns?.[0]);
                return (record: Record<string, any>) => {
                    const cols = where.selector.columns ?? Object.keys(record);
                    return cols.some((c) => predicate(record[c]));
                };
            }
            if (where.kind === 'relation') {
                const checker = ctx.relationChecks?.get(where);
                if (!checker) return () => false;
                return (record) => checker(record);
            }
            // group
            return () => false;
        }
        case 'NOT': {
            const inner = buildWherePredicate(expr.expr, ctx);
            return (record) => !inner(record);
        }
        case 'AND': {
            const left = buildWherePredicate(expr.left, ctx);
            const right = buildWherePredicate(expr.right, ctx);
            return (record) => left(record) && right(record);
        }
        case 'OR': {
            const left = buildWherePredicate(expr.left, ctx);
            const right = buildWherePredicate(expr.right, ctx);
            return (record) => left(record) || right(record);
        }
    }
};

const gatherColumns = (expr: ExpressionNode, acc: Set<string>) => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'basic' && expr.where.selector.columns) {
            expr.where.selector.columns.forEach((c) => acc.add(c));
        }
    } else if (expr.op === 'NOT') {
        gatherColumns(expr.expr, acc);
    } else {
        gatherColumns(expr.left, acc);
        gatherColumns(expr.right, acc);
    }
};

const needsAllColumns = (expr: ExpressionNode): boolean => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'basic' && !expr.where.selector.columns) return true;
        return false;
    }
    if (expr.op === 'NOT') return needsAllColumns(expr.expr);
    return needsAllColumns(expr.left) || needsAllColumns(expr.right);
};

const collectRelationNodes = (expr: ExpressionNode, acc: WhereNode[] = []): WhereNode[] => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'relation') acc.push(expr.where);
    } else if (expr.op === 'NOT') {
        collectRelationNodes(expr.expr, acc);
    } else {
        collectRelationNodes(expr.left, acc);
        collectRelationNodes(expr.right, acc);
    }
    return acc;
};

const findRelationMeta = (from: string, to: string, direction: 'forward' | 'backward') => {
    if (direction === 'forward') {
        return Relations.find((r) => r.from === from && r.to === to);
    }
    return Relations.find((r) => r.from === to && r.to === from);
};

const buildRelationResolvers = async (relations: WhereNode[], rows: any[]) => {
    const checks = new WeakMap<WhereNode, (record: Record<string, any>) => boolean>();
    for (const rel of relations) {
        if (rel.kind !== 'relation') continue;
        const meta = findRelationMeta(rel.from, rel.to, rel.direction);
        if (!meta) {
            checks.set(rel, () => false);
            continue;
        }

        const keyFields = rel.direction === 'forward' ? meta.fromFields : meta.toFields;
        const targetFields = rel.direction === 'forward' ? meta.toFields : meta.fromFields;
        const targetTable = rel.direction === 'forward' ? meta.to : meta.from;

        const keyTuples: string[][] = [];
        for (const row of rows) {
            const values = keyFields.map((f) => row[f]);
            if (values.some((v) => v === undefined || v === null)) continue;
            keyTuples.push(values.map((v) => `${v}`));
        }

        if (keyTuples.length === 0) {
            checks.set(rel, () => false);
            continue;
        }

        // Deduplicate tuples
        const tupleKey = (vals: string[]) => vals.join('|');
        const uniqueTuples = Array.from(new Set(keyTuples.map(tupleKey))).map((key) => key.split('|'));

        const whereClauses = uniqueTuples.map((vals) => Object.fromEntries(targetFields.map((f, idx) => [f, vals[idx]])));

        const targetRows = await (prisma as any)[targetTable].findMany({
            where: {OR: whereClauses},
            select: Object.fromEntries(targetFields.map((f) => [f, true])),
        });

        const existing = new Set<string>();
        for (const row of targetRows) {
            const vals = targetFields.map((f) => row[f]);
            if (vals.some((v) => v === undefined || v === null)) continue;
            existing.add(tupleKey(vals.map((v) => `${v}`)));
        }

        checks.set(rel, (record: Record<string, any>) => {
            const vals = keyFields.map((f) => record[f]);
            if (vals.some((v) => v === undefined || v === null)) return false;
            return existing.has(tupleKey(vals.map((v) => `${v}`)));
        });
    }
    return checks;
};

const runStatement = async (stmt: Statement, ctx: ExecutionContext) => {
    const expr = 'expr' in stmt ? stmt.expr : stmt.query;
    // Determine table from first atom encountered
    const table = findTable(expr);
    if (!table) throw new Error('Unable to infer table from query');
    if (ctx.allowedTables && !ctx.allowedTables.includes(table)) {
        throw new Error('Table not allowed');
    }

    const idColumn = stmt.asColumn || stmt.asColumns?.[0] || getDefaultIdColumn(table)?.name || 'id';
    const neededColumns = new Set<string>([idColumn]);
    if (stmt.asColumns?.length) stmt.asColumns.forEach((c) => neededColumns.add(c));
    const selectAll = needsAllColumns(expr);
    gatherColumns(expr, neededColumns);

    const relationNodes = collectRelationNodes(expr);
    // Ensure relation key fields are selected for resolver checks
    for (const rel of relationNodes) {
        if (rel.kind !== 'relation') continue;
        const meta = findRelationMeta(rel.from, rel.to, rel.direction);
        if (!meta) continue;
        meta.fromFields.forEach((f) => neededColumns.add(f));
        meta.toFields.forEach((f) => neededColumns.add(f));
    }

    if (selectAll) {
        const schema = Schemas[table];
        if (!schema) throw new Error(`Unknown schema for table ${table}`);
        Object.keys(schema.columns).forEach((c) => neededColumns.add(c));
    }

    // Select only required columns to reduce payload
    const select = Object.fromEntries(Array.from(neededColumns).map((c) => [c, true]));

    const rows = await (prisma as any)[table].findMany({select});
    if (relationNodes.length) {
        ctx.relationChecks = await buildRelationResolvers(relationNodes, rows);
    }
    const predicate = buildWherePredicate(expr, ctx);
    const filtered = rows.filter((r: any) => predicate(r));

    let resultValues: any[];
    if (stmt.asColumns?.length) {
        resultValues = filtered.map((r: any) => Object.fromEntries(stmt.asColumns!.map((c) => [c, r[c]])));
    } else {
        resultValues = filtered.map((r: any) => r[idColumn]);
        if (stmt.asColumn && stmt.asColumn !== idColumn) {
            resultValues = filtered.map((r: any) => r[stmt.asColumn!]);
        }
    }

    if (stmt.aggregation) {
        switch (stmt.aggregation) {
            case 'COUNT':
                resultValues = [filtered.length];
                break;
            case 'UNIQUE':
                resultValues = Array.from(new Set(resultValues));
                break;
            case 'FIRST':
                resultValues = resultValues.length ? [resultValues[0]] : [];
                break;
            case 'LAST':
                resultValues = resultValues.length ? [resultValues[resultValues.length - 1]] : [];
                break;
        }
    }

    const columnMeta = stmt.asColumns?.length
        ? undefined
        : getColumn(table, stmt.asColumn || idColumn);
    const variableValue: VariableValue = {
        values: resultValues,
        column: columnMeta,
        columns: stmt.asColumns?.map((c) => getColumn(table, c)).filter(Boolean) as any,
        ids: stmt.asColumns?.length ? filtered.map((r: any) => r[idColumn]) : undefined,
        table
    };

    if ('name' in stmt) {
        ctx.variables[stmt.name] = variableValue;
        ctx.variables['_prev'] = variableValue;
        return {name: stmt.name, values: resultValues};
    }

    ctx.variables['_prev'] = variableValue;
    return {values: resultValues};
};

const findTable = (expr: ExpressionNode): string | null => {
    if (expr.op === 'ATOM') {
        if (expr.where.kind === 'basic') return expr.where.selector.table;
        if (expr.where.kind === 'relation') return expr.where.from;
    } else {
        if (expr.op === 'NOT') return findTable(expr.expr);
        return findTable(expr.left) || findTable(expr.right);
    }
};

export const executeQuery = async (statements: Statement[], allowedTables?: string[]) => {
    const ctx: ExecutionContext = {schemas: {}, variables: {}, allowedTables};
    const results: any[] = [];
    for (const stmt of statements) {
        const res = await runStatement(stmt, ctx);
        results.push(res);
    }
    return {results, variables: ctx.variables};
};
