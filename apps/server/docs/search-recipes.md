# Search Recipes

> This document is a **cookbook** for the Search DSL. It shows concrete, copy-pastable examples
> built on top of the language described in `./search-query-language.md`.

Each recipe includes:

- A sample query string
- A URL-encoded version you can drop into `/search?q=...`
- A short explanation of what it does

---

## 1. Basic Text Search

### 1.1 Single-table search across default columns

Query:

```text
[Where posts ("hello")]
```

URL-encoded (`q` param):

```text
%5BWhere%20posts%20(%22hello%22)%5D
```

Explanation:

- Searches the `posts` table.
- Matches if any searchable column contains `"hello"` (case-insensitive).
- Returns an array of default IDs (usually `id` column values).

### 1.2 Case-sensitive search

Query:

```text
[Where posts:body ("Hello":s)]
```

Explanation:

- Only matches rows where `body` contains `"Hello"` with the same capitalization.

### 1.3 Prefix and suffix wildcard matching

Query (prefix):

```text
[Where posts:title ("Hello*")]
```

Query (suffix):

```text
[Where posts:title ("*world")]
```

Query (contains):

```text
[Where posts:title ("*ello*")]
```

Explanation:

- `Hello*` → titles starting with `Hello`.
- `*world` → titles ending with `world`.
- `*ello*` → titles containing `ello`.

---

## 2. Column-Specific Searches

### 2.1 Search a single column

```text
[Where packs:display_name ("Travel Blog")]
```

Explanation:

- Looks only at the `display_name` column in the `packs` table.

### 2.2 Search multiple columns together

```text
[Where profiles:first_name,last_name ("John")]
```

Explanation:

- Uses list semantics over two columns:
    - Both `first_name` **and** `last_name` must satisfy the list predicate.

---

## 3. Combining Conditions with AND / OR / NOT

### 3.1 Require multiple terms (logical AND)

```text
[Where posts ("hello" AND "world")]
```

Explanation:

- The expression tree requires both atoms to match.
- Each atom behaves like a basic string predicate.

### 3.2 Alternative terms (logical OR)

```text
[Where posts ("hello" OR "world")]
```

Explanation:

- Matches posts that contain either `"hello"` **or** `"world"` (or both).

### 3.3 Negation (NOT)

```text
[Where posts ("hello" AND NOT "spam")]
```

Explanation:

- Combines positive and negated clauses in a single boolean expression.

---

## 4. List-Based Tag Searches

Assume `posts:tags` is an array of strings.

### 4.1 Require a single tag

```text
[Where posts:tags ("news")]
```

Explanation:

- Matches posts where `tags` contains `"news"`.

### 4.2 Require at least one of several tags (OR)

```text
[Where posts:tags ("~news" "~world")]
```

Explanation:

- `~` marks OR items.
- Matches posts whose tags include **either** `"news"` or `"world"`.

### 4.3 Require multiple tags and exclude others

```text
[Where posts:tags ("news" "tech" "-archive")]
```

Explanation:

- Requires both `"news"` and `"tech"`.
- Excludes any post whose tags include `"archive"`.

### 4.4 Mix AND, OR, and NOT in a single list

```text
[Where posts:tags ("news" "~world" "-internal")]
```

Explanation:

- Must have `"news"`.
- May have `"world"` but not required.
- Must **not** have `"internal"`.

---

## 5. Date Range Filtering

### 5.1 Closed range

```text
[Where posts:created_at ("2024-01-01".."2024-12-31")]
```

Explanation:

- Matches posts created between 2024-01-01 and 2024-12-31 (inclusive).

### 5.2 Open-ended ranges

From a specific date onwards:

```text
[Where posts:created_at ("2024-01-01"..)]
```

Until a specific date:

```text
[Where posts:created_at ("".."2024-12-31")]
```

> Use ISO 8601 date strings for best results.

---

## 6. Emptiness and Optional Fields

### 6.1 Missing or empty values

```text
[Where profiles:bio (EMPTY)]
```

Explanation:

- Matches profiles with no bio (`null`, `undefined`, empty string, or empty array).

### 6.2 Present values

```text
[Where profiles:bio (NOT EMPTY)]
```

Explanation:

- Matches profiles where `bio` is non-empty.

---

## 7. Working with Relations

