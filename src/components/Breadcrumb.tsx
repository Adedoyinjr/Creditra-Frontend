import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Breadcrumb.css';

/**
 * A single breadcrumb segment.
 *
 * `href` makes it a navigable link; omitting it renders the item as plain
 * text (typically the current / active page).
 */
export interface BreadcrumbItem {
  /** Visible label for this segment. */
  label: string;
  /** Route path. Omit for the last (current) segment. */
  href?: string;
}

export interface BreadcrumbProps {
  /** Ordered list of breadcrumb segments, left-to-right (root first). */
  items: BreadcrumbItem[];
  /**
   * Character count threshold above which a label is truncated with a
   * middle-ellipsis. Defaults to 24.
   */
  ellipsisThreshold?: number;
  /** Additional class name applied to the outer `<nav>`. */
  className?: string;
}

/**
 * Middle-ellipsis helper: trims the center of a string while preserving the
 * first and last few characters, inserting `\u2026` (…) in between.
 *
 * For a string of `n` characters we keep `head = ceil(n/3)` and
 * `tail = floor(n/3)` characters, which keeps both the recognisable prefix
 * and any file-extension / identifier suffix visible.
 */
export function middleEllipsis(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const head = Math.ceil(maxLen / 3);
  const tail = Math.floor(maxLen / 3);
  return `${text.slice(0, head)}\u2026${text.slice(-tail)}`;
}

/**
 * Accessible breadcrumb navigation with middle-ellipsis truncation for
 * long path segments.
 *
 * Accessibility (WCAG 2.1 AA):
 *  - Uses `<nav aria-label="Breadcrumb">` landmark.
 *  - Ordered list (`<ol>`) conveys sequence to screen readers.
 *  - The current page item uses `aria-current="page"`.
 *  - Each truncatable label gets a `title` attribute so the full text is
 *    available on hover / focus.
 *  - Separator is decorative (`aria-hidden="true"`).
 */
export function Breadcrumb({
  items,
  ellipsisThreshold = 24,
  className,
}: BreadcrumbProps) {
  const processed = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        displayLabel: middleEllipsis(item.label, ellipsisThreshold),
        truncated: item.label.length > ellipsisThreshold,
      })),
    [items, ellipsisThreshold],
  );

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`breadcrumb${className ? ` ${className}` : ''}`}
    >
      <ol className="breadcrumb__list">
        {processed.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="breadcrumb__item">
              {idx > 0 && (
                <span className="breadcrumb__separator" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className={`breadcrumb__text${isLast ? ' breadcrumb__text--current' : ''}`}
                  {...(isLast ? { 'aria-current': 'page' } : {})}
                  {...(item.truncated ? { title: item.label } : {})}
                >
                  {item.displayLabel}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="breadcrumb__link"
                  {...(item.truncated ? { title: item.label } : {})}
                >
                  {item.displayLabel}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
