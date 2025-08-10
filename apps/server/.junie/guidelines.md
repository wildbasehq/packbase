# Yapock Development Guidelines

This document provides essential information for developers working on the Yapock project. It covers build/configuration instructions, testing procedures, and other development guidelines specific to this project.

## Build and Configuration

### Prerequisites

- [Bun](https://bun.sh/) runtime environment (latest version recommended)
- PostgreSQL database (via Supabase or standalone)
- Node.js (for some tooling compatibility)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` (if not already present) and configure the following variables:
   - `DATABASE_URL`: PostgreSQL connection string with pgbouncer (for connection pooling)
   - `DIRECT_URL`: Direct PostgreSQL connection string (for migrations)
   - `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Authentication keys from Clerk
   - `SUPABASE_URL` and `SUPABASE_KEY`: Supabase connection details
   - `PDS_HOST`: The host where the server will be accessible
   - `POSTHOG_KEY`: Analytics key (if using PostHog)

### Database Setup

1. Initialize the database:
   ```bash
   bun prisma migrate dev
   ```

2. The schema uses multiple PostgreSQL schemas (auth, public) and includes row-level security, which requires proper setup for migrations.

### Running the Application

#### Development Mode

```bash
bun run dev
```

This starts the server with hot reloading enabled.

#### Production Mode

```bash
bun run start
```

### Building the Project

The project includes several build scripts:

1. Standard build:
   ```bash
   bun run build:bun
   ```

2. SDK build (generates TypeScript types for API):
   ```bash
   bun run build:voyagesdktypes
   ```

### Startup Flags

The application supports several startup flags:

- `--cluster`: Run in cluster mode
- `--build-sdk`: Build SDK types and exit
- `--close-on-success`: Test startup time and exit
- `--skip-self-diag`: Skip self-diagnostic tests

## Testing

### Test Framework

The project uses Bun's built-in test runner. Test files should follow these naming conventions:
- `.test.ts` (e.g., `component.test.ts`)
- `_test_.ts`
- `.spec.ts`
- `_spec_.ts`

### Running Tests

To run all tests:

```bash
bun test
```

To run a specific test file:

```bash
bun test path/to/file.test.ts
```

### Writing Tests

Here's a simple example of a test file:

```typescript
import { test, expect } from 'bun:test';

// Function to test
function add(a: number, b: number): number {
  return a + b;
}

// Test group
test('basic math operations', () => {
  // Test case
  test('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });
});

export { add };
```

### Self-Diagnostic Tests

The application includes a self-diagnostic system that tests all routes. This runs automatically on startup unless the `--skip-self-diag` flag is used.

To manually run the self-diagnostic tests:

```typescript
import { selfTest } from '@/self-test';
await selfTest(app);
```

## Project Structure

### Key Directories

- `src/`: Source code
  - `routes/`: API routes (automatically loaded)
  - `utils/`: Utility functions
  - `db/`: Database connections and utilities
  - `migrate/`: Migration scripts
  - `scripts/`: Utility scripts
- `prisma/`: Database schema and migrations
- `tests/`: Test files

### API Structure

The API is built with Elysia and uses automatic route loading. Routes are organized in directories that match the URL structure:

- `src/routes/user/[username]/`: User-specific routes
- `src/routes/themes/`: Theme-related routes
- `src/routes/packs/`: Pack-related routes
- etc.

## Development Guidelines

### Code Style

- TypeScript is used throughout the project
- Use async/await for asynchronous operations
- Follow the existing pattern of route organization

### Authentication

The project uses Clerk for authentication. Token verification is handled by the `verifyToken` utility.

### Database Access

- Use Prisma Client for database operations
- Be aware of row-level security in the database
- Use connection pooling for better performance

### Error Handling

- Use appropriate HTTP status codes
- Return structured error responses
- Log errors with the debug module

### Logging

The project uses the `debug` module for logging. To enable logs:

```bash
DEBUG=vg* bun run dev
```

Different log levels are available:
- `vg:init`: Initialization logs
- `vg:request`: Request logs
- `vg:init:error`: Error logs

### Performance Considerations

- The application monitors startup time and warns if it exceeds 94ms
- Use connection pooling for database connections
- Be mindful of unnecessary database queries

## Documentation

API documentation is available at the `/docs` endpoint using Swagger. When adding new routes, ensure they are properly documented for Swagger.