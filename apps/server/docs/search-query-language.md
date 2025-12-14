# Search Query Language Reference

> This document is the **authoritative reference** for the Search DSL implemented in
> `apps/server/src/lib/search`. It reflects the actual behavior of `parser.ts`, `executor.ts`, and `types.ts`.

If you're calling `/search`, start with `./search-api-overview.md`.
If you're designing complex queries or extending the DSL, this is your main guide.

---

## 1. High-Level Concepts

- A query is a **string** in a custom DSL.
- The parser turns the string into:
    - `ParsedQuery` → `Statement[]` → `ExpressionNode` trees.
- The executor evaluates those statements against Prisma models and returns:
    - Values
    - Optional aggregations
    - Optional variable metadata

Key ideas:

- **Statements** are separated by `;`.
- Each statement is built from one or more bracketed **segments** like `[Where posts ("hello")]`.
- Statements can be **assigned to variables** using `$name = ...`.
- The final results and any variables are returned to the caller.

---

## 2. Lexical Rules

### 2.1 Comments

- Line comments start with `//` and continue to the end of the line.
- Comments inside double-quoted strings are preserved.

Example:

```text
// this is ignored
[Where posts ("hello // not a comment")]
```

Implementation: `stripLineComments` in `parser.ts`.

### 2.2 Statement Separation

- Statements are separated by one or more semicolons `;`.

Example:

```text
[Where posts ("hello")]; [Where profiles ("world")] ;
```

Parses as **two** statements.

### 2.3 Brackets and Segments

- Most query structure lives inside square brackets `[...]`.
- A **segment** is usually one bracketed group, optionally combined with a leading aggregation and/or `AS` clause.

```text
[Where posts ("hello")]
AS body, user_id [Where profiles ("world")]
```

The parser uses `trimOuterBrackets` and `splitPipeline` to normalize segments.

### 2.4 Keywords and Identifiers

- Keywords (e.g., `Where`, `AND`, `OR`, `NOT`, `AS`, `COUNT`, `FIRST`) are **case-insensitive**.
- Identifiers (table and column names) must match:

  ```text
  [A-Za-z0-9_.]+
  ```

- Table names are validated using `isValidTable` from `schema.ts`.

---

## 3. Statements and Variables

A query is one or more **statements**.

### 3.1 Expression Statements

An expression statement has no variable assignment:

```text
[Where posts ("hello")]
```

It is represented as:

```ts
{
    type: 'expression',
        expr
:
    ExpressionNode,
        asColumn ? : string,
        asColumns ? : string[],
        asAll ? : boolean,
        aggregation ? : Aggregation,
}
```

The values from the **last** expression statement are included in the top-level result.

### 3.2 Variable Assignments

A variable assignment has the form:

```text
$var = [Where posts ("hello")] AS body
```

Grammar:

```bnf
Assignment ::= '$' Identifier (':' Identifier)? '=' Segment+
```

- `$var` is the **variable name**.
- Optional `:targetKey` suffix (e.g., `$posts:user`) controls how nested results are merged into objects (advanced; see
   8.2).

Parser behavior (`parseVariableAssignment`):

- Captures `name`, optional `targetKey`, and the inner segment string.
- The **last** segment becomes the statement's `query`/`expr`.

Execution behavior:

- The statement's results are stored in `ExecutionContext.variables[name]` as a `VariableValue`:

  ```ts
  type VariableValue = {
    values: any[];
    column?: TableColumn;
    columns?: TableColumn[];
    ids?: any[];
    table?: string;
  };
  ```

- A special variable `_prev` is always updated to reflect the last executed statement.

---

## 4. WHERE Expressions

The core of the DSL is the **boolean expression** inside each segment.

### 4.1 Atoms

Atoms are the leaves of the expression tree.

There are two main atom types:

1. **Basic** column comparison
2. **Relation** hop

#### 4.1.1 Basic atoms

Canonical form:

```text
Where TABLE[:col1,col2,...] (VALUE)
```

Examples:

```text
Where posts ("hello")
Where posts:body ("hello")
Where posts:title,body ("hello")
```

Parser pipeline:

- `parseAtom` normalizes missing `Where` prefix (e.g. `posts:body ("hello")` is allowed).
- `parseColumnSelector` extracts `table` and optional `columns[]`.
- `parseValue` parses the `(VALUE)` portion.

Resulting type:

```ts
{
    kind: 'basic';
    selector: ColumnSelector;
    value: QueryValue
}
```

#### 4.1.2 Relation atoms

Canonical form:

```text
Where FROM -> TO
Where FROM <- TO
```

Examples:

```text
Where posts -> profiles
Where profiles <- posts
```

Parser (`parseRelation`):

- `->` means a **forward** hop from `from` to `to`.
- `<-` means a **backward** hop.

Resulting type:

