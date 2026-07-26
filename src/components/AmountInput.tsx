import { CreditLine } from "@/types/draw-credit.types";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Minus,
  Plus,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  formatMoney,
  getDrawAmountValidation,
} from "../utils/amountValidation";
import { FormMessage } from "./FormMessage";
import { LiveRegion } from "./LiveRegion";
import { Skeleton } from "./Skeleton";
import { useReducedMotion } from "../context/ReducedMotionContext";
import "./AmountInput.css";

const STEP_AMOUNT = 100;

const stepClasses =
  "flex items-center justify-center w-10 h-10 xs:w-11 xs:h-11 rounded-lg border border-border bg-background/60 text-foreground hover:bg-surface hover:border-accent/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 disabled:cursor-not-allowed";

const STEP_ICON_CLASS = "h-4 w-4 stroke-[2.5]";

export interface AmountInputProps {
  creditLine?: CreditLine;
  onAmountChange?: (amount: number) => void;
  onNext?: (amount: number) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function AmountInputSkeleton() {
  return (
    <div
      className="space-y-8"
      role="region"
      aria-busy="true"
      aria-label="Loading amount input"
      data-testid="amount-input-skeleton"
    >
      {/* Header section skeleton */}
      <div>
        <Skeleton width="180px" height="2.25rem" className="rounded-lg mb-2" />
        <Skeleton width="220px" height="1.25rem" className="rounded-md" />
      </div>

      {/* Main input field section skeleton */}
      <div className="space-y-3">
        <Skeleton width="100px" height="1.25rem" className="rounded-md" />
        <Skeleton width="260px" height="1.25rem" className="rounded-md" />

        {/* Input box with stepper buttons skeleton */}
        <div className="flex items-center gap-2 bg-surface p-4 rounded-xl border border-border">
          <Skeleton
            width="44px"
            height="44px"
            className="rounded-lg shrink-0"
          />
          <Skeleton
            width="24px"
            height="32px"
            className="rounded-md shrink-0"
          />
          <Skeleton width="100%" height="40px" className="rounded-lg flex-1" />
          <Skeleton
            width="44px"
            height="44px"
            className="rounded-lg shrink-0"
          />
          <Skeleton
            width="56px"
            height="36px"
            className="rounded-lg shrink-0"
          />
        </div>

        {/* Constraint cards skeleton */}
        <div className="grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background/60 px-3 py-2 space-y-2"
            >
              <Skeleton width="60%" height="0.75rem" className="rounded-sm" />
              <Skeleton width="80%" height="1.25rem" className="rounded-md" />
            </div>
          ))}
        </div>

        {/* Inline message placeholder skeleton */}
        <div className="h-[60px] rounded-lg border border-border/40 bg-surface/30 p-3 flex items-center gap-3">
          <Skeleton
            width="20px"
            height="20px"
            shape="circular"
            className="shrink-0"
          />
          <div className="space-y-1 flex-1">
            <Skeleton width="40%" height="0.875rem" className="rounded-sm" />
            <Skeleton width="70%" height="0.75rem" className="rounded-sm" />
          </div>
        </div>
      </div>

      {/* Quick amount presets skeleton */}
      <div>
        <Skeleton width="100px" height="1.25rem" className="rounded-md mb-3" />
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percent) => (
            <Skeleton key={percent} height="40px" className="rounded-lg" />
          ))}
        </div>
      </div>

      {/* Summary card skeleton */}
      <div className="bg-surface p-5 rounded-xl border border-border space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton width="80px" height="1rem" className="rounded-sm" />
          <Skeleton width="90px" height="1rem" className="rounded-sm" />
        </div>
        <div className="flex justify-between items-center border-t border-border pt-3">
          <Skeleton width="90px" height="1rem" className="rounded-sm" />
          <Skeleton width="90px" height="1rem" className="rounded-sm" />
        </div>
        <div className="flex justify-between items-center border-t border-border pt-3">
          <Skeleton width="120px" height="1rem" className="rounded-sm" />
          <Skeleton width="90px" height="1rem" className="rounded-sm" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3 pt-4">
        <Skeleton height="48px" className="flex-1 rounded-lg" />
        <Skeleton height="48px" className="flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function AmountInput({
  creditLine,
  onAmountChange,
  onNext,
  onBack,
  isLoading = false,
}: AmountInputProps) {
  const [amount, setAmount] = useState("");
  const [pasteAnnouncement, setPasteAnnouncement] = useState("");
  const [validationAnnouncement, setValidationAnnouncement] = useState("");
  const prevSeverity = useRef<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isReducedMotionActive: reducedMotion } = useReducedMotion();
  const inputId = "draw-amount-input";
  const helperId = "draw-amount-helper";
  const errorId = "draw-amount-error";
  const constraintsId = "draw-amount-constraints";
  const statusId = "draw-amount-status";
  const announcementId = "amount-paste-announcement";

  useEffect(() => {
    if (isLoading || !creditLine) return;
    const numAmount = parseFloat(amount) || 0;
    onAmountChange?.(numAmount);
  }, [amount, onAmountChange, isLoading, creditLine]);

  // Announce validation-state changes via aria-live for screen-reader users.
  // Must be called unconditionally (Rules of Hooks); guards inside the effect.
  const numAmount = parseFloat(amount) || 0;
  const validation = creditLine
    ? getDrawAmountValidation(amount, creditLine)
    : null;
  useEffect(() => {
    if (!creditLine || !validation) return;
    const current = validation.feedback.severity;
    const previous = prevSeverity.current;
    if (current === previous) return;
    prevSeverity.current = current;

    if (!amount) {
      setValidationAnnouncement("Enter an amount to begin.");
      return;
    }

    switch (current) {
      case "success":
        setValidationAnnouncement(`Amount is valid. ${validation.feedback.title}.`);
        break;
      case "warning":
        setValidationAnnouncement(`Warning: ${validation.feedback.title}. ${validation.feedback.message}`);
        break;
      case "danger":
        setValidationAnnouncement(`Error: ${validation.feedback.title}. ${validation.feedback.message}`);
        break;
      default:
        setValidationAnnouncement(`${validation.feedback.title}. ${validation.feedback.message}`);
    }
  }, [validation, amount, creditLine]);

  const handleStep = useCallback(
    (direction: "up" | "down") => {
      if (!creditLine) return;
      setAmount((prev) => {
        const current = parseFloat(prev) || 0;
        const next =
          direction === "up"
            ? Math.min(current + STEP_AMOUNT, creditLine.available)
            : Math.max(current - STEP_AMOUNT, 0);
        return next.toString();
      });
    },
    [creditLine?.available],
  );

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    // Sanitize: Strip $, commas, and whitespace
    const sanitized = pastedText.replace(/[$,\s]/g, "");

    // Validate if it's a valid number
    if (sanitized === "" || isNaN(parseFloat(sanitized))) {
      setPasteAnnouncement(
        "Invalid amount pasted. Please enter a numeric value.",
      );
      return;
    }

    const numValue = parseFloat(sanitized);
    setAmount(sanitized);
    setPasteAnnouncement(`Pasted value sanitized to ${formatMoney(numValue)}`);

    setTimeout(() => {
      if (inputRef.current) {
        const start = e.target.selectionStart || 0;
        const end = e.target.selectionEnd || 0;
        inputRef.current.setSelectionRange(start, end);
      }
    }, 0);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleStep("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleStep("down");
      }
    },
    [handleStep],
  );

  const handlePreset = (percent: number) => {
    if (!creditLine) return;
    const preset = Math.floor((creditLine.available * percent) / 100);
    setAmount(preset.toString());
  };

  if (isLoading) {
    return <AmountInputSkeleton />;
  }

  const toneBySeverity = {
    info: {
      bg: "bg-accent/10",
      border: "border-accent/30",
      text: "text-foreground",
      icon: (
        <Info
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
          aria-hidden="true"
        />
      ),
      input: "border-border focus-within:border-accent",
    },
    success: {
      bg: "bg-success/10",
      border: "border-success/30",
      text: "text-foreground",
      icon: (
        <CheckCircle
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-success"
          aria-hidden="true"
        />
      ),
      input: "border-success/60 focus-within:border-success",
    },
    warning: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      text: "text-foreground",
      icon: (
        <AlertTriangle
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning"
          aria-hidden="true"
        />
      ),
      input: "border-warning/60 focus-within:border-warning",
    },
    danger: {
      bg: "bg-error/10",
      border: "border-error/30",
      text: "text-foreground",
      icon: (
        <AlertCircle
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-error"
          aria-hidden="true"
        />
      ),
      input: "border-error/70 focus-within:border-error",
    },
  };
  const currentTone = toneBySeverity[validation.feedback.severity];
  const inputStateClassName = currentTone.input;
  const hasError = validation.feedback.severity === "danger";
  const isValid = validation.isValid;
  const handleMaxClick = () => handlePreset(100);
  const getMessageType = () => validation.feedback.severity;
  const describedBy = `${helperId} ${constraintsId} ${statusId}${hasError ? ` ${errorId}` : ""}`;
  const stepBtnClasses = buildStepClasses(reducedMotion);

  return (
    <div
      className="amount-input-root space-y-6 sm:space-y-8"
      data-reduced-motion={reducedMotion ? "true" : undefined}
    >
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-[var(--lh-heading)] tracking-tight">
          Enter Amount
        </h2>
        <p className="text-sm text-muted leading-[var(--lh-body)] mt-1.5 sm:mt-2">
          {creditLine.name}
        </p>
      </div>

      <div className="space-y-3">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground leading-[var(--lh-body)]"
        >
          Draw amount
          <span className="text-error ml-1" aria-label="required">
            *
          </span>
        </label>

        {/* Helper text explaining the input */}
        <p
          id={helperId}
          className="text-sm text-muted leading-[var(--lh-body)]"
        >
          Enter the amount you wish to draw from your available credit.
          Available limit:{" "}
          <span
            className="font-semibold text-foreground tabular-nums amount"
            data-amount
          >
            {formatMoney(creditLine.available)}
          </span>
        </p>

        {/* Input field with border styling based on validation state */}
        <div
          className={`flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-3 bg-surface p-3 xs:p-3.5 sm:p-4 rounded-xl border-2 overflow-hidden transition-colors ${inputStateClassName}`}
        >
          <button
            onClick={() => handleStep("down")}
            disabled={numAmount <= 0}
            className={stepBtnClasses}
            aria-label="Decrease amount"
            aria-controls={inputId}
            type="button"
          >
            <Minus className={STEP_ICON_CLASS} aria-hidden="true" />
          </button>
          <span
            className="text-2xl sm:text-3xl font-bold text-foreground leading-[var(--lh-display)] flex-shrink-0"
            aria-hidden="true"
          >
            $
          </span>
          <input
            id={inputId}
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            className="text-xl sm:text-2xl font-bold bg-transparent outline-none flex-1 text-foreground placeholder:text-muted/50 min-w-0 tabular-nums amount leading-[var(--lh-display)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:rounded"
            min={validation.minAmount}
            max={creditLine.available}
            step={STEP_AMOUNT}
            required
            aria-invalid={hasError}
            aria-describedby={describedBy}
            aria-required="true"
          />

          <button
            onClick={() => handleStep("up")}
            disabled={numAmount >= creditLine.available}
            className={stepBtnClasses}
            aria-label="Increase amount"
            aria-controls={inputId}
            type="button"
          >
            <Plus className={STEP_ICON_CLASS} aria-hidden="true" />
          </button>
          {/* Max button for quick-fill with accessible label */}
          <button
            onClick={handleMaxClick}
            className="px-2 xs:px-3 py-2 text-xs xs:text-sm font-semibold text-accent hover:bg-accent/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface flex-shrink-0 min-h-[44px]"
            aria-label="Set amount to maximum available credit"
            type="button"
          >
            Max
          </button>
        </div>

        {/* Constraint boxes showing min, available, and suggested buffer */}
        <div id={constraintsId} className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted leading-[var(--lh-small)]">
              Minimum draw
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums leading-[var(--lh-body)]">
              {formatMoney(validation.minAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted leading-[var(--lh-small)]">
              Available credit
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums leading-[var(--lh-body)]">
              {formatMoney(validation.maxAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted leading-[var(--lh-small)]">
              Buffer
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums leading-[var(--lh-body)]">
              {formatMoney(validation.recommendedReserve)}
            </p>
          </div>
        </div>

        {/* Inline validation message with color-blind-safe pattern */}
        <div
          className={`rounded-lg overflow-hidden ${
            validation.feedback.severity === "info"
              ? "ai-pattern-info"
              : validation.feedback.severity === "success"
                ? "ai-pattern-success"
                : validation.feedback.severity === "warning"
                  ? "ai-pattern-warning"
                  : validation.feedback.severity === "danger"
                    ? "ai-pattern-danger"
                    : ""
          }`}
        >
          <FormMessage
            id={errorId}
            title={validation.feedback.title}
            message={validation.feedback.message}
            type={getMessageType()}
            tone="inline"
            reserveSpace={true}
            minHeight={60}
          />
        </div>
      </div>

      {/* Polite live region for validation status announcements */}
      <LiveRegion message={validationAnnouncement} politeness="polite" />

      {/* Polite live region for paste announcements */}
      <div
        id={announcementId}
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {pasteAnnouncement}
      </div>

      {/* Quick presets for percentage-based amounts */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3 leading-[var(--lh-body)]">
          Quick amount
        </p>
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() =>
                setAmount(
                  Math.floor((creditLine.available * percent) / 100).toString(),
                )
              }
              className="py-2.5 px-3 border-2 border-border rounded-lg hover:border-accent hover:bg-surface transition-all text-foreground font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] flex items-center justify-center tabular-nums"
              aria-label={`Set amount to ${percent} percent of available credit`}
              type="button"
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      {/* Summary display showing available, requested, and remaining */}
      <div className="bg-surface p-3.5 xs:p-4 sm:p-5 rounded-xl border border-border space-y-2.5 xs:space-y-3">
        <div className="flex justify-between text-sm leading-[var(--lh-body)]">
          <span className="text-muted">Available:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(creditLine.available)}
          </span>
        </div>
        <div className="flex justify-between text-sm leading-[var(--lh-body)] border-t border-border pt-3">
          <span className="text-muted">Requested:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(numAmount)}
          </span>
        </div>
        <div className="flex justify-between text-sm leading-[var(--lh-body)] border-t border-border pt-3">
          <span className="text-muted">Remaining credit:</span>
          <span
            className={`font-semibold tabular-nums ${validation.remainingCredit < validation.recommendedReserve && numAmount > 0 ? "text-warning" : "text-foreground"}`}
          >
            {formatMoney(validation.remainingCredit)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col xs:flex-row gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 border-2 border-border text-foreground rounded-lg hover:bg-surface transition-colors font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] w-full xs:w-auto"
          type="button"
        >
          Back
        </button>
        <button
          onClick={() => onNext(numAmount)}
          disabled={!isValid}
          className="flex-1 py-3 px-4 bg-accent text-background rounded-lg hover:bg-accent/90 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px] w-full xs:w-auto"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
