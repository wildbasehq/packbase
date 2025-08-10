# API Client Documentation

This document provides documentation for the API client that can be used to interact with the Voyage API. The client uses a simple dot notation to access API endpoints.

## Client Usage

The client is accessed using the `vg` object, followed by the path to the endpoint. For example:

```javascript
// Fetch notifications
const notifications = await vg.inbox.fetch.get({ limit: 20 });

// Get a specific notification
const notification = await vg.inbox.get({ id: '1234' });

// Mark notifications as read
const result = await vg.inbox.read.post({ id: '1234' });
```

## API Endpoints

### Inbox / Notifications

#### Fetch Notifications

```javascript
vg.inbox.fetch.get(options)
```

Fetches a list of notifications for the current user with pagination.

**Parameters:**
- `options` (object, optional):
  - `limit` (number, optional): Maximum number of notifications to return. Default: 20.
  - `cursor` (string, optional): Cursor for pagination.
  - `unread_only` (boolean, optional): Whether to return only unread notifications. Default: false.

**Returns:**
```javascript
{
  has_more: boolean,
  data: [
    {
      id: string,
      created_at: string, // ISO date string
      user_id: string,
      type: string,
      title: string,
      content: string,
      read: boolean,
      read_at: string | null, // ISO date string or null
      metadata: any | null,
      related_id: string | null
    },
    // ...
  ]
}
```

#### Get Notification

```javascript
vg.inbox.get(options)
```

Gets a specific notification by ID.

**Parameters:**
- `options` (object, required):
  - `id` (string, required): ID of the notification to retrieve.

**Returns:**
```javascript
{
  id: string,
  created_at: string, // ISO date string
  user_id: string,
  type: string,
  title: string,
  content: string,
  read: boolean,
  read_at: string | null, // ISO date string or null
  metadata: any | null,
  related_id: string | null
}
```

#### Mark Notifications as Read

```javascript
vg.inbox.read.post(options)
```

Marks one or more notifications as read.

**Parameters:**
- `options` (object, required): At least one of the following must be provided:
  - `id` (string, optional): ID of a single notification to mark as read.
  - `ids` (string[], optional): Array of notification IDs to mark as read.
  - `all` (boolean, optional): Whether to mark all notifications as read.

**Returns:**
```javascript
{
  success: boolean,
  count: number // Number of notifications marked as read
}
```

### User Profiles

#### Get User Profile

```javascript
vg.user.get(options)
```

Gets a user profile by username.

**Parameters:**
- `options` (object, required):
  - `username` (string, required): Username of the user to get.

**Returns:**
```javascript
{
  id: string,
  username: string,
  display_name: string,
  about: {
    bio: string
  },
  images: {
    avatar: string | null,
    header: string | null
  },
  following: boolean | undefined
}
```

### Packs (Groups)

#### Get Pack Members

```javascript
vg.pack.members.get(options)
```

Gets the members of a pack (group).

**Parameters:**
- `options` (object, required):
  - `id` (string, required): ID of the pack to get members for.

**Returns:**
```javascript
[
  {
    id: string,
    username: string,
    display_name: string,
    about: {
      bio: string
    },
    images: {
      avatar: string | null,
      header: string | null
    },
    joined_at: string // ISO date string
  },
  // ...
]
```

## Error Handling

All API methods can throw errors. The error object has the following structure:

```javascript
{
  status: number, // HTTP status code
  message: string, // Error message
  code: string // Error code
}
```

Common error codes:
- `401`: Unauthorized - You must be logged in to access this resource
- `403`: Forbidden - You don't have permission to access this resource
- `404`: Not Found - The requested resource was not found
- `400`: Bad Request - The request was invalid
- `500`: Internal Server Error - Something went wrong on the server

## Examples

### Fetch Notifications

```javascript
// Fetch all notifications
const allNotifications = await vg.inbox.fetch.get();

// Fetch only unread notifications
const unreadNotifications = await vg.inbox.fetch.get({ unread_only: true });

// Fetch with pagination
const paginatedNotifications = await vg.inbox.fetch.get({ limit: 10, cursor: 'abc123' });
```

### Get a Specific Notification

```javascript
const notification = await vg.inbox.get({ id: '1234' });
```

### Mark Notifications as Read

```javascript
// Mark a single notification as read
const result1 = await vg.inbox.read.post({ id: '1234' });

// Mark multiple notifications as read
const result2 = await vg.inbox.read.post({ ids: ['1234', '5678'] });

// Mark all notifications as read
const result3 = await vg.inbox.read.post({ all: true });
```

### Get User Profile

```javascript
const userProfile = await vg.user.get({ username: 'johndoe' });
```

### Get Pack Members

```javascript
const packMembers = await vg.pack.members.get({ id: '1234' });
```