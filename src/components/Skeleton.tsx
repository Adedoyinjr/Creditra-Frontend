import React from 'react';
import './Skeleton.css';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Width passed through as a CSS dimension (string or px number). */
  width?: string | number;
  /** Height passed through as a CSS dimension (string or px number). */
  height?: string | number;
};

/**
 * Shimmer placeholder used during loading states.
 *
 * Dimensions are deliberately passed through as props so callers can
 * match the size of the eventual content exactly — preserving CLS while
 * a fetch is in flight.
 *
 * The shimmer animation is defined in `Skeleton.css` and is suppressed
 * under `@media (prefers-reduced-motion: reduce)`. See the loading-state
 * policy in `docs/ARCHITECTURE.md` section 5.
 *
 * @example
 *   <Skeleton width="100%" height={48} aria-label="Loading credit lines" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height, style, className, ...rest }) => (
  <div
    className={`skeleton ${className ?? ''}`.trim()}
    style={{ width, height, ...style }}
    {...rest}
  />
);

export const RiskGaugeSkeleton: React.FC = () => {
  return (
    <div className="risk-gauge-container skeleton-gauge" aria-label="Loading risk gauge" role="img">
      <svg className="risk-gauge-svg" viewBox="0 0 160 100" aria-hidden="true" tabIndex={-1}>
        <path
          className="risk-gauge-bg"
          d="M 25 75 A 55 55 0 0 1 135 75"
        />
        <path
          className="skeleton-arc-shimmer"
          d="M 25 75 A 55 55 0 0 1 135 75"
        />
      </svg>
      <div className="risk-meta" aria-hidden="true">
        <div className="risk-meta-item">
          <Skeleton width={40} height={10} style={{ marginBottom: 4, borderRadius: 2 }} />
          <Skeleton width={60} height={14} style={{ borderRadius: 2 }} />
        </div>
        <div className="risk-meta-item">
          <Skeleton width={60} height={10} style={{ marginBottom: 4, borderRadius: 2 }} />
          <Skeleton width={80} height={14} style={{ borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
};
