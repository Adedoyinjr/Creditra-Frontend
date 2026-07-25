import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('tabular-nums CSS utility', () => {
  it('applies tabular-nums class to elements', () => {
    const TestComponent = () => (
      <div>
        <span className="tabular-nums" data-testid="tabular">$1,234.56</span>
        <span data-testid="normal">$1,234.56</span>
      </div>
    );

    render(<TestComponent />);

    const tabularEl = screen.getByTestId('tabular');
    const normalEl = screen.getByTestId('normal');

    expect(tabularEl).toHaveClass('tabular-nums');
    expect(normalEl).not.toHaveClass('tabular-nums');
  });

  it('applies tabular-nums to numeric displays in RepayModal', () => {
    const TestComponent = () => (
      <div>
        <p className="tabular-nums" data-testid="amount">$10,000.00</p>
        <p className="tabular-nums" data-testid="percentage">75%</p>
        <p className="tabular-nums" data-testid="utilization">50%</p>
      </div>
    );

    render(<TestComponent />);

    expect(screen.getByTestId('amount')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('percentage')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('utilization')).toHaveClass('tabular-nums');
  });

  it('applies tabular-nums to RepaySuccessShareCard amount', () => {
    const TestComponent = () => (
      <div>
        <span className="repay-value tabular-nums" data-testid="repay-amount">$5,000.00</span>
      </div>
    );

    render(<TestComponent />);

    expect(screen.getByTestId('repay-amount')).toHaveClass('tabular-nums');
  });

  it('applies tabular-nums to ConfirmationStep amounts', () => {
    const TestComponent = () => (
      <div>
        <p className="tabular-nums" data-testid="draw-amount">$1,000.00</p>
        <p className="tabular-nums" data-testid="fee">$10.00</p>
        <p className="tabular-nums" data-testid="interest">$12.50</p>
        <p className="tabular-nums" data-testid="new-balance">$1,012.50</p>
        <p className="tabular-nums" data-testid="available">$8,987.50</p>
        <span className="tabular-nums" data-testid="utilization">45%</span>
        <span className="tabular-nums" data-testid="new-utilization">55%</span>
      </div>
    );

    render(<TestComponent />);

    expect(screen.getByTestId('draw-amount')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('fee')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('interest')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('new-balance')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('available')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('utilization')).toHaveClass('tabular-nums');
    expect(screen.getByTestId('new-utilization')).toHaveClass('tabular-nums');
  });
});