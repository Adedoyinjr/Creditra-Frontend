import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RepayPage from '../RepayPage';

vi.mock('@/data/mockData', () => ({
  MOCK_CREDIT_LINES: [
    {
      id: 'CL-2024-001',
      name: 'Primary Business Line',
      status: 'Active',
      limit: 500000,
      utilized: 187500,
      apr: 8.5,
      riskScore: 720,
      collateral: 'Commercial Real Estate',
      openedAt: '2024-03-15',
      updatedAt: '2025-02-20T14:32:00Z',
      nextPaymentDate: '2025-03-01',
      nextPaymentAmount: 3200,
      transactions: [],
      statusHistory: [],
    },
  ],
}));

function renderPage(initialEntries = ['/repay']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <RepayPage />
    </MemoryRouter>,
  );
}

describe('RepayPage', () => {
  it('renders credit line selection when no line is preselected', () => {
    renderPage();
    expect(screen.getByText('Select a credit line to repay')).toBeInTheDocument();
  });

  it('shows available credit lines in selection view', () => {
    renderPage();
    expect(screen.getByText('Primary Business Line')).toBeInTheDocument();
  });

  it('navigates to input view when a credit line is selected', () => {
    renderPage();
    fireEvent.click(screen.getByText('Primary Business Line'));
    expect(screen.getByText('Make a repayment')).toBeInTheDocument();
  });

  it('preselects a credit line when line param is provided', () => {
    renderPage(['/repay?line=CL-2024-001']);
    expect(screen.getByText('Make a repayment')).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.startsWith('Primary Business Line')),
    ).toBeInTheDocument();
  });

  it('shows the PayoffProjection component in input view', () => {
    renderPage(['/repay?line=CL-2024-001']);
    expect(screen.getByText('Payoff Projection')).toBeInTheDocument();
  });

  it('shows current debt amount', () => {
    renderPage(['/repay?line=CL-2024-001']);
    const matches = screen.getAllByText('$187,500.00');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has quick percentage buttons', () => {
    renderPage(['/repay?line=CL-2024-001']);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('MAX')).toBeInTheDocument();
  });

  it('Review Repayment button is disabled with no amount', () => {
    renderPage(['/repay?line=CL-2024-001']);
    expect(screen.getByText('Review Repayment')).toBeDisabled();
  });

  it('has I need help button', () => {
    renderPage(['/repay?line=CL-2024-001']);
    expect(screen.getByText('I need help')).toBeInTheDocument();
  });

  it('has Cancel button', () => {
    renderPage(['/repay?line=CL-2024-001']);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Smart Pay button when a credit line is selected', () => {
    renderPage(['/repay?line=CL-2024-001']);
    expect(screen.getByRole('button', { name: /smart pay/i })).toBeInTheDocument();
  });

  it('Smart Pay button has correct aria-label with suggested amount', () => {
    renderPage(['/repay?line=CL-2024-001']);
    const button = screen.getByRole('button', { name: /smart pay/i });
    expect(button).toHaveAttribute('aria-label', 'Smart Pay suggested repayment of $3,200.00');
  });

  it('clicking Smart Pay fills the amount input with the suggested value', () => {
    renderPage(['/repay?line=CL-2024-001']);
    const smartPayBtn = screen.getByRole('button', { name: /smart pay/i });
    fireEvent.click(smartPayBtn);
    const input = screen.getByRole('spinbutton', { name: /amount to repay/i });
    expect(input).toHaveValue(3200);
  });

  it('Smart Pay enables Review Repayment when clicked', () => {
    renderPage(['/repay?line=CL-2024-001']);
    const reviewBtn = screen.getByText('Review Repayment');
    expect(reviewBtn).toBeDisabled();
    const smartPayBtn = screen.getByRole('button', { name: /smart pay/i });
    fireEvent.click(smartPayBtn);
    expect(reviewBtn).not.toBeDisabled();
  });

  describe('Focus-visible outline accessibility', () => {
    it('applies focus-visible classes on selection view back button and credit line options', () => {
      renderPage(['/repay']);
      const backBtn = screen.getByRole('button', { name: /back/i });
      expect(backBtn).toHaveClass('focus-visible:outline');

      const clOption = screen.getByRole('button', { name: /primary business line/i });
      expect(clOption).toHaveClass('focus-visible:outline');
    });

    it('applies focus-visible classes on input view back, preset, input, and review buttons', () => {
      renderPage(['/repay?line=CL-2024-001']);
      const backBtn = screen.getByRole('button', { name: /back to credit lines/i });
      expect(backBtn).toHaveClass('focus-visible:outline');

      const preset25 = screen.getByRole('button', { name: /25 percent/i });
      expect(preset25).toHaveClass('focus-visible:outline');

      const smartPayBtn = screen.getByRole('button', { name: /smart pay/i });
      expect(smartPayBtn).toHaveClass('focus-visible:outline');

      const input = screen.getByRole('spinbutton', { name: /amount to repay/i });
      expect(input).toHaveClass('focus-visible:outline');

      const reviewBtn = screen.getByRole('button', { name: /review repayment/i });
      expect(reviewBtn).toHaveClass('focus-visible:outline');
    });

    it('applies focus-visible classes on help and cancel buttons', () => {
      renderPage(['/repay?line=CL-2024-001']);
      const helpBtn = screen.getByRole('button', { name: /i need help/i });
      expect(helpBtn).toHaveClass('focus-visible:outline');

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(cancelBtn).toHaveClass('focus-visible:outline');
    });

    it('applies focus-visible classes on review step buttons', () => {
      renderPage(['/repay?line=CL-2024-001']);
      fireEvent.click(screen.getByRole('button', { name: /smart pay/i }));
      fireEvent.click(screen.getByRole('button', { name: /review repayment/i }));

      const backBtn = screen.getByRole('button', { name: /back/i });
      expect(backBtn).toHaveClass('focus-visible:outline');

      const confirmBtn = screen.getByRole('button', { name: /confirm repayment/i });
      expect(confirmBtn).toHaveClass('focus-visible:outline');
    });
  });
});
