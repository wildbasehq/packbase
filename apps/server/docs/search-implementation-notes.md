# Search Implementation Notes

> This document is for **maintainers** and **advanced integrators** working on the
> search subsystem itself (parser, executor, schema, whitelist, route wiring).

If you just want to *use* the search API, see:

- `./search-api-overview.md`
- `./search-query-language.md`
- `./search-recipes.md`

---

## 1. Architecture Overview

Core pieces live under `apps/server/src/lib/search`:

- `parser.ts` — converts DSL strings into `ParsedQuery` (`Statement[]`, `ExpressionNode` trees).
- `executor.ts` — runs statements against Prisma using schema/whitelist metadata.
- `types.ts` — shared AST, execution context, and variable metadata types.
- `schema.ts` — exposes `Schemas`, `Relations`, and helpers like `getColumn`, `getDefaultIdColumn`.
- `whitelist.ts` / `whitelist.json` — define which tables/columns the DSL can see.
- `cache.ts` — small caching helper used by `executeQuery`.
- `CONTRIBUTING.md` — higher-level design docs focused on evolving the DSL.

The HTTP route entry-point is:

- `apps/server/src/routes/search/index.ts`

---

## 2. Request Flow

1. **Route** (`index.ts`):
    - Validates query parameters using Elysia's `t.Object`.
    - Extracts `q` and optional `allowedTables`.
    - Calls `parseQuery(q)`.
    - Calls `executeQuery(parsed.statements)`.
    - Measures elapsed time and returns `{ ...result, variables, ms }`.
    - Catches any error and responds with HTTP 400 + `{ error: 'INVALID_QUERY', message }`.

2. **Parser** (`parser.ts`):
    - Strips line comments while preserving string literals (`stripLineComments`).
    - Splits on semicolons to obtain statement strings.
    - For each statement:
        - Detects assignments via `parseVariableAssignment`.
        - Splits into pipeline segments with `splitPipeline`.
        - For each segment:
            - Normalizes brackets (`trimOuterBrackets`).
            - Extracts aggregation prefix (`parseAggregation`).
            - Extracts leading `AS` projection (`parseAsColumn`).
            - Parses trailing `AS` after the bracket.
            - Builds an `ExpressionNode` via `parseExpression`.
    - Produces a `ParsedQuery` with `Statement[]`.

3. **Executor** (`executor.ts`):
    - Wraps execution in an optional cache (`withQueryCache`, `makeCacheKey`).
    - Initializes an `ExecutionContext` with:
        - `schemas` from `Schemas`.
        - `variables` map.
        - Optional `allowedTables` from the route.
    - Iterates over statements and runs each via `runStatement`.
    - Maintains special `_prev` variable.
    - Returns both primary results and `variables` metadata.

---

## 3. Parser Details

Key helpers in `parser.ts`:

- `stripLineComments(input)` — removes `//` comments except inside `"..."`.
- `trimOuterBrackets(input)` — strips a single outer `[...]` if present.
- `parseAggregation(segment)` — detects and strips leading `COUNT()`, `UNIQUE()`, `FIRST()`, or `LAST()`.
- `parseAsColumn(segment)` — parses leading `AS ...` projection.
- Trailing `AS` is handled separately inside `parseQuery`.
- `parseVariableAssignment(input)` — identifies `$var[:targetKey] =` prefixes.
- `splitPipeline(input)` — splits into segments, keeping trailing `AS` with the preceding `]`.
- `parseValue(raw)` — parses the value part into `QueryValue` (string, list, date, empty, not_empty, variable).
- `parseColumnSelector(segment)` — parses `Where TABLE[:cols]`.
- `parseRelation(segment)` — parses `Where A -> B` or `Where A <- B`.
- `parseAtom(segment)` — normalizes missing `Where`, then chooses between relation or basic.
- `splitTopLevel(input, delimiters)` — splits expressions at top-level `AND`/`OR` only.
- `parseExpression(segment)` — recursive descent respecting NOT > AND > OR precedence.

When changing the grammar:

