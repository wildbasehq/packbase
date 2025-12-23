# Yapock Server Codebase Notes

## Overview

Yapock appears to be a social platform server with features for user profiles, content sharing ("howls"), themed
interfaces, and group-based organization ("packs"). The server is built with modern TypeScript technologies and follows
a structured API design.

## Technology Stack

- **Runtime**: Bun (inferred from bun.lockb)
- **Framework**: Elysia (similar to Express.js but for Bun)
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Clerk (migrated from Supabase Auth)
- **Analytics**: PostHog
- **Documentation**: Swagger

## Core Architecture

- **Entry Point**: `src/index.ts` - Sets up the Elysia server, middleware, and route loading
- **Route Structure**: Routes are automatically loaded using elysia-autoload
- **Database**: Prisma client with connection pooling and development mode detection
- **Authentication**: Clerk client with token verification

## Database Schema

The database uses PostgreSQL with multiple schemas (auth, public) and includes models for:

1. **User-related**:
    - `profiles`: User profiles with username, bio, display name, etc.
    - `profiles_followers`: Tracks who follows whom
    - `profiles_settings`: User settings
    - `user_presence`: Tracks user online status
    - `user_themes`: Custom themes created by users

2. **Content-related**:
    - `posts`: Content posted by users (likely "howls")
    - `posts_reactions`: Reactions to posts

3. **Organization**:
    - `packs`: Groups/collections (central entity)
    - `packs_memberships`: Relates users to packs
    - `packs_pages`: Pages within packs

4. **System**:
    - `notice`: For announcements
    - `audit_log_entries`: Audit logs (in auth schema)
    - `flow_state`: Authentication flow state (in auth schema)

## API Structure

The API is organized into logical sections:

1. **User Routes**:
    - `/user/me/*`: Current user endpoints
    - `/user/[username]/*`: User profile endpoints

2. **Theme Routes**:
    - `/themes`: List themes
    - `/themes/validate`: Validate themes
    - `/themes/[id]`: Specific theme

3. **Server Routes**:
    - `/server/describeServer`: Server info
    - `/server/insight`: Server insights

4. **Search Route**:
    - `/search`: Search functionality

5. **Pack Routes**:
    - `/packs`: List packs
    - `/pack/create`: Create pack
    - `/pack/[id]/*`: Pack-specific endpoints

6. **Invite Routes**:
    - `/invite/generate`: Generate invites
    - `/invite/list`: List invites

7. **Inbox Routes**:
    - `/inbox/*`: Inbox management

8. **Howl Routes** (content/posts):
    - `/howl/create`: Create content
    - `/howl/[id]/*`: Content-specific endpoints

9. **Feed Route**:
    - `/feed/[id]`: Feed endpoint

10. **Dipswitch Route**:
    - `/dipswitch`: Configuration switches

## Utility Functions

The codebase includes various utility functions organized in the `src/utils` directory:

1. **Core Utilities**:
    - `BulkPostLoader.ts`: Efficient loading of multiple posts
    - `verify-token.ts`: Authentication token verification
    - `NotificationManager.ts`: Handling notifications
    - `unlockables-manager.ts`: Managing unlockable content
    - `get-id-type.ts`: Determining ID types

2. **Specialized Utilities** (in subdirectories):
    - `controllers`: Controller logic
    - `errors`: Error handling
    - `identity`: Identity management
    - `packs`: Pack-related utilities
    - `posthog`: Analytics utilities
    - `sanitize`: Input sanitization
    - `search`: Search functionality
    - `supabase`: Supabase-related utilities
    - `themes`: Theme-related utilities

## Startup Process

1. Server initialization in `index.ts`
2. Connection to Clerk authentication
3. Connection to Prisma database
4. Running of migration scripts
5. Self-diagnostic tests
6. Route loading and server start

## Security Features

- Token verification for authentication
- Row-level security in database tables
- Input sanitization
- Audit logging

## Notable Features

- Custom theming system
- User presence tracking
- Social features (followers, reactions)
- Content organization via "packs"
- Invitation system
- Notification system

## Recent Changes

There appears to be a migration from Supabase Auth to Clerk for authentication, as evidenced by the migration file
`src/migrate/1_supabase_auth_to_clerk.ts`.

## Development Notes

- The codebase uses debug logging extensively
- There's a self-test system for diagnostics
- The server can be run in different modes (cluster, SDK building, etc.)
- There's webhook functionality for server events