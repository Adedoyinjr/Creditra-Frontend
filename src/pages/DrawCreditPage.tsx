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

import { useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/Skeleton";
import { useLocation, useNavigate } from "react-router-dom";
import { loadDraft, saveDraft, clearDraft } from "@/state/wizardDraft";
import { CreditLineSelector } from "@/components/CreditLineSelector";
import { AmountInput } from "@/components/AmountInput";
import { PreviewSection } from "@/components/PreviewSection";
import { ConfirmationStep } from "@/components/ConfirmationStep";
import { TransactionStatus } from "@/components/TransactionStatus";
import { InlineHelpOverlay } from "@/components/InlineHelpOverlay";
import { CreditLine, DrawStep, Transaction } from "@/types/draw-credit.types";
import { mockCreditLines } from "@/lib/draw-credit-mock-data";
import { WhyApr } from "@/components/WhyApr";
import { DrawingLimit } from "@/components/DrawingLimit";
import { DrawSummaryBar } from "@/components/DrawSummaryBar";
import { DrawWizardMicroIndicator } from "@/components/DrawWizardMicroIndicator";
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

  const { steps: microProgressSteps, debouncedAnnouncement: microProgressAnnouncement } =
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

  const handleBack = () => {
    if (step === "amount") {
      setStep("select");
      setSelectedCreditLine(null);
      setConfirmationAcknowledged(false);
    } else if (step === "confirm") {
      setStep("amount");
      setConfirmationAcknowledged(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const currentProgressStep: ProgressStep =
    step === "confirm" ? "confirm" : step === "amount" ? "preview" : "select";
  const activeStepIndex = drawSteps.findIndex(
    (drawStep) => drawStep.id === currentProgressStep,
  );

  return (
    /*
     * `dc-page` sets min-height:100vh + flex centering via tokens.
     * aria-label exposes this landmark to screen readers as "Draw credit".
     */
    <main className="dc-page" aria-label="Draw credit">
      <div className="dc-page__inner">
        {/* Card uses dc-page__card (token-backed padding + radius) — no inline style override */}
        <div className="dc-page__card">

          {/* ── Step 1: Select a credit line ── */}
          {step === "select" && (
            <CreditLineSelector
              creditLines={mockCreditLines}
              onSelect={handleSelectCreditLine}
            />
          )}

          {/* ── Step 2: Enter amount + live preview ── */}
          {step === "amount" && selectedCreditLine && (
            <div className="dc-step">
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
            </div>
          )}

          {/* ── Step 3: Review & confirm ── */}
          {step === "confirm" && selectedCreditLine && (
            <ConfirmationStep
              creditLine={selectedCreditLine}
              amount={amount}
              onConfirm={handleConfirm}
              onBack={handleBack}
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
              {transaction && !isLoading && (
                <TransactionStatus
                  transaction={transaction}
                  onNewDraw={handleNewDraw}
                />
              )}
            </>
          )}
        </div>

        <p className="dc-page__footer">
          Need help? Contact support at 1-800-CREDIT-1
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
      className="min-h-screen bg-background px-4 pb-24 pt-6 max-md:pb-28 md:pb-8 sm:pt-8"
      aria-busy="true"
      aria-label="Loading draw credit page"
    >
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <header className="card" aria-hidden="true">
          <div className="space-y-2">
            <Skeleton width="120px" height="20px" />
            <Skeleton width="60%" height="36px" className="max-w-[400px]" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background/60 px-3 py-3"
              >
                <Skeleton width="40px" height="16px" className="mb-1" />
                <Skeleton width="80px" height="20px" />
              </div>
            ))}
          </div>
        </header>

        <div className="card card-large" style={{ maxWidth: "none", margin: 0 }} aria-hidden="true">
          <section>
            <Skeleton width="200px" height="28px" className="mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton width="150px" height="24px" />
                    <Skeleton width="80px" height="24px" />
                  </div>
                  <Skeleton width="100px" height="16px" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