- Update `types.ts` unions first.
- Add or adjust regexes in `parseValue`, `parseRelation`, `parseAggregation`, etc.
- Keep `splitTopLevel` and `parseExpression` in sync with any new logical operators.

---

## 4. Executor Details

### 4.1 ExecutionContext

Defined in `types.ts` as:

```ts
export type ExecutionContext = {
    schemas: Record<string, TableSchema>;
    variables: Record<string, VariableValue>;
    allowedTables?: string[];
    relationChecks?: WeakMap<WhereNode, (record: Record<string, any>) => boolean>;
    loop?: { variable: string; value: any; index: number };
};
```

Key ideas:

- `variables` accumulates named statement outputs.
- `allowedTables` is set from the route; `runStatement` enforces it.
- `relationChecks` maps relation atoms to compiled predicates.
- `loop` is used for `->ONE` variable mode during nested assignments.

### 4.2 `runStatement`

High-level algorithm:

1. Derive the expression: `const expr = 'expr' in stmt ? stmt.expr : stmt.query;`.
2. Infer the main table using `findTable(expr)` (first atom's selector).
3. Enforce `ensureTableWhitelisted(table)`; if `ctx.allowedTables` set, also ensure `table` is allowed.
4. Determine the **ID column**:
    - `stmt.asColumn` or first `stmt.asColumns` or `getDefaultIdColumn(table)` or `'id'` fallback.
5. Collect `neededColumns`:
    - ID column
    - Any `asColumns`
    - Any columns appearing in predicates via `gatherColumns(expr)`.
    - Relation key fields (from `Relations`) via `collectRelationNodes` and `findRelationMeta`.
6. Decide between:
    - `selectAll` (if `stmt.asAll` or `needsAllColumns(expr)`), then `ensureAllColumnsAllowed(table)`.
    - Or `ensureColumnsWhitelisted(table, neededColumns)`.
7. Build `select` object for Prisma: `{ colName: true, ... }`.
8. Build an optional Prisma `where` via `buildPrismaWhere(expr, table)`.
9. Run Prisma query: `(prisma as any)[table].findMany({ select, where })`.
10. If there are relation nodes: build `relationChecks` via `buildRelationResolvers`.
11. Filter in-memory rows using `buildWherePredicate(expr, ctx)`.
12. Shape results (`shapeResults`) based on `asAll` / `asColumns` / `asColumn`.
13. Apply aggregation if present.
14. Store in variables if this is an assignment statement; update `_prev`.

### 4.3 Predicates

- `buildStringPredicate` — handles wildcard and case-sensitivity.
- `buildDatePredicate` — handles `[from, to]` ranges.
- `buildValuePredicate` — orchestrates string/list/date/empty/not_empty/variable comparisons.
- `buildWherePredicate` — composes predicates according to the expression tree.

### 4.4 Relations

- `Relations` comes from `schema.ts` and describes model relations.
- `buildRelationResolvers`:
    - Extracts key tuples from the current result set.
    - Fetches matching rows on the related table via Prisma.
    - Builds a `Set` of existing key tuples.
    - Maps each relation atom to a function that checks whether a record belongs to any of these tuples.

This approach performs **one additional query per relation atom**, not per row.

### 4.5 Prisma Pushdown (`buildPrismaWhere`)

- Supports only simple cases:
    - Single-column string equality or contains/startsWith/endsWith.
    - String values that look like UUIDs on string columns.
    - Date ranges on date columns.
- Complex expressions (NOT, OR with incompatible parts, variable references, list predicates) return `null`, causing the
  executor to do full in-memory filtering.

When optimizing:

- Consider broadening pushdown support, but keep the implementation simple and robust.

---

## 5. Schema and Whitelist

### 5.1 Schema (`schema.ts`)

Responsibilities:

- Build `Schemas` — a map from table name to `TableSchema`.
- Provide helpers:
    - `getColumn(table, column)` → metadata including type.
    - `getDefaultIdColumn(table)` → column considered the primary ID.
- Expose `Relations` — relation descriptors used by the executor.

When adding a new Prisma model or altering schema:

1. Update Prisma schema and run migrations.
2. Ensure `schema.ts` sees the new model/columns (often via generated DMMF introspection).
3. Update `whitelist.json` to allow or deny access.

### 5.2 Whitelist (`whitelist.ts` / `whitelist.json`)

Responsibilities:

- Define which tables are visible to the DSL.
- Define which columns are queryable and/or selectable.

Main helpers:

- `ensureTableWhitelisted(table)`
- `ensureColumnsWhitelisted(table, columns)`
- `ensureAllColumnsAllowed(table)`

These are called from `runStatement` before doing Prisma queries.

Security rationale:

- Prevent leakage of sensitive columns (password hashes, internal flags, etc.).
- Prevent users from querying internal tables by name.

---

## 6. Caching (`cache.ts`)

The executor uses a thin wrapper around a cache implementation.

- `makeCacheKey(statements)` — converts a `Statement[]` into a cache key.
- `withQueryCache(key, fn)` — runs `fn()` and caches its result.

Notes:

- The actual storage backend may be in-memory or external, depending on project configuration.
- Caching is purely an optimization; correctness does not depend on it.

When modifying cache behavior:

- Ensure keys include everything that affects semantics (e.g., `allowedTables`).
- Consider cache invalidation semantics when underlying data changes frequently.

---

## 7. Frontend Integration Notes

Common patterns in `apps/web` and `apps/admin`:

- Build query strings using small helpers so that DSL changes are centralized.
- Encode `q` using `encodeURIComponent`.
- Use `allowedTables` per application surface (e.g., admin may see more tables than public web).
- Treat `variables` in the response as advanced metadata, not the primary data surface, unless explicitly needed.

Guidelines:

- Wrap `/search` access behind a typed client function that:
    - Accepts a plain object or higher-level description.
    - Produces a DSL string.
    - Handles pagination parameters and `includeMetadata`.

---

## 8. Extending the DSL Safely

When introducing new syntax or behavior, follow this order:

1. **Design**
    - Decide whether the feature is best expressed as:
        - A new value type
        - A new aggregation
        - A new keyword/atom
        - Or an application-level convenience wrapper
    - Sketch examples and edge cases.

2. **Types** (`types.ts`)
    - Extend `QueryValue`, `Aggregation`, `WhereNode`, or `Statement` as needed.

3. **Parser** (`parser.ts`)
    - Update `parseValue`, `parseAtom`, `parseRelation`, etc.
    - Extend regexes carefully; avoid breaking existing syntax.
    - Add comments and simple inline examples near new code.

4. **Executor** (`executor.ts`)
    - Extend `buildValuePredicate` and/or `buildWherePredicate`.
    - Consider whether `buildPrismaWhere` can support the new pattern.
    - Add aggregation behavior in `shapeResults` if needed.

5. **Schema / Whitelist** (if relevant)
    - Expose any additional metadata required.
    - Update whitelist rules if new tables/columns should be accessible.

6. **Docs & Examples**
    - Update:
        - `apps/server/src/lib/search/CONTRIBUTING.md`
        - `./search-query-language.md`
        - `./search-recipes.md`
    - Add or adjust examples under `apps/server/src/routes/search/index.ts` detail comment.

7. **Tests**
    - Add tests for:
        - Parsing (string → AST)
        - Execution (AST → results)
        - Error cases and edge behavior
    - Place tests under `apps/server/tests/` or a dedicated folder in the search lib.

---

## 9. Known Limitations & Future Directions

Known limitations (at time of writing):

- No built-in numeric comparison operators (>, <, >=, <=) — values are treated as strings or dates.
- No fuzzy/Levenshtein matching.
- No explicit `SORT BY` operator in the DSL; ordering is typically by underlying Prisma defaults.
- No direct support for pagination primitives in the DSL itself.

Potential enhancements:

- Add numeric value types and comparators.
- Add explicit `ORDER BY`/`LIMIT` constructs.
- Introduce fuzzy match expressions.
- Provide a machine-readable grammar (EBNF/PEG) for tooling and editor support.

When implementing such features, align with the process above and keep this document and
`CONTRIBUTING.md` up to date.

