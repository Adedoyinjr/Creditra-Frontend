/**
 * Settings page
 *
 * Houses accessibility and display preferences.
 * High-contrast toggle uses ContrastContext; future light/dark theme toggle
 * will use ThemeContext.
 *
 * Route: /settings  (add to App.tsx router when ready)
 */

import { Settings as SettingsIcon, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HighContrastToggle } from '../components/HighContrastToggle';
import { ReducedMotionToggle } from '../components/ReducedMotionToggle';

export function Settings() {
  return (
    <div className="card card-large">
      <h2>
        <SettingsIcon className="icon" aria-hidden="true" />
        Settings
      </h2>
      <p>Customize your experience with accessibility and notification options.</p>

      {/* ── Accessibility section ─────────────────────────────────────── */}
      <section
        aria-labelledby="settings-a11y-heading"
        style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem' }}
      >
        <h3
          id="settings-a11y-heading"
          style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}
        >
          Accessibility
        </h3>

        <HighContrastToggle />
        <ReducedMotionToggle />
      </section>

      {/* ── Notifications section ─────────────────────────────────────── */}
      <section
        aria-labelledby="settings-notif-heading"
        style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}
      >
        <h3
          id="settings-notif-heading"
          style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}
        >
          Notifications
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
          Manage your in-app category notifications and delivery channels.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/settings/notifications" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Bell size={16} aria-hidden="true" />
            Category Preferences
          </Link>
          <Link to="/notification-preferences" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            Delivery Channels
          </Link>
        </div>
      </section>
    </div>
  );
}
