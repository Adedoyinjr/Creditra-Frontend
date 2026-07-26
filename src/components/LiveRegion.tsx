/**
 * LiveRegion — aria-live announcement helper (WCAG 4.1.3 Status Messages)
 *
 * Renders a visually-hidden node that screen readers poll for content
 * changes.  When `message` changes, assistive technology announces the new
 * text automatically — no focus move required.
 *
 * Usage
 * -----
 * ```tsx
 * const [announcement, setAnnouncement] = useState('');
 *
 * // later, on a state transition:
 * setAnnouncement('Review step: repaying $3,200.00');
 *
 * return (
 *   <>
 *     <LiveRegion message={announcement} />
 *     {/* … rest of page … *\/}
 *   </>
 * );
 * ```
 *
 * Props
 * -----
 * message   – Text to announce.  Changing this value triggers the read-out.
 *             Pass an empty string to stay silent.
 * politeness – 'polite' (default) waits for the user to finish typing before
 *              announcing.  'assertive' interrupts immediately — use only for
 *              errors/critical alerts where immediate announcement is needed.
 * atomic     – When true (default) the entire region is read on each change
 *              rather than only the diff.  Recommended for short status
 *              strings like step transitions and validation feedback.
 *
 * Accessibility notes
 * -------------------
 * - The node is visually hidden via .sr-only (defined in src/index.css).
 *   It must stay in the DOM at all times so the browser registers the live
 *   region before any content is injected.
 * - Do NOT use `display:none` or `visibility:hidden` — browsers de-register
 *   live regions that are invisible at announcement time.
 * - For errors that also steal focus, prefer `role="alert"` (implicit
 *   aria-live="assertive") on the inline banner rather than using this
 *   component, to avoid double-announcing.
 */

import type React from 'react';

export interface LiveRegionProps {
  /** The text to be announced by screen readers. */
  message: string;
  /**
   * Controls how urgently the announcement is made.
   * - `'polite'` (default) – waits for the user to be idle.
   * - `'assertive'`        – interrupts immediately; use sparingly.
   */
  politeness?: 'polite' | 'assertive';
  /**
   * When `true` (default) the whole region is re-read on every message
   * change, even if only part of the text changed.
   */
  atomic?: boolean;
}

/**
 * A visually-hidden `<div>` that exposes state-change announcements to
 * screen readers via ARIA live regions.
 *
 * Always render this component at the top of the page/section it belongs
 * to, before the interactive content, so the browser registers the live
 * region node before any dynamic content is written into it.
 */
const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
}) => (
  <div
    role="status"
    aria-live={politeness}
    aria-atomic={atomic}
    // sr-only is defined in src/index.css — visually hidden but in the
    // accessibility tree and reachable by live-region polling.
    className="sr-only"
    data-testid="live-region"
  >
    {message}
  </div>
);

export default LiveRegion;
