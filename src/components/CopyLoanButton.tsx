import { useState, useEffect, useRef } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "../utils/clipboard";
import { COLOR, fmt, fmtDate } from "../utils/tokens";
import type { CreditLine } from "../types/creditLine";

export interface CopyLoanButtonProps {
  creditLines: CreditLine[];
}

export const COPY_FEEDBACK_DURATION_MS = 2000;

export function CopyLoanButton({ creditLines }: CopyLoanButtonProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatCreditLine = (cl: CreditLine) => {
    const available = cl.limit - cl.utilized;
    const lines = [
      `Status: ${cl.status}`,
      `Limit: ${fmt(cl.limit)}`,
      `Utilized: ${fmt(cl.utilized)}`,
      `Available: ${fmt(available)}`,
      `APR: ${cl.apr}%`,
    ];
    if (cl.collateral) {
      lines.push(`Collateral: ${cl.collateral}`);
    }
    if (cl.nextPaymentDate && cl.nextPaymentAmount !== undefined) {
      lines.push(
        `Next Payment: ${fmt(cl.nextPaymentAmount)} on ${fmtDate(cl.nextPaymentDate)}`
      );
    }
    return lines.map((line) => `   - ${line}`).join("\n");
  };

  const formatLoanInfo = () => {
    if (!creditLines || creditLines.length === 0) {
      return "Creditra Loan Information\n-------------------------\nNo credit lines found.";
    }

    const activeLines = creditLines.filter(
      (cl) => cl.status === "Active" || cl.status === "Suspended" || cl.status === "Frozen"
    );

    if (activeLines.length === 0) {
      return "Creditra Loan Information\n-------------------------\nNo active credit lines found.";
    }

    const totalLimit = activeLines.reduce((s, cl) => s + cl.limit, 0);
    const totalUtilized = activeLines.reduce((s, cl) => s + cl.utilized, 0);
    const totalAvailable = totalLimit - totalUtilized;

    const header = [
      "Creditra Loan Information",
      "-------------------------",
      `Total Credit Limit: ${fmt(totalLimit)}`,
      `Total Utilized: ${fmt(totalUtilized)}`,
      `Total Available: ${fmt(totalAvailable)}`,
      "",
      "Active Credit Lines:",
    ].join("\n");

    const linesDetails = activeLines
      .map((cl, i) => `${i + 1}. ${cl.name} (ID: ${cl.id})\n${formatCreditLine(cl)}`)
      .join("\n\n");

    return `${header}\n${linesDetails}`;
  };

  const handleCopy = async () => {
    const textToCopy = formatLoanInfo();
    try {
      await copyTextToClipboard(textToCopy);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopyState("idle");
      timeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION_MS);
  };

  const isCopied = copyState === "copied";
  const isError = copyState === "error";

  const buttonBorderColor = isCopied
    ? "rgba(63, 185, 80, 0.3)"
    : isError
    ? "rgba(248, 81, 73, 0.3)"
    : "rgba(88, 166, 255, 0.3)";

  const iconBg = isCopied
    ? "rgba(63, 185, 80, 0.12)"
    : isError
    ? "rgba(248, 81, 73, 0.12)"
    : "rgba(88, 166, 255, 0.12)";

  const iconColor = isCopied
    ? COLOR.success
    : isError
    ? COLOR.danger
    : COLOR.accent;

  const labelColor = isCopied
    ? COLOR.success
    : isError
    ? COLOR.danger
    : COLOR.accent;

  const labelText = isCopied
    ? "Copied!"
    : isError
    ? "Failed to copy"
    : "Copy Loan Info";

  const descText = isCopied
    ? "Loan info copied to clipboard"
    : isError
    ? "Please try again"
    : "Copy details to clipboard";

  return (
    <button
      className="qa-btn"
      style={{ borderColor: buttonBorderColor }}
      onClick={handleCopy}
      type="button"
      aria-label="Copy loan details to clipboard"
    >
      <div className="qa-icon" style={{ background: iconBg, color: iconColor }}>
        {isCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      </div>
      <div>
        <div className="qa-label" style={{ color: labelColor }}>
          {labelText}
        </div>
        <div className="qa-desc" style={{ color: COLOR.muted }}>
          {descText}
        </div>
      </div>
      {isCopied ? (
        <span className="qa-arrow" style={{ color: COLOR.success, opacity: 0.8 }}>
          ✓
        </span>
      ) : (
        <span className="qa-arrow" style={{ color: COLOR.muted }}>
          →
        </span>
      )}
    </button>
  );
}
