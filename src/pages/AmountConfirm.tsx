/**
 * AmountConfirm Page Component
 *
 * Provides a dedicated review & confirmation screen for repayment and draw amounts.
 * Includes expandable breakdown sections for principal, interest, fees, and schedule.
 * Integrated with src/styles/print.css for printing: chrome elements (navigation,
 * action buttons) are hidden while all collapsible sections auto-expand on paper.
 *
 * Accessibility (WCAG 2.1 AA):
 * - Semantic sectioning and heading hierarchy.
 * - Native `<details>` and ARIA collapsible states.
 * - Minimum 44px touch targets.
 * - High-contrast design token compliance across light/dark themes.
 */

import { useState, useId } from 'react';
import { ArrowLeft, Printer, ChevronDown, CheckCircle } from 'lucide-react';
import { formatMoney, requiresRepayConfirmation } from '@/utils/amountValidation';
import { TypedAmountConfirmField, isTypedAmountMatch } from '@/components/TypedAmountConfirm';
import './AmountConfirm.css';

export interface AmountConfirmProps {
  /** Repayment or draw amount in USD. Defaults to 5000 if not specified. */
  amount?: number;
  /** Name or reference of the credit line. */
  creditLineName?: string;
  /** Called when the user confirms the transaction. */
  onConfirm?: () => void;
  /** Called when the user cancels or navigates back. */
  onCancel?: () => void;
}

export function AmountConfirm({
  amount = 5000,
  creditLineName = 'Credit Line #1',
  onConfirm,
  onCancel,
}: AmountConfirmProps) {
  const [typedValue, setTypedValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const breakdownPanelId = useId();

  const needsTypedConfirm = requiresRepayConfirmation(amount);
  const isMatch = !needsTypedConfirm || isTypedAmountMatch(typedValue, amount);
  const canConfirm = isMatch && !isSubmitted;

  // Breakdown calculations
  const estimatedInterest = Math.round(amount * 0.025 * 100) / 100;
  const processingFee = Math.round(amount * 0.005 * 100) / 100;
  const totalRepayment = amount + estimatedInterest + processingFee;

  const handlePrint = () => {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  };

  const handleConfirmSubmit = () => {
    if (!canConfirm) return;
    setIsSubmitted(true);
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="amount-confirm-page">
      {/* Top Header Chrome (Hidden on Print) */}
      <div className="amount-confirm__chrome no-print">
        <button
          type="button"
          onClick={onCancel}
          className="amount-confirm__back-btn"
          aria-label="Go back to previous screen"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="amount-confirm__print-btn"
          aria-label="Print confirmation statement"
        >
          <Printer size={16} aria-hidden="true" />
          <span>Print Statement</span>
        </button>
      </div>

      {/* Main Confirmation Card */}
      <div className="amount-confirm__card">
        <header className="amount-confirm__header">
          <h1 className="amount-confirm__title">Confirm Repayment Amount</h1>
          <p className="amount-confirm__subtitle">
            Review account and repayment details for {creditLineName}.
          </p>
        </header>

        {/* Display Amount Box */}
        <div className="amount-confirm__amount-box">
          <p className="amount-confirm__amount-label">Confirmation Amount</p>
          <p className="amount-confirm__amount-value">{formatMoney(amount)}</p>
        </div>

        {/* Collapsible Breakdown Section 1 (Native <details> for automatic print expansion) */}
        <details className="amount-confirm__collapsible" open={isBreakdownOpen} onToggle={(e) => setIsBreakdownOpen(e.currentTarget.open)}>
          <summary className="amount-confirm__collapsible-trigger">
            <span className="amount-confirm__collapsible-title">Repayment Breakdown & Fees</span>
            <ChevronDown
              size={18}
              className={`amount-confirm__chevron ${isBreakdownOpen ? 'amount-confirm__chevron--open' : ''}`}
              aria-hidden="true"
            />
          </summary>
          <div className="amount-confirm__collapsible-content">
            <div className="amount-confirm__detail-row">
              <span className="amount-confirm__detail-label">Principal Amount</span>
              <span className="amount-confirm__detail-value">{formatMoney(amount)}</span>
            </div>
            <div className="amount-confirm__detail-row">
              <span className="amount-confirm__detail-label">Estimated Monthly Interest (2.5%)</span>
              <span className="amount-confirm__detail-value">{formatMoney(estimatedInterest)}</span>
            </div>
            <div className="amount-confirm__detail-row">
              <span className="amount-confirm__detail-label">Network / Processing Fee (0.5%)</span>
              <span className="amount-confirm__detail-value">{formatMoney(processingFee)}</span>
            </div>
            <div className="amount-confirm__detail-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 700 }}>
              <span className="amount-confirm__detail-label" style={{ color: 'var(--text)' }}>Total Amount Due</span>
              <span className="amount-confirm__detail-value">{formatMoney(totalRepayment)}</span>
            </div>
          </div>
        </details>

        {/* Collapsible Breakdown Section 2 (Schedule Details) */}
        <details className="amount-confirm__collapsible">
          <summary className="amount-confirm__collapsible-trigger">
            <span className="amount-confirm__collapsible-title">Payment Schedule & Policy</span>
            <ChevronDown size={18} className="amount-confirm__chevron" aria-hidden="true" />
          </summary>
          <div className="amount-confirm__collapsible-content">
            <div className="amount-confirm__detail-row">
              <span className="amount-confirm__detail-label">Effective Date</span>
              <span className="amount-confirm__detail-value">Immediate (On-chain Settlement)</span>
            </div>
            <div className="amount-confirm__detail-row">
              <span className="amount-confirm__detail-label">Grace Period</span>
              <span className="amount-confirm__detail-value">0 Days (Direct Credit)</span>
            </div>
            <div className="amount-confirm__detail-row">
              <span className="amount-confirm__detail-label">Cancellation Policy</span>
              <span className="amount-confirm__detail-value">Final once submitted to network</span>
            </div>
          </div>
        </details>

        {/* Typed Amount Confirmation Input (Hidden when printing via print.css) */}
        {needsTypedConfirm && (
          <div style={{ marginTop: '1.5rem' }}>
            <TypedAmountConfirmField
              amount={amount}
              value={typedValue}
              onChange={setTypedValue}
              idPrefix="amount-confirm-page-field"
            />
          </div>
        )}

        {/* Success Confirmation State */}
        {isSubmitted && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'rgba(63, 185, 80, 0.1)',
              border: '1px solid var(--success)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success)',
              marginTop: '1rem',
            }}
            role="status"
          >
            <CheckCircle size={20} aria-hidden="true" />
            <span>Repayment amount of {formatMoney(amount)} confirmed successfully!</span>
          </div>
        )}

        {/* Action Buttons (Hidden on Print) */}
        <div className="amount-confirm__actions no-print">
          <button
            type="button"
            onClick={onCancel}
            className="amount-confirm__btn amount-confirm__btn--secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            className="amount-confirm__btn amount-confirm__btn--primary"
          >
            {isSubmitted ? 'Confirmed' : 'Confirm Repayment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AmountConfirm;
