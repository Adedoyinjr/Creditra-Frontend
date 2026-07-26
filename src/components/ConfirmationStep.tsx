/**
 * ConfirmationStep
 *
 * Step 4 of the draw-credit flow. Displays a full summary of the draw
 * (credit line, amounts, projected utilization) and requires the user to
 * accept the terms before submitting.
 *
 * Design-token classes used (all from `src/index.css` `:root` block):
 *   bg-surface, border-border, text-foreground, text-muted,
 *   bg-background, accent-accent
 *
 * Polish additions (issue #429):
 *   - Prominent cost-breakdown card with draw amount, 1-time fee, monthly
 *     interest and totals in clear visual hierarchy.
 *   - Risk-band badge (Prime / Standard / Watch) with accessible aria-label.
 *   - Collapsible "How is my APR calculated?" disclosure (aria-expanded +
 *     aria-controls) exposing base rate, utilization and term adjustments.
 *   - Before / after utilization progress bars (role="progressbar").
 *   - Risk-adjusted fee notice (role="note") for Watch-band lines.
 *
 * Accessibility:
 *   - High-utilization warning has role="alert" so it is announced immediately.
 *   - Confirm button is `disabled` (not hidden) when terms are not accepted.
 *   - PendingButton sets aria-busy="true" while isLoading.
 *   - Color is never the sole signal — icons and text labels accompany every
 *     colored element (WCAG 1.4.1 Use of Color).
 */

import { AccessibleTooltip } from "@/components/AccessibleTooltip";
import { CreditLine } from "@/types/draw-credit.types";
import { AlertCircle, ChevronDown, ChevronUp, Info, ShieldCheck } from "lucide-react";
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

/** Map a DrawPricingRiskBand to a human-readable label and visual tone. */
function getRiskBandMeta(riskBand: string): {
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (riskBand) {
    case "Prime":
      return {
        label: "Prime",
        description: "Lowest risk tier — best available pricing.",
        colorClass: "text-green-400",
        bgClass: "bg-green-500/10",
        borderClass: "border-green-500/30",
      };
    case "Watch":
      return {
        label: "Watch",
        description: "Elevated risk tier — pricing reflects higher uncertainty.",
        colorClass: "text-yellow-400",
        bgClass: "bg-yellow-500/10",
        borderClass: "border-yellow-500/30",
      };
    case "Standard":
    default:
      return {
        label: "Standard",
        description: "Mid-tier risk — standard market pricing applies.",
        colorClass: "text-blue-400",
        bgClass: "bg-blue-500/10",
        borderClass: "border-blue-500/30",
      };
  }
}

