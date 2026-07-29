# TransactionHistory — First-Paint Loading Skeleton

Themed shimmer placeholder shown on the first paint of the `/transactions` route while
transaction data is being resolved.

---

## Why this exists

Before this change, navigating to `/transactions` caused a brief flash of unstyled content
(FOUC): the full filter bar, stats cards, and table were committed to the DOM in one shot
after data became available, producing a visual pop. The skeleton replaces that pop with a
stable, themed layout that occupies the same space as the eventual content — keeping
Cumulative Layout Shift (CLS) at zero.

---

## Components involved

| File | Role |
|---|---|
| `src/components/TransactionHistorySkeleton.tsx` | Page-level skeleton wrapper. Renders stats cards, filter bar, and table placeholder using the `Skeleton` primitive. |
| `src/components/TransactionHistorySkeleton.css` | Layout styles scoped to the skeleton. All colours consumed from design tokens (`--surface`, `--border`, `--bg`, `--radius-*`). |
| `src/components/Skeleton.tsx` | Existing shimmer primitive reused as-is. Shimmer animation defined in `Skeleton.css`. |
| `src/pages/TransactionHistory.tsx` | Adds `isLoading` state; renders `<TransactionHistorySkeleton />` before any other early-return guard. |

---

## How the loading state works

```ts
// TransactionHistory.tsx (simplified)
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  // Clears on the first committed render, simulating async data resolution.
  // Replace with the real fetch-completion signal when the API is wired up.
  const id = setTimeout(() => setIsLoading(false), 0);
  return () => clearTimeout(id);
}, []);

if (isLoading) return <TransactionHistorySkeleton />;
```

`setTimeout(0)` yields control back to the browser for one frame so the skeleton is
painted before the heavy filter/table tree is committed. When real data fetching is added,
replace `setTimeout` with the async resolution point (e.g. set `isLoading = false` in the
`.then()` / `await` of the fetch call).

---

## TransactionHistorySkeleton API

```tsx
<TransactionHistorySkeleton rows={8} />
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `rows` | `number` | `8` | Number of shimmer transaction rows to render. Match this to the `itemsPerPage` in `TransactionHistory`. |

---

## Accessibility

- The wrapper element has `role="status"` and `aria-busy="true"` so assistive technology
  announces that content is loading (WCAG 2.1 AA — SC 4.1.3 Status Messages).
- `aria-label="Loading transaction history"` provides a human-readable region name.
- Stats cards, filter bar, and table placeholder carry `aria-hidden="true"` so screen
  readers do not narrate meaningless placeholder shapes.
- The shimmer sweep animation is suppressed under `@media (prefers-reduced-motion: reduce)`
  and the `[data-motion="reduced"]` class hook (both handled in `Skeleton.css`).

---

## Design-token contract

The skeleton uses no hard-coded hex values. Every colour is a CSS custom property:

| Property | Token |
|---|---|
| Card / container backgrounds | `var(--surface)` |
| Page background (thead) | `var(--bg)` |
| Borders | `var(--border)` |
| Shimmer base colour | `var(--border)` (via `Skeleton.css`) |
| Corner radii | `var(--radius-lg)`, `var(--radius-md)` |

This means the skeleton inherits the active theme automatically, including
`[data-contrast="high"]` high-contrast mode.

---

## Responsive behaviour

| Breakpoint | Change |
|---|---|
| `≤ 960 px` | Stats grid collapses to 2 columns |
| `≤ 640 px` | Stats grid stays at 2 columns; hash-column skeleton hidden (mirrors real table) |

---

## Tests

| File | What it covers |
|---|---|
| `src/components/TransactionHistorySkeleton.test.tsx` | Unit tests: ARIA attributes, default/custom row count, DOM structure, shimmer elements, `aria-hidden` on placeholders |
| `src/pages/TransactionHistory.test.tsx` (Loading skeleton `describe` block) | Integration tests: skeleton visible on first paint, table absent while loading, transition to loaded state after timer fires |

Existing `TransactionHistory` tests were updated: the `renderTransactionHistory` helper
now calls `act(() => vi.runAllTimers())` after mount to flush the `isLoading` timer,
ensuring all pre-existing assertions continue to target the fully-loaded UI.

---

## Migrating to real async data

When the backend API is wired up:

1. Remove the `setTimeout` in the `useEffect`.
2. Set `isLoading = false` after your `await fetch(...)` / `useQuery` resolves.
3. Propagate a loading prop down from the data hook if you use a data-fetching library.

The skeleton component itself requires no changes — it is entirely presentation.
