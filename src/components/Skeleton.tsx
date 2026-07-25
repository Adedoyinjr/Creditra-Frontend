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
   * - `rectangular` — sharp corners, default border-radius from --skeleton-radius.
   * - `circular` — border-radius: 50%, for avatar / icon placeholders.
   * - `rounded` — same as rectangular but explicitly uses --skeleton-radius;
   *   provided as a semantic alias for callers that want to document intent.
   */
  shape?: 'rectangular' | 'circular' | 'rounded';
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
 * ## Motion
 * The shimmer animation is suppressed under both
 * `@media (prefers-reduced-motion: reduce)` and `[data-motion="reduced"]`
 * (the runtime JS toggle managed by ReducedMotionContext).
 * See the loading-state policy in `docs/ARCHITECTURE.md` §5.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height, shape = 'rectangular', variant, style, className, 'aria-hidden': ariaHidden = true, ...rest }) => (
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

