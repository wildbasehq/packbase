# Search API Overview

> This document describes the HTTP layer for the search endpoint and how it maps to the internal Search DSL.
>
> It is intended for anyone calling `/search` over HTTP (backend services, web/admin apps, CLI tools).

---

## Endpoint

- **Method**: `GET`
- **Path**: `/search`
- **Handler**: `apps/server/src/routes/search/index.ts`

The route is wired through Elysia and delegates to the Search DSL implementation:

- Parses the `q` query parameter using `parseQuery` (`apps/server/src/lib/search/parser.ts`).
- Executes the parsed statements using `executeQuery` (`apps/server/src/lib/search/executor.ts`).
- Wraps and returns the result as JSON.

> See also:
> - `./search-query-language.md` – full DSL reference
> - `./search-recipes.md` – practical examples
> - `./search-implementation-notes.md` – maintainer deep-dive
> - `apps/server/src/lib/search/CONTRIBUTING.md` – guidance on evolving the DSL safely

---

## Query Parameters

All parameters are accepted as **query string** values and validated by the route definition.

```ts
// apps/server/src/routes/search/index.ts (excerpt)
app.get('', async ({query, set}) => {
    /* ... */
}, {
    query: t.Object({
        q: t.String(),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        includeMetadata: t.Optional(t.String()),
        allowedTables: t.Optional(t.Array(t.String())),
    }),
});
```

### `q` (required)

- **Type**: string
- **Description**: The search query written in the custom Search DSL.
- **Examples**:
    - `[Where posts ("hello")]`
    - `[Where posts:body ("*World":s)]`
    - `COUNT()[Where posts ("hello")]`

See `./search-query-language.md` for the full syntax.

### `page` (optional)

- **Type**: string (typically an integer, e.g. `"1"`)
- **Description**: Logical page number. Currently the core DSL executor does not interpret `page` directly; you are
  free to use it on the client side together with `limit`/`offset`.

Recommended convention:

- `offset = (page - 1) * limit` (computed by the client or a thin wrapper around the API).

### `limit` (optional)

- **Type**: string (typically an integer, e.g. `"25"`)
- **Description**: Maximum number of rows to return for the **final statement** in the query.
- **Default / bounds**: If omitted, the underlying Prisma `findMany` call uses its default limit
  (effectively unbounded). You should pass a limit explicitly for user-facing queries.

> Note: At the time of writing the low-level executor does not enforce an upper bound, so callers should
> avoid very large limits.

### `offset` (optional)

- **Type**: string (typically an integer, e.g. `"0"`)
- **Description**: Number of rows to skip before returning results for the final statement.
- **Usage**: Combine with `limit` and optionally `page` for pagination.

### `includeMetadata` (optional)

- **Type**: string (`"true"` or `"false"`)
- **Description**: When `"true"`, the API attaches additional execution metadata to the response.

Current metadata includes:

- `ms`: execution duration in milliseconds, measured in the route.
- `variables`: all named variables produced by the query (see below).

### `allowedTables` (optional)

- **Type**: array of strings in the query string, e.g.:
    - `?allowedTables=posts&allowedTables=packs`
- **Description**: Per-request allowlist that constrains which tables the query may reference.

Execution rules:

- Every statement infers its target table from the first `Where` atom.
- If that table is **not** included in `allowedTables`, the executor throws and the route responds with HTTP 400.
- This comes on top of the global table/column whitelist in `apps/server/src/lib/search/whitelist.*`.

Use this when you want to expose a restricted search surface (e.g. only `posts` and `profiles`) to a particular
frontend or integration.

---

## Request Examples

### 1. Minimal search

```http
GET /search?q=%5BWhere%20posts%20(%22hello%22)%5D
```

Decoded `q`:

```text
[Where posts ("hello")]
```

Description:

- Searches the `posts` table.
- Matches rows where at least one searchable column contains `"hello"` (case-insensitive by default).

### 2. Column-specific search with wildcards

```http
GET /search?q=%5BWhere%20posts:body%20(%22*World%22:s)%5D
```

Decoded `q`:

```text
[Where posts:body ("*World":s)]
```

Description:

- Targets the `body` column on `posts`.
- Uses a **suffix wildcard** (`*World`) meaning "ends with `World`".
- `:s` makes the match **case-sensitive**.

### 3. Date range query

