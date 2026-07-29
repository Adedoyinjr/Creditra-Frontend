import type { ReactNode } from 'react';

export interface RepayCalendarEvent {
  date: string;
  amount: number;
  label: string;
}

export interface RepayCalendarProps {
  /** Ordered list of upcoming repayment events. */
  events: RepayCalendarEvent[];
  /** Additional CSS class names. */
  className?: string;
  /** Optional children rendered below the calendar. */
  children?: ReactNode;
}

/**
 * RepayCalendar — repayment schedule calendar with a live region.
 *
 * Renders an ordered list of upcoming repayment events with accessible
 * date labels and amounts. Uses `aria-live="polite"` so assistive
 * technology announces changes to the schedule.
 *
 * WCAG 2.1 AA:
 * - Live region announces schedule updates to screen readers.
 * - Each event row uses semantic markup for date and amount.
 * - All numeric values use `font-variant-numeric: tabular-nums`.
 */
export function RepayCalendar({
  events,
  className = '',
  children,
}: RepayCalendarProps) {
  const classes = ['card', 'repay-calendar', className]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={classes}
      aria-label="Repayment calendar"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 className="repay-calendar__title">Upcoming Payments</h2>

      {events.length === 0 ? (
        <p className="repay-calendar__empty">No upcoming payments.</p>
      ) : (
        <ol className="repay-calendar__list">
          {events.map((event, idx) => (
            <li key={`${event.date}-${idx}`} className="repay-calendar__event">
              <time
                dateTime={event.date}
                className="repay-calendar__date num-tabular"
              >
                {new Date(event.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
              <span className="repay-calendar__label">{event.label}</span>
              <span className="repay-calendar__amount num-tabular">
                ${event.amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}

      {children}
    </section>
  );
}

export default RepayCalendar;
