import { useEffect, useState } from 'react';

export interface LiveRegionProps {
  /** The message to be announced by screen readers. */
  message?: string | null;
  /** Optional custom CSS class. Defaults to "sr-only" for visual hiding. */
  className?: string;
  /** Defines the politeness level of the live region. Defaults to "polite". */
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

/**
 * A reusable component for screen reader announcements.
 * It renders a visually hidden element that announces text changes via `aria-live`.
 */
export function LiveRegion({
  message,
  className = 'sr-only',
  'aria-live': ariaLive = 'polite',
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // We only update the internal announcement state when a new, non-empty message arrives.
    // This allows the message to persist in the DOM for ATs to read it.
    if (message) {
      setAnnouncement(message);
    }
  }, [message]);

  return (
    <div
      className={className}
      role="status"
      aria-live={ariaLive}
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
}
