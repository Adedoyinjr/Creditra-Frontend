import React from 'react';
import './KbdHint.css';

export interface KbdHintProps {
  /**
   * Array of keys to display in the hint (e.g., ['⌘', 'K'] or ['Shift', 'C'])
   */
  keys: string[];
  /**
   * Optional description of what the shortcut does, used for tooltip and aria-label
   */
  description?: string;
  /**
   * Optional additional class name
   */
  className?: string;
}

/**
 * KbdHint Component
 * Displays a keyboard shortcut visually using HTML <kbd> elements.
 * 
 * @example
 * <KbdHint keys={['⌘', 'K']} description="Open Command Palette" />
 */
export function KbdHint({ keys, description, className = '' }: KbdHintProps) {
  if (!keys || keys.length === 0) return null;

  return (
    <span 
      className={`kbd-hint-wrapper ${className}`.trim()}
      title={description}
      aria-label={description ? `${description}: ${keys.join(' then ')}` : keys.join(' then ')}
    >
      {keys.map((k, i) => (
        <span key={i} className="kbd-hint-group">
          <kbd className="kbd-hint-key">{k}</kbd>
          {i < keys.length - 1 && <span className="kbd-hint-sep" aria-hidden="true">+</span>}
        </span>
      ))}
    </span>
  );
}
