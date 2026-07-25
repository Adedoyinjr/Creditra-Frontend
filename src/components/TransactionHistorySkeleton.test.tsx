import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TransactionHistorySkeleton } from './TransactionHistorySkeleton';

describe('TransactionHistorySkeleton', () => {
  it('renders a status region with aria-busy while loading', () => {
    render(<TransactionHistorySkeleton />);

    const region = screen.getByRole('status', {
      name: /loading transaction history/i,
    });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the default 8 skeleton rows', () => {
    const { container } = render(<TransactionHistorySkeleton />);

    const rows = container.querySelectorAll('.th-skeleton__row');
    expect(rows).toHaveLength(8);
  });

  it('renders a custom number of rows when the rows prop is provided', () => {
    const { container } = render(<TransactionHistorySkeleton rows={5} />);

    const rows = container.querySelectorAll('.th-skeleton__row');
    expect(rows).toHaveLength(5);
  });

  it('renders the stats card placeholders (4 cards)', () => {
    const { container } = render(<TransactionHistorySkeleton />);

    const statCards = container.querySelectorAll('.th-skeleton__stat-card');
    expect(statCards).toHaveLength(4);
  });

  it('renders the filter bar placeholder', () => {
    const { container } = render(<TransactionHistorySkeleton />);

    expect(container.querySelector('.th-skeleton__filters')).toBeInTheDocument();
  });

  it('renders the table container placeholder', () => {
    const { container } = render(<TransactionHistorySkeleton />);

    expect(container.querySelector('.th-skeleton__table-container')).toBeInTheDocument();
  });

  it('renders shimmer skeleton elements inside the region', () => {
    const { container } = render(<TransactionHistorySkeleton />);

    const shimmerElements = container.querySelectorAll('.skeleton');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it('stat cards and filter bar are hidden from assistive technology', () => {
    const { container } = render(<TransactionHistorySkeleton />);

    // aria-hidden prevents AT from narrating meaningless placeholder content.
    expect(
      container.querySelector('.th-skeleton__stats'),
    ).toHaveAttribute('aria-hidden', 'true');
    expect(
      container.querySelector('.th-skeleton__filters'),
    ).toHaveAttribute('aria-hidden', 'true');
    expect(
      container.querySelector('.th-skeleton__table-container'),
    ).toHaveAttribute('aria-hidden', 'true');
  });

  it('each skeleton row contains at least one shimmer element', () => {
    const { container } = render(<TransactionHistorySkeleton />);

    const rows = container.querySelectorAll('.th-skeleton__row');
    rows.forEach((row) => {
      expect(row.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    });
  });
});
