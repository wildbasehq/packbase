# Whskrd Search Language - User Guide

> **Whskrd** (pronounced "whisker-d") is a powerful, flexible search language that lets you query your data using an
> intuitive, text-based syntax. This guide will teach you everything you need to know to write effective search queries.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Concepts](#basic-concepts)
3. [Searching Text](#searching-text)
4. [Working with Lists and Tags](#working-with-lists-and-tags)
5. [Date Ranges](#date-ranges)
6. [Combining Conditions](#combining-conditions)
7. [Selecting Data](#selecting-data)
8. [Aggregations](#aggregations)
9. [Variables and Multi-Step Queries](#variables-and-multi-step-queries)
10. [Relations Between Tables](#relations-between-tables)
11. [Advanced Patterns](#advanced-patterns)
12. [Tips and Best Practices](#tips-and-best-practices)

---

## Quick Start

Here's your first whskrd query:

```
[Where posts ("hello")]
```

This searches all posts for the word "hello" and returns matching post IDs.

Want to get more than just IDs? Add a projection:

```
[Where posts ("hello")] AS title, body
```

Now you'll get back objects with `title` and `body` fields for each matching post.

---

## Basic Concepts

### Queries and Statements

A whskrd query consists of one or more **statements** separated by semicolons (`;`):

```
[Where posts ("tech")];
[Where profiles ("John")]
```

Each statement runs independently, and the last statement's results are returned to you.

### Square Brackets

Most query logic lives inside square brackets `[...]`. Think of them as containers for search expressions:

```
[Where posts ("search term")]
```

### Comments

Add comments to document your queries using `//`:

```
// Find all tech posts from 2024
[Where posts ("tech" AND "2024")]
```

---

## Searching Text

### Basic Text Search

Search any table for text across all searchable columns:

```
[Where posts ("hello world")]
```

By default, searches are **case-insensitive** and match if the text appears **anywhere** in the field.

### Searching Specific Columns

Target specific columns by adding a colon after the table name:

```
[Where posts:title ("Product Launch")]
```

Search multiple columns at once:

```
[Where profiles:first_name,last_name ("John")]
```

### Case-Sensitive Search

Add `:s` to make your search case-sensitive:

```
[Where posts:title ("Hello World":s)]
```

Use `:i` (or nothing) for case-insensitive (the default):

```
[Where posts:title ("hello world":i)]
[Where posts:title ("hello world")]      // Same as above
```

### Wildcard Matching

Use `*` for wildcard matching:

**Starts with:**

```
[Where posts:title ("Getting Started*")]
```

**Ends with:**

```
[Where posts:title ("*Tutorial")]
```

**Contains (both sides):**

```
[Where posts:title ("*Guide*")]
```

> **Note:** Without wildcards, "contains" is the default behavior, so `("Guide")` and `("*Guide*")` are equivalent.

---

## Working with Lists and Tags

When searching array fields like tags, whskrd provides powerful list operators.

### Require Specific Items (AND)

```
[Where posts:tags ("tech" "tutorial")]
```

Posts must have **both** "tech" **AND** "tutorial" tags.

### Optional Items (OR)

Prefix items with `~` to make them optional:

```
[Where posts:tags ("~javascript" "~python")]
```

Posts must have **either** "javascript" **OR** "python" (or both).

### Exclude Items (NOT)

Prefix items with `-` to exclude:

```
[Where posts:tags ("tech" "-deprecated")]
```

Posts must have "tech" but **NOT** "deprecated".

### Mixing AND, OR, and NOT

Combine all three for complex filtering:

```
[Where posts:tags ("tutorial" "~javascript" "~python" "-beginner")]
```

This matches posts that:

- **Must** have "tutorial"
- **May** have "javascript" or "python" (or both)
- **Must not** have "beginner"

---

## Date Ranges

Search date fields using range syntax with `..`:

### Specific Date Range

```
[Where posts:created_at ("2024-01-01".."2024-12-31")]
```

### Open-Ended Ranges

**From a date onwards:**

```
[Where posts:created_at ("2024-06-01"..)]
```

**Up to a date:**

```
[Where posts:created_at ("".."2024-06-01")]
```

> Use ISO 8601 format (YYYY-MM-DD) for best results.

---

## Combining Conditions

Build complex queries by combining conditions with `AND`, `OR`, and `NOT`.

### AND - All conditions must match

```
[Where posts ("tutorial" AND "javascript")]
```

```
[Where posts:title ("Getting Started" AND "Guide")]
```

### OR - Any condition can match

```
[Where posts ("javascript" OR "typescript")]
```

### NOT - Exclude results

```
[Where posts ("tutorial" AND NOT "deprecated")]
```

### Combining Multiple Operators

Whskrd follows standard precedence: `NOT` > `AND` > `OR`

```
[Where posts ("tutorial" AND "javascript" OR "python" AND NOT "advanced")]
```

Use multiple segments for clarity:

```
[Where posts ("tutorial" AND "javascript")]
[Where posts ("tutorial" AND "python")]
```

---

## Selecting Data

By default, queries return IDs. Use `AS` to select specific columns.

### Select Single Column

```
[Where posts ("tech")] AS title
```

Returns an array of title strings.

### Select Multiple Columns

```
[Where posts ("tech")] AS id, title, created_at
```

Returns an array of objects with those three fields.

### Select All Columns

```
[Where posts ("tech")] AS *
```

Returns full objects with all available columns.

### Checking for Empty Values

Find records with missing or empty data:

```
[Where profiles:bio (EMPTY)]
```

Find records with data present:

```
[Where profiles:bio (NOT EMPTY)]
```

---

## Aggregations

Transform your results with aggregation functions.

### COUNT - Count matches

```
COUNT()[Where posts ("tutorial")]
```

Returns `[42]` if there are 42 matching posts.

### UNIQUE - Get distinct values

```
UNIQUE()[Where posts:author_id ("tech")]
```

Returns deduplicated list of author IDs.

### FIRST - Get first match

```
FIRST()[Where posts ("latest")] AS id, title
```

Returns only the first matching post.

### LAST - Get last match

```
LAST()[Where posts ("latest")] AS id, title
```

Returns only the last matching post.

> **Tip:** Combine aggregations with projections for powerful queries:
> ```
> COUNT()[Where posts:tags ("tutorial" "javascript")]
> ```

---

## Variables and Multi-Step Queries

Store intermediate results in variables for complex, multi-step queries.

### Basic Variable Assignment

```
$tech_posts = [Where posts:tags ("tech")] AS id, author_id;
[Where profiles:id ($tech_posts:author_id -> ANY)] AS username, bio
```

**How it works:**

1. First statement stores matching posts in `$tech_posts`
2. Second statement finds profiles whose ID matches any `author_id` from `$tech_posts`

### Variable Reference Modes

**ANY** - Match if value is in the variable's list:

```
($my_var:field -> ANY)
```

**ALL** - Match if all variable values are equal to the field:

```
($my_var:field -> ALL)
```

**ONE** - Used in enrichment patterns (see Advanced Patterns):

```
($my_var:field -> ONE)
```

### The `_prev` Variable

Skip naming variables by using `_prev` to reference the previous statement:

```
[Where posts ("tech")] AS id, author_id;
[Where profiles:id ($_prev:author_id -> ANY)] AS *
```

---

## Relations Between Tables

Query relationships between tables using relation atoms.

### Forward Relations

Find posts that have a related profile:

```
[Where posts (Where posts -> profiles)]
```

### Backward Relations

Find profiles that have at least one post:

```
[Where profiles (Where profiles <- posts)]
```

### Combining Relations with Text Search

```
[Where posts ("tutorial" AND Where posts -> profiles)]
```

Finds posts that:

- Contain "tutorial"
- Have an associated profile

---

## Advanced Patterns

### Data Enrichment

Build nested objects by enriching variables with related data:

```
$posts = [Where posts ("tech")] AS id, title, author_id;
$posts:author = [Where profiles:id ($posts:author_id -> ONE)] AS username, avatar
```

The `$posts` variable now contains objects like:

```json
{
  "id": "...",
  "title": "...",
  "author_id": "...",
  "author": {
    "username": "jane_doe",
    "avatar": "..."
  }
}
```

### Chaining Multiple Steps

```
// Find tech tutorial posts
$posts = [Where posts:tags ("tech" "tutorial")] AS id, author_id;

// Get their authors
$authors = [Where profiles:id ($posts:author_id -> ANY)] AS id, username;

// Count unique authors
COUNT()[Where profiles:id ($authors:id -> ANY)]
```

### Complex Tag Filtering

```
// Must have "tutorial", prefer "javascript" or "python", exclude "deprecated"
[Where posts:tags ("tutorial" "~javascript" "~python" "-deprecated" "-archive")]
```

---

## Tips and Best Practices

### 1. Start Simple, Then Add Complexity

Begin with basic queries and gradually add conditions:

```
// Start here
[Where posts ("tech")]

// Add specificity
[Where posts:title,body ("tech")]

// Add time range
[Where posts:title,body ("tech") AND Where posts:created_at ("2024-01-01"..)]

// Add projections
[Where posts:title,body ("tech") AND Where posts:created_at ("2024-01-01"..)] AS title, body, created_at
```

### 2. Use Variables for Readability

Break complex queries into steps:

**Instead of:**

```
[Where profiles:id ([Where posts ("tech")] -> ANY)] AS *
```

**Use:**

```
$tech_posts = [Where posts ("tech")] AS author_id;
[Where profiles:id ($tech_posts:author_id -> ANY)] AS *
```

### 3. Project Only What You Need

Avoid `AS *` unless necessary:

```
// ✅ Good - only get what you need
[Where posts ("tech")] AS id, title

// ❌ Less efficient - pulls all columns
[Where posts ("tech")] AS *
```

### 4. Use Comments for Documentation

```
// Find active users from the last quarter
$recent_posts = [Where posts:created_at ("2024-10-01".."2024-12-31")] AS author_id;

// Get their profiles
[Where profiles:id ($recent_posts:author_id -> ANY)] AS username, email
```

### 5. Leverage List Syntax for Tags

When working with arrays, use list syntax instead of multiple queries:

**Instead of:**

```
[Where posts:tags ("tech")] OR [Where posts:tags ("tutorial")]
```

**Use:**

```
[Where posts:tags ("~tech" "~tutorial")]
```

### 6. Test Date Ranges

Use open-ended ranges for "since" or "until" queries:

```
// Everything from June onwards
[Where posts:created_at ("2024-06-01"..)]

// Everything before July
[Where posts:created_at ("".."2024-07-01")]
```

### 7. Combine Aggregations with Filters

```
// How many tech posts were created in 2024?
COUNT()[Where posts:tags ("tech") AND Where posts:created_at ("2024-01-01".."2024-12-31")]

// Who are the unique authors?
UNIQUE()[Where posts:tags ("tech")] AS author_id
```

---

## Common Use Cases

### Search All Posts by a User

```
[Where posts:author_id ("user-123")] AS title, body, created_at
```

### Find Posts with Specific Tags from Date Range

```
[Where posts:tags ("tutorial" "javascript") AND Where posts:created_at ("2024-01-01"..)] AS *
```

### Get User Profiles Who Posted Recently

```
$recent = [Where posts:created_at ("2024-12-01"..)] AS author_id;
[Where profiles:id ($recent:author_id -> ANY)] AS username, bio
```

### Count Posts by Tag Combination

```
COUNT()[Where posts:tags ("tech" "tutorial" "-deprecated")]
```

### Search Across Multiple Text Fields

```
[Where posts:title,body,summary ("machine learning")] AS title
```

### Find Empty or Missing Data

```
// Users without bios
[Where profiles:bio (EMPTY)] AS username

// Posts with bios
[Where profiles:bio (NOT EMPTY)] AS username, bio
```

---

## Quick Reference

### Text Search Modifiers

- `:i` or nothing → case-insensitive (default)
- `:s` → case-sensitive
- `*` → wildcard (prefix/suffix)

### List Operators

- `"item"` → must have (AND)
- `"~item"` → may have (OR)
- `"-item"` → must not have (NOT)

### Boolean Operators

- `AND` → all conditions must match
- `OR` → any condition can match
- `NOT` → negate a condition

### Date Range Syntax

- `("2024-01-01".."2024-12-31")` → specific range
- `("2024-01-01"..)` → from date onwards
- `("".."2024-12-31")` → up to date

### Aggregations

- `COUNT()` → count matches
- `UNIQUE()` → distinct values
- `FIRST()` → first match
- `LAST()` → last match

### Projections

- `AS column` → single column
- `AS col1, col2` → multiple columns
- `AS *` → all columns

### Variable Modes

- `-> ANY` → match if in list
- `-> ALL` → match if all equal
- `-> ONE` → match current loop element

### Special Checks

- `(EMPTY)` → null/undefined/empty
- `(NOT EMPTY)` → has value

---

## Getting Help

**Examples not working?** Make sure:

- Table and column names are spelled correctly
- Dates are in ISO format (YYYY-MM-DD)
- Quotes are properly closed
- Variable names start with `$`

**Need more power?** Consider:

- Breaking complex queries into multiple steps with variables
- Using aggregations to summarize data
- Combining text search with date ranges and tag filters

Happy searching with whskrd! 🐱

