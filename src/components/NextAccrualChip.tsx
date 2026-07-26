import { fmtDate } from "../utils/tokens";

/**
 * NextAccrualChip — pill that displays when interest next accrues on a
 * credit line.
 *
 * Minimal stable implementation.  Replaces a missing import that was
 * blocking render in `src/pages/CreditLines.tsx` (issue #574 reduced-motion).
 * Future enrichments (live countdown, tooltip with absolute time, etc.)
 * land separately and stay outside the reduced-motion scope.
 */
export function NextAccrualChip({ target }: { target: string }) {
  return (
    <span className="cl-accrual-chip" title={target}>
      {fmtDate(target)}
    </span>
  );
}
