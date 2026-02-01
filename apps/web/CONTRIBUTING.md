# Contributing to Packbase Frontend

Welcome to the Packbase Frontend repository! We appreciate your interest in contributing. This document guides you
through the setup process, coding standards, and workflow for contributing to the `apps/web` project.

## 🚀 Getting Started

### Prerequisites

- **Bun**: [Bun](https://bun.sh/) as the package manager and runtime. **YOU MUST USE BUN. DO NOT USE (P)NPM, YARN, ETC.
  **
- **Clerk**: [Clerk](https://clerk.com/) for authentication.
- **Tailwind CSS**: [Tailwind CSS](https://tailwindcss.com/) for styling.
- **TypeScript**: [TypeScript](https://www.typescriptlang.org/) for type safety.
- **Vite**: [Vite](https://vitejs.dev/) for building and serving the application. Rolldown experimental fork.
- **Zustand**: [Zustand](https://github.com/pmndrs/zustand) for state management.
- **Wouter**: [Wouter](https://github.com/molefrog/wouter) for client-side routing.
- **TanStack Query**: [TanStack Query](https://tanstack.com/query/latest) for data fetching.
- **Tiptap**: [Tiptap](https://tiptap.dev/) for rich text editor.
- **React**: [React](https://react.dev/) for building user interfaces.
- **shadcn/ui**: [shadcn/ui](https://ui.shadcn.com/)-style design tokens for theming.
- **Sentry**: [Sentry](https://sentry.io/) for error tracking.

If a tool complains about not having node installed, use `bunx` before the command.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd korat-hb/apps/web
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Setup your environment variables**:
    ```bash
    cp .env.example .env
    ```

   Fill in the values for the environment variables, most are self explanatory.

### Running Locally

To start the development server with Vite:

```bash
bun run dev
```

The application will typically run at `http://localhost:5173` (check the terminal output for the exact URL).

## 📂 Project Structure

Here is a quick overview of the directory structure:

- **`src/`**: Contains the source code.
    - **`components/`**: Reusable UI components.
    - **`datasets/`**: Static datasets or mock data.
    - **`routes/`** (implied): Component or hooks for Client-side routing (using `wouter`).
    - **`tests/`**: Test files.
- **`public/`**: Static assets served directly (images, icons, etc.).
- **`tailwind.config.js`**: Configuration for Tailwind CSS.
- **`vite.config.ts`**: Configuration for Vite.

## 🛠 Development Workflow

### Code Style & Linters

We enforce code quality using **ESLint** and **Prettier**.

- **Linting**:
    ```bash
    bun run lint
    ```
  This will run ESLint to catch common errors and enforce coding standards.

- **Formatting**:
  Prettier is configured to format your code. Ensure your editor is set up to format on save, or run:
    ```bash
    bun x prettier --write .
    ```

### Type Checking

We use **TypeScript** for type safety. It is crucial to ensure there are no type errors before submitting your code.

- **Check types**:
    ```bash
    bun run check-types
    ```
  This runs `tsc --noEmit` to verify type integrity without generating output files.

### Building for Production

To create a production build:

```bash
bun run build
```

This command first checks types and then builds the project using Vite. The output will be in the `dist/` directory.

### Previewing Production Build

To preview the production build locally:

```bash
bun run preview
```

## 🏗 Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [Wouter](https://github.com/molefrog/wouter)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Authentication**: [Clerk](https://clerk.com/)
- **Editor**: [Tiptap](https://tiptap.dev/)
