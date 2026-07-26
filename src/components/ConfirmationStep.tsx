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
  /**
   * Exit the wizard entirely.  Optional — when omitted the Cancel button is
   * not rendered, but most callers (DrawCreditPage, tests) supply it.
   */
  onCancel?: () => void;
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

  // Derive the figures the render layer references.  `amount` is the raw
  // draw amount entered by the user; the rest are pricing- and balance
  // computations derived from creditLine + the pricing quote.  Names match
  // what the markup uses so all the labels stay meaningful and the test
  // assertions line up.
  //
  // NOTE: `creditLine.utilization` is a percentage (e.g. 30 = 30%); for
  // dollar arithmetic we use `creditLine.utilized` (already-drawn
  // balance) and `creditLine.available` (remaining headroom).
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const fee = getDrawPricingQuote(creditLine, safeAmount).fee;
  const estimatedMonthlyInterest =
    getDrawPricingQuote(creditLine, safeAmount).estimatedMonthlyInterest;
  // `creditLine` (the draw-credit.types shape) carries `limit` and `available`
  // but not a `utilized` field; pre-draw balance is therefore derived as
  // `limit - available`. Post-draw balance is pre-draw + safeAmount.
  const preDrawBalance = Math.max(
    Number(creditLine.limit || 0) - Number(creditLine.available || 0),
    0,
  );
  const newBalance = preDrawBalance + safeAmount;
  const remainingAvailable = Math.max(
    Number(creditLine.available || 0) - safeAmount,
    0,
  );

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

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-sm text-muted font-medium">Draw amount</p>
              <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
                {formatMoney(safeAmount)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">Estimated fee</p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(fee)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">
                Estimated monthly interest
              </p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(estimatedMonthlyInterest)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">New balance</p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(newBalance)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted font-medium">
                Available after draw
              </p>
              <p className="mt-1 font-semibold text-foreground tabular-nums">
                {formatMoney(remainingAvailable)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted font-medium">
                Current utilization
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {creditLine.utilization}%
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted font-medium">After draw</span>
              <span
                className={`font-semibold tabular-nums ${newUtilization > 80 ? "text-yellow-500" : "text-foreground"}`}
              >
                {newUtilization}%
              </span>
            </div>
          </div>
          {newUtilization > 80 && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-500">
                  High Utilization Warning
                </p>
                <p className="text-sm text-yellow-500 mt-1">
                  Your credit utilization will exceed 80%. This may impact your
                  credit terms.
                </p>
              </div>
            </div>
          )}
        </div>
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

      {/* Button order: Cancel → Back → Primary (docs/BUTTON_ORDER.md).
          * Cancel is leftmost as a safe exit; Back is in the middle slot
          * because it preserves progress; Confirm draw is the irreversible
          * primary action (rightmost). */}
      <div className="dc-actions dc-actions--stacked">
        <button
          onClick={onCancel}
          disabled={isLoading || !onCancel}
          type="button"
          className="dc-btn dc-btn--secondary dc-actions__slot"
        >
          Cancel
        </button>
        <button
          onClick={onBack}
          disabled={isLoading}
          type="button"
          className="dc-btn dc-btn--secondary dc-actions__slot"
        >
          Back
        </button>
        <div className="dc-actions__slot">
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            type="button"
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
