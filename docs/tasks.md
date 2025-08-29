# Chat System Improvement Tasks

An ordered, actionable checklist covering architectural and code-level improvements across server, client, data model, performance, security, testing, and DevOps.

## P0: Performance & UX Acceleration for DMs
Target: highly performant and quick UX reactions for Direct Messages.
- Scope
  - UI: apps\\web\\src\\pages\\c (channel pages and layout)
  - API: apps\\server\\src\\routes\\dm (channels and messages routes)
- Latency budgets (perceived by user)
  - Send: message appears instantly via optimistic insert (≤ 150 ms perceived); server reconciliation < 1 s.
  - Initial channel open: first messages visible ≤ 500 ms on broadband; skeletons should render within 100 ms.
  - Scrolling: keep main-thread work under ~8 ms/frame; avoid scroll jank > 16 ms.
- Prioritized actions (reference existing sections below)
  1) Optimistic send and failure recovery (see item 8): temp id + pending state; disable send during post; reconcile or error toast.
  2) Virtualize long message lists (see item 14) to keep DOM small and scrolling smooth.
  3) Pagination and scroll behavior (see item 9, 17, 32): before=<id> for older messages; de-dup/ordering; preserve scroll position; near-bottom auto-scroll only.
  4) Data layer performance (see item 11, 39): abort fetch on unmount/change; dedupe in-flight; SWR-like caching with TTL; ETag/304 support.
  5) Server and HTTP caching (see item 23, 17): ETag based on last message id + count; document before/after usage; consider Server-Timing headers.
  6) Observability for UX responsiveness (see item 21, 35): RUM/custom performance marks in UI; Server-Timing in API; synthetic test asserts send/receive budget.
  7) Perceived performance improvements (see item 12, 16): toasts on failure; skeleton loaders; disabled/loading states.
- Rollout & flags (see item 25)
  - Feature-flag transport choice (WS/SSE/Polling) and polling/backoff tuning for safe rollout.

1. [x] Align API response contracts across DM endpoints
   - [x] Ensure all timestamps are serialized as ISO 8601 strings (e.g., created_at) consistently for GET/POST/PATCH/DELETE and mapChannel payloads
   - [x] Standardize response shapes and field names (snake_case vs camelCase) and document in Swagger
   - [x] Add explicit 4xx/5xx error shapes with machine-readable codes and user-friendly messages
2. [x] Harden message validation and limits on the server
   - [x] Enforce max length for dm_messages.content (e.g., 4k chars) and return 413/400 accordingly
   - [x] Trim and reject empty/whitespace-only content on POST/PATCH (already partially enforced)
   - [x] Validate message_type and reply_to (if provided) with referential integrity checks
3. [x] Add server-side rate limiting for messaging
   - [x] Per-user and per-channel limits (e.g., 20/min per channel, 60/min global), return 429 on violation
   - [x] Expose Retry-After header and log limit events for abuse monitoring
4. [x] Sanitize Markdown rendering to prevent XSS
   - [x] Use rehype-sanitize (or equivalent) with a safe allowlist for Markdown in web/components/shared/markdown.tsx
   - [x] Disable/strip raw HTML by default; only allow explicit safe embeds/components
   - [x] Add link rel="noopener noreferrer" target handling and URL validation
5. [x] Decouple server utilities from route files
   - [x] Move getUserClerkByID imported by utils/channels/mapChannel.ts into a dedicated server/utils/auth or clerk service module
   - [x] Add caching for Clerk avatar lookups; avoid N+1 in mapChannel (batch or memoize)
6. [ ] Implement unread counts and read receipts
   - [ ] Update dm_participants.last_read_at when a channel is viewed
   - [ ] Compute unread counts per channel on the server for sidebar listing
   - [ ] Surface unread badge in apps/web sidebar and mark read on view/focus
7. [ ] Introduce real-time message delivery
   - [ ] Add WebSocket or Server-Sent Events channel for DM message created/edited/deleted events
   - [ ] Broadcast to channel participants only; authenticate and authorize subscriptions
   - [ ] Fall back to incremental polling using after=<last_id|timestamp> with ETag/If-None-Match support
   - [ ] Remove or increase 1s polling once real-time is in place
