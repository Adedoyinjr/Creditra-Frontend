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
import "@/components/DrawWizardMicroProgress.css";

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
    setIsLoading(true);

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
                 * aria-label on the spinner ring itself provides a text
                 * alternative for the animated element.
                 */
                <div
                  className="dc-spinner-wrap"
                  role="status"
                  aria-live="polite"
                  aria-label="Processing your draw request"
                >
                  <div className="dc-spinner-ring-bg">
                    <div
                      className="dc-spinner-ring"
                      aria-hidden="true"
                    />
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
    <main className="dc-page" aria-busy="true" aria-label="Loading draw credit page">
      <div className="dc-page__inner">
        <div className="dc-page__card" aria-hidden="true">
          <div className="dc-step">
            <div>
              <Skeleton width="200px" height="32px" className="mb-2" />
              <Skeleton width="300px" height="24px" />
            </div>

            <ul className="dc-credit-line-list" role="list">
              {[1, 2, 3].map((i) => (
                <li key={i}>
                  <div className="dc-credit-line-item">
                    <div className="dc-credit-line-item__inner w-full">
                      <div className="dc-credit-line-item__body w-full">
                        <Skeleton width="120px" height="24px" className="mb-3" />
                        
                        <div className="flex gap-6 mb-3">
                          <div className="space-y-1">
                            <Skeleton width="60px" height="14px" />
                            <Skeleton width="80px" height="20px" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton width="70px" height="14px" />
                            <Skeleton width="50px" height="20px" />
                          </div>
                        </div>

                        <Skeleton width="100%" height="8px" shape="rounded" />
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center justify-center">
                        <Skeleton width="20px" height="20px" shape="circular" />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="dc-page__footer flex justify-center mt-4">
           <Skeleton width="250px" height="20px" />
        </div>
      </div>
    </main>
  );
}

