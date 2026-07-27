import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { PreviewCard } from './PreviewCard';

describe('PreviewCard', () => {
  it('renders payment installment number, date, and formatted amount', () => {
    render(
      <PreviewCard
        paymentNumber={1}
        date="2026-08-15"
        amount={250}
        frequency="Monthly"
        status="Upcoming"
        id="test-preview-1"
      />
    );

    expect(screen.getByText('Payment #1')).toBeInTheDocument();
    expect(screen.getByText(/Aug 15, 2026/i)).toBeInTheDocument();
    expect(screen.getByText('$250')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('renders estimated principal and fee breakdown correctly', () => {
    render(
      <PreviewCard
        paymentNumber={2}
        date="2026-09-15"
        amount={100}
        principalAmount={90}
        feeAmount={10}
      />
    );

    expect(screen.getByText('Principal portion')).toBeInTheDocument();
    expect(screen.getByText('$90')).toBeInTheDocument();
    expect(screen.getByText('Est. fees / interest')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
  });

  it('renders cumulative total when totalAccumulated prop is provided', () => {
    render(
      <PreviewCard
        paymentNumber={3}
        date="2026-10-15"
        amount={100}
        totalAccumulated={300}
        isOpenEnded={true}
      />
    );

    expect(screen.getByText(/Cumulative total\*/i)).toBeInTheDocument();
    expect(screen.getByText('$300')).toBeInTheDocument();
  });

  it('carries role="tooltip" and accessible labels', () => {
    render(
      <PreviewCard
        paymentNumber={4}
        date="2026-11-15"
        amount={150}
        id="preview-tooltip-4"
      />
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute('id', 'preview-tooltip-4');
    expect(tooltip).toHaveAttribute('aria-label', 'Preview card for payment #4');
  });
});