```ts
{
    kind: 'relation';
    direction: 'forward' | 'backward';
    from: string;
    to: string
}
```

Execution (`buildRelationResolvers`):

- Looks up relation metadata (`Relations`) to find key fields.
- Prefetches related rows once, then checks for each record whether it participates in the relation.

> Relation atoms do **not** specify values themselves; they are used alongside basic atoms to filter by the existence
> of related rows.

### 4.2 Boolean Combinators

Expressions are built by combining atoms with `NOT`, `AND`, and `OR`.

Precedence (from highest to lowest):

1. `NOT`
2. `AND`
3. `OR`

Parser implementation (`parseExpression`):

- Strips leading `NOT` recursively.
- Uses `splitTopLevel` to split on top-level `OR` and then `AND`, respecting nested brackets and parentheses.
- Leaves atomic segments to be parsed by `parseAtom`.

Examples:

```text
Where posts ("hello" AND "world")
Where posts ("hello" OR "world")
NOT Where posts ("spam")
Where posts ("hello") AND Where posts ("world")
```

Execution:

- `buildWherePredicate` recursively builds a predicate function over records.
- For basic atoms, it calls `buildValuePredicate` and decides whether to use `some` or `every` over the target columns
  (see 5.3).

---

## 5. Tables, Columns, and Column Selection

### 5.1 Table Names

- Table names must be known Prisma models; validated via `isValidTable`.
- If an unknown table is referenced, the parser throws `Unknown table: <name>`.

### 5.2 Columns

- Columns can be explicitly listed after a colon:

  ```text
  Where posts:body ("hello")
  Where posts:title,body ("hello")
  ```

- Omit columns to let the executor decide whether to use **all** columns or a subset:

  ```text
  Where posts ("hello")
  ```

### 5.3 How Column Sets Are Used

Execution logic:

- For **basic** atoms, `buildWherePredicate` determines which columns to inspect:

  ```ts
  const cols = where.selector.columns ?? Object.keys(record);
  const checkFn = where.value.type === 'list' ? 'every' : 'some';
  return cols[checkFn]((c) => predicate(record[c]));
  ```

Semantics:

- For **string**, **date**, **empty**, **not_empty**, and **variable** values:
    - Uses `some` → at least one column must satisfy the predicate.
- For **list** values:
    - Uses `every` → every listed column must satisfy the list predicate.

This allows patterns like:

```text
Where profiles:first_name,last_name ("John")
```

> Both `first_name` **and** `last_name` must satisfy the list semantics; see 6.2.

### 5.4 Whitelisting and Security

Before executing a statement, `runStatement` enforces:

- `ensureTableWhitelisted(table)`
- `ensureColumnsWhitelisted(table, columns)` or `ensureAllColumnsAllowed(table)`

Definitions live in `whitelist.ts` / `whitelist.json` and ensure only intended parts of the schema are searchable.

---

## 6. Values (`QueryValue`)

The `QueryValue` union covers all value shapes the DSL supports:

```ts
export type QueryValue =
    | { type: 'string'; value: string; caseSensitive: boolean; prefix?: boolean; suffix?: boolean }
    | { type: 'list'; items: { value: string; or?: boolean; not?: boolean }[]; caseSensitive: boolean }
    | { type: 'date'; value: { from?: string; to?: string } }
    | { type: 'empty' }
    | { type: 'not_empty' }
    | { type: 'variable'; name: string; key?: string; mode: 'ANY' | 'ALL' | 'ONE' };
```

### 6.1 String Values

Syntax:

```text
("text"[:i|s])
```

Examples:

```text
("hello")       // case-insensitive contains
("*World":s)    // case-sensitive, suffix wildcard
("prefix*")     // prefix wildcard
("*middle*")    // both sides wildcard (contains)
```

Parser:

- `parseValue` matches `("..."[:i|s])`.
- `:i` (or omitted) → `caseSensitive: false`.
- `:s` → `caseSensitive: true`.
- Leading `*` sets `prefix: true`.
- Trailing `*` sets `suffix: true`.

Executor (`buildStringPredicate`):

- If `prefix` → `startsWith`.
- If `suffix` → `endsWith`.
- Else → `includes`.

### 6.2 List Values

Syntax (one or more quoted values, optional case flag):

```text
("foo" "~bar" "-baz"[:i|s])
```

Semantics:

- `"foo"` (no prefix) → **AND** term: must be present.
- `"~bar"` (tilde) → **OR** term: any of these may match.
- `"-baz"` (dash) → **NOT** term: must **not** be present.

Execution details (`buildValuePredicate`):

