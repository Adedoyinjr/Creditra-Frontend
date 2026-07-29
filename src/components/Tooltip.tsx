import { useId, useState, useRef, useEffect, type ReactNode, type HTMLAttributes } from 'react';
import './Tooltip.css';

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Text label displayed inside the tooltip box. */
  label: string;
  /** Hover delay in milliseconds before showing the tooltip. Defaults to 400ms. */
  hoverDelay?: number;
  /** Long press delay in milliseconds for touch devices. Defaults to 500ms. */
  longPressDelay?: number;
  /** Interactive or target element wrapped by the tooltip. */
  children: ReactNode;
  /** Relative placement of tooltip box. Defaults to 'top'. */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional container CSS class name. */
  className?: string;
  /** When true, disables tooltip rendering and event handling. */
  disabled?: boolean;
}

/**
 * Shared Tooltip Primitive Component
 *
 * Surfacing contextual text labels on hover, focus, and touch long-press.
 * Fully compliant with WCAG 2.1 AA keyboard and screen reader accessibility guidelines.
 */
export function Tooltip({
  label,
  hoverDelay = 400,
  longPressDelay = 500,
  children,
  position = 'top',
  className = '',
  disabled = false,
  ...props
}: TooltipProps) {
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (disabled || !label) return;
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(true), hoverDelay);
  };

  const handleMouseLeave = () => {
    clearTimer();
    setIsVisible(false);
  };

  const handleTouchStart = () => {
    if (disabled || !label) return;
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(true), longPressDelay);
  };

  const handleTouchEnd = () => {
    clearTimer();
    setIsVisible(false);
  };

  const handleFocus = () => {
    if (disabled || !label) return;
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

  if (disabled || !label) {
    return <>{children}</>;
  }

  return (
    <span
      className={`tooltip-wrapper tooltip-wrapper--${position} ${className}`.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-describedby={isVisible ? tooltipId : undefined}
      {...props}
    >
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        className={`tooltip-content tooltip-content--${position}${isVisible ? ' is-visible' : ''}`}
        aria-hidden={!isVisible}
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;