8. [x] Add client-side optimistic UI for sending messages
   - [x] Insert a temporary message with a client-generated id; show pending state and disable send button while posting
   - [x] Reconcile success by replacing the temp message; handle failure with error toast and retry affordance
9. [x] Implement infinite scroll and pagination on the client
   - [x] Use GET /dm/channels/:id/messages?before=<id> to load older messages on scroll-up
   - [x] De-duplicate messages and maintain stable ordering when merging pages
   - [x] Auto-scroll to bottom on first load and when user is near bottom
10. [ ] Expose message editing and deletion in the UI
    - [ ] Add message action menu (edit/delete) visible for author-only
    - [ ] Inline edit form with escape-to-cancel and optimistic update for PATCH
    - [ ] Soft delete UI to show “deleted” placeholder (already handled by content=null in renderer)
11. [ ] Improve ContentFrame data layer robustness
    - [ ] Ensure fetch abort on unmount or dependency change; dedupe in-flight requests by signature
    - [ ] Provide SWR-like caching semantics (stale-while-revalidate) with configurable TTL
    - [ ] Standardize error propagation; add per-frame onError callbacks and global error boundary
    - [ ] Support ETag/Last-Modified and 304 handling to reduce payloads
12. [ ] Strengthen error handling and user feedback in the client
    - [ ] Replace silent try/catch with surfaced toasts/snackbars for failures in message send and DM creation
    - [ ] Show disabled/loading states during network operations and retry buttons
    - [ ] Add empty-state designs (no messages, failed to load, etc.)
13. [ ] Improve accessibility (a11y)
    - [ ] Add aria-labels/tooltips to markdown toolbar buttons and action icons
    - [ ] Use aria-live regions for new message announcements for screen readers
    - [ ] Ensure focus management when opening edit dialogs/menus
14. [ ] Virtualize long message lists
    - [ ] Integrate react-virtuoso/react-window for message list virtualization
    - [ ] Preserve grouping by author/day while virtualizing
15. [ ] Message grouping resilience and performance
    - [ ] Memoize group computation and only recompute for changed ranges
    - [ ] Maintain grouping consistency when merging real-time or paginated messages
16. [ ] Sidebar DM list enhancements
    - [ ] Show unread counts and last message timestamp
    - [ ] Handle long names with tooltips and truncation consistently
    - [ ] Add skeleton loaders for list and details for perceived performance
17. [ ] API pagination and filtering improvements
    - [ ] Support after=<id> for forward pagination and live updates; document both before/after usage
    - [ ] Add include_deleted/include_edited flags for admin/debug
18. [ ] Audit and add missing indexes/constraints
    - [ ] Consider foreign key for dm_channels.last_message_id -> dm_messages.id or redundant materialized fields + index
    - [ ] Ensure composite index coverage for frequent queries (channel_id, created_at) — already present; validate query plans
    - [ ] Add length constraints at DB level where appropriate (CHECK or use Prisma @db.VarChar(x) if feasible)
19. [ ] Presence and typing indicators (optional but valuable)
    - [ ] Add typing events via WS, with throttling/debouncing and expiry
    - [ ] Reuse or extend chat_presence model for DMs; server emits join/leave/typing
20. [ ] Security hardening
    - [ ] Verify authorization on all DM endpoints (list, get, messages, edit, delete); add tests for access control
    - [ ] Add audit logging for moderation-sensitive actions (edit/delete)
    - [ ] Validate and sanitize usernames in NewDM form; avoid information leakage (user existence probing)
21. [ ] Observability and metrics
    - [ ] Structured logging in DM routes (message creation latency, errors, 4xx/5xx)
    - [ ] Metrics: messages per minute, send latency, WS connection counts, fanout latency
    - [ ] Add tracing hooks (request ids, span ids) for critical flows
22. [ ] Test coverage (Bun test + integration)
    - [ ] Unit tests for mapChannel, content sanitization, and ContentFrame helpers
    - [ ] Integration tests for DM endpoints (authz, pagination, edit/delete, rate limiting)
    - [ ] Contract tests to ensure date serialization and response shapes
    - [ ] UI tests for message send/edit/delete, infinite scroll, unread badges
