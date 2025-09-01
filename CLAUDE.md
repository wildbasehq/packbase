# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo managed with Turbo and Bun containing a full-stack social platform with real-time features. The project uses TypeScript throughout and follows a modern web development stack.

## Architecture

- **Monorepo Structure**: Uses Turbo with workspaces in `apps/*` and `packages/*`
- **Frontend**: React 18 + Vite + TypeScript in `apps/web` (named "packbase")
- **Backend**: Elysia.js API server with Bun runtime in `apps/server` (named "wominjeka")
- **Shared Packages**: ESLint config, TypeScript config, and UI components in `packages/`

### Key Technologies

**Frontend Stack**:
- Vite for bundling and dev server
- Tailwind CSS v4 with custom plugins
- Radix UI primitives for components
- Clerk for authentication
- Supabase for database
- SWR for data fetching
- Zustand for state management
- TipTap for rich text editing
- Wouter for routing

**Backend Stack**:
- Elysia.js web framework
- Bun runtime and package manager
- Prisma ORM with PostgreSQL
- Clerk backend for auth
- AWS S3 for file storage

## Common Commands

### Development

```bash
# Install dependencies
bun install

# Start development servers (all apps)
bun run dev

# Start individual apps
cd apps/web && bun run dev      # Frontend dev server
cd apps/server && bun run dev  # Backend with hot reload
```

### Build & Type Checking

```bash
# Build all apps
turbo build

# Type check all projects
turbo check-types

# Individual app commands
cd apps/web && bun run build        # Build frontend
cd apps/web && bun run check-types  # Type check frontend
cd apps/web && bun run lint         # Lint frontend

cd apps/server && bun run build     # Build backend
cd apps/server && bun run check-types # Type check backend
```

### Backend-Specific Commands

```bash
cd apps/server

# Start production server
bun run start

# Database operations
bun run prisma:generate
bun run db-dev-container    # Start dev database

# Create new API route
bun run create-route

# Load balancer
bun run load-balancer
```

## Code Organization

### Frontend (`apps/web/src/`)
- `components/` - Organized by feature (chat, feed, home, layout, shared, etc.)
- `pages/` - Route components
- `lib/` - Utilities and configurations
- `types/` - TypeScript type definitions
- `styles/` - Global styles and Tailwind config

### Backend (`apps/server/src/`)
- `routes/` - API endpoints organized by feature
- `models/` - Data models and schemas
- `db/` - Database utilities
- `utils/` - Helper functions
- `lib/` - Shared backend logic

## Development Guidelines

- Use Bun as the primary runtime and package manager
- Strict TypeScript configuration is enforced
- Components use React 18 with hooks and modern patterns
- Backend uses Elysia.js with functional patterns
- Database operations use Prisma ORM
- Authentication handled by Clerk (frontend + backend)
- File uploads handled via AWS S3