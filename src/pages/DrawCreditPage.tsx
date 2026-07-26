"use client";

/**
 * DrawCreditPage
 *
 * Multi-step draw-credit flow:
 *   1. "select"  – choose a credit line
 *   2. "amount"  – enter draw amount (+ live preview)
 *   3. "confirm" – review details and accept terms
 *   4. "status"  – loading spinner → transaction result
 *
 * Spacing, colour and typography all reference design tokens via the
 * `dc-*` CSS classes defined in `src/index.css`. No raw Tailwind colour
 * utilities (blue-500, green-400, etc.) are used in this module.
 *
 * Accessibility:
 *   - <main> labelled with aria-label for screen-reader landmark navigation
 *   - Loading state wrapped in role="status" + aria-live="polite"
 *   - Spinner has aria-label describing the in-progress action
 *
 * Reduced-motion strategy (GrantFox FWC26 / issue #693):
 *   - DrawCreditPage.css suppresses all animations and transitions on
 *     `.dc-page` descendants via @media (prefers-reduced-motion: reduce)
 *     and the in-app [data-motion="reduced"] attribute override.
 *   - The animated `dc-spinner-ring` is replaced with a static SVG icon
 *     (dc-spinner-static) when `isReducedMotionActive` is true, giving
 *     a meaningful visual fallback rather than a frozen rotation frame.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/Skeleton";
import { useLocation, useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/context/ReducedMotionContext";
import { loadDraft, saveDraft, clearDraft } from "@/state/wizardDraft";
import { CreditLineSelector } from "@/components/CreditLineSelector";
import { AmountInput } from "@/components/AmountInput";
import { PreviewSection } from "@/components/PreviewSection";
import { ConfirmationStep } from "@/components/ConfirmationStep";
import { TransactionStatus } from "@/components/TransactionStatus";
import { InlineHelpOverlay } from "@/components/InlineHelpOverlay";
import { KbdHint } from "@/components/KbdHint";
import { CreditLine, DrawStep, Transaction } from "@/types/draw-credit.types";
import { mockCreditLines } from "@/lib/draw-credit-mock-data";
import { WhyApr } from "@/components/WhyApr";
import { DrawingLimit } from "@/components/DrawingLimit";
import { DrawSummaryBar } from "@/components/DrawSummaryBar";
import { useDrawWizardMicroProgress } from "@/hooks/useDrawWizardMicroProgress";
import { useReducedMotion } from "@/context/ReducedMotionContext";
import "@/components/DrawWizardMicroProgress.css";
import "./DrawCreditPage.css";

const drawSteps = [
  { id: "select", label: "Select line" },
  { id: "amount", label: "Enter amount" },
  { id: "preview", label: "Preview" },
  { id: "confirm", label: "Confirm" },
] as const;

type ProgressStep = (typeof drawSteps)[number]["id"];

/** Returns true if the currently focused element can receive text input. */
function isFocusedOnInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return (el as HTMLElement).isContentEditable;
}

