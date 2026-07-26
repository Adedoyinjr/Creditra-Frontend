import React from 'react';
import { NoActivity } from '../components/illustrations';
import './Notifications.css';

/**
 * Notifications Page
 *
 * Provides a themed empty state for the /notifications route when there are no
 * notifications available for the user.
 *
 * Accessibility:
 * - Uses role="status" and aria-live="polite" to politely announce the empty state.
 * - WCAG 2.1 AA compliant contrast and responsive scaling.
 */
export function Notifications() {
  return (
    <div className="notifications-page">
      <div className="notifications-empty-state" role="status" aria-live="polite">
        <NoActivity className="notifications-empty-icon" aria-hidden="true" />
        <h2 className="notifications-empty-title">No notifications yet</h2>
        <p className="notifications-empty-desc">
          When you have new alerts, reminders, or messages, they will appear here.
        </p>
      </div>
    </div>
  );
}

export default Notifications;