23. [ ] Performance improvements and caching
    - [ ] Cache recipient profile and avatar (short TTL) in server layer to prevent repeated Clerk calls
    - [ ] Implement HTTP caching for GET messages (ETag based on last message id + count)
    - [ ] Batch channel lookups (Bulk loader) similar to BulkPostLoader pattern
24. [ ] Developer experience and documentation
    - [ ] Swagger docs for all DM endpoints with detailed schemas and examples
    - [ ] README section on chat architecture (real-time, pagination, contracts)
    - [ ] API SDK types updated (build:voyagesdktypes) to include DM routes and event payloads
25. [ ] Feature flags and configuration
    - [ ] Gate real-time transport choice (WS vs SSE vs polling) via env flags
    - [ ] Configure polling intervals/backoff strategy from env for gradual rollout
26. [ ] Error states for mapChannel
    - [ ] Handle missing Clerk user gracefully; fallback avatar and name from profiles
    - [ ] Avoid blocking call chains by running Clerk fetch and Prisma in parallel; add timeouts and fallbacks
27. [ ] Secure attachments groundwork (future)
    - [ ] Define attachment model and signed upload flow (Supabase S3 or similar), virus scanning hooks
    - [ ] Restrict file types and sizes; sanitize image rendering
28. [ ] Client configuration consistency
    - [ ] Centralize VITE_YAPOCK_URL usage and provide dev/prod overrides and health check
    - [ ] Add retry/backoff and network offline handling for fetches
29. [ ] Mark-as-read lifecycle
    - [ ] Mark read on channel focus/visibilitychange with debounce
    - [ ] Update sidebar counts instantly (optimistic) and reconcile from server
30. [ ] Typing markdown shortcuts and toolbar UX
    - [ ] Improve markdown insertion logic to handle multi-line selections and list continuations
    - [ ] Add keyboard hints and accessible help for markdown shortcuts
31. [ ] Consistent deleted and edited message rendering
    - [ ] Display “edited” timestamp indicator; tooltip with time
    - [ ] Keep deleted placeholders minimal and consistent across first and subsequent messages in a group
32. [ ] Robust scroll behavior
    - [ ] Preserve scroll position when loading older messages (anchor-based approach)
    - [ ] Auto-scroll only when user is near bottom to avoid disrupting reading
33. [ ] Data migrations (as needed)
    - [ ] Add/alter indexes, constraints, and new columns (e.g., message length, last_read_at semantics) with migrations
    - [ ] Backfill last_read_at and compute initial unread counts
34. [ ] CI/CD and quality gates
    - [ ] Add CI to run Bun tests, type checks, linting, and Swagger validation
    - [ ] Add pre-commit hooks for formatting and type checking in apps/web and apps/server
35. [ ] Self-diagnostic route coverage
    - [ ] Extend selfTest to hit DM endpoints with auth and validate contracts
    - [ ] Add synthetic monitor that opens a DM channel, sends a message, and asserts delivery time budget
36. [ ] Internationalization and time formatting
    - [ ] Centralize time formatting (Today/Yesterday) with i18n support and consistent timezone handling
    - [ ] Store and compare timestamps in UTC; format on client locale-safely
37. [ ] Consistency in nullability and types
    - [ ] Return null vs omit fields consistently (e.g., deleted content) and document
    - [ ] Ensure TypeScript types on client reflect server contracts (generated SDK)
38. [ ] Prevent user enumeration in NewDM form
    - [ ] Obscure difference between unknown vs unauthorized user responses; generic error message
    - [ ] Rate-limit username lookups and add captcha/challenge after repeated failures (optional)
39. [ ] Resilient networking in ContentFrame
    - [ ] Add exponential backoff and jitter on repeated failures
    - [ ] Pause auto-refresh when tab is hidden; resume on focus
40. [ ] Message replies and threads (future)
    - [ ] Expose reply relationships in GET (include minimal parent snippet)
    - [ ] Client UI for replying, with context preview

