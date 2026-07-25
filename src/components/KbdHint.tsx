/**
 * KbdHint
 *
 * Renders styled keyboard shortcut hints (<kbd> tags) with screen reader support,
 * dark mode / high contrast token consistency, and responsive layouts.
 *
 * WCAG 2.1 AA Conformance:
 *   - Screen reader fallback via .sr-only element explaining the shortcut.
 *   - Uses design tokens for colors, borders, and dark/high-contrast mode support.
 */

import React from 'react';
import './KbdHint.css';

export interface KbdHintProps {
  /** Key or sequence of keys to display (e.g. "Esc", ["←", "→"], ["Ctrl", "K"]) */
  keys: string | string[];
  /** Optional descriptive label shown next to the shortcut keys */
  label?: string;
  /** Optional detailed description for screen readers or tooltips */
  description?: string;
  /** Visual variant: 'inline' (default) or 'badge' (boxed container) */
  variant?: 'inline' | 'badge';
  /** Additional CSS class names */
  className?: string;
  /** Optional override for root container aria-label */
  'aria-label'?: string;
}

export function KbdHint({
  keys,
  label,
  description,
  variant = 'inline',
  className = '',
  'aria-label': ariaLabel,
}: KbdHintProps) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const keysText = keyList.join(' ');
  const srText = description ?? (label ? `${label} (${keysText})` : `Keyboard shortcut: ${keysText}`);

  const containerClasses = [
    'kbd-hint-container',
    variant === 'badge' ? 'kbd-hint-badge' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={containerClasses}
      aria-label={ariaLabel ?? srText}
      role="group"
    >
      <span className="sr-only">{srText}</span>
      <span className="kbd-hint-group" aria-hidden="true">
        {keyList.map((key, index) => (
          <React.Fragment key={`${key}-${index}`}>
            {index > 0 && <span className="kbd-hint-separator">/</span>}
            <kbd className="kbd-hint-key">{key}</kbd>
          </React.Fragment>
        ))}
      </span>
      {label && (
        <span className="kbd-hint-label" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}

export default KbdHint;
