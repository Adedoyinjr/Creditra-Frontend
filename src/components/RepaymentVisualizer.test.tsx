import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RepaymentVisualizer } from './RepaymentVisualizer';
import { ReducedMotionProvider } from '@/context/ReducedMotionContext';

describe('RepaymentVisualizer', () => {
  it('renders without crashing on valid inputs', () => {
    render(
      <ReducedMotionProvider>
        <RepaymentVisualizer
          principal={10000}
          apr={5}
          monthlyPayment={300}
        />
      </ReducedMotionProvider>
    );
    expect(screen.getByText('Repayment Plan')).toBeInTheDocument();
  });

  it('renders EmptyState when inputs are missing or zero', () => {
    render(
      <ReducedMotionProvider>
        <RepaymentVisualizer
          principal={0}
          apr={0}
          monthlyPayment={0}
        />
      </ReducedMotionProvider>
    );
    expect(screen.getByText('Enter a valid principal, APR, and monthly payment to see the repayment plan.')).toBeInTheDocument();
  });
});