/** Narrow progress bar used for utilization visualization. */
function UtilizationBar({
  pct,
  isHighlighted,
  "aria-label": ariaLabel,
}: {
  pct: number;
  isHighlighted: boolean;
  "aria-label": string;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const barColor =
    clamped > 80
      ? "bg-yellow-500"
      : clamped > 50
        ? "bg-blue-400"
        : "bg-blue-500";

  return (
    <div
      className="w-full rounded-full bg-border h-2.5"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={`h-2.5 rounded-full transition-all duration-300 ${barColor} ${isHighlighted ? "ring-1 ring-offset-1 ring-blue-400" : ""}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

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
  const [agreedToTermsInternal, setAgreedToTermsInternal] = useState(false);
  const agreedToTerms = agreedToTermsProp ?? agreedToTermsInternal;
  const setAgreedToTerms = (value: boolean) => {
    onAgreedToTermsChange?.(value);
    if (agreedToTermsProp === undefined) {
      setAgreedToTermsInternal(value);
    }
  };

  /** Controls the "How is my APR calculated?" collapsible section. */
  const [aprDisclosureOpen, setAprDisclosureOpen] = useState(false);

  const { status } = useWallet();
  const utilizedBalance = creditLine.limit - creditLine.available;
  const safeAmount = Math.max(amount, 0);

  const {
    fee,
    apr,
    estimatedMonthlyInterest,
    riskBand,
    termMonths,
    utilizationAdjustmentLabel,
    termAdjustmentLabel,
  } = getDrawPricingQuote(creditLine, safeAmount);

  // Reconstruct the base APR before adjustments for the disclosure panel.
  // The pricing module does not export BASE_APR_BY_RISK_BAND, but the
  // adjustment point values are deterministic — mirror the same branches.
  const utilizationAdjPts =
    creditLine.utilization >= 80
      ? 2
      : creditLine.utilization >= 50
        ? 1.25
        : 0.5;
  const termAdjPts = termMonths > 24 ? 2.5 : termMonths > 12 ? 1.5 : 0.5;
  const baseApr = Math.round((apr - utilizationAdjPts - termAdjPts) * 100) / 100;

  const newBalance = utilizedBalance + safeAmount + fee;
  const remainingAvailable = Math.max(creditLine.limit - newBalance, 0);
  const newUtilization = Math.round((newBalance / creditLine.limit) * 100);
  const currentUtilizationPct = creditLine.utilization;

  const isDrawDisabled = !agreedToTerms || isLoading;
  const disabledHelperText = !agreedToTerms
    ? "Accept the authorization terms to enable the Draw button."
    : "Submitting your draw request. Please wait.";

  const riskBandMeta = getRiskBandMeta(riskBand);
  const isWatchBand = riskBand === "Watch";
  const isHighUtilization = newUtilization > 80;

  return (
    <div className="space-y-8">
      {/* ── Step header ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold uppercase text-muted">Step 4</p>
        <h2
          id="confirm-draw-heading"
          className="mt-1 text-2xl font-bold text-foreground sm:text-3xl"
        >
          Review and confirm
        </h2>
        <p className="text-muted mt-2">
          Check your draw details below. Once you confirm, the request is
          submitted to the network.
        </p>
      </div>

      {/* ── Credit line summary card ─────────────────────────────────────── */}
      <CreditLineSummaryBlock creditLine={creditLine} amount={amount} />

      {/* ── Cost breakdown card ───────────────────────────────────────────── */}
      <section
        aria-labelledby="cost-breakdown-heading"
        className="rounded-xl border border-border bg-surface p-5 space-y-5"
      >
        <h3
          id="cost-breakdown-heading"
          className="text-sm font-semibold uppercase text-muted tracking-wide"
        >
          Cost breakdown
        </h3>

        {/* Primary number — draw amount + risk-band badge */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted font-medium">Draw amount</p>
            <p
              className="mt-1 text-4xl font-bold text-foreground tabular-nums"
              data-testid="draw-amount-display"
            >
              {formatMoney(safeAmount)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${riskBandMeta.bgClass} ${riskBandMeta.borderClass} ${riskBandMeta.colorClass}`}
            data-testid="risk-band-badge"
            aria-label={`Risk band: ${riskBandMeta.label} — ${riskBandMeta.description}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {riskBandMeta.label} band
          </span>
        </div>

        {/* Line items */}
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <dt className="text-sm text-muted font-medium">One-time fee (1%)</dt>
            <dd className="mt-1 font-semibold text-foreground tabular-nums" data-testid="fee-display">
              {formatMoney(fee)}
            </dd>
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-3">
            <dt className="text-sm text-muted font-medium flex items-center gap-1.5">
              APR
              <AccessibleTooltip label="Annual Percentage Rate — the annualised cost of borrowing.">
                <span className="sr-only">What is APR?</span>
              </AccessibleTooltip>
            </dt>
            <dd
              className="mt-1 font-semibold text-foreground tabular-nums"
              data-testid="apr-display"
            >
              {apr}%
            </dd>
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-3">
            <dt className="text-sm text-muted font-medium">Est. monthly interest</dt>
            <dd className="mt-1 font-semibold text-foreground tabular-nums" data-testid="monthly-interest-display">
              {formatMoney(estimatedMonthlyInterest)}
            </dd>
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-3">
            <dt className="text-sm text-muted font-medium">Term</dt>
            <dd className="mt-1 font-semibold text-foreground tabular-nums">
              {termMonths} months
            </dd>
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-3">
            <dt className="text-sm text-muted font-medium">New balance</dt>
            <dd className="mt-1 font-semibold text-foreground tabular-nums" data-testid="new-balance-display">
              {formatMoney(newBalance)}
            </dd>
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-3">
            <dt className="text-sm text-muted font-medium">Available after draw</dt>
            <dd className="mt-1 font-semibold text-foreground tabular-nums">
              {formatMoney(remainingAvailable)}
            </dd>
          </div>
        </dl>

        {/* ── Collapsible APR breakdown ─────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-background/40">
          <button
            type="button"
            onClick={() => setAprDisclosureOpen((prev) => !prev)}
            aria-expanded={aprDisclosureOpen}
            aria-controls="apr-breakdown-body"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-border/40 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            data-testid="apr-disclosure-toggle"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
              How is my APR calculated?
            </span>
            {aprDisclosureOpen ? (
              <ChevronUp className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
            )}
          </button>

          {aprDisclosureOpen && (
            <div
              id="apr-breakdown-body"
              data-testid="apr-breakdown-body"
              className="border-t border-border px-4 py-4 space-y-3 text-sm"
            >
              <p className="text-muted text-xs">
                Your APR is composed of a base rate for your risk band, plus
                adjustments for your current utilization level and the draw
                term length.
              </p>
              <dl className="space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">
                    Base rate ({riskBandMeta.label} band)
                  </dt>
                  <dd className="font-semibold text-foreground tabular-nums" data-testid="apr-base-rate">
                    {baseApr}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{utilizationAdjustmentLabel}</dt>
                  <dd className="font-semibold text-foreground tabular-nums" data-testid="apr-utilization-adj">
                    +{utilizationAdjPts}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{termAdjustmentLabel}</dt>
                  <dd className="font-semibold text-foreground tabular-nums" data-testid="apr-term-adj">
                    +{termAdjPts}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-2">
                  <dt className="font-semibold text-foreground">Total APR</dt>
                  <dd className="font-bold text-foreground tabular-nums" data-testid="apr-total">
                    {apr}%
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Risk-adjusted fee notice — Watch band only */}
        {isWatchBand && (
          <div
            className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3"
            role="note"
            data-testid="risk-fee-notice"
          >
            <AlertCircle
              className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-yellow-500">
                Risk-adjusted pricing
              </p>
              <p className="text-sm text-yellow-500/90 mt-1">
                Your credit line is in the Watch risk band. A higher APR applies
                to reflect elevated risk. Improving your on-chain repayment
                history may move you to a better band.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Utilization progress bars ─────────────────────────────────────── */}
      <section
        aria-labelledby="utilization-heading"
        className="rounded-xl border border-border bg-surface p-5 space-y-5"
      >
        <h3
          id="utilization-heading"
          className="text-sm font-semibold uppercase text-muted tracking-wide"
        >
          Credit utilization
        </h3>

        {/* Before */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted font-medium">Current utilization</span>
            <span className="font-semibold text-foreground tabular-nums">
              {currentUtilizationPct}%
            </span>
          </div>
          <UtilizationBar
            pct={currentUtilizationPct}
            isHighlighted={false}
            aria-label={`Current credit utilization: ${currentUtilizationPct} percent`}
          />
        </div>

        {/* After */}
        <div className="space-y-2" data-testid="utilization-after-section">
          <div className="flex justify-between text-sm">
            <span className="text-muted font-medium">After this draw</span>
            <span
              className={`font-semibold tabular-nums ${isHighUtilization ? "text-yellow-500" : "text-foreground"}`}
              data-testid="utilization-after-pct"
            >
              {newUtilization}%
            </span>
          </div>
          <UtilizationBar
            pct={newUtilization}
            isHighlighted
            aria-label={`Projected credit utilization after draw: ${newUtilization} percent`}
          />
        </div>

        {/* High utilization warning */}
        {isHighUtilization && (
          <div
            className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3"
            role="alert"
            data-testid="high-utilization-warning"
          >
            <AlertCircle
              className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-yellow-500">
                High utilization warning
              </p>
              <p className="text-sm text-yellow-500/90 mt-1">
                Your utilization will exceed 80% after this draw. High
                utilization may impact your credit terms and future pricing.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Terms checkbox ───────────────────────────────────────────────── */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-border">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 w-5 h-5 rounded accent-accent"
          data-testid="terms-checkbox"
        />
        <span className="text-sm text-foreground">
          I agree to the{" "}
          <AccessibleTooltip label="A term is a defined period or condition of your credit agreement.">
            <span>terms</span>
          </AccessibleTooltip>{" "}
          and conditions and authorize this draw. The funds will be deposited
          within 1–2 business days.
        </span>
      </label>

      {/* ── Wallet signing hint ───────────────────────────────────────────── */}
      {status === "connected" && !isLoading && (
        <div
          className="flex items-start gap-3 rounded-lg border p-4"
          style={{
            backgroundColor: "rgba(88,166,255,0.08)",
            borderColor: "rgba(88,166,255,0.3)",
          }}
          role="status"
        >
          <Info
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: "#58a6ff" }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium" style={{ color: "#e6edf3" }}>
            Your wallet will ask you to sign next
          </span>
        </div>
      )}

      {/* ── Sticky footer actions ─────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-surface/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        {/* Button order rule (docs/BUTTON_ORDER.md):
            Cancel (exit flow) — Back (previous step) — Draw (primary/confirm)
            flex-col-reverse reverses this on mobile so the primary stacks on top. */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {/* Cancel: leftmost — exits the wizard entirely */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border-2 border-border px-4 py-3 font-semibold text-foreground transition-colors hover:bg-background disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          {/* Back: adjacent to primary — returns to the previous step */}
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="rounded-lg border-2 border-border px-4 py-3 font-semibold text-foreground transition-colors hover:bg-background disabled:opacity-50 sm:w-auto"
          >
            Back
          </button>
          {/* Primary: rightmost — the forward/confirm action */}
          <div className="space-y-2 sm:ml-auto sm:min-w-64">
            <PendingButton
              type="button"
              onClick={onConfirm}
              pending={isLoading}
              pendingLabel="Processing draw..."
              disabled={isDrawDisabled}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              aria-describedby={
                isDrawDisabled ? "draw-disabled-helper" : undefined
              }
            >
              Draw
            </PendingButton>
            {isDrawDisabled && (
              <p
                id="draw-disabled-helper"
                className="text-center text-xs text-muted sm:text-right"
                role="status"
              >
                {disabledHelperText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
