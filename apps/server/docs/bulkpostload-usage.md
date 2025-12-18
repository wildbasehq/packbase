# @BULKPOSTLOAD Usage Guide

The `@BULKPOSTLOAD` directive allows you to efficiently load posts with all their related data (user profiles,
reactions, comments, packs, pages) using the `BulkPostLoader` class.

## Syntax

```
@BULKPOSTLOAD([query])
@BULKPOSTLOAD(currentUserId, [query])
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

### Complex Queries

Use complex WHERE clauses:

```
$posts = @BULKPOSTLOAD($userId, [Where posts:channel_id ("channel-123") AND posts:created_at ("2023-01-01".."2023-12-31")])
```

### With Projection

Specify which column to extract post IDs from (defaults to 'id'):

```
@BULKPOSTLOAD([Where posts:id ("some-id")] AS id)
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
than loading posts one at a time.

