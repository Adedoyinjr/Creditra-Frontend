/**
 * TransactionStatus
 *
 * Step 4 (final) of the draw-credit flow. Shows the outcome of the draw
 * request: pending / success / error — with a transaction detail card and a
 * "Make Another Draw" reset button.
 *
 * Design-token classes used (all from `src/index.css` `.dc-*` block):
 *   dc-spinner-wrap (reused for centred text layout),
 *   dc-status-icon-bg, dc-status-icon-bg--accent/success/error,
 *   dc-status-icon, dc-status-icon--accent/success/error,
 *   dc-step__title, dc-step__subtitle,
 *   dc-status-detail-card, dc-status-detail-row,
 *   dc-status-detail-row__label, dc-status-detail-row__value,
 *   dc-status-detail-row__value--mono, dc-status-detail-row__value--large,
 *   dc-success-notice,
 *   dc-btn, dc-btn--primary, dc-btn--full, dc-btn--icon-gap
 *
 * Accessibility:
 *   - The outer div has role="status" + aria-live="polite" so the result is
 *     announced when it replaces the loading spinner.
 *   - Icons are aria-hidden="true"; all meaningful state info is in text.
 */

import { Transaction } from "@/types/draw-credit.types";
import { CheckCircle2, AlertCircle, Clock, RotateCcw } from "lucide-react";

interface TransactionStatusProps {
  transaction: Transaction;
  onNewDraw: () => void;
}

/**
 * Maps a transaction status to the CSS modifier and icon for that outcome.
 * All colour references go through the dc-status-icon-bg--* and
 * dc-status-icon--* token classes (var(--accent/success/error)).
 */
const STATUS_CONFIG = {
  pending: {
    Icon: Clock,
    title: "Processing",
    colorMod: "accent",
    message: "Your draw request is being processed.",
  },
  success: {
    Icon: CheckCircle2,
    title: "Draw Successful",
    colorMod: "success",
    message: "Funds have been disbursed to your account.",
  },
  error: {
    Icon: AlertCircle,
    title: "Draw Failed",
    colorMod: "error",
    message: null, // filled from transaction.message at render time
  },
} as const;

export function TransactionStatus({
  transaction,
  onNewDraw,
}: TransactionStatusProps) {
  const config = STATUS_CONFIG[transaction.status];
  const { Icon, title, colorMod } = config;

  const message =
    transaction.status === "error"
      ? (transaction.message ?? "An error occurred during processing.")
      : config.message;

  return (
    /*
     * role="status" + aria-live="polite" ensures the result is announced when
     * this replaces the loading spinner (which was removed from the DOM).
     */
    <div
      className="dc-spinner-wrap"
      role="status"
      aria-live="polite"
    >
      {/* Status icon circle */}
      <div className="dc-status-icon-wrap" style={{ display: "flex", justifyContent: "center" }}>
        <div className={`dc-status-icon-bg dc-status-icon-bg--${colorMod}`}>
          <Icon
            className={`dc-status-icon dc-status-icon--${colorMod}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Title + message */}
      <div>
        <h2 className="dc-step__title">{title}</h2>
        <p className="dc-step__subtitle">{message}</p>
      </div>

      {/* Transaction detail card */}
      <div className="dc-status-detail-card">
        {/* Transaction ID */}
        <div className="dc-status-detail-row">
          <p className="dc-status-detail-row__label">Transaction ID</p>
          <p className="dc-status-detail-row__value dc-status-detail-row__value--mono">
            {transaction.id}
          </p>
        </div>

        {/* Amount drawn */}
        <div className="dc-status-detail-row">
          <p className="dc-status-detail-row__label">Amount Drawn</p>
          <p className="dc-status-detail-row__value dc-status-detail-row__value--large tabular-nums">
            ${transaction.amount.toLocaleString()}
          </p>
        </div>

        {/* Timestamp (optional) */}
        {transaction.timestamp && (
          <div className="dc-status-detail-row">
            <p className="dc-status-detail-row__label">Time</p>
            <p className="dc-status-detail-row__value">
              {transaction.timestamp.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Success notice — uses var(--success-tint/border) via dc-success-notice */}
      {transaction.status === "success" && (
        <div className="dc-success-notice">
          <p>
            Funds will be deposited to your account within 1-2 business days.
          </p>
        </div>
      )}

      {/* Reset CTA */}
      <button
        onClick={onNewDraw}
        className="dc-btn dc-btn--primary dc-btn--full dc-btn--icon-gap"
      >
        <RotateCcw width={20} height={20} aria-hidden="true" />
        Make Another Draw
      </button>
    </div>
  );
}
