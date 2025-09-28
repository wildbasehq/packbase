<!-- 56df53d0-d989-4348-b1a3-da4dcb575629 0361ae67-bc6c-4331-a7c6-9337f0e2e89c -->
c## Rewrite Feed Fetching (per-page queries + PagedContainer)

- **Goal**: Replace the reducer/refetch flow with page-keyed React Query queries driven by the URL `?page=` and `PagedContainer`. Keep numbered pagination and page size 10. Remove the “new threads available” toast and the auto-refresh interval.

### Why the current approach lags/off-by-one

- `feed.tsx` uses a constant query id for different pages, collapsing cache entries and causing stale/off-by-one state:
- `useContentFrame` uses `options.id` as the whole query key, so pages cannot be distinguished:
- A large imperative `fetchPosts` mixes refetching, state, cache, and toasts:
const fetchPosts = async (source = 'manual', checkForNew = false, forcedPage = -1) => {
console.log('fetchPosts', source, checkForNew, forcedPage)

if (isLoading) {
console.log('isLoading')
return
}

const page = forcedPage !== -1 ? forcedPage : checkForNew ? 1 : state.currentPage
if (forcedPage !== -1) {
dispatch({ type: 'SET_PAGE', page: forcedPage })
}

### Target design

- **Single source of truth**: Read/write the current page from URL `?page=` via `wouter`.
- **One query per page**: `useQuery({ queryKey: ['feed'|'search', baseId, page, optionalQuery], keepPreviousData: true })` for the active page.
- **Prefetch for pagination**: `onNeedsContent(page)` prefetches `requestedPage` with the same fetcher and returns `PagedContentLoadStatus`.
- **Normalization**: Small fetchers map API responses to `{ posts: FeedPostData[], hasMore: boolean }` (page size fixed at 10).
- **Remove complexity**: Drop the reducer, interval refresh, and the new-threads toast. Derive `posts`, `hasMore`, `isLoading` from the active query only.
- **Reset on target change**: When `packID`/`channelID` changes, set URL to `?page=1`.
- **Compose refresh**: After compose completes, invalidate base query keys to refresh the current page.

### Implementation outline (concise)

- Create two minimal fetchers:
  - `fetchFeedPage({ token, packID, page }) -> { posts, hasMore }`
  - `fetchSearchPage({ token, channelID, q, page }) -> { posts, hasMore }`
- In `feed.tsx`:
  - Read `page` from URL; compute `isSearch` and `queryKey`.
  - Use `useQuery` with `keepPreviousData: true` and the appropriate fetcher.
  - Provide `onLoadMore` to `FeedList` that prefetches `requestedPage` and returns `PagedContentLoadStatus`.
  - Remove reducer + `fetchPosts`, the interval, and toast logic.
  - If `packID`/`channelID` changes, set `?page=1`.
  - Keep `FloatingCompose`; on success, invalidate the base query key.
- In `FeedList`, keep `PagedContainer`: pass `posts`, `hasMore`, and `onLoadMore`; do not slice/merge posts across pages.

### To-dos

- [ ] Add normalized fetchers for feed/search pages (10/page)
- [ ] Refactor `apps/web/src/components/feed/feed.tsx` to page-keyed `useQuery` + prefetch in `onNeedsContent`
- [ ] Remove reducer, refresh interval, and new-threads toast from `feed.tsx`
- [ ] Reset URL page to 1 on pack/channel change
- [ ] Invalidate current page query after compose to refresh UI

### To-dos

- [ ] Add normalized fetchers for feed/search pages (10/page)
- [ ] Refactor `apps/web/src/components/feed/feed.tsx` to page-keyed `useQuery` + prefetch in `onNeedsContent`
- [ ] Remove reducer, refresh interval, and new-threads toast from `feed.tsx`
- [ ] Reset URL page to 1 on pack/channel change
- [ ] Invalidate current page query after compose to refresh UI