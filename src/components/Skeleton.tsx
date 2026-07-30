import React from 'react';
import './Skeleton.css';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Width passed through as a CSS dimension (string or px number). */
  width?: string | number;
  /** Height passed through as a CSS dimension (string or px number). */
  height?: string | number;
  /**
   * Shape of the skeleton. Defaults to 'rectangular'.
   *
   * - `rectangular` — uses `--skeleton-radius` (matches cards, inputs, buttons).
   * - `circular`    — border-radius: 50%, for avatar / icon placeholders.
   * - `rounded`     — semantic alias for rectangular; explicit intent for
   *                   inline text-row placeholders.
   * - `pill`        — uses `--skeleton-radius-pill` (9999px) for badge / chip
   *                   placeholders (StatusBadge, network-badge, wallet chip).
   * - `inherit`     — `border-radius: inherit`, for a shimmer that fills a
   *                   real page element and must adopt *that* element's
   *                   corner radius (see below).
   *
   * Shape parity principle (FWC26 — issue #690): each variant resolves to the
   * same radius token used by the final rendered component so first-paint
   * skeleton geometry matches loaded-state geometry exactly (CLS = 0).
   *
   * `inherit` (FWC26 — issue #854) takes that principle one step further: when
   * a page skeleton reuses the loaded component's own class for a placeholder
   * box, the radius is already correct on the parent, and restating it here
   * would be a second source of truth that can drift.  Place the Skeleton as
   * an absolutely-positioned child filling that parent and the radius follows
   * automatically — including any responsive or theme override.
   */
  shape?: 'rectangular' | 'circular' | 'rounded' | 'pill' | 'inherit';
  /**
   * Visual variant.
   *
   * - `default`  — uses `var(--skeleton-bg)` → `var(--surface-raised, #1c2230)`.
   *                Best for placeholders on card surfaces.
   * - `subtle`   — reduces opacity to 60% so the placeholder blends more
   *                softly against lighter-toned sections.
   *
   * GrantFox FWC26 (Stellar Wave): the `default` variant replaces the
   * previous `var(--border)` background with a properly-themed surface token
   * so skeletons adapt to [data-contrast="high"] and dark-mode overrides.
   */
  variant?: 'default' | 'subtle';
  /**
   * Element to render. Defaults to `'div'`.
   *
   * Use `'span'` when the placeholder sits inside phrasing content — a `<p>`,
   * `<h1>`, `<label>`, or table cell holding inline text — where a `<div>`
   * would be invalid HTML. The two render identically because `.skeleton`
   * declares its own box; only the tag name differs.
   */
  as?: 'div' | 'span';
};

/**
 * Shimmer placeholder used during loading states.
 *
 * ## Usage
 * ```tsx
 * <Skeleton width="100%" height={48} aria-label="Loading credit lines" />
 * ```
 *
 * ## Theming (FWC26)
 * The background is driven by `var(--skeleton-bg)`, which defaults to
 * `var(--surface-raised)`.  Override the token at any scope:
 * ```css
 * .my-section { --skeleton-bg: var(--surface-overlay); }
 * ```
 *
 * ## Dimensions
 * Pass `width` / `height` to match the eventual content size and prevent
 * Cumulative Layout Shift (CLS) while the data fetch is in flight.
 *
 * ## Shape parity (FWC26 — issue #690)
 * Use `shape="rounded"` (the default, driven by `--skeleton-radius`) for
 * most block placeholders so the border-radius matches the final card/input
 * element and first-paint does not jump when real content arrives.
 * Use `shape="circular"` only for avatar / icon-sized placeholders (≤ 48 px).
 *
 * ## Composed page skeletons
 * Higher-level first-paint layouts compose this primitive — e.g.
 * `RepaymentVisualizerSkeleton` in `RepaymentVisualizer.tsx` (issue #609)
 * mirrors the chart card height (220px) and header/legend rows, and
 * `TransactionHistorySkeleton.tsx` (issue #854) reuses the loaded page's own
 * class names and drives every shimmer bar off `shape="inherit"` plus the
 * real element's typography, so no dimension is restated in two places.
 *
 * ## Motion
 * The shimmer animation is suppressed under both
 * `@media (prefers-reduced-motion: reduce)` and `[data-motion="reduced"]`
 * (the runtime JS toggle managed by ReducedMotionContext).
 * See the loading-state policy in `docs/ARCHITECTURE.md` §5.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height, shape = 'rectangular', variant = 'default', as: Tag = 'div', style, className, 'aria-hidden': ariaHidden = true, ...rest }) => (
  <Tag
    className={[
      'skeleton',
      `skeleton--${shape}`,
      variant === 'subtle' ? 'skeleton--subtle' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
    style={{ width, height, ...style }}
    aria-hidden={ariaHidden}
    {...rest}
  />
);

