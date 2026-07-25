import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Check, Copy, AlertCircle } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';
import './CopyToClipboard.css';

export const COPY_FEEDBACK_DURATION_MS = 2000;

/** The three mutually-exclusive button states. */
type CopyState = 'idle' | 'copied' | 'error';

interface CopyToClipboardProps {
  /** The raw string written to the clipboard on click. */
  value: string;
  /**
   * Optional override for the visible value. Defaults to `value`. Use
   * this when the displayed form is a truncated address but the copied
   * form should be the full string.
   */
  displayValue?: ReactNode;
  /**
   * Required descriptive `aria-label` for the copy button, e.g.
   * `Copy connected wallet address` or
   * `Copy transaction hash for TX-001`. Must be specific so the user
   * knows which value is being copied when several `CopyToClipboard`
   * instances live on the same screen.
   */
  ariaLabel: string;
  /** Label shown in the idle state. Defaults to `Copy`. */
  copyLabel?: string;
  /** Label shown for `COPY_FEEDBACK_DURATION_MS` after a successful copy. Defaults to `Copied`. */
  copiedLabel?: string;
  /** Label shown for `COPY_FEEDBACK_DURATION_MS` when the copy operation fails. Defaults to `Failed`. */
  errorLabel?: string;
  /**
   * Visual treatment: `inline` flows with surrounding text; `surface`
   * styles the value as a chip on a contrasting background.
   */
  variant?: 'inline' | 'surface';
  /** Class name appended to the root container. */
  className?: string;
  /** Class name applied to the displayed value element. */
  valueClassName?: string;
  /** Class name applied to the copy button. */
  buttonClassName?: string;
  /**
   * When true, the click handler calls `event.stopPropagation()`. Use
   * inside a clickable parent (e.g. a list row that navigates) so the
   * copy click doesn't also trigger row navigation.
   */
  stopPropagation?: boolean;
  /**
   * Called once after a successful copy, before the button resets.
   * Receives the copied value so callers can trigger secondary actions
   * (e.g. toast notifications) without duplicating the clipboard write.
   */
  onCopied?: (value: string) => void;
  /**
   * Called when the clipboard write fails, receiving the underlying error.
   * Useful for reporting or showing an external toast. The built-in error
   * state is shown regardless of whether this callback is provided.
   */
  onError?: (error: unknown) => void;
}

/**
 * Standardised "copy to clipboard" affordance for wallet addresses and
 * transaction hashes.
 *
 * State machine: `idle` → `copied` | `error` → (after `COPY_FEEDBACK_DURATION_MS`) → `idle`
 *
 * - Success: button turns green and plays a scale-in animation, icon
 *   switches to a check-mark.
 * - Error: button turns red (`--error` token) and plays a subtle shake,
 *   icon switches to an alert circle, label changes to `errorLabel`.
 * - Both states auto-reset after `COPY_FEEDBACK_DURATION_MS` (2 s).
 * - The label change is announced to screen readers via a polite live
 *   region so AT users get the same feedback as sighted users.
 * - `prefers-reduced-motion` collapses the scale/shake to an instant
 *   color swap so no motion is forced on users who opt out.
 *
 * Always renders a real `<button>` (not a `<div role="button">`) so
 * keyboard activation, focus styling, and disabled states are inherited
 * for free.
 *
 * See `docs/ACCESSIBILITY.md` section 5 for the canonical contract.
 *
 * @example
 * // Basic usage
 * <CopyToClipboard value={address} ariaLabel="Copy wallet address" />
 *
 * @example
 * // With callbacks and custom labels
 * <CopyToClipboard
 *   value={txHash}
 *   displayValue={truncate(txHash)}
 *   ariaLabel="Copy transaction hash"
 *   copiedLabel="Copied!"
 *   errorLabel="Try again"
 *   variant="surface"
 *   onCopied={(v) => toast.success(`Copied ${v}`)}
 *   onError={(e) => toast.error('Clipboard unavailable')}
 * />
 */
export function CopyToClipboard({
  value,
  displayValue,
  ariaLabel,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  errorLabel = 'Failed',
  variant = 'inline',
  className = '',
  valueClassName = '',
  buttonClassName = '',
  stopPropagation = false,
  onCopied,
  onError,
}: CopyToClipboardProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  /** Schedule a reset to `idle` after the feedback window elapses. */
  const scheduleReset = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCopyState('idle');
      timeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION_MS);
  };

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    try {
      await copyTextToClipboard(value);
      setCopyState('copied');
      onCopied?.(value);
    } catch (error) {
      setCopyState('error');
      onError?.(error);
    }

    scheduleReset();
  };

  const containerClassName = [
    'copy-affordance',
    variant === 'surface' ? 'copy-affordance--surface' : '',
    className,
  ].filter(Boolean).join(' ');

  const resolvedValueClassName = ['copy-affordance__value', valueClassName].filter(Boolean).join(' ');
  const resolvedButtonClassName = ['copy-affordance__button', buttonClassName].filter(Boolean).join(' ');

  const currentLabel =
    copyState === 'copied' ? copiedLabel
    : copyState === 'error' ? errorLabel
    : copyLabel;

  const announcement =
    copyState === 'copied' ? `${copiedLabel}: ${ariaLabel}`
    : copyState === 'error' ? `Failed to copy: ${ariaLabel}`
    : '';

  return (
    <div className={containerClassName}>
      {displayValue ? <span className={resolvedValueClassName}>{displayValue}</span> : null}
      <button
        type="button"
        className={resolvedButtonClassName}
        aria-label={ariaLabel}
        data-copy-state={copyState}
        onClick={handleCopy}
      >
        <span className="copy-affordance__button-label">{currentLabel}</span>
        {copyState === 'copied' ? (
          <Check className="copy-affordance__icon" aria-hidden="true" />
        ) : copyState === 'error' ? (
          <AlertCircle className="copy-affordance__icon" aria-hidden="true" />
        ) : (
          <Copy className="copy-affordance__icon" aria-hidden="true" />
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
