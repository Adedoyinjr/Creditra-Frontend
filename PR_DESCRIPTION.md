# feat: scroll restoration on route change

## Summary

Adds `useScrollRestoration` — a hook that saves and restores the vertical scroll position (`window.scrollY`) when navigating between routes in the SPA. The hook is mounted once in `App.tsx` inside `<BrowserRouter>` and requires no per-page configuration.

## Changes

### New files

- **`src/hooks/useScrollRestoration.ts`** — The hook implementation:
  - Saves the previous route's scroll position to a `sessionStorage`-backed map on every navigation.
  - Restores the current route's saved position (if any) via `window.scrollTo({ top, behavior: "instant" })` on the next animation frame.
  - Tracks user scroll while on a page (rAF-throttled) so the saved position stays current.
  - Excludes the URL hash from the route key so native hash-anchor scrolling is unaffected.
  - Includes each `pathname + search` combination as a separate entry, so filtered/paginated views (`/transactions?page=2`) get their own scroll positions.
  - Supports an `enabled` parameter (defaults to `true`) to disable the feature entirely.

- **`src/hooks/__tests__/useScrollRestoration.test.tsx`** — 9 focused tests covering:
  - No-op on initial mount when no saved position exists
  - No-op when `enabled=false` even with pre-populated storage
  - Saving previous route's scroll on navigation
  - Restoring saved scroll when navigating back
  - Threshold guard (`MIN_SAVED_Y = 4px`)
  - Updating saved position while scrolling on the same route
  - Cleaning up event listeners on unmount
  - Saving current scroll position on unmount
  - Saving scroll position for routes with search params

### Modified files

- **`src/App.tsx`** — Imports and calls `useScrollRestoration()` at the top of the `App` component.
- **`src/test/__mocks__/react-router-dom.tsx`** — Exports `__setMockLocation(pathname, search)` test helper so tests can simulate client-side navigation.
- **`docs/ARCHITECTURE.md`** — Lists `useScrollRestoration` in the hooks folder map.

## How it works

1. On mount (and every location change), the hook saves the *previous* route's `scrollY` into a `sessionStorage`-backed `Map<string, number>`.
2. It then checks whether the *current* route has a saved scroll position. If yes, it calls `window.scrollTo(0, savedY)` on the next animation frame so the DOM has had a chance to lay out.
3. While the user is on a page, scroll events are captured (rAF-throttled) so the saved position stays up to date.
4. `sessionStorage` is written whenever the map changes, so back/forward navigation works even after a full page refresh.

## Edge cases handled

- **Hash-only changes** (`#section1` → `#section2` on the same path): Not treated as a route change; native hash-scroll takes over.
- **Same-path navigations via search** (`?page=1` → `?page=2`): Each search combination gets its own entry.
- **Reduced motion**: Scroll restoration is always instant (`behavior: "instant"`), so `prefers-reduced-motion` is irrelevant.
- **Disabled mode**: When `enabled=false` the cache is cleared and no scroll positions are recorded or restored.

## Test results

```
 ✓ src/hooks/__tests__/useScrollRestoration.test.tsx (9 tests)
 ✓ src/hooks/__tests__/useScrollCollapse.test.ts (4 tests)
 ✓ src/hooks/__tests__/useDebounceValue.test.ts (3 tests)
 ✓ src/hooks/__tests__/useFocusTrap.test.tsx (5 tests)

 Test Files  4 passed (4)
      Tests  21 passed (21)
```

No regressions in existing tests.