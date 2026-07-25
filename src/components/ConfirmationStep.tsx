/**
 * ConfirmationStep
 *
 * Step 3 of the draw-credit flow. Displays a full summary of the draw
 * (credit line, amounts, projected utilization) and requires the user to
 * accept the terms before submitting.
 *
 * Design-token classes used (all from `src/index.css` `.dc-*` block):
 *   dc-step, dc-step__title, dc-step__subtitle,
 *   dc-balance-card, dc-balance-row, dc-balance-row__label, dc-balance-row__value,
 *   dc-banner, dc-banner--warning, dc-banner__icon, dc-banner__body, dc-banner__title,
 *   dc-terms-label, dc-terms-label__checkbox, dc-terms-label__text,
 *   dc-actions, dc-actions--stacked, dc-actions__slot,
 *   dc-btn, dc-btn--secondary, dc-btn--primary, dc-btn--full,
 *   dc-hint, dc-hint--right
 *
 * Accessibility:
 *   - High-utilization warning banner has role="alert" so it is announced.
 *   - Confirm button is `disabled` (not hidden) when terms are not accepted.
 *   - aria-disabled mirrors the disabled prop for redundant AT signals.
 */

import { CreditLine } from "@/types/draw-credit.types";
import { AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { CreditLineSummaryBlock } from "@/components/CreditLineSummaryBlock";
import { PendingButton } from "@/components/PendingButton";
import { formatMoney } from "@/utils/amountValidation";
import { useWallet } from "@/context/WalletContext";
import { getDrawPricingQuote } from "@/lib/draw-credit-pricing";

interface ConfirmationStepProps {
  /** The credit line the user is drawing from. */
  creditLine: CreditLine;
  /** Whole-USD draw amount the user entered in step 2. */
  amount: number;
  /**
   * Invoked when the user agrees to terms and presses the primary action.
   * The parent wizard handles network submission and step transition.
   */
  onConfirm: () => void;
  /** Return to the previous (preview) step without losing context. */
  onBack: () => void;
  /** Exit the wizard entirely. */
  onCancel: () => void;
  /**
   * When true, the primary button shows the `PendingButton` spinner and is
   * disabled to prevent double-submission. Driven by the parent's
   * network request state.
   */
  isLoading?: boolean;
  /** Controlled checkbox state for terms acknowledgment (lifted to wizard). */
  agreedToTerms?: boolean;
  /** Notified when the user toggles the terms checkbox. */
  onAgreedToTermsChange?: (agreed: boolean) => void;
}

/**
 * Step 4 of the draw-credit wizard: final confirmation.
 *
 * Surfaces the unambiguous numbers (draw amount, fee, post-draw utilization,
 * APR) alongside a "I agree to the terms" checkbox. The primary action is
 * disabled until the checkbox is ticked — see UX_RATIONALE.md
 * "Repayment uses a confirmation modal" for the irreversible-action policy
 * this enforces.
 *
 * Local state: `agreedToTerms` (checkbox). All other state lives in the
 * parent wizard.
 *
 * Accessibility: the primary button uses `PendingButton`, which sets
 * `aria-busy="true"` and disables the button while `isLoading`. The
 * checkbox is a native input so it inherits keyboard semantics.
 */
export function ConfirmationStep({
  creditLine,
  amount,
  onConfirm,
  onBack,
  onCancel,
  isLoading = false,
  agreedToTerms: agreedToTermsProp,
  onAgreedToTermsChange,
}: ConfirmationStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const newUtilization = Math.round(
    ((creditLine.limit - creditLine.available + amount) / creditLine.limit) *
      100,
  );
  const isHighUtilization = newUtilization > 80;
  const canConfirm = agreedToTerms && !isLoading;

  return (
    <div className="dc-step">
      {/* Step header */}
      <div>
        <h2 className="dc-step__title">Review &amp; Confirm</h2>
        <p className="dc-step__subtitle">
          Confirm your draw details before submitting.
        </p>
      </div>

      {/* Credit-line summary block (limit / utilized / available) */}
      <CreditLineSummaryBlock creditLine={creditLine} amount={amount} />

      {/* Draw details card */}
      <div className="dc-balance-card">
        {/* Draw amount */}
        <div className="dc-balance-row" style={{ alignItems: "center" }}>
          <span className="dc-balance-row__label" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
            Draw Amount
          </span>
          <span style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--text)" }}>
            ${amount.toLocaleString()}
          </span>
        </div>

        {/* Current utilization */}
        <div className="dc-balance-row" style={{ alignItems: "center" }}>
          <span className="dc-balance-row__label" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
            Current Utilization
          </span>
          <span className="dc-balance-row__value">
            {creditLine.utilization}%
          </span>
        </div>

        {/* After-draw utilization */}
        <div className="dc-balance-row" style={{ alignItems: "center" }}>
          <span className="dc-balance-row__label" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
            After Draw
          </span>
          <span
            className={isHighUtilization ? "dc-util-row__value--warning" : "dc-balance-row__value"}
          >
            {newUtilization}%
          </span>
        </div>

        {/* High-utilization warning — role="alert" ensures immediate announcement */}
        {isHighUtilization && (
          <div
            className="dc-banner dc-banner--warning"
            role="alert"
            style={{ marginTop: "var(--space-4)" }}
          >
            <AlertCircle
              className="dc-banner__icon"
              aria-hidden="true"
            />
            <div className="dc-banner__body">
              <p className="dc-banner__title">High Utilization Warning</p>
              <p>
                Your credit utilization will exceed 80%. This may impact your
                credit terms.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Terms & conditions checkbox */}
      <label className="dc-terms-label">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="dc-terms-label__checkbox"
          aria-label="I agree to the terms and conditions and authorise this draw"
        />
        <span className="dc-terms-label__text">
          I agree to the terms and conditions and authorize this draw. The funds
          will be deposited within 1-2 business days.
        </span>
      </label>

      {/* Back / Confirm actions */}
      <div className="dc-actions dc-actions--stacked">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="dc-btn dc-btn--secondary dc-actions__slot"
        >
          Back
        </button>
        <div className="dc-actions__slot">
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            className="dc-btn dc-btn--primary dc-btn--full"
          >
            {isLoading ? "Processing…" : "Confirm draw"}
          </button>
          {/* Hint shown only when terms not yet accepted */}
          {!agreedToTerms && !isLoading && (
            <p className="dc-hint dc-hint--right">
              Accept terms to enable confirmation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
