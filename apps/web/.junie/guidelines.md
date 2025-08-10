# Packbase Development Guidelines

This document provides essential information for developers working on the Packbase project. It includes
build/configuration instructions, testing information, and additional development details specific to this project.

## Build/Configuration Instructions

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/) (v1.22+) or [npm](https://www.npmjs.com/)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Using Yarn
   yarn install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Configure environment variables in the `.env` file

### Development

Start the development server:

```bash
# Using Bun
bun dev

# Using Yarn
yarn dev
```

The development server will be available at `http://localhost:5173` by default.

### Building for Production

Build the project for production:

```bash
# Using Bun
bun build

# Using Yarn
yarn build
```

The built files will be available in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
# Using Bun
bun preview

# Using Yarn
yarn preview
```

## Testing Information

### Testing Framework

This project uses Bun's built-in testing framework. Tests are located in the `tests` directory.

### Running Tests

Run all tests:

```bash
bun test
```

Run a specific test file:

```bash
bun test tests/file-name.test.ts
```

### Creating Tests

1. Create a new test file in the `tests` directory with a `.test.ts` or `.test.tsx` extension
2. Import the testing utilities from Bun:
   ```typescript
   import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
   ```
3. Write your tests using the standard testing patterns:
   ```typescript
   describe('Feature or Component Name', () => {
     // Optional setup before each test
     beforeEach(() => {
       // Setup code
     });
     
     // Optional teardown after each test
     afterEach(() => {
       // Cleanup code
     });
     
     test('should do something specific', () => {
       // Test code
       expect(result).toBe(expectedValue);
     });
   });
   ```

### Example Test

Here's a simple example of a utility function test:

```typescript
// tests/utils.test.ts
import {describe, expect, test} from 'bun:test';

// Function to test
function capitalizeString(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

describe('capitalizeString', () => {
    test('capitalizes first letter and lowercases the rest', () => {
        expect(capitalizeString('hello')).toBe('Hello');
        expect(capitalizeString('WORLD')).toBe('World');
    });

    test('handles empty strings', () => {
        expect(capitalizeString('')).toBe('');
    });
});
```

Run this test with:

```bash
bun test tests/utils.test.ts
```

## Additional Development Information

### Project Structure

- `components/`: React components organized by feature or type
- `lib/`: Utility functions, hooks, and state management
- `src/`: Main application code and pages
- `public/`: Static assets
- `tests/`: Test files
- `dist/`: Build output (generated)

### State Management

This project uses Zustand for state management. Store definitions can be found in the `lib/states` directory.

### Styling

- Tailwind CSS is used for styling
- Global styles including Tailwind theming are in `src/styles/global.css`
- Additional Tailwind plugins are used for animations and typography

### Code Style and Formatting

- ESLint is used for linting (configuration in `.eslintrc.json`)
- Prettier is used for code formatting (configuration in `.prettierrc` and `prettier.config.js`)
- Run linting with `bun lint` or `yarn lint`

### Important Libraries

- React for UI components
- Vite for build tooling
- Wouter for routing
- Headless UI and Radix UI for accessible components
- Framer Motion for animations
- TipTap for rich text editing

### Worker System

The project includes a worker system for background processing. See the `lib/workers` directory and the
`tests/workers.test.ts` file for examples of how to use it.

### Debugging

- Use the browser's developer tools for client-side debugging
- For server-side or build issues, check the terminal output
- Add console logs with meaningful prefixes for easier filtering

### Performance Considerations

- Use React's memo, useMemo, and useCallback for performance optimization when needed
- Avoid unnecessary re-renders by properly structuring component hierarchies
- Use code splitting with dynamic imports for larger components or pages