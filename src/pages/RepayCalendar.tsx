import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RepaymentSchedule } from '@/components/RepaymentSchedule';
import { buildRepaymentScheduleFromLines } from '@/components/RepaymentSchedule';
import { MOCK_CREDIT_LINES } from '@/data/mockData';
import './RepayCalendar.css';

/**
 * RepayCalendar — calendar-style view of the user's repayment schedule.
 *
 * The page displays a full repayment timeline with breadcrumb navigation.
 * The breadcrumb demonstrates middle-ellipsis truncation when path segments
 * are long (see issue #687).
 *
 * Accessibility (WCAG 2.1 AA):
 *  - Breadcrumb landmark with `aria-label="Breadcrumb"`.
 *  - `aria-current="page"` on the current breadcrumb segment.
 *  - Heading hierarchy: h1 > h2 (schedule section).
 *  - Back button has a descriptive `aria-label`.
 *  - All interactive elements have visible focus-visible outlines.
 *  - Reduced motion is respected via the global CSS reset.
 */
export default function RepayCalendar() {
  const navigate = useNavigate();

  const activeLines = useMemo(
    () =>
      MOCK_CREDIT_LINES.filter(
        (cl) => cl.status === 'Active' && cl.utilized > 0,
      ),
    [],
  );

  const schedule = useMemo(
    () => buildRepaymentScheduleFromLines(activeLines),
    [activeLines],
  );

  const totalRemaining = useMemo(
    () =>
      schedule
        .filter((s) => s.status !== 'paid')
        .reduce((sum, s) => sum + s.amount, 0),
    [schedule],
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/' },
      { label: 'Credit Lines', href: '/credit-lines' },
      {
        label: 'Repayment Calendar — ' + (activeLines[0]?.name ?? 'All lines'),
      },
    ],
    [activeLines],
  );

  return (
    <div className="repay-calendar mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
      <Breadcrumb items={breadcrumbItems} />

      <button
        type="button"
        aria-label="Back to credit lines"
        onClick={() => navigate('/credit-lines')}
        className="repay-calendar__back"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <header className="space-y-1.5">
        <div className="repay-calendar__icon-badge" aria-hidden="true">
          <Calendar className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold uppercase text-muted">
          Repayment Schedule
        </p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Repayment Calendar
        </h1>
        <p className="text-sm text-muted">
          View your upcoming and past repayment installments across all active
          credit lines.
        </p>
      </header>

      {activeLines.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-muted">
            No active credit lines with an outstanding balance. Make a draw to
            see your repayment calendar.
          </p>
        </div>
      ) : (
        <>
          <div className="repay-calendar__summary" role="status" aria-live="polite">
            <div className="repay-calendar__summary-item">
              <span className="repay-calendar__summary-label">
                Active lines
              </span>
              <span className="repay-calendar__summary-value">
                {activeLines.length}
              </span>
            </div>
            <div className="repay-calendar__summary-item">
              <span className="repay-calendar__summary-label">
                Total installments
              </span>
              <span className="repay-calendar__summary-value">
                {schedule.length}
              </span>
            </div>
            <div className="repay-calendar__summary-item">
              <span className="repay-calendar__summary-label">
                Remaining
              </span>
              <span className="repay-calendar__summary-value">
                ${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <RepaymentSchedule
            schedule={schedule}
            title="All Scheduled Payments"
          />
        </>
      )}
    </div>
  );
}
