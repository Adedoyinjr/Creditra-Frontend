/**
 * NotificationBell
 *
 * Trigger button for the app-wide NotificationCenter. Reads unread
 * count and panel state directly from NotificationContext, so it can
 * be dropped anywhere inside a NotificationProvider without props.
 *
 * Plays a one-shot 600 ms pulse ring when a NEW high-priority
 * ('danger' / 'error') notification arrives.
 *
 * Accessibility:
 *  - aria-haspopup="dialog" / aria-expanded / aria-controls wire the
 *    button to the NotificationCenter panel (id="notification-center").
 *  - The pulse is purely visual; the badge count is exposed via the
 *    accessible name so screen readers don't need the visual pulse.
 *  - Reduced-motion: pulse → brief border flash (via CSS media query).
 *
 * Issue: #219
 */

import { forwardRef, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationBell.css';

export interface NotificationBellProps {
  /** Accessible label for the button (defaults to "Notifications"). */
  label?: string;
}

export const NotificationBell = forwardRef<HTMLButtonElement, NotificationBellProps>(
  function NotificationBell({ label = 'Notifications' }, ref) {
    const { notifications, unreadCount, isPanelOpen, openPanel } = useNotifications();
    const [isPulsing, setIsPulsing] = useState(false);

    /**
     * Track the ID of the last high-priority notification we pulsed for.
     * Ensures we pulse once per ARRIVAL, not on every render or count change.
     */
    const lastPulsedIdRef = useRef<string | null>(null);

    // ── Pulse trigger ──────────────────────────────────────────────────────
    useEffect(() => {
      const latest = notifications.find(
        (n) => !n.read && (n.type === 'danger' || n.type === 'error'),
      );

      if (!latest) return;
      if (latest.id === lastPulsedIdRef.current) return; // already pulsed for this one

      lastPulsedIdRef.current = latest.id;
      setIsPulsing(true);

      const timer = setTimeout(() => setIsPulsing(false), 650); // 600ms + 50ms buffer
      return () => clearTimeout(timer);
    }, [notifications]);

    return (
      <button
        type="button"
        ref={ref}
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        aria-controls="notification-center"
        aria-label={unreadCount > 0 ? `${label} — ${unreadCount} unread` : label}
        className={[
          'notif-bell-btn',
          'relative inline-flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'text-gray-600 hover:text-gray-900',
          'hover:bg-gray-100 transition-colors duration-150',
          'focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
          isPulsing ? 'bell-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Bell size={20} aria-hidden="true" />

        {unreadCount > 0 && (
          <span
            aria-hidden="true" /* count is already in the button aria-label */
            className={[
              'notif-bell-badge',
              'absolute -top-0.5 -right-0.5',
              'min-w-[18px] h-[18px] px-1',
              'flex items-center justify-center',
              'rounded-full text-[10px] font-semibold leading-none',
              'bg-yellow-400 text-yellow-900', /* AA contrast: 5.2:1 */
            ].join(' ')}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  },
);

export default NotificationBell;
