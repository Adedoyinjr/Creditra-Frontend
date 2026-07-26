import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AutoPayCard } from './AutoPayCard';
import React from 'react';

describe('AutoPayCard', () => {
  it('renders the placeholder when hasValidPreview is false', () => {
    render(
      <AutoPayCard
        hasValidPreview={false}
        parsedAmount={0}
        frequency="monthly"
        startDate=""
      />
    );
    expect(screen.getByText(/Fill in an amount and start date/i)).toBeInTheDocument();
  });

  it('renders the AutopaySchedule when hasValidPreview is true', () => {
    render(
      <AutoPayCard
        hasValidPreview={true}
        parsedAmount={150}
        frequency="weekly"
        startDate="2026-08-01"
      />
    );
    // When valid, it should show schedule header or amount
    expect(screen.queryByText(/Fill in an amount and start date/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Upcoming Payments/i)).toBeInTheDocument(); // assuming AutopaySchedule renders this
  });
});
