import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './EmptyState.css';

/**
 * Action descriptor used by `<EmptyState />`.
 *
 * - Provide `to` to render as a React Router `<Link />` (preferred for
 *   in-app navigation such as `/open-credit`).
 * - Provide `onClick` to render as a `<button type="button">`.
 * - The discriminated union makes TypeScript narrow the type based on
 *   the chosen variant; exactly one of `to` / `onClick` should be supplied.
 */
export type EmptyStateAction =
  | { to: string; onClick?: never }
  | { onClick: () => void; to?: never };

/**
 * Visual + ARIA tone for the empty state.
 *
 * - `info` (default): neutral status, announced politely.
 * - `success`: celebratory "you're all caught up" states such as the
 *   zero-debt Repay page. Tint via `--success` and announced as
 *   `role="status"` so AT users understand it is informational, not
 *   urgent. The illustration + heading carry the message; colour is
 *   NEVER the sole cue (WCAG 1.4.1).
 */
export type EmptyStateTone = 'info' | 'success';

/**
 * Compile-time exhaustive lookup for tone -> className.
 *
 * A `switch` + `never` exhaustiveness check means adding a future tone
 * (e.g. `'warning'`) will surface as a TS error here, not as a silent
 * fall-through to the default case.
 */
function toneClassName(tone: EmptyStateTone): string {
  switch (tone) {
    case 'info':
      return 'empty-state--info';
    case 'success':
      return 'empty-state--success';
    default: {
      // Exhaustiveness check. If we add a new tone and forget to handle
      // it here, this line will refuse to compile.
      const _exhaustive: never = tone;
      void _exhaustive;
      return 'empty-state--info';
    }
  }
}

export interface EmptyStateProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'children' | 'role' | 'aria-live' | 'aria-labelledby'
  > {
  /**
   * Decorative illustration element (typically one of the named SVG
   * illustrations from `@/components/illustrations`). The illustration
   * component is responsible for marking itself `aria-hidden="true"` —
   * see `EmptyStateIllustrations.tsx`. EmptyState itself does not render
   * an `alt` because the heading provides the accessible name.
   */
  illustration: ReactNode;

  /** Main heading — provides the accessible name for the region. */
  title: string;

  /**
   * Supporting body copy explaining the situation. Keep under ~2 short sentences
   * or a concise list so the card does not feel overwhelming.
   */
  description: React.ReactNode;

  /**
   * Optional eyebrow line rendered above the heading (e.g. "Repay
   * Credit"). Styled as muted uppercase small caps.
   */
  eyebrow?: string;

  /**
   * Primary CTA. When omitted, the empty state is purely informational.
   */
  primaryAction?: EmptyStateAction & { label: string };

  /**
   * Optional secondary CTA. When paired with `primaryAction` it renders
   * in the same row with a lower-emphasis outline style.
   */
  secondaryAction?: { label: string } & EmptyStateAction;

  /**
   * Visual + aria-live tone. Defaults to `'info'`.
   */
  tone?: EmptyStateTone;

  /**
   * Optional override for the heading id. When omitted, the component
   * generates a unique id via `React.useId()` so multiple EmptyStates
   * on the same page never collide on `aria-labelledby`.
   *
   * NOTE: the auto-generated id looks like `:r0:` (it contains `:`
   * characters). That is fine for `aria-labelledby`/`getElementById`
   * lookups and for screen readers, but it is INVALID as a CSS selector
   * target. Tests should prefer `getByRole('heading')` over
   * `getByTestId('#<auto-id>')`.
   */
  titleId?: string;
}

/**
 * Themed empty-state container.
 *
 * Use this anywhere a list / page is empty: credit lines, transactions,
 * repayable balances, etc. The component handles layout, illustration
 * framing, tone-aware announcements, and CTA wiring; consumers only
 * supply copy and the illustration element.
 *
 * Accessibility:
 *
 * - The root region uses `role="status"` with `aria-live="polite"` so
 *   the heading and description are announced when the empty state
 *   appears after navigation — but never interrupts the user.
 * - The illustration is decorative (`aria-hidden`); the heading is the
 *   accessible name and its id is auto-generated so multiple instances
 *   can co-exist on the same page.
 * - Each action honours the repo's focus-visible outline via the
 *   `.empty-state-btn` / `.empty-state-secondary-btn` classes.
 */
export function EmptyState({
  illustration,
  title,
  description,
  eyebrow,
  primaryAction,
  secondaryAction,
  tone = 'info',
  titleId,
  ...rest
}: EmptyStateProps) {
  const generatedId = useId();
  const headingId = titleId ?? generatedId;
  const toneClass = toneClassName(tone);

  return (
    <div
      className={`empty-state ${toneClass}`}
      role="status"
      aria-live="polite"
      aria-labelledby={headingId}
      {...rest}
    >
      <div className="empty-state__accent-rule" aria-hidden="true" />

      {illustration}

      {eyebrow ? <p className="empty-state__eyebrow">{eyebrow}</p> : null}

      <h2 id={headingId} className="empty-state__title">
        {title}
      </h2>

      <p className="empty-state__description">{description}</p>

      {(primaryAction || secondaryAction) && (
        <div className="empty-state__actions">
          {primaryAction ? (
            <EmptyStateActionButton
              action={primaryAction}
              variant="primary"
            />
          ) : null}
          {secondaryAction ? (
            <EmptyStateActionButton
              action={secondaryAction}
              variant="secondary"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Internal helper that collapses the action variants into a single
 * element. Kept inside the module so EmptyState's JSX stays readable.
 *
 * NOTE: consumers spread `...rest` onto the root `<div>`, so arbitrarily
 * named `data-testid` (or any other DOM attribute) is supported without
 * having to declare each one on the props interface.
 */
function EmptyStateActionButton({
  action,
  variant,
}: {
  action: { label: string } & EmptyStateAction;
  variant: 'primary' | 'secondary';
}) {
  const className =
    variant === 'primary' ? 'empty-state-btn' : 'empty-state-secondary-btn';

  if ('to' in action && action.to) {
    return (
      <Link to={action.to} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={action.onClick}>
      {action.label}
    </button>
  );
}
