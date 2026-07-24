/**
 * AmountInput
 *
 * Step 2 of the draw-credit flow. Lets the user type a draw amount or
 * choose from quick-preset percentage buttons (25 / 50 / 75 / 100 %).
 *
 * Design-token classes used (all from `src/index.css` `.dc-*` block):
 *   dc-step, dc-step__title, dc-step__subtitle,
 *   dc-amount-field, dc-amount-field__prefix, dc-amount-field__input,
 *   dc-banner, dc-banner--error, dc-banner__icon,
 *   dc-presets, dc-preset-btn,
 *   dc-balance-card, dc-balance-row, dc-balance-row__label, dc-balance-row__value,
 *   dc-actions, dc-btn, dc-btn--secondary, dc-btn--primary
 *
 * Accessibility:
 *   - Input linked to helper and error IDs via aria-describedby.
 *   - Error message has role="alert" so it is announced immediately.
 *   - Preset buttons have aria-label with percentage text for screen readers.
 *   - Continue button is disabled (not hidden) when the amount is invalid.
 */

import { CreditLine } from "@/types/draw-credit.types";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface AmountInputProps {
  creditLine: CreditLine;
  onAmountChange: (amount: number) => void;
  onNext: (amount: number) => void;
  onBack: () => void;
}

export function AmountInput({
  creditLine,
  onAmountChange,
  onNext,
  onBack,
}: AmountInputProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  /* Stable IDs for ARIA associations */
  const helperId = "draw-amount-helper";
  const errorId = "draw-amount-error";

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    onAmountChange(numAmount);

    if (numAmount > 0 && numAmount <= creditLine.available) {
      setError("");
    } else if (numAmount > creditLine.available) {
      setError(`Maximum available: $${creditLine.available.toLocaleString()}`);
    } else if (numAmount > 0) {
      setError("");
    }
  }, [amount, creditLine.available, onAmountChange]);

  const handlePreset = (percent: number) => {
    const preset = Math.floor((creditLine.available * percent) / 100);
    setAmount(preset.toString());
  };

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= creditLine.available;
  const describedBy = error ? `${helperId} ${errorId}` : helperId;

  return (
    <div className="dc-step">
      {/* Step header */}
      <div>
        <h2 className="dc-step__title">Enter Amount</h2>
        <p className="dc-step__subtitle" id={helperId}>
          {creditLine.name}
        </p>
      </div>

      {/* Amount input field */}
      <div>
        <label htmlFor="draw-amount-input" className="sr-only">
          Amount to draw
        </label>
        <div className="dc-amount-field">
          {/* Dollar prefix — hidden from assistive tech since input has its own label */}
          <span className="dc-amount-field__prefix" aria-hidden="true">
            $
          </span>
          <input
            id="draw-amount-input"
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="dc-amount-field__input"
            min="0"
            max={creditLine.available}
            aria-invalid={!!error}
            aria-describedby={describedBy}
          />
        </div>

        {/* Error banner — role="alert" ensures immediate announcement */}
        {error && (
          <div
            id={errorId}
            className="dc-banner dc-banner--error"
            role="alert"
            style={{ marginTop: "var(--space-3)" }}
          >
            <AlertCircle
              className="dc-banner__icon"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick-preset buttons */}
      <div>
        <p className="dc-section-label" style={{ marginBottom: "var(--space-3)" }}>
          Quick preset
        </p>
        <div className="dc-presets">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => handlePreset(percent)}
              className="dc-preset-btn"
              aria-label={`Set amount to ${percent} percent of available balance`}
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      {/* Balance summary */}
      <div className="dc-balance-card">
        <div className="dc-balance-row">
          <span className="dc-balance-row__label">Available:</span>
          <span className="dc-balance-row__value">
            ${creditLine.available.toLocaleString()}
          </span>
        </div>
        <div className="dc-balance-row">
          <span className="dc-balance-row__label">Requested:</span>
          <span className="dc-balance-row__value">
            ${numAmount.toLocaleString()}
          </span>
        </div>
        <div className="dc-balance-row">
          <span className="dc-balance-row__label">Remaining:</span>
          <span className="dc-balance-row__value">
            ${(creditLine.available - numAmount).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Back / Continue actions */}
      <div className="dc-actions">
        <button
          onClick={onBack}
          className="dc-btn dc-btn--secondary dc-actions__slot"
        >
          Back
        </button>
        <button
          onClick={() => onNext(numAmount)}
          disabled={!isValid}
          className="dc-btn dc-btn--primary dc-actions__slot"
          aria-disabled={!isValid}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