1. Build a string predicate for each item (`caseSensitive` is shared across them).
2. For a record value `v` (string or array of strings):
    - Wrap into array `values = Array.isArray(v) ? v : [v]`.
    - If there are NOT items:
        - If any NOT item matches any value → record fails.
    - Split the remaining items into:
        - `orItems` (those with `or: true`)
        - `andItems` (others)
    - If there are AND items:
        - Each must match **at least one** value.
    - If there are OR items:
        - At least one must match **some** value.

Example patterns:

- Require tag `"news"` and optionally `"world"`:

  ```text
  ("news" "~world")
  ```

- Require both `"news"` and `"tech"`, and exclude `"archive"`:

  ```text
  ("news" "tech" "-archive")
  ```

### 6.3 Date Ranges

Syntax:

```text
("from".."to")
```

Examples:

```text
("2024-01-01".."2024-12-31")
("2024-01-01"..)
("".."2024-12-31")
```

Parser:

- `parseValue` uses a range regex to extract `from` and `to`.
- Either bound may be omitted, resulting in an open-ended range.

Executor (`buildDatePredicate`):

- Coerces record values using `new Date(recordValue)`.
- Compares timestamps (ms since epoch) against `from` and `to`.

### 6.4 Emptiness Checks

Syntax:

```text
(EMPTY)
(NOT EMPTY)
```

Executor semantics:

- `EMPTY` matches `null`, `undefined`, `""`, or `[]`.
- `NOT EMPTY` is the logical negation.

Use-cases:

- Find records with no tags:

  ```text
  Where posts:tags (EMPTY)
  ```

- Find records that have any tags:

  ```text
  Where posts:tags (NOT EMPTY)
  ```

### 6.5 Variable References

Syntax:

```text
($var[:key] -> ANY|ALL|ONE)
```

Examples:

```text
($posts:id -> ANY)
($users:user_id -> ALL)
($packs:id -> ONE)
($posts:user_id -> ANY)
```

Parser:

- `parseValue` matches `$name`, optional `:key`, and the mode (`ANY`, `ALL`, or `ONE`).

Executor (`buildValuePredicate`):

- Looks up `ctx.variables[value.name]`.
- For `ONE` mode:
    - Requires loop context (`ctx.loop`) to be set by the executor.
    - Compares the current loop element (or its `key` field) directly to the target value.
- For `ANY`/`ALL` modes:
    - If the variable values are **objects**, you must provide `:key`.
    - Collects `sourceValues` from the variable:

      ```ts
      const sourceValues = value.key
        ? variable.values.map(v => v[key]).filter(v => v !== undefined)
        : variable.values;
      ```

    - `ANY`: predicate passes if **any** source value is equal to the record value.
    - `ALL`: predicate passes if **all** source values equal the record value.

Errors:

- Using `->ONE` without loop context → error.
- Referring to an object-valued variable without `:key` → error.

---

## 7. Aggregation and Projection (`AS`)

### 7.1 Aggregations

Supported aggregations (`Aggregation` type):

- `COUNT`
- `UNIQUE`
- `FIRST`
- `LAST`

Syntax:

```text
COUNT()[Where posts ("hello")]
UNIQUE()[Where posts:author_id ("hello")]
FIRST()[Where posts ("hello")]
LAST()[Where posts ("hello")]
```

Parser (`parseAggregation`):

- Looks for `^(COUNT|UNIQUE|FIRST|LAST)\(\)` at the start of a segment.

Executor (`runStatement` → `shapeResults`):

- Without aggregation: `values` is the projected row/column data.
- With aggregation:
    - `COUNT` → `[subset.length]`.
    - `UNIQUE` → deduplicated `values` array.
    - `FIRST` → `[values[0]]` or `[]` if empty.
    - `LAST` → `[values[values.length - 1]]` or `[]`.

### 7.2 `AS` Projection

`AS` controls which columns are projected into the result.

Syntax (leading or trailing):

```text
AS body [Where posts ("hello")]
[Where posts ("hello")] AS body
[Where posts ("hello")] AS body, user_id
[Where posts ("hello")] AS *
```

Parser (`parseAsColumn` and trailing `AS` handling):

- Supports:
    - Single column: `AS body` → `asColumn: 'body'`.
    - Multiple columns: `AS body, user_id` → `asColumns: ['body', 'user_id']`.
    - All columns: `AS *` → `asAll: true`.
- Leading and trailing `AS` are normalized into the same fields.

Executor (`shapeResults` inside `runStatement`):

- If `asAll`:

  ```ts
  values = subset.map(r => ({ ...r }));
  ```

- Else if `asColumns`:

  ```ts
  values = subset.map(r => Object.fromEntries(asColumns.map(c => [c, r[c]])));
  ```

- Else (no explicit projection):
    - Use the inferred `idColumn` (default ID column from the schema).
    - If `asColumn` is set, it takes precedence.

This yields three common patterns:

1. **Scalar IDs** (default):

   ```text
   [Where posts ("hello")]
   // → ["uuid-1", "uuid-2", ...]
   ```

