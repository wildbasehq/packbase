# Contributing to Packbase

Welcome to the Packbase repository! We appreciate your interest in contributing. This document guides you through the
setup process, coding standards, and workflow for contributing to the project.

__**Read the respective `CONTRIBUTING.md` file for each project.**__

## 🚀 Getting Started

### Prerequisites

- **Bun**: [Bun](https://bun.sh/) as the package manager and runtime. **YOU MUST USE BUN. DO NOT USE (P)NPM, YARN, ETC.
  **
- **PostgreSQL**: [PostgreSQL](https://www.postgresql.org/) for database.

If a tool complains about not having node installed, use `bunx` before the command.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   ```

2. **Install dependencies**:
   Do this in the **root** for everything. Alternatively, do this for each project in `apps` and `packages`.
   ```bash
   bun install
   ```

3. **Setup your environment variables**:
   Do this for each project in `apps` and `packages`. You can't skip this.
    ```bash
    cp .env.example .env
    ```

   Fill in the values for the environment variables, most are self explanatory.

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

- **Greptile**:
  We use Greptile to catch security issues and bugs in the code, as well as PR summaries and code quality. He'll run
  automatically on PRs.

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
bunx turbo build
```

This command first checks types and then builds the project using Vite. The output will be in the `dist/` directory.

### Previewing Production Build

To preview the production build locally:

```bash
bunx turbo dev
```

## 🤝 Submitting Changes

1. **Create a Branch**: Create a new branch for your feature or fix.
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. **Commit Changes**: Make atomic commits with clear messages.
   ```bash
   git add .
   git commit -m "feat: add my new feature"
   ```
3. **Verify**: Run linting and type checking to ensure CI passes.
   ```bash
   bun run lint
   bun run check-types
   ```
4. **Push**: Push your branch to the remote repository.
   ```bash
   git push origin feature/my-new-feature
   ```
5. **Pull Request**: Open a Pull Request (PR) against the `main` (or appropriate) branch. Provide a clear description of
   your changes.
