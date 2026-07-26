# Pull Request: Color-blind safe patterns on TransactionHistory status chips

**Closes #307**

## Summary

Adds geometric CSS patterns to `TransactionStatus` badges in the TransactionHistory table so that the three statuses (Completed / Pending / Failed) are distinguishable without relying on colour alone. This addresses WCAG 2.1 Success Criterion 1.4.1 — Use of Color.

## Changes

### 1. `src/styles/patterns.css` — New pattern classes

Three pure-CSS pattern classes for transaction statuses, leveraging `background-image` with semi-transparent gradients that overlay the existing coloured badge:

| Status    | Pattern        | Visual                    |
|-----------|----------------|---------------------------|
| Completed | Polka dots     | Radial gradient, 12px grid |
| Pending   | Diagonal hatch | 45° repeating stripes     |
| Failed    | Crosshatch     | Dual 45° crossing stripes  |

Each class includes a `@media (forced-colors: active)` override using `CanvasText` to ensure patterns remain visible in Windows High Contrast Mode (using `forced-color-adjust: none`).

### 2. `src/index.css` — Global import

Added `@import "./styles/patterns.css"` to make pattern classes available application-wide.

### 3. `src/pages/TransactionHistory.tsx` — Pattern class application

- Added `STATUS_PATTERNS` constant mapping `TransactionStatus` → CSS class name
- Updated the `<span className="tx-status-badge">` in `TransactionRow` to also include the pattern class: `className={\`tx-status-badge ${STATUS_PATTERNS[tx.status]}\`}`
- Inline `style` props (background/color) are preserved — the pattern overlays the existing colour tint

### 4. `src/pages/TransactionHistory.test.tsx` — 5 new tests

| Test | Description |
|------|-------------|
| Completed pattern | Verifies `.tx-status-pattern--completed` is applied to all Completed badges |
| Pending pattern (page 2) | Verifies `.tx-status-pattern--pending` appears on the Pending transaction (page 2 due to pagination) |
| Failed pattern | Verifies zero `.tx-status-pattern--failed` badges in unfiltered view (no Failed tx in mock data) |
| One pattern per badge | Every `.tx-status-badge` has exactly one matching pattern class |
| Base class preserved | All badges retain `.tx-status-badge` alongside their pattern class |

## Accessibility (WCAG 2.1 AA)

- **SC 1.4.1 (Use of Color):** Geometric patterns provide a secondary visual cue alongside colour
- **SC 1.4.1 (forced-colors):** Pattern classes include `forced-colors: active` overrides with `forced-color-adjust: none`
- **Dark-mode compatibility:** Patterns use semi-transparent `rgba()` values that merge with the existing badge background colour
- **Design-token consistency:** All pattern colours reference the same token values used in `STATUS_COLORS`

## Screenshots

*Visual representation of the patterns (description):*
- **Completed** (green): ![#3fb950](https://via.placeholder.com/12/3fb950/000000?text=+) — Fine polka dots
- **Pending** (amber): ![#d29922](https://via.placeholder.com/12/d29922/000000?text=+) — Diagonal stripes
- **Failed** (red): ![#f85149](https://via.placeholder.com/12/f85149/000000?text=+) — Crosshatch

## Test Results

```
 ✓  61 passed (61)
```

All 61 tests pass — 56 existing tests remain unchanged, 5 new tests verify pattern functionality.

## Related Issues

- Closes #307
</｜DSML｜parameter>
</｜DSML｜parameter>
</｜DSML｜create_file>
