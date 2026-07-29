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
   * - `rectangular` — uses `--skeleton-radius` (--radius-md, 8px); matches
   *                   inputs, buttons, and small card surfaces.
   * - `card`        — uses `--skeleton-radius-card` (--radius-lg, 12px);
   *                   matches the outer radius of page-level card containers
   *                   such as the CollateralSwap card (issue #834).
   * - `circular`    — border-radius: 50%, for avatar / icon placeholders.
   * - `rounded`     — semantic alias for rectangular; explicit intent for
   *                   inline text-row placeholders.
   * - `pill`        — uses `--skeleton-radius-pill` (9999px) for badge / chip
   *                   placeholders (StatusBadge, network-badge, wallet chip).
   *
   * Shape parity principle (FWC26 — issues #690 and #834): each variant
   * resolves to the same radius token used by the final rendered component
   * so first-paint skeleton geometry matches loaded-state geometry exactly
   * (CLS = 0).
   */
  shape?: 'rectangular' | 'card' | 'circular' | 'rounded' | 'pill';
  /**
   * Visual variant.
   *
   * - `default` — uses `var(--skeleton-bg)` → `var(--border, #30363d)`.
   *               Best for placeholders on page and card surfaces.
   * - `subtle`  — reduces opacity to 60% so the placeholder blends more
   *               softly against already-muted sections (e.g. secondary rows).
   *
   * GrantFox FWC26 (Stellar Wave): the `default` variant uses the
   * `var(--border)` token so skeletons adapt to [data-contrast="high"] and
   * dark-mode overrides automatically.
   */
  variant?: 'default' | 'subtle';
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
 * `var(--border)`.  Override the token at any scope:
 * ```css
 * .my-section { --skeleton-bg: var(--surface); }
 * ```
 *
 * ## Dimensions
 * Pass `width` / `height` to match the eventual content size and prevent
 * Cumulative Layout Shift (CLS) while the data fetch is in flight.
 *
 * ## Shape parity (FWC26 — issues #690 and #834)
 * Choose the shape that matches the rendered component's border-radius:
 *
 * | Shape          | CSS token              | Pixels | Matches                           |
 * |----------------|------------------------|--------|-----------------------------------|
 * | `rectangular`  | `--skeleton-radius`    | 8 px   | inputs, buttons, summary cards    |
 * | `card`         | `--skeleton-radius-card` | 12 px | outer page cards (CollateralSwap) |
 * | `rounded`      | `--skeleton-radius`    | 8 px   | text-row placeholders             |
 * | `circular`     | 50%                    | —      | avatar, icon placeholders         |
 * | `pill`         | `--skeleton-radius-pill` | 9999px| StatusBadge, chips, badges        |
 *
 * ## Composed page skeletons
 * Higher-level first-paint layouts compose this primitive — e.g.
 * `CollateralSwapSkeleton` in `CollateralSwap.tsx` (issue #834) mirrors the
 * card's --radius-lg outer container and each inner asset-row's --radius-md.
 * `RepaymentVisualizerSkeleton` in `RepaymentVisualizer.tsx` (issue #609)
 * mirrors the chart card height (220px) and header/legend rows.
 *
 * ## Motion
 * The shimmer animation is suppressed under both
 * `@media (prefers-reduced-motion: reduce)` and `[data-motion="reduced"]`
 * (the runtime JS toggle managed by ReducedMotionContext).
 * See the loading-state policy in `docs/ARCHITECTURE.md` §5.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  shape = 'rectangular',
  variant = 'default',
  style,
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}) => (
  <div
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
