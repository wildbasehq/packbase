# pages.guideline.md

Purpose
- Define how to design, name, and structure pages under apps/web/src/pages using a Next.js app-router–style folder model (even though we use Wouter for routing).
- Ensure clear URL-to-filesystem mapping, predictable nesting, and consistent use of layouts and shared UI.

Directory overview
- Top-level sections observed: c, files, id, inbox, pack, search, settings, store, stuff, terms, user
- Inside each section, routes are represented by folders and page files:
  - page.tsx for the leaf route component
  - layout.tsx for subtree layout wrappers
  - Dynamic segments use square brackets: [id], [slug], [channel]
  - Catch-all segments use bracket-dot-dot-dot: [...slug]
  - Non-route helpers/components may exist alongside but should be scoped appropriately

URL mapping model (Next.js-like)
- For a URL /x, map to src/pages/x/page.tsx
- For nested paths /a/b, map to src/pages/a/b/page.tsx
- For dynamic segments:
  - /pack/[slug] → src/pages/pack/[slug]/page.tsx
  - /pack/[slug]/[channel] → src/pages/pack/[slug]/[channel]/page.tsx
  - /user/[...slug] → src/pages/user/[...slug]/page.tsx (catch-all)
- Layouts:
  - Place layout wrappers at the segment root: src/pages/<segment>/layout.tsx applies to all children within that folder tree.
  - Example: src/pages/pack/[slug]/layout.tsx sets up sidebar navigation and theme for all children under /pack/[slug]/*.

Layouts and shared UI
- Use a layout.tsx to provide consistent wrappers, sidebars, or providers for a route subtree. Examples observed:
  - pages/store/layout.tsx wraps children with Body and centers content.
  - pages/pack/[slug]/layout.tsx fetches and prepares navigation and theme; renders a SidebarPortal and then children.
- A layout component should:
  - Accept { children }: { children: React.ReactNode }
  - Be a default export named descriptively (e.g., function StoreLayout, PackLayout)
  - Avoid hard-coding route-specific strings outside of the layout’s concern

Routing library integration
- Wouter is used for routing primitives. Use useParams in page/layout files to read dynamic params.
- For navigation links in components or pages, use the shared Link component (components/shared/link.tsx), which wraps Wouter’s Link.

Naming conventions
- Folders and segments: lowercase, kebab-case if needed. Use [param] for dynamic and [...param] for catch-all.
- Page files: page.tsx; default export is the page component (PascalCase name like FilesPage, PackHome).
- Layout files: layout.tsx; default export is the layout component (e.g., StoreLayout, PackLayout).
- Non-route helpers inside a route subtree should be in clearly named files/folders (e.g., components.tsx if it’s not a route, but prefer moving shared pieces to components/* when reusable across routes).

Import boundaries and dependencies
- Pages may import from:
  - components/* (primitives, feature UI like layout/Body, shared/Text, etc.)
  - lib/* (state stores, API clients, providers, contexts); e.g., useUIStore, useResourceStore, vg
  - types/* for domain types
- Pages should not be imported by components to avoid circular dependencies. Keep pages as top-level composition nodes.

Data and state patterns
- Page and layout components consume state via lib stores/hooks (e.g., useUIStore, useUserAccountStore) and params via Wouter’s useParams.
- Data fetching should be done via lib/api clients (e.g., vg) or custom hooks. Avoid inline fetch logic inside deeply nested presentational components.
- Loading and error UI:
  - Use shared primitives (Heading, Text, LoadingDots, icons) and Tailwind classes, following patterns in pack/[slug]/layout.tsx.

Dynamic segments and catch-all
- Prefer [param] for single dynamic segments: [id], [slug], [channel]
- Prefer [...param] for variable-depth paths when needed (e.g., user/[...slug])
- Access params with useParams<{ param: string }>() (or proper type for catch-all).

Adding a new page under an existing path
1. Determine the URL, e.g., /pack/[slug]/settings.
2. Create the folder: apps/web/src/pages/pack/[slug]/settings.
3. Add page.tsx with a default-exported PascalCase component (e.g., PackSettingsPage).
4. If the parent folder already has a layout.tsx, your page will render inside it automatically.
5. Import and compose UI using components from components/* and hooks from lib/*.

Adding a new top-level section
1. Create a new folder under src/pages, e.g., reports.
2. Add layout.tsx if the section needs consistent wrappers; otherwise omit.
3. Add page.tsx for /reports, and nested folders for deeper paths (e.g., /reports/[id]/page.tsx).
4. Use the shared Link component to navigate to and from the new section.

Handling shared layout, providers, or route-level state
- Place providers or portals that apply to a subtree in the nearest layout.tsx. Example: SidebarPortal in pack/[slug]/layout.tsx.
- Keep cross-cutting providers at a higher level (app shell) if used by most pages; otherwise scope to the subtree layout.

Organizing code shared within a route subtree
- Co-locate one-off helpers inside the route folder with clear names (e.g., components.tsx) if they aren’t reused elsewhere.
- If the helper becomes reusable, promote it to components/* or lib/* and update imports accordingly.

Do’s and Don’ts
Do:
- Use page.tsx and layout.tsx to model routes and subtrees.
- Keep file and folder names aligned with URL paths and segment semantics.
- Use components/shared primitives (Text, Heading, Body, Navbar) and icons for consistency.
- Read dynamic params with useParams; keep side effects in useEffect blocks when needed.
Don’t:
- Create pages that fetch and own state that should live in lib stores/hooks; prefer centralized state where feasible.
- Import pages from components or other pages; use shared components or lib utilities for reuse.
- Place arbitrary utilities inside pages that are broadly useful; move them to lib/*.

Examples from the codebase
- /pack/[slug]/layout.tsx
  - Reads slug via useParams
  - Builds navigation and theme via lib state and API (vg)
  - Renders SidebarPortal and {children}
- /store/layout.tsx
  - Wraps children with Body and a centered container div
- /pack/[slug]/page.tsx
  - Uses stores to hide UI for anon users, renders GuestLanding or PackFeedController

Checklist for adding a page
- Decide the URL and derive folder structure (segments and dynamics). ✓
- Create the folder(s) and add page.tsx. ✓
- Add layout.tsx at the appropriate level if a shared wrapper is needed. ✓
- Import components from components/* and hooks/utilities from lib/*. ✓
- Use Link for navigation and useParams for dynamic values. ✓
- Handle loading/error using shared primitives and Tailwind. ✓
