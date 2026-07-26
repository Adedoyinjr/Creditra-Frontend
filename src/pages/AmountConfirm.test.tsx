import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AmountConfirm } from './AmountConfirm';

describe('AmountConfirm Page', () => {
  it('renders confirmation title, formatted amount, and breakdown sections', () => {
    render(<AmountConfirm amount={5000} creditLineName="Test Line #1" />);

    expect(screen.getByText('Confirm Repayment Amount')).toBeInTheDocument();
    expect(screen.getByText(/Test Line #1/i)).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('Repayment Breakdown & Fees')).toBeInTheDocument();
    expect(screen.getByText('Payment Schedule & Policy')).toBeInTheDocument();
  });

  it('triggers window.print when Print Statement button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<AmountConfirm amount={2500} />);

    const printBtn = screen.getByRole('button', { name: /print statement/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it('disables confirmation button until exact amount typed for large repayments', () => {
    const onConfirmMock = vi.fn();
    render(<AmountConfirm amount={5000} onConfirm={onConfirmMock} />);

    const confirmBtn = screen.getByRole('button', { name: /confirm repayment/i });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByRole('textbox', { name: /type the repayment amount to confirm/i });
    fireEvent.change(input, { target: { value: '5000' } });

    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(/confirmed successfully/i);
  });

  it('invokes onCancel when Back or Cancel button is clicked', () => {
    const onCancelMock = vi.fn();
    render(<AmountConfirm amount={1000} onCancel={onCancelMock} />);

    const backBtn = screen.getByRole('button', { name: /go back to previous screen/i });
    fireEvent.click(backBtn);

    expect(onCancelMock).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    fireEvent.click(cancelBtn);

    expect(onCancelMock).toHaveBeenCalledTimes(2);
  });
});
