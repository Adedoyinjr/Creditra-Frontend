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

import { useState } from "react";
import { CreditLineSelector } from "@/components/CreditLineSelector";
import { AmountInput } from "@/components/AmountInput";
import { PreviewSection } from "@/components/PreviewSection";
import { ConfirmationStep } from "@/components/ConfirmationStep";
import { TransactionStatus } from "@/components/TransactionStatus";
import { CreditLine, DrawStep, Transaction } from "@/types/draw-credit.types";
import { mockCreditLines } from "@/lib/draw-credit-mock-data";

export default function DrawCreditPage() {
  const [step, setStep] = useState<DrawStep>("select");
  const [selectedCreditLine, setSelectedCreditLine] =
    useState<CreditLine | null>(null);
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const handleSelectCreditLine = (creditLine: CreditLine) => {
    setSelectedCreditLine(creditLine);
    setAmount(0);
    setStep("amount");
  };

  const handleAmountNext = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setStep("status");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newTransaction: Transaction = {
      id: `TXN-${Date.now()}`,
      creditLineId: selectedCreditLine!.id,
      amount,
      status: Math.random() > 0.2 ? "success" : "error",
      message: Math.random() > 0.2 ? undefined : "Insufficient funds available",
      timestamp: new Date(),
    };

    setTransaction(newTransaction);
    setIsLoading(false);
  };

  const handleNewDraw = () => {
    setStep("select");
    setSelectedCreditLine(null);
    setAmount(0);
    setTransaction(null);
  };

  const handleBack = () => {
    if (step === "amount") {
      setStep("select");
      setSelectedCreditLine(null);
    } else if (step === "confirm") {
      setStep("amount");
    }
  };

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
    </main>
  );
}