```http
GET /search?q=%5BWhere%20posts:created_at%20(%222024-01-01%22..%222024-12-31%22)%5D
```

Decoded `q`:

```text
[Where posts:created_at ("2024-01-01".."2024-12-31")]
```

Description:

- Matches `posts` with `created_at` timestamps between 2024-01-01 and 2024-12-31 (inclusive).

### 4. Aggregation

```http
GET /search?q=COUNT()%5BWhere%20posts%20(%22hello%22)%5D
```

Decoded `q`:

```text
COUNT()[Where posts ("hello")]
```

Description:

- Returns the **count** of posts matching the condition as a single-element array.

### 5. Variables and reuse

```http
GET /search?q=%24tags%20%3D%20%5BWhere%20posts:tags%20(%22news%22)%5D%3B%20%5BWhere%20posts:tags%20(%24tags:tags-%3EANY)%5D&includeMetadata=true
```

Decoded `q`:

```text
$tags = [Where posts:tags ("news")];
[Where posts:tags ($tags:tags->ANY)]
```

Description:

- First statement stores posts with `"news"` in their `tags` column into variable `$tags`.
- Second statement reuses those tags (via a variable reference) to run a related query.
- Because `includeMetadata=true`, the response includes the full `$tags` variable payload.

---

## Response Shape

The route wraps the raw executor result and adds execution time:

```ts
// apps/server/src/routes/search/index.ts (logic sketch)
const {variables, ...result} = await executeQuery(parsed.statements);
const ms = Date.now() - timeStart;
return {
    ...result,
    variables,
    ms,
};
```

### Successful response

The executor returns an object whose exact keys depend on your query. At minimum you can expect:

- `result` (or another key): the values from the **last** unnamed statement.
- Variable entries: one key per `$variable` you defined.

A typical pattern for a single unnamed statement is:

```jsonc
{
  "result": [
    "d94e1f0e-5d88-4ee8-a5b1-60506bb2f1fb",
    "01234567-89ab-cdef-0123-456789abcdef"
  ],
  "variables": {},
  "ms": 7
}
```

When you use variables:

```jsonc
{
  "result": [
    "d94e1f0e-5d88-4ee8-a5b1-60506bb2f1fb"
  ],
  "variables": {
    "tags": {
      "values": [
        { "id": "...", "tags": ["news"] },
        { "id": "...", "tags": ["news", "world"] }
      ],
      "table": "posts",
      "columns": [
        { "name": "id", "type": "string" },
        { "name": "tags", "type": "string[]" }
      ]
    }
  },
  "ms": 12
}
```

> Notes:
> - `values` is always an array; its element shape depends on your `AS` projection (see DSL docs).
> - `columns` and `table` are optional metadata describing the variable payload.
> - For full details of the `VariableValue` structure, see `apps/server/src/lib/search/types.ts`.

### Error responses

All DSL or execution errors are caught and surfaced as HTTP 400 with a simple payload:

```json
{
  "error": "INVALID_QUERY",
  "message": "<human-readable message>"
}
```

Examples of situations that produce `INVALID_QUERY`:

- Syntax errors (e.g. missing closing bracket, bad value format).
- Unknown table name (not present in the schema/whitelist).
- Disallowed table when `allowedTables` is provided.
- Using `->ONE` variable mode outside of a loop assignment.
- Referencing an object-valued variable without specifying a key.

Implementation detail:

- The underlying parser/executor may throw rich `Error` objects; the route currently forwards only
  `error.message` to clients.

---

## Performance and Caching

The executor uses a lightweight caching layer (`apps/server/src/lib/search/cache.ts`):

- A cache key is derived from the parsed statements.
- Results for identical queries may be reused, depending on the cache configuration.

Implications for API consumers:

- Prefer stable, repeatable queries for hot paths (e.g. dashboards) to benefit from caching.
- Avoid embedding rapidly-changing values (like `Date.now()`) directly into the DSL.

---

## Versioning and Compatibility

The search DSL and API are intended to be **backwards compatible**:

- New features are usually **additive** to the grammar (e.g., new value types, new aggregations).
- Existing constructs should not change semantics without a deprecation path.

When you depend on specific syntax, pin your application to a known server version or add tests around your queries.

For internal contributors, see `./search-implementation-notes.md` and
`apps/server/src/lib/search/CONTRIBUTING.md` for guidance on evolving the DSL safely.