export default function DrawCreditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeTransaction = location.state?.transaction as Transaction | undefined;
  const draftState = routeTransaction ? null : loadDraft();

  const [step, setStep] = useState<DrawStep>(
    routeTransaction ? "status" : draftState?.step ?? "select",
  );
  const [selectedCreditLine, setSelectedCreditLine] =
    useState<CreditLine | null>(draftState?.selectedCreditLine ?? null);
  const [amount, setAmount] = useState(draftState?.amount ?? 0);

  useEffect(() => {
    if (step === "status") {
      clearDraft();
    } else {
      saveDraft({ step, selectedCreditLine, amount });
    }
  }, [step, selectedCreditLine, amount]);

  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const [isWhyAprOpen, setIsWhyAprOpen] = useState(false);
  const whyAprTriggerRef = useRef<HTMLButtonElement>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(
    routeTransaction ?? null,
  );
  const [confirmationAcknowledged, setConfirmationAcknowledged] =
    useState(false);

  const { debouncedAnnouncement: microProgressAnnouncement } =
    useDrawWizardMicroProgress({
      selectedCreditLine,
      amount,
      confirmationAcknowledged,
      isOnConfirmStep: step === "confirm",
    });

  const { isReducedMotionActive } = useReducedMotion();

  const handleSelectCreditLine = (creditLine: CreditLine) => {
    setSelectedCreditLine(creditLine);
    setAmount(0);
    setConfirmationAcknowledged(false);
    setStep("amount");
  };

  const handleAmountNext = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    // Move to the status step immediately so the loading indicator
    // (animated spinner or static reduced-motion fallback) is visible
    // while the request is in flight.
    setIsLoading(true);
    setStep("status");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const succeeded = Math.random() > 0.2;
    const newTransaction: Transaction = {
      id: `TXN-${Date.now()}`,
      creditLineId: selectedCreditLine!.id,
      amount,
      status: succeeded ? "success" : "error",
      message: succeeded ? undefined : "Insufficient funds available",
      timestamp: new Date(),
    };

    setTransaction(newTransaction);
    setIsLoading(false);
    setStep("status");

    if (newTransaction.status === "success") {
      navigate("/draw-credit/success", {
        replace: true,
        state: { transaction: newTransaction },
      });
    }
  };

  const handleNewDraw = () => {
    navigate("/draw-credit", { replace: true });
    setStep("select");
    setSelectedCreditLine(null);
    setAmount(0);
    setConfirmationAcknowledged(false);
    setTransaction(null);
  };

  const handleBack = useCallback(() => {
    if (step === "amount") {
      setStep("select");
      setSelectedCreditLine(null);
      setConfirmationAcknowledged(false);
    } else if (step === "confirm") {
      setStep("amount");
      setConfirmationAcknowledged(false);
    }
  }, [step]);

  const handleCancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // ── Global keyboard handler ───────────────────────────────────────────────
  //
  // Only fires when focus is NOT on an editable element to avoid swallowing
  // normal typing.  The handler is re-registered whenever the step or amount
  // state changes so stale closure values never leak.

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never intercept when user is typing
      if (isFocusedOnInput()) return;

      switch (e.key) {
        case "Escape":
          if (step === "select") {
            e.preventDefault();
            handleCancel();
          } else if (step === "amount" || step === "confirm") {
            e.preventDefault();
            handleBack();
          }
          break;

        case "ArrowLeft":
          if (step === "amount" || step === "confirm") {
            e.preventDefault();
            handleBack();
          }
          break;

        case "ArrowRight":
          // Amount step: advance only when a valid (> 0) amount is set
          if (step === "amount" && amount > 0) {
            e.preventDefault();
            handleAmountNext(amount);
          }
          // Confirm step: advance only when terms are acknowledged
          if (step === "confirm" && confirmationAcknowledged) {
            e.preventDefault();
            handleConfirm();
          }
          break;

        case "?":
          // Open the help overlay
          e.preventDefault();
          setIsHelpOpen(true);
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, amount, confirmationAcknowledged, handleBack, handleCancel]);

  // ── Progress step derivation ──────────────────────────────────────────────

  const currentProgressStep: ProgressStep =
    step === "confirm" ? "confirm" : step === "amount" ? "preview" : "select";
  const activeStepIndex = drawSteps.findIndex(
    (drawStep) => drawStep.id === currentProgressStep,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /*
     * `dc-page` sets min-height:100vh + flex centering via tokens.
     * aria-label exposes this landmark to screen readers as "Draw credit".
     */
    <main className="dc-page" aria-label="Draw credit">
      {/*
        Always-mounted, visually-hidden live region. Announces wizard
        state changes (line selection, amount validity, preview
        readiness, confirmation acknowledgement) to screen readers as
        the user progresses through the flow, independent of which
        step's markup is currently rendered.
      */}
      <LiveRegion
        id="draw-wizard-progress-announcement"
        message={microProgressAnnouncement}
      />
      <div className="dc-page__inner">
        {/* Card uses dc-page__card (token-backed padding + radius) — no inline style override */}
        <div className="dc-page__card">

          {/* ── Step 1: Select a credit line ── */}
          {step === "select" && (
            <>
              <CreditLineSelector
                creditLines={mockCreditLines}
                onSelect={handleSelectCreditLine}
              />
              {/* Shortcut bar for the select step */}
              <div className="dc-kbd-bar" aria-label="Keyboard shortcuts">
                <KbdHint
                  keys="Esc"
                  label="Cancel"
                  description="Press Escape to cancel and go back to the dashboard"
                />
                <KbdHint
                  keys="?"
                  label="Help"
                  description="Press ? to open keyboard shortcut help"
                />
              </div>
            </>
          )}

        {/* ── Step 1: Select a credit line ── */}
        {step === "select" && (
          <div className="card card-large" style={{ maxWidth: "none", margin: 0 }}>
            <section aria-labelledby="select-credit-line-heading">
              <CreditLineSelector
                creditLines={mockCreditLines}
                onSelect={handleSelectCreditLine}
                microProgressDescribedBy="draw-wizard-micro-select"
              />
            </section>
          </div>
        )}

        {/* ── Step 2: Enter amount + live preview ── */}
        {step === "amount" && selectedCreditLine && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
            <section className="card" style={{ margin: 0 }}>
              <AmountInput
                creditLine={selectedCreditLine}
                onAmountChange={setAmount}
                onNext={handleAmountNext}
                onBack={handleBack}
              />
              {/* Separator uses dc-separator (border-top with space-8 padding — token-backed) */}
              <div className="dc-separator">
                <PreviewSection
                  creditLine={selectedCreditLine}
                  amount={amount}
                />
              </div>
              {/* Shortcut bar for the amount step */}
              <div className="dc-kbd-bar" aria-label="Keyboard shortcuts">
                <KbdHint
                  keys={["←", "→"]}
                  label="Back / Continue"
                  separator="/"
                  description="Use left and right arrow keys to go back or continue"
                />
                <KbdHint
                  keys="Esc"
                  label="Back"
                  description="Press Escape to go back to the previous step"
                />
                <KbdHint
                  keys="?"
                  label="Help"
                  description="Press ? to open keyboard shortcut help"
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Review & confirm ── */}
          {step === "confirm" && selectedCreditLine && (
            <ConfirmationStep
              creditLine={selectedCreditLine}
              amount={amount}
              onConfirm={handleConfirm}
              onBack={handleBack}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          )}

          {/* ── Step 4: Status (loading → result) ── */}
          {step === "status" && (isLoading || transaction) && (
            <>
              {isLoading && (
                /*
                 * role="status" + aria-live="polite" announce the loading state
                 * to screen readers without interrupting the user.
                 *
                 * Reduced-motion strategy:
                 *   When isReducedMotionActive is true, the animated
                 *   dc-spinner-ring is replaced with a static SVG clock icon.
                 *   This gives a meaningful visual cue without triggering
                 *   vestibular discomfort from continuous rotation.
                 *   DrawCreditPage.css additionally suppresses the dc-spin
                 *   keyframe via @media (prefers-reduced-motion: reduce) and
                 *   [data-motion="reduced"] as a belt-and-suspenders fallback.
                 */
                <div
                  className="dc-spinner-wrap"
                  role="status"
                  aria-live="polite"
                  aria-label="Processing your draw request"
                >
                  <div className="dc-spinner-ring-bg">
                    {isReducedMotionActive ? (
                      /*
                       * Static fallback: a simple clock SVG at the same 4rem
                       * size as the spinner ring, using the accent colour
                       * token. No animation.
                       */
                      <div className="dc-spinner-static" aria-hidden="true">
                        <svg
                          viewBox="0 0 64 64"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          width="64"
                          height="64"
                          aria-hidden="true"
                        >
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <line
                            x1="32"
                            y1="32"
                            x2="32"
                            y2="14"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <line
                            x1="32"
                            y1="32"
                            x2="46"
                            y2="32"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className="dc-spinner-ring"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="dc-step__title">Processing</h2>
                    <p className="dc-step__subtitle">
                      Your draw request is being processed.
                    </p>
                  </div>
                </div>
              )}
            </section>
            <aside className="card lg:sticky lg:top-6" style={{ margin: 0 }}>
              <PreviewSection creditLine={selectedCreditLine} amount={amount} />
            </aside>
          </div>
        )}

        <p className="dc-page__footer">
          Need help?{" "}
          <button
            ref={helpTriggerRef}
            type="button"
            className="focus-ring hover:text-foreground transition-colors underline underline-offset-4"
            onClick={() => setIsHelpOpen(true)}
          >
            Contact support
          </button>{" "}
          at 1-800-CREDIT-1
        </p>
      </div>
      <InlineHelpOverlay
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        triggerRef={helpTriggerRef}
      />
      <WhyApr
        isOpen={isWhyAprOpen}
        onClose={() => setIsWhyAprOpen(false)}
        triggerRef={whyAprTriggerRef}
      />
      {/*
        Mobile-only sticky summary (below md) — fixed to the viewport so
        line / amount / APR stay visible while scrolling the amount step.
        Desktop uses the sidebar PreviewSection instead. Bottom padding on
        <main> (max-md:pb-28) prevents content from sitting under the bar.
      */}
      <DrawSummaryBar
        creditLine={selectedCreditLine}
        amount={amount}
        step={step}
      />
    </main>
  );
}

export function DrawCreditPageSkeleton() {
  return (
    <main
      className="dc-page"
      aria-busy="true"
      aria-label="Loading draw credit page"
    >
      <div className="dc-page__inner">
        <div className="dc-page__card" aria-hidden="true">
          <div className="space-y-4">
            <Skeleton width="120px" height="20px" />
            <Skeleton width="60%" height="36px" />
          </div>
          <div className="dc-credit-line-list" style={{ marginTop: 'var(--space-6)' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="dc-credit-line-item"
                style={{ pointerEvents: 'none' }}
              >
                <div className="dc-credit-line-item__inner">
                  <div className="dc-credit-line-item__body">
                    <div className="dc-credit-line-item__name">
                      <Skeleton width="120px" height="20px" />
                    </div>
                    <div className="dc-credit-line-item__meta">
                      <Skeleton width="80px" height="16px" />
                      <Skeleton width="60px" height="16px" />
                    </div>
                  </div>
                  <div className="dc-chevron">
                    <Skeleton width="16px" height="16px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
