# Search API Documentation

This document provides comprehensive documentation for the Search API, which allows you to search data using a custom query syntax.

## API Endpoint

```
GET /search?q=<query>&limit=<limit>&offset=<offset>&includeMetadata=<true|false>
```

### Query Parameters

- `q` (required): The search query string using the custom syntax described below
- `limit` (optional): Maximum number of results to return
- `offset` (optional): Number of results to skip
- `includeMetadata` (optional): Whether to include metadata in the results (true/false)
- 
### Response Format

```json
{
  "results": [
    {
      "id": "uuid-string",
      "table": "table-name",
      "score": 0.95,
      "metadata": {}
    }
  ],
  "count": 1,
  "query": "original-query-string"
}
```

Note: The `score` and `metadata` fields are optional and will only be included if requested.

### Error Response

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "position": {
      "line": 1,
      "column": 10
    }
  }
}
```

## Query Syntax

The search API uses a custom query syntax that allows for powerful and flexible searches.

### Basic Syntax

The basic syntax for a query is:

```
[Where TABLE ("search term")]
```

This searches for the term "search term" in all searchable fields of the specified table.

### Column-Specific Queries

To search in a specific column:

```
[Where TABLE:COLUMN ("search term")]
```

### Logical Operators

You can use logical operators to combine search terms:

```
[Where TABLE ("term1" AND "term2")]
[Where TABLE ("term1" OR "term2")]
[Where TABLE (NOT "term")]
```

You can also use logical operators to search multiple groups (tables) at once:

```
[Where TABLE1 ("term1")] OR [Where TABLE2 ("term2")]
```

This searches for "term1" in TABLE1 and "term2" in TABLE2, and returns results from both tables.

### Nested Queries

You can nest queries to search across multiple tables:

```
[Where TABLE1 ("term1" AND [Where TABLE2 ("term2")])]
```

This searches for "term1" in TABLE1 and "term2" in TABLE2, and returns results from TABLE1 that match both conditions.

### Sorting

You can sort the results:

```
[Where TABLE ("term")] SORT BY field ASC
[Where TABLE ("term")] SORT BY field DESC
```

### Wildcard Matching

You can use wildcards in search terms:

```
[Where TABLE ("j*n*")]
```

This matches terms like "john", "jane", "johnson", etc.

### Case Sensitivity

By default, searches are case-insensitive. You can make them case-sensitive:

```
[Where TABLE CASE=true ("Term")]
```

### Range Queries

You can search for values within a range:

```
[Where TABLE:COLUMN BETWEEN ("start" AND "end")]
```

### Fuzzy Matching

You can perform fuzzy matching with a specified distance:

```
[Where TABLE FUZZY=2 ("term")]
```

This matches terms that are within 2 edit distances of "term".

### Numerical Comparisons

You can perform numerical comparisons:

```
[Where TABLE:COLUMN >(10)]
[Where TABLE:COLUMN <(20)]
[Where TABLE:COLUMN =(15)]
[Where TABLE:COLUMN >=(10)]
[Where TABLE:COLUMN <=(20)]
```

### Existence Check

You can check if a column has a value:

```
[Where TABLE:COLUMN EXISTS]
```

### Exact Match

You can perform exact matching:

```
[Where TABLE EXACT ("term")]
```

### Named Queries

You can define and reuse queries:

```
$popularPosts = [Where posts:likes >=(100)]
$popularPosts
```

## Examples

### Basic Search

```
[Where packs ("travel")]
```

Searches for "travel" in all searchable fields of the "packs" table.

### Column-Specific Search

```
[Where packs:display_name ("Travel Blog")]
```

Searches for "Travel Blog" in the "display_name" column of the "packs" table.

### Logical Operators

```
[Where packs ("travel" AND "blog")]
```

Searches for packs that contain both "travel" and "blog".

### Nested Query

```
[Where packs ("travel" AND [Where posts ("vacation")])]
```

Searches for packs that contain "travel" and have associated posts that contain "vacation".

### Sorting

```
[Where packs ("travel")] SORT BY display_name DESC
```

Searches for packs that contain "travel" and sorts the results by display_name in descending order.

### Wildcard Matching

```
[Where profiles ("j*n*")]
```

Searches for profiles with names that match the pattern "j*n*".

### Case Sensitivity

```
[Where profiles CASE=true ("John")]
```

Searches for profiles with the exact name "John" (case-sensitive).

### Range Query

```
[Where posts:created_at BETWEEN ("2023-01-01" AND "2023-12-31")]
```

Searches for posts created between January 1, 2023 and December 31, 2023.

### Fuzzy Matching

```
[Where profiles FUZZY=2 ("john")]
```

Searches for profiles with names that are within 2 edit distances of "john".

### Numerical Comparison

```
[Where posts:likes >=(10)]
```

Searches for posts with 10 or more likes.

### Existence Check

```
[Where profiles:bio EXISTS]
```

Searches for profiles that have a bio.

### Exact Match

```
[Where profiles EXACT ("John Doe")]
```

Searches for profiles with the exact name "John Doe".

### Named Query

```
$popularPosts = [Where posts:likes >=(100)]
$popularPosts
```

Defines a named query for popular posts and then uses it.

### Multiple Groups

```
[Where profiles ("john")] OR [Where packs ("travel")]
```

Searches for profiles that contain "john" and packs that contain "travel", and returns results from both tables.

## Supported Tables

The search API supports the following tables:

- `packs`: Packs information
- `posts`: Posts information
- `profiles`: User profiles
- `users`: User accounts
- `user_themes`: User themes

Each table has specific searchable fields. The search API ensures that all results are UUIDs.

### Table Allowlist

You can restrict which tables are allowed to be searched by using the `tables` query parameter. This is useful for security purposes or to limit the scope of a search.

For example, to only allow searching in the `packs` and `posts` tables:

```
GET /search?q=[Where packs ("travel")]&tables=packs,posts
```

If a query attempts to search in a table that is not in the allowlist, the API will return a `TABLE_NOT_ALLOWED` error.

```json
{
  "error": {
    "message": "Table 'profiles' is not in the allowed tables list",
    "code": "TABLE_NOT_ALLOWED"
  }
}
```

If the `tables` parameter is not provided, all supported tables can be searched.

## Error Handling

The search API provides detailed error messages with position information to help you debug your queries. Common error codes include:

- `LEXER_ERROR`: Error in the lexical analysis of the query
- `PARSER_ERROR`: Error in the parsing of the query
- `EXECUTION_ERROR`: Error in the execution of the query
- `INVALID_TABLE`: Invalid table name
- `TABLE_NOT_ALLOWED`: Table is not in the allowed tables list
- `MISSING_COLUMN`: Column name is required for certain operations
- `UNSUPPORTED_EXPRESSION`: Unsupported expression type

## Implementation Details

The search API is implemented using a three-step process:

1. **Lexical Analysis**: The query string is tokenized into a stream of tokens.
2. **Parsing**: The tokens are parsed into an Abstract Syntax Tree (AST).
3. **Execution**: The AST is executed against the database to produce results.

All results are guaranteed to be UUIDs, as required by the specification.
