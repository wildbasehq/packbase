# @BULKPOSTLOAD Usage Guide

The `@BULKPOSTLOAD` directive allows you to efficiently load posts with all their related data (user profiles,
reactions, comments, packs, pages) using the `BulkPostLoader` class.

## Syntax

```
@BULKPOSTLOAD([query])
@BULKPOSTLOAD(currentUserId, [query])
@BULKPOSTLOAD(@PAGE(skip, take, [query]))
@BULKPOSTLOAD(currentUserId, @PAGE(skip, take, [query]))
```

## Examples

### Basic Usage

Load posts by ID:

```
@BULKPOSTLOAD([Where posts:id ("post-123")])
```

### With Current User ID

Include the current user's ID to determine which reactions they've made:

```
@BULKPOSTLOAD("user-456", [Where posts:id ("post-123")])
```

### With Variable Reference

Use a variable for the current user ID:

```
@BULKPOSTLOAD($currentUser, [Where posts:channel_id ("channel-789")])
```

### With Variable Assignment

Assign the result to a variable:

```
$posts = @BULKPOSTLOAD([Where posts:channel_id ("channel-123")])
```

### With Variable Assignment and User Context

```
$enrichedPosts = @BULKPOSTLOAD($currentUser, [Where posts:id ("post-123")])
```

### With Pagination (@PAGE)

Use `@PAGE` for pagination - it will automatically add `hasMore` to indicate if more results exist:

```
$posts = @BULKPOSTLOAD(@PAGE(0, 20, [Where posts:channel_id ("channel-123")]))
```

This returns:

- `posts`: Array of 20 enriched posts
- `posts_hasMore`: Boolean indicating if more posts exist beyond the current page

### With User Context and Pagination

```
$enrichedPosts = @BULKPOSTLOAD($userId, @PAGE(10, 25, [Where posts:channel_id ("channel-xyz")]))
```

### Complex Queries

Use complex WHERE clauses:

```
$posts = @BULKPOSTLOAD($userId, @PAGE(0, 50, [Where posts:channel_id ("channel-123") AND posts:created_at ("2023-01-01".."2023-12-31")]))
```

### With Projection

Specify which column to extract post IDs from (defaults to 'id'):

```
@BULKPOSTLOAD([Where posts:id ("some-id")] AS id)
```

## Pagination with hasMore

When using `@PAGE(skip, take, [query])`, the system automatically:

1. Fetches one extra row beyond the `take` limit
2. Checks if more results exist
3. Adds a `hasMore` property to the result (named `{variableName}_hasMore` or `result_hasMore`)

Example response structure:

```javascript
{
    posts: [...], // Array of enriched posts
        posts_hasMore
:
    true, // More results available
        variables
:
    { ...
    }
}
```

This allows you to implement infinite scroll or pagination UI:

```typescript
const result = await executeQuery('$posts = @BULKPOSTLOAD(@PAGE(0, 20, [Where posts:channel_id ("channel-123")]))');
const posts = result.posts;
const hasMore = result.posts_hasMore;

// In your UI
if (hasMore) {
    // Show "Load More" button
    // Next query would use @PAGE(20, 20, ...)
}
```

## What Gets Loaded

The `BulkPostLoader` automatically fetches and includes:

- Post data (id, created_at, content_type, body, assets, tags, etc.)
- User profiles (with avatars and badges)
- Reactions (with counts and "reactedByMe" flags)
- Comments (with nested user data and reactions)
- Pack information (if post belongs to a pack)
- Page/channel information

## Return Format

Returns an object mapping post IDs to their complete data:

```javascript
{
    "post-123"
:
    {
        id: "post-123",
            created_at
    :
        "2023-01-01T00:00:00Z",
            content_type
    :
        "text",
            body
    :
        "Hello world",
            user
    :
        {
            id: "user-456",
                username
        :
            "john",
                display_name
        :
            "John Doe",
                images
        :
            {
                avatar: "...", header
            :
                "..."
            }
        }
    ,
        reactions: [
            {key: "👍", emoji: "👍", count: 5, reactedByMe: true}
        ],
            comments
    :
        [...],
            pack
    :
        {...
        }
    ,
        page: {...
        }
    }
}
```

## Performance

The `BulkPostLoader` efficiently batches all database queries to minimize database round-trips, making it much faster
than loading posts one at a time. It also limits to a maximum of 25 posts per load for optimal performance.
