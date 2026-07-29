import { useId, useState, useRef, useEffect, type ReactNode } from 'react';
import './AccessibleTooltip.css';

interface AccessibleTooltipProps {
  /** Plain-text label surfaced visually and to assistive tech via `aria-describedby`. */
  label: string;
  /** Optional inline content to render as the interactive glossary trigger. */
  children?: ReactNode;
}

/**
 * Compact keyboard-focusable info trigger.
 *
 * Renders a small "i" affordance that surfaces `label` as a tooltip on
 * hover and keyboard focus. The trigger is `tabIndex={0}` (focusable
 * without being a button so it can sit inline next to labels), carries
 * `aria-label="More information"`, and is wired to the tooltip via
 * `aria-describedby` — so screen readers announce the label as the
 * trigger's accessible description.
 */
export function AccessibleTooltip({ label, children }: AccessibleTooltipProps) {
  const tooltipId = useId();
  const hasInlineContent = Boolean(children);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(true), 400); // hover delay
  };

  const handleMouseLeave = () => {
    clearTimer();
    setIsVisible(false);
  };

  const handleTouchStart = () => {
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(true), 500); // long press delay
  };

  const handleTouchEnd = () => {
    clearTimer();
    setIsVisible(false);
  };

  const handleFocus = () => {
    clearTimer();
    setIsVisible(true);
  };

  const handleBlur = () => {
    clearTimer();
    setIsVisible(false);
  };

  useEffect(() => {
    return clearTimer;
  }, []);

  return (
    <span 
      className={`accessible-tooltip${hasInlineContent ? ' accessible-tooltip--inline' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <span
        tabIndex={0}
        className={`accessible-tooltip__trigger${hasInlineContent ? ' accessible-tooltip__trigger--text' : ''}`}
        aria-label="More information"
        aria-describedby={tooltipId}
      >
        {hasInlineContent ? (
          <span className="accessible-tooltip__label">{children}</span>
        ) : (
          <span aria-hidden="true">i</span>
        )}
      </span>
      <span 
        id={tooltipId} 
        role="tooltip" 
        className={`accessible-tooltip__content${isVisible ? ' is-visible' : ''}`}
      >
        {label}
      </span>
    </span>
  );
}
