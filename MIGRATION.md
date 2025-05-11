# Migration Guide

This document provides guidance for migrating the codebase to the new directory structure.

## Directory Structure Changes

The project has been refactored to follow a standard React project structure with all application code under the `/src`
directory:

- `/components` → `/src/components`
- `/lib` → `/src/lib`
- `/lib/index` → `/src/lib/state/*` (split into multiple files)
- `/lib/workers.ts` → `/src/lib/workers/workers.ts`

## Import Statement Updates

The vite.config.ts file has been updated to point to the new locations, so existing imports should continue to work.
However, it's recommended to update import statements to use the new locations for better clarity and consistency.

### State Management Imports

Old:

```typescript
import {useUIStore, useUserAccountStore, useResourceStore} from '@/lib/index';
// or
import {useUIStore, useUserAccountStore, useResourceStore} from '@/lib/index';
```

New:

```typescript
import {useUIStore, useUserAccountStore, useResourceStore} from '@/lib/state';
```

### Worker System Imports

Old:

```typescript
import {WorkerStore, shutdownWorker} from '@/lib/workers';
// or
import {WorkerStore, shutdownWorker} from '@/lib/workers';
```

New:

```typescript
import {WorkerStore, shutdownWorker} from '@/lib/workers';
```

## Next Steps

1. Update import statements in your code to use the new locations
2. Remove the old files and directories once all imports have been updated
3. Update any build scripts or configuration files that reference the old directory structure