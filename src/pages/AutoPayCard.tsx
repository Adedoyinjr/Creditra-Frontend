import React from 'react';
import { AutopaySchedule, type AutopayFrequency } from '../components/AutopaySchedule';
import './AutopayPage.css'; // Or inline styles if needed

export interface AutoPayCardProps {
  hasValidPreview: boolean;
  parsedAmount: number;
  frequency: AutopayFrequency;
  startDate: string;
  endDate?: string;
}

export function AutoPayCard({
  hasValidPreview,
  parsedAmount,
  frequency,
  startDate,
  endDate,
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
