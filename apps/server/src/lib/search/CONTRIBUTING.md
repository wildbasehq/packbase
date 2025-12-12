# Search DSL Contributing Guide

This document explains how the search DSL in `apps/server/src/lib/search` works, how it is wired into the API, and how
to extend or modify it safely.

## Scope & Entry Points

- **`parser.ts`** — Parses the DSL string into an AST (`ParsedQuery` → `Statement` → `ExpressionNode`). Handles
  assignments, pipelines, `AS`, aggregations, value parsing (strings, ranges, variables, empty/not-empty), and
  relations.
- **`executor.ts`** — Executes AST against Prisma, building predicates, resolving relations, applying aggregations, and
  producing variable metadata.
- **`schema.ts`** — Builds table/column metadata and relation info from Prisma DMMF at runtime (column types, default
  IDs, relation mapping).
- **`types.ts`** — Shared type definitions for AST, statements, execution context, and variable metadata.
- **Route**: `src/routes/search/index.ts` — GET `/search?q=...` parses via `parseQuery` and executes via `executeQuery`.
  Optional `allowedTables` can restrict tables.

## DSL Primer (Supported Features)

- **Statements** are separated by `;`. Each statement is a bracketed expression (or an aggregation prefix) optionally
  assigned to a variable: `$var = [Where posts ("text")] AS body`.
- **Where clauses**: `Where <table>` or `Where <table>:<col1,col2>`; table must exist in Prisma schema. Multiple
  columns = OR across those columns.
- **Values**:
    - Strings: `("hello")`, case-insensitive by default; add `:s` for case-sensitive. Prefix/suffix wildcards via `*`:
      `("*world")` or `("hello*")`.
    - Date ranges: `("2024-01-01".."2024-12-31")`, open-ended supported.
    - Empty checks: `(EMPTY)` / `(NOT EMPTY)`.
    - Variables: `($var->ANY)` or `($var->ALL)`. For object-valued variables you **must** specify a key:
      `($posts:user_id->ANY)`.
- **Boolean logic**: `AND`, `OR`, `NOT` at top level, respecting bracket depth.
- **Relations**: `Where posts -> profiles` (forward) or `Where profiles <- posts` (backward); uses Prisma relation
  metadata to validate matches.
- **Pipelines**: Multiple bracketed groups in sequence are parsed as separate statements; results stored in `_prev`
  variable automatically (last statement).
- **AS selection**:
    - Single column: `AS body` returns an array of that column.
    - Multiple columns: `AS body, user_id` returns array of objects `{ body, user_id }`.
    - Default when omitted: returns the table’s default ID column.
- **Aggregations**: `COUNT()`, `UNIQUE()`, `FIRST()`, `LAST()` can prefix a bracketed expression. Applied after
  filtering.

## Execution Model

1. **Table inference**: The executor infers table from the first atom; `allowedTables` (route query) can restrict usage.
2. **Column selection**: Only required columns are selected: default ID, requested `AS` columns, columns referenced in
   predicates, and relation keys. If a predicate targets “all columns” (no column specified), executor selects all table
   columns.
3. **Predicates**:
    - Strings, ranges, empty/not-empty map to JavaScript predicate functions.
    - Variable predicates compare against stored variable values; object variables require key selection.
4. **Relations**: Relation resolvers prefetch target rows using relation keys and check existence for each source row.
5. **Aggregations**: Applied on the filtered value array.
6. **Variables**: Stored with metadata `{ values, column?, columns?, ids?, table? }`. `_prev` mirrors the last
   statement.
7. **Errors**: Parser/executor throw descriptive errors; route wraps as `{ error: 'INVALID_QUERY', message }` with HTTP
   400.

## Extending the DSL

When adding features, keep parser ↔ executor contract in sync and update types.

### Adding a New Aggregation

1. **`types.ts`**: Add the aggregation string to `Aggregation` union.
2. **`parser.ts`**: Extend `parseAggregation` regex to recognize it.
3. **`executor.ts`**: Handle the new aggregation in the switch in `runStatement` after filtering.
4. Document the feature here and consider adding an example in the search route detail comment.

### Adding a New Value Type / Predicate

1. **`types.ts`**: Extend `QueryValue` union.
2. **`parser.ts`**: Teach `parseValue` to parse it (be mindful of top-level splitting rules).
3. **`executor.ts`**: Extend `buildValuePredicate` to interpret it.

### Changing `AS` Behavior

1. **`parser.ts`**: Update `parseAsColumn` to accept the new syntax; ensure both leading and trailing `AS` forms stay
   compatible.
2. **`types.ts`**: Adjust statement shapes if needed.
3. **`executor.ts`**: Update result shaping and metadata (`VariableValue`). Keep default ID selection intact for
   pipelines and metadata.

### Adding Relation Semantics

1. **`schema.ts`**: Ensure Prisma relation metadata is exposed as needed (from/to fields, direction).
2. **`parser.ts`**: Update `parseRelation` if syntax changes.
3. **`executor.ts`**: Adapt `buildRelationResolvers` to new semantics or key resolution rules.

### Performance Considerations

- The executor already minimizes selected columns; avoid broad `select` expansions unless necessary.
- Relations trigger extra queries; prefer key-only selects for relation checks (current behavior).
- Avoid regex or heavy parsing in the hot path; parser is intentionally simple string/regex-based.

## Testing & Validation

- **Automated tests**: No dedicated test suite exists yet for search. Add Bun tests under
  `apps/server/src/lib/search/__tests__` (or similar) when introducing behavior changes. Cover parser edge cases,
  executor predicates, relation resolution, and error paths.
- **Manual checks**: Use GET `/search?q=...` with examples:
    - `[Where posts ("hello")]`
    - `[Where posts:body ("*World":s)]`
    - `[Where posts:created_at ("2024-01-01".."2024-12-31")] AS id,body`
    - `$p = [Where posts ("hello")] AS body,user_id; [Where profiles ($p:user_id->ANY)] AS username,display_name`
    - `COUNT()[Where posts ("hello")]`

## Contribution Checklist

- [ ] Update `types.ts` when AST shapes change.
- [ ] Keep `parser.ts` and `executor.ts` in sync (new syntax must execute, new execution needs parseable syntax).
- [ ] Preserve default ID selection for result metadata and pipeline compatibility.
- [ ] Maintain object-variable key requirement (errors if missing key).
- [ ] Add or update inline documentation/examples in `routes/search/index.ts` when new user-facing features ship.
- [ ] Add tests (unit/manual) for new behaviors and error handling.

## Notes / Limitations

- No pagination or regex matching is supported.
- Boolean literals are not part of the DSL; use existing predicates.
- Pipelining does not auto-filter by previous IDs (only `_prev` variable is provided); use variables explicitly to chain
  filters.