2. **Single column projection**:

   ```text
   [Where posts ("hello")] AS body
   // → ["Hello world", "Another post", ...]
   ```

3. **Object projection**:

   ```text
   [Where posts ("hello")] AS id, body
   // → [{ "id": "...", "body": "..." }, ...]
   ```

---

## 8. Variables and Pipelines

### 8.1 Basic Variable Usage

Example:

```text
$posts = [Where posts ("hello")] AS id, user_id;
[Where profiles:id ($posts:user_id -> ANY)] AS *
```

Explanation:

1. First statement:
    - Stores posts into `$posts.values` as `{ id, user_id }` objects.
2. Second statement:
    - Uses `$posts:user_id -> ANY` to filter `profiles` whose `id` is contained in `$posts.values[*].user_id`.

### 8.2 Nested Enrichment via `:targetKey`

Advanced pattern (described in `CONTRIBUTING.md`):

```text
$posts:user = [Where profiles:id ($posts:user_id -> ONE)] AS *;
```

Execution (high-level):

- The executor iterates each element of `$posts.values` with a loop context (`ctx.loop`).
- For each element, it runs the inner query with `->ONE`, binding to the current element.
- The first matching row is stored under the `user` key on the original `$posts` element, enriching it with nested
  objects.

This enables building richer, tree-shaped results in multiple statements.

### 8.3 `_prev` Special Variable

- After every statement, the executor updates `_prev` to mirror the last statement's result.
- You can use `_prev` in subsequent statements instead of naming variables explicitly.

Example:

```text
[Where posts ("hello")] AS id, user_id;
[Where profiles:id ($_prev:user_id -> ANY)] AS *
```

---

## 9. Prisma Pushdown and In-Memory Filtering

The executor tries to push simple predicates into Prisma (`buildPrismaWhere`) to leverage the database.

Supported pushdown patterns:

- Simple **string** equality or UUID-like matches on a single column.
- Contains/startsWith/endsWith on **string** columns with optional case-insensitive mode.
- Date range filters on **date** columns.

More complex expressions (lists, NOT, relation checks, variable references) fall back to in-memory filtering using
`buildWherePredicate`.

As a query author, you don't need to distinguish these cases, but be aware that more complex queries may have higher
runtime cost.

---

## 10. Grammar Summary (Informal)

```bnf
Query       ::= Statement (';' Statement)*

Statement   ::= Assignment
              | ExpressionStatement

Assignment  ::= '$' Identifier (':' Identifier)? '=' Pipeline

ExpressionStatement
            ::= Pipeline

Pipeline    ::= Segment+

Segment     ::= '[' SegmentInner ']'

SegmentInner::= AggregationOpt AsOpt Expression

AggregationOpt
            ::= ( 'COUNT()'
                | 'UNIQUE()'
                | 'FIRST()'
                | 'LAST()'
               )?

AsOpt       ::= ('AS' ColumnList | 'AS' '*')?

ColumnList  ::= Identifier (',' Identifier)*

Expression  ::= 'NOT' Expression
              | Expression 'AND' Expression
              | Expression 'OR'  Expression
              | Atom

Atom        ::= BasicWhere
              | Relation

BasicWhere  ::= 'Where' Table (':' Columns)? Value

Relation    ::= 'Where' Identifier ('->' | '<-') Identifier

Table       ::= Identifier
Columns     ::= Identifier (',' Identifier)*

Value       ::= StringValue
              | ListValue
              | DateRange
              | EmptyCheck
              | VariableRef

StringValue ::= '(' '"' .* '"' (':' ('i' | 's'))? ')'
ListValue   ::= '(' ( '"' .* '"' )+ (':' ('i' | 's'))? ')'
DateRange   ::= '(' '"' [^"']* '"' '..' '"'? [^"')']* '"'? ')'
EmptyCheck  ::= '(EMPTY)' | '(NOT EMPTY)'
VariableRef ::= '(' '$' Identifier (':' Identifier)? '->'
                   ('ANY' | 'ALL' | 'ONE') ')'

Identifier  ::= [A-Za-z_][A-Za-z0-9_.]*
```

---

## 11. Limitations and Non-Features

Current DSL intentionally does **not** support:

- Arbitrary numeric comparisons like `>(10)` or `<(20)`.
- Fuzzy matching (edit distance) operators.
- Free-form `SORT BY` clauses.
- Explicit `BETWEEN` syntax for ranges (use `("from".."to")` instead).
- EXISTS/EXACT keyword-based predicates.

If you see such features in older documentation, treat them as **outdated**; the real behavior is determined by the
implementation in `parser.ts` and `executor.ts` described here.

For ideas on how to extend the DSL, see `apps/server/src/lib/search/CONTRIBUTING.md` and
`./search-implementation-notes.md`.

