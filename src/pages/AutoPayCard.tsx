import { AutopaySchedule, type AutopayFrequency } from '../components/AutopaySchedule';
import './AutopayPage.css';

export interface AutoPayCardProps {
  /** Whether the schedule input form has valid values to preview. */
  hasValidPreview: boolean;
  /** Payment amount per installment in USD. */
  parsedAmount: number;
  /** Recurrence frequency (weekly, biweekly, monthly, quarterly). */
  frequency: AutopayFrequency;
  /** Start date string in ISO format. */
  startDate: string;
  /** Optional end date string in ISO format. */
  endDate?: string;
  /** Optional callback triggered when a schedule row preview card is hovered/focused. */
  onPreviewRowChange?: (index: number | null) => void;
}

/**
 * AutoPayCard — Container card displaying the live payment schedule preview
 * or an informative placeholder state.
 *
 * Each scheduled row inside the card features an interactive hover-preview card
 * (`PreviewCard`) that displays payment breakdown details and supports keyboard focus navigation.
 */
export function AutoPayCard({
  hasValidPreview,
  parsedAmount,
  frequency,
  startDate,
  endDate,
  onPreviewRowChange,
}: AutoPayCardProps) {
  return (
    <div
      className="card autopay-page__preview-card"
      style={{
        padding: 'var(--space-8)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {hasValidPreview ? (
        <AutopaySchedule
          amount={parsedAmount}
          frequency={frequency}
          startDate={startDate}
          endDate={endDate}
          maxRows={8}
          onPreviewRowChange={onPreviewRowChange}
        />
      ) : (
        <div
          className="autopay-page__preview-placeholder"
          aria-live="polite"
          style={{
            padding: 'var(--space-10) var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <span
            className="autopay-page__preview-placeholder-icon"
            aria-hidden="true"
            style={{ fontSize: 'var(--text-3xl)', color: 'var(--muted)' }}
          >
            📅
          </span>
          <p
            className="autopay-page__preview-placeholder-text"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--muted)',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            Fill in an amount and start date to see your upcoming payment
            schedule.
          </p>
        </div>
      )}
    </div>
  );
}
