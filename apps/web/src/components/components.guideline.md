# components.guideline.md

Purpose
- This document defines how to design, name, structure, and extend reusable UI components in apps/web/src/components.
- It codifies the existing patterns in this repo and aligns them with a shadcn/ui-style organization using categories.

Directory overview
- apps/web/src/components uses category folders. Examples observed:
  - charm, chat, feed, home, icons, layout, modal, novel, search, seen-once, shared, ui
- A top-level barrel file re-exports main categories: components/index.ts re-exports from charm, feed, home, icons, layout, modal, novel, shared.

Category model (shadcn-style)
- Goal: predictable, browsable component library organized by category.
- Category folder naming: all-lowercase, kebab-case if needed, singular where it reads like a system (shared, layout, modal) or plural where the domain already dictates (icons).
- Inside each category:
  - One primary component per concept, file name matches the concept in kebab-case: e.g., shared/button.tsx, layout/navbar.tsx, shared/text.tsx
  - Optional subcomponents or feature slices live alongside the primary file with descriptive names: e.g., shared/paged-modal/*, shared/input/*, layout/resource/*, layout/user-dropdown/*
  - Optional variants/helpers use suffixes: -item.tsx, -group.tsx, -trigger.tsx, -icon.tsx, -context.tsx, -styles.css (rare; Tailwind preferred)
  - Co-locate lightweight types or contexts: types.ts, context.tsx when specific to that component group
  - Avoid deep nests beyond 2 levels; prefer category/subgroup/* over category/subgroup/deep/*

How to choose a category
- Reuse an existing category when the new component fits an existing domain:
  - Visual primitives and UI building blocks: shared, ui
  - App shells and structural UI: layout
  - Feature-specific UI that composes primitives: feed, chat, search, home
  - Iconography: icons (with further subfolders like icons/plump)
- Create a new category only if:
  - Multiple components share a domain and don’t logically fit an existing category, and
  - You expect more than one component or a complex component tree, and
  - The new category name is short, generic, and reusable across pages.

Naming conventions
- Folders: kebab-case, all lowercase. Examples: user-dropdown, paged-modal, plump
- Files: kebab-case, all lowercase. Examples: button.tsx, navbar.tsx, text-ticker.tsx, server-config-render.tsx
- Components: PascalCase for component identifiers in code. Prefer named exports for primitives and small sets; default export is acceptable for page-local or “controller-like” components.
  - Examples observed:
    - Named: export function NavbarItem, Navbar, NavbarSection in layout/navbar.tsx
    - Named: export function Text, Heading in shared/text.tsx
    - Default: export default function TextTicker in shared/text-ticker.tsx (acceptable)
- Props interfaces: PascalCase with Props suffix, e.g., ButtonProps, NavbarItemProps. If using inline typing with React.ComponentPropsWithoutRef<'button'>, keep it concise; export explicit props types if reused.
- Hooks: camelCase with use prefix: useContentFrame, useUIStore, useResourceStore, useNormalizedMessages.
- Contexts: Named as XyzContext; provider components PascalCase with Provider suffix where applicable.

Exports and barrels
- Prefer local file exports and import via absolute aliases ("@/components/...", "@/lib", etc.).
- For categories with many entries, optionally provide an index.ts that re-exports public components for that category. Keep export surface small and intentional.
- The root components/index.ts re-exports select categories for convenience. Add your category only if it’s broadly reusable.

Styling and theming
- Tailwind CSS is the primary styling system.
- Use the cn helper to merge className values and conditional classes. Import it from "@/lib" (preferred) or "@/lib/utils/cn" depending on current exports.
- Accept className on all visual components and merge via cn to enable composition.
- Prefer variant props over ad-hoc booleans when there are stylistic modes (e.g., intent, size). See shared/button.tsx and layout/navbar.tsx for patterns.
- Dark mode and state classes are expressed with Tailwind and data- attributes (e.g., data-hover, data-active). Preserve these conventions when extending.

Accessibility
- Favor Headless UI primitives (@headlessui/react) where interactivity is required. See shared/button.tsx and layout/navbar.tsx for usage.
- For interactive elements, ensure proper roles, focus states, and keyboard support. Keep aria- labels where icons are used without text.

File contents per component group
- Typical files inside a component folder or subgroup:
  - main.tsx or button.tsx, navbar.tsx, text.tsx: primary component(s)
  - subcomponents: e.g., item.tsx, section.tsx, label.tsx, group.tsx
  - context.tsx: React context specific to this group
  - types.ts: shared types for the group
  - index.ts: optional barrel for curated exports
  - README.md: optional quick usage notes for complex groups (e.g., shared/paged-modal has README)

Composition and reuse patterns
- Compose primitives from shared and ui inside feature components like feed/*, chat/*, and layout/*.
- Provide layout wrappers in layout/* and use them across pages (e.g., Body, Navbar, Sidebar components).
- Keep data-fetching and app state in hooks/stores under "@/lib"; components should consume via hooks rather than fetching directly.
- Loading/error states: prefer lightweight placeholders and Text/Heading primitives from shared/text.tsx, and skeleton-style Tailwind if appropriate.

Imports and dependency boundaries
- Components may import:
  - Other components from components/*
  - Hooks, stores, utilities from lib/*
  - Types from types/*
- Components must not import from pages/* to avoid circular dependencies.
- Feature components (e.g., feed, chat) can import primitives from shared/ui and structural components from layout.

Adding a new component to an existing category
1. Identify the category that best matches your component’s role (e.g., shared for a primitive, layout for structural UI).
2. Create a file in apps/web/src/components/<category>/<name>.tsx using kebab-case for the filename.
3. Implement a PascalCase component that accepts at least:
   - className?: string
   - children?: React.ReactNode (if it renders content)
   - variant/size props when stylistic changes are expected
4. Export as a named export unless there is a strong reason to default export.
5. If the component has subparts, co-locate them: <name>-item.tsx, <name>-section.tsx, etc.; optionally add index.ts to re-export.
6. Add usage examples or a short README.md if the API is nontrivial.

Creating a new category
1. Ensure it is truly necessary; prefer fitting into shared, ui, or layout.
2. Add a folder at apps/web/src/components/<category> (kebab/lowercase).
3. Add initial components and, if helpful, an index.ts that re-exports the public surface.
4. Optionally add a README.md describing the category’s purpose.
5. Consider adding the category to components/index.ts only if it’s broadly reused by pages.

Code examples (anonymized, pattern-based)
- Named primitive with className and cn:
  - export function NavbarSection(props) { return <div {...props} className={cn(props.className, 'flex items-center gap-3')} /> }
- Default subcomponent with animation or one-off behavior is acceptable, as with shared/text-ticker.tsx.
- Import patterns in pages use "@/components/...": keep your exports compatible with absolute imports.

Anti-patterns to avoid
- Deep component nesting beyond two levels inside a category.
- Importing from pages/* in a component.
- Inconsistent casing (e.g., Title.tsx in lowercase folders). Stick to PascalCase identifiers and kebab-case filenames.
- Skipping className passthrough; always accept and merge className for visual components.
- Re-implementing shared primitives (e.g., another Button or Text) instead of extending existing ones.

Checklist for adding a component
- Choose category (shared/ui/layout/feature domain). ✓
- Create <name>.tsx with PascalCase component, className prop, and variant props when applicable. ✓
- Export as named (preferred) or default with rationale. ✓
- Co-locate subcomponents/helpers and optional index.ts barrel. ✓
- Use Tailwind; merge classes via cn; keep accessibility in mind. ✓
- Add to components/index.ts only if broadly reusable. ✓
