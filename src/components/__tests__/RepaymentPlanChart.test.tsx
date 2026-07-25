import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RepaymentPlanChart } from '../RepaymentPlanChart';
import type { CreditLine } from '../../types/creditLine';

const mockLine: CreditLine = {
  id: 'CL-TEST-1',
  name: 'Growth Reserve',
  status: 'Active',
  limit: 500000,
  utilized: 120000,
  apr: 8.5,
  riskScore: 720,
  openedAt: '2025-01-02',
  updatedAt: '2025-02-20T14:32:00Z',
  transactions: [],
  statusHistory: [],
};

describe('RepaymentPlanChart', () => {
  it('renders a chart and table and updates the projection when a preset changes', () => {
    render(<RepaymentPlanChart line={mockLine} />);

    expect(screen.getByRole('img', { name: /repayment plan by week/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /projected repayment breakdown by week/i })).toBeInTheDocument();

    const summary = screen.getByText(/estimated repayment over 12 weeks/i);
    const initialSummary = summary.textContent ?? '';
    expect(initialSummary).toContain('$');

    fireEvent.click(screen.getByRole('button', { name: /50%/i }));

    const updatedSummary = screen.getByText(/estimated repayment over 12 weeks/i).textContent ?? '';
    expect(updatedSummary).not.toBe(initialSummary);
  });
});
