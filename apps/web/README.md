## Introduction

[![Wildbase Labs proof-of-concept project image](/.github/poc-landing.png)](https://labs.yipnyap.me/)
**THIS IS NOT PRODUCTION READY, DISCLOSURE PROSECUTABLE BY LAW.** Run it either air-gapped or in a sandbox network.

⚠️ Wildbase projects are bound by your non-disclosure agreement with Wolfbite Labs. Sharing this project with
unauthorized individuals in its current state is a violation of your NDA and prosecutable by law.

## Project Structure

The project follows a standard React project structure with all application code under the `/src` directory:

```
/src
  /components       # React components organized by feature
  /lib              # Utility functions, hooks, and state management
    /api            # API-related code
    /defs           # Type definitions
    /hooks          # Custom React hooks
    /socket         # WebSocket-related code
    /state          # Zustand stores for state management
    /utils          # Utility functions
    /workers        # Worker system
  /pages            # Page components
  /styles           # Global styles
```

## Import Guidelines

When importing from the project, use the following aliases:

- `@/components` - React components
- `@/lib` - Utility functions, hooks, and state management
- `@/pages` - Page components
- `@/styles` - Global styles
- `@/public` - Public assets
- `@/datasets` - Dataset files

Example:

```typescript
// Import components
import { Button } from '@/components/shared/button';

// Import from lib
import { useUserAccountStore } from '@/lib/state';
import { cn } from '@/lib/utils';

// Import from pages
import { HomePage } from '@/pages/home';
```

## State Management

The project uses Zustand for state management. State stores are organized by domain in the `/src/lib/state` directory:

- `ui-settings.ts` - UI settings store
- `user-account.ts` - User account store
- `resource.ts` - Resource store
- `ui.ts` - UI store

Import state stores from the state index file:

```typescript
import { useUIStore, useUserAccountStore, useResourceStore } from '@/lib/state';
```

## Worker System

The project includes a worker system for background processing. Worker functionality is in the `/src/lib/workers` directory.

Import worker functionality from the workers index file:

```typescript
import { WorkerStore, shutdownWorker } from '@/lib/workers';
```

## Building and Running

See the [Development Guidelines](/.junie/guidelines.md) for information on building and running the project.
