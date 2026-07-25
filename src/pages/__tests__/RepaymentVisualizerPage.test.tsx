import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepaymentVisualizerPage, { RepaymentVisualizer } from '../RepaymentVisualizer';

describe('RepaymentVisualizer Page Re-export', () => {
  it('re-exports RepaymentVisualizer component as named and default export', () => {
    expect(RepaymentVisualizerPage).toBe(RepaymentVisualizer);
  });

  it('renders RepaymentVisualizer component via page export', () => {
    render(
      <RepaymentVisualizerPage
        principal={50000}
        apr={7.5}
        monthlyPayment={1500}
      />
    );
    expect(screen.getByRole('region', { name: 'Repayment plan visualizer' })).toBeInTheDocument();
    expect(screen.getByText('Repayment Plan')).toBeInTheDocument();
    expect(screen.getAllByText('Inspect month').length).toBeGreaterThanOrEqual(1);
  });
});
