import { Skeleton } from './Skeleton';
import './TransactionHistorySkeleton.css';

/**
 * TransactionHistorySkeleton
 *
 * Themed shimmer placeholder shown on the first paint of the
 * TransactionHistory page while transaction data is being loaded.
 *
 * Layout mirrors the real table:
 *   - A header bar matching the stats cards row
 *   - A filter-bar placeholder
 *   - A table container with N skeleton rows (default: 8)
 *
 * Accessibility:
 *   - Wrapping element carries role="status" and aria-busy="true" so
 *     assistive technology announces that content is loading (WCAG 2.1
 *     AA — SC 4.1.3 Status Messages).
 *   - aria-label provides a human-readable description of the region.
 *   - Individual skeleton divs are aria-hidden to prevent AT from reading
 *     meaningless placeholder content.
 *
 * Design tokens:
 *   All colours and radii come from CSS custom properties defined in
 *   src/index.css (:root block) so the skeleton automatically inherits
 *   the active theme, including high-contrast mode.
 *
 * Reduced motion:
 *   The shimmer sweep animation is suppressed via
 *   `@media (prefers-reduced-motion: reduce)` in Skeleton.css and
 *   also honoured by the `[data-motion="reduced"]` class hook defined
 *   in Skeleton.css.
 *
 * @param rows - Number of skeleton transaction rows to render (default 8).
 */
interface TransactionHistorySkeletonProps {
  /** Number of placeholder rows to render. Defaults to 8. */
  rows?: number;
}

export function TransactionHistorySkeleton({ rows = 8 }: TransactionHistorySkeletonProps) {
  return (
    <div
      className="th-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading transaction history"
    >
      {/* ── Stats cards row ─────────────────────────────────────────────── */}
      <div className="th-skeleton__stats" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="th-skeleton__stat-card">
            {/* Icon placeholder */}
            <Skeleton width={40} height={40} shape="rounded" />
            <div className="th-skeleton__stat-content">
              {/* Label */}
              <Skeleton width="60%" height={10} />
              {/* Value */}
              <Skeleton width="80%" height={20} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar placeholder ────────────────────────────────────────── */}
      <div className="th-skeleton__filters" aria-hidden="true">
        {/* Simulate 4 filter groups of varying widths */}
        {(['25%', '35%', '20%', '15%'] as const).map((w, i) => (
          <Skeleton key={i} width={w} height={36} shape="rounded" />
        ))}
      </div>

      {/* ── Table container ──────────────────────────────────────────────── */}
      <div className="th-skeleton__table-container" aria-hidden="true">
        {/* Table header */}
        <div className="th-skeleton__thead">
          {(['10%', '15%', '12%', '20%', '12%', '18%', '4%'] as const).map((w, i) => (
            <Skeleton key={i} width={w} height={12} />
          ))}
        </div>

        {/* Transaction rows */}
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonRow key={i} index={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Single skeleton transaction row.
 *
 * Column widths are randomised within a bounded range using the row
 * index as a stable seed so renders are consistent (no layout shift
 * between re-renders while still looking natural).
 *
 * Columns mirror the real table: Date | Type | Amount | Line | Status | Hash | Expand
 */
function SkeletonRow({ index }: { index: number }) {
  // Deterministic pseudo-random widths based on row index to avoid
  // identical rows while keeping renders stable.
  const seed = (index * 7 + 3) % 10; // 0–9

  return (
    <div className="th-skeleton__row">
      {/* Date */}
      <div className="th-skeleton__cell th-skeleton__cell--date">
        <Skeleton width={`${60 + seed * 4}px`} height={13} />
        <Skeleton width="40px" height={10} />
      </div>
      {/* Type badge */}
      <div className="th-skeleton__cell">
        <Skeleton width={`${70 + seed * 3}px`} height={24} shape="rounded" />
      </div>
      {/* Amount */}
      <div className="th-skeleton__cell">
        <Skeleton width={`${50 + seed * 5}px`} height={14} />
      </div>
      {/* Credit Line */}
      <div className="th-skeleton__cell th-skeleton__cell--line">
        <Skeleton width={`${90 + seed * 4}px`} height={13} />
        <Skeleton width="50px" height={10} />
      </div>
      {/* Status badge */}
      <div className="th-skeleton__cell">
        <Skeleton width={`${64 + seed * 2}px`} height={22} shape="rounded" />
      </div>
      {/* Hash */}
      <div className="th-skeleton__cell">
        <Skeleton width={`${80 + seed * 3}px`} height={13} />
      </div>
      {/* Expand chevron */}
      <div className="th-skeleton__cell th-skeleton__cell--expand">
        <Skeleton width={16} height={16} shape="circular" />
      </div>
    </div>
  );
}