Assume a relation between `posts` and `profiles` (e.g. `posts.author_id` → `profiles.id`).

### 7.1 Posts that have a related profile

```text
[Where posts (Where posts -> profiles)]
```

Explanation:

- Uses a relation atom to filter posts that are connected to at least one profile.

### 7.2 Profiles that have at least one post

```text
[Where profiles (Where profiles <- posts)]
```

Explanation:

- Backward relation from `profiles` to `posts`.

> Combine basic and relation atoms using `AND` / `OR` for richer queries.

---

## 8. Projections and Aggregations

### 8.1 Selecting specific columns

```text
[Where posts ("hello")] AS id, title
```

Explanation:

- Returns an array of objects `{ id, title }` instead of plain IDs.

### 8.2 Selecting all columns

```text
[Where posts ("hello")] AS *
```

Explanation:

- Returns full-row objects with all whitelisted columns.

### 8.3 Count

```text
COUNT()[Where posts ("hello")]
```

Explanation:

- Returns a single-element array containing the number of matching posts.

### 8.4 Unique values

```text
UNIQUE()[Where posts:author_id ("hello")]
```

Explanation:

- Fetches all matching posts and returns a deduplicated list of `author_id` values.

### 8.5 First / last

```text
FIRST()[Where posts ("hello")] AS id
LAST()[Where posts ("hello")] AS id
```

Explanation:

- `FIRST` / `LAST` pick the first / last projected value after filtering.

---

## 9. Variables and Reuse Patterns

### 9.1 Reusing IDs across tables

```text
$posts = [Where posts ("hello")] AS id, user_id;
[Where profiles:id ($posts:user_id -> ANY)] AS *
```

Explanation:

- Step 1: `$posts.values` contains `{ id, user_id }`.
- Step 2: Filter `profiles` where `id` is in the set of `$posts.user_id` values.

### 9.2 Using `_prev` instead of a named variable

```text
[Where posts ("hello")] AS id, user_id;
[Where profiles:id ($_prev:user_id -> ANY)] AS *
```

Explanation:

- Same as above but relies on the special `_prev` variable.

### 9.3 Enriching parent objects with related data

```text
$posts:user = [Where profiles:id ($posts:user_id -> ONE)] AS *;
```

Explanation (high-level):

- Iterates over `$posts.values`, and for each element:
    - Runs the inner query with `->ONE` bound to that element.
    - Stores the first match under `user` on the element.

This is useful when you want variable results shaped like:

```jsonc
{
  "values": [
    { "id": "...", "user_id": "...", "user": { "id": "...", "username": "..." } },
    // ...
  ]
}
```

---

## 10. Pagination Patterns

Even though the DSL itself does not have `LIMIT` / `OFFSET` keywords, you can paginate via HTTP query parameters.

### 10.1 Simple pagination on the client

On the client (pseudo-code):

```ts
const page = 2;
const limit = 20;
const offset = (page - 1) * limit;

GET /search?q=[Where posts ("hello")]&limit=20&offset=20
```

Combine with `COUNT()` in a separate query to get total count:

```text
COUNT()[Where posts ("hello")]
```

---

## 11. Troubleshooting and Anti-Patterns

### 11.1 Common errors

- **Unknown table**: using a table name not present in the schema or whitelist.
- **Table not allowed**: trying to access a table not present in `allowedTables` when provided.
- **Variable shape mismatch**:
    - Using `$var->ANY` when `$var.values` are objects without a `:key`.
    - Using `->ONE` outside of a loop assignment.
- **Unsupported value**:
    - Typos or malformed range syntax (`("2024-01-01"..2024-12-31)`).

### 11.2 Performance pitfalls

- Overusing `*` wildcards can degrade performance, especially when pushdown is not possible.
- Very wide `AS *` projections pull all columns; prefer `AS column1, column2`.
- Complex boolean expressions with many list predicates may require full in-memory filtering.

### 11.3 When to change the DSL vs. application code

- If a query feels impossible or extremely awkward, consider:
    - Adding a new value type or aggregation per `CONTRIBUTING.md`.
    - Or simplifying the use-case in the calling application.

For details on evolving the language, see `apps/server/src/lib/search/CONTRIBUTING.md` and
`./search-implementation-notes.md`.

