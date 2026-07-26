# PR Description: Add 'Terms updated' banner for GrantFox FWC26 campaign

## Summary
Resolves #493. This PR introduces a new `TermsBanner` component to notify users of Terms of Service updates for the GrantFox FWC26 (Stellar Wave) campaign. It provides both inline acceptance, session-level dismissal, and a detailed review modal.

## What changed
- Created `src/components/TermsBanner.tsx` which renders a persistent page-level banner with actions to review or accept the updated terms. It also renders a modal overlay for reviewing detailed terms with full keyboard/a11y features.
- Created `src/components/TermsBanner.css` containing corresponding styles that adhere to the system's token-based CSS variable architecture, including dark-mode, high-contrast override, and media query support for reduced motion and responsive breakpoints.
- Imported and rendered `<TermsBanner />` in `src/App.tsx` directly above the routing view inside the `<main>` tag.
- Added comprehensive unit tests in `src/components/TermsBanner.test.tsx` checking for initial render status, session storage dismissal, localStorage acceptance version checks, review modal toggles, and keyboard behavior.
- Documented `TermsBanner` in `docs/DESIGN_SYSTEM.md`.

## Why
For the GrantFox FWC26 campaign, it's essential that users are notified of and accept the updated Terms of Service. This banner provides a non-intrusive yet prominent prompt with a complete, accessible terms review modal.

## Testing / Accessibility
- Unit tests written under `src/components/TermsBanner.test.tsx` to verify core states.
- Verified WCAG 2.1 AA compliance:
  - Text colors have a contrast ratio of at least 4.5:1.
  - Interactive controls have high contrast borders and custom focus indicators (`.focus-ring` using outline-offset).
  - High-contrast override support via `[data-contrast="high"]` styling rules.
  - Touch targets for all interactive actions (Accept, Review Terms, Cancel, Close, Dismiss) are styled with at least a `44px` size.
  - The modal behaves as an accessible dialog (`role="dialog"` and `aria-modal="true"` with key listener for `Escape`).
  - Screen readers are notified appropriately via semantic roles.
  - Motion effects are suppressed when `prefers-reduced-motion` is active.

## Accessibility Check Checklist
- [x] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- [x] Focus indicators are clearly visible (2px outline, 3px offset)
- [x] Contrast ratios meet WCAG AA (4.5:1 text, 3:1 large text/icons)
- [x] Touch targets are at least 44×44 px (Accept, Review, Cancel, Close buttons)
- [x] Semantic HTML and ARIA roles/labels are used
- [x] `prefers-reduced-motion` is respected
