import { fmt, fmtDate } from '../utils/tokens';
import './PreviewCard.css';

export interface PreviewCardProps {
  /** Sequential payment number / installment index (1-based) */
  paymentNumber?: number;
  /** ISO date string or formatted date for the payment */
  date: string;
  /** Total installment payment amount in USD */
  amount: number;
  /** Frequency of recurring payment */
  frequency?: string;
  /** Current payment status */
  status?: 'Upcoming' | 'Scheduled' | 'Past';
  /** Cumulative total paid after this installment */
  totalAccumulated?: number;
  /** Whether the schedule is open-ended */
  isOpenEnded?: boolean;
  /** Estimated principal portion */
  principalAmount?: number;
  /** Estimated fee / interest portion */
  feeAmount?: number;
  /** Payment source/vault description */
  paymentMethod?: string;
  /** Element ID for ARIA linkage (e.g. aria-describedby) */
  id?: string;
  /** Optional custom class name */
  className?: string;
}

/**
 * PreviewCard — Rich hover-triggered & keyboard-accessible preview popover.
 *
 * Surfaced when hovering or focusing on an AutoPay payment card or schedule row.
 * Displays breakdown of payment installment details:
 * - Payment date & installment index
 * - Amount breakdown (Principal vs Fee / Interest)
 * - Status badge (Upcoming / Scheduled / Past)
 * - Cumulative balance projection
 * - Payment vault source
 *
 * Accessibility:
 * - Rendered with role="tooltip" and links via aria-describedby/aria-details.
 * - Colors adhere to AA contrast rules using project CSS custom properties.
 * - Formatted tabular numbers for accessibility and scannability.
 */
export function PreviewCard({
  paymentNumber,
  date,
  amount,
  frequency = 'Monthly',
  status = 'Scheduled',
  totalAccumulated,
  isOpenEnded = false,
  principalAmount,
  feeAmount,
  paymentMethod = 'Stellar AutoPay Vault',
  id,
  className = '',
}: PreviewCardProps) {
  // If principal and fee amounts are not explicitly passed, calculate an estimated 92%/8% split
  const calculatedPrincipal = principalAmount ?? Math.round(amount * 0.92 * 100) / 100;
  const calculatedFee = feeAmount ?? Math.round((amount - calculatedPrincipal) * 100) / 100;

  // Calculate days remaining/relative tag if valid ISO date string
  let daysLabel = '';
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(parsedDate);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      daysLabel = 'Due today';
    } else if (diffDays > 0) {
      daysLabel = `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } else {
      daysLabel = `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
    }
  }

  const badgeClass =
    status === 'Upcoming'
      ? 'preview-card__badge--upcoming'
      : status === 'Past'
      ? 'preview-card__badge--past'
      : 'preview-card__badge--scheduled';

  return (
    <div
      id={id}
      role="tooltip"
      aria-label={`Preview card for payment ${paymentNumber ? '#' + paymentNumber : ''}`}
      className={`preview-card ${className}`}
    >
      {/* ── Card Header ────────────────────────────────────────────────── */}
      <div className="preview-card__header">
        <div className="preview-card__title-group">
          {paymentNumber && (
            <span className="preview-card__index">Payment #{paymentNumber}</span>
          )}
          <span className="preview-card__date">{fmtDate(date)}</span>
        </div>
        <span
          className={`preview-card__badge ${badgeClass}`}
          aria-label={`Status: ${status}`}
        >
          {status}
        </span>
      </div>

      {daysLabel && (
        <div className="preview-card__relative-time" aria-live="off">
          ⏱ {daysLabel}
        </div>
      )}

      <div className="preview-card__divider" />

      {/* ── Main Amount Stat ────────────────────────────────────────────── */}
      <div className="preview-card__stat-primary">
        <span className="preview-card__label">Total Installment</span>
        <span className="preview-card__amount num-tabular">{fmt(amount)}</span>
      </div>

      {/* ── Breakdown grid ──────────────────────────────────────────────── */}
      <div className="preview-card__breakdown">
        <div className="preview-card__breakdown-row">
          <span className="preview-card__sublabel">Principal portion</span>
          <span className="preview-card__subval num-tabular">{fmt(calculatedPrincipal)}</span>
        </div>
        <div className="preview-card__breakdown-row">
          <span className="preview-card__sublabel">Est. fees / interest</span>
          <span className="preview-card__subval num-tabular">{fmt(calculatedFee)}</span>
        </div>
        {totalAccumulated !== undefined && (
          <div className="preview-card__breakdown-row preview-card__breakdown-row--highlight">
            <span className="preview-card__sublabel">
              Cumulative total{isOpenEnded ? '*' : ''}
            </span>
            <span className="preview-card__subval num-tabular">{fmt(totalAccumulated)}</span>
          </div>
        )}
      </div>

      {/* ── Footer / Vault Info ─────────────────────────────────────────── */}
      <div className="preview-card__footer">
        <span className="preview-card__method-icon" aria-hidden="true">
          🔒
        </span>
        <span className="preview-card__method-text">
          {paymentMethod} • {frequency}
        </span>
      </div>
    </div>
  );
}
