/**
 * SettingsAccount — Account management page
 *
 * Collapsible sections for account-related settings. Each section can be
 * toggled independently. When the user prints the page all sections are
 * automatically expanded and browser chrome is hidden via print.css.
 *
 * @accessibility
 *   - Each section uses a <button> with aria-expanded wired to its collapsed
 *     state so screen readers announce expand/collapse.
 *   - aria-controls links the toggle button to its content panel.
 *   - All interactive elements meet 44×44 px minimum touch target.
 *   - Focus ring uses the semantic --accent token.
 *
 * @darkmode All colours reference var(--*) tokens.
 *
 * Route: /settings/account (add to App.tsx router)
 */

import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  Accessibility,
  Globe,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { HighContrastToggle } from '../components/HighContrastToggle';
import { ReducedMotionToggle } from '../components/ReducedMotionToggle';
import { LocaleSettings } from './settings/Locale';
import { ExportAccountSettings } from './settings/Export';
import './SettingsAccount.css';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

// ─── CollapsibleSection ─────────────────────────────────────────────────────

/**
 * A single collapsible section with a toggle button and content panel.
 *
 * During print, the `settings-account__collapsible--print-expand` class
 * (applied by print.css) forces all panels to render expanded.
 */
function CollapsibleSection({
  id,
  title,
  icon,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = `${id}-panel`;
  const buttonId = `${id}-toggle`;

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <section
      className="settings-account__section settings-account__collapsible"
      aria-labelledby={buttonId}
    >
      <button
        id={buttonId}
        type="button"
        className="settings-account__toggle"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span className="settings-account__toggle-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="settings-account__toggle-label">{title}</span>
        <ChevronDown
          className={`settings-account__chevron${expanded ? ' settings-account__chevron--open' : ''}`}
          aria-hidden="true"
          size={20}
        />
      </button>

      <div
        id={panelId}
        className={`settings-account__panel${expanded ? ' settings-account__panel--expanded' : ''}`}
        role="region"
        aria-labelledby={buttonId}
        hidden={!expanded}
      >
        <div className="settings-account__panel-inner">
          {children}
        </div>
      </div>
    </section>
  );
}

// ─── SettingsAccount ────────────────────────────────────────────────────────

export function SettingsAccount() {
  return (
    <main
      className="settings-account"
      aria-labelledby="settings-account-title"
    >
      <h1 id="settings-account-title" className="settings-account__title">
        Account Settings
      </h1>
      <p className="settings-account__description">
        Manage your account preferences and data. Sections expand independently
        — all sections are automatically expanded when you print this page.
      </p>

      {/* ── Accessibility ────────────────────────────────────────────────── */}
      <CollapsibleSection
        id="account-a11y"
        title="Accessibility"
        icon={<Accessibility size={20} aria-hidden="true" />}
        defaultExpanded
      >
        <div className="settings-account__toggle-grid">
          <HighContrastToggle />
          <ReducedMotionToggle />
        </div>
      </CollapsibleSection>

      {/* ── Regional Preferences ──────────────────────────────────────────── */}
      <CollapsibleSection
        id="account-locale"
        title="Regional Preferences"
        icon={<Globe size={20} aria-hidden="true" />}
      >
        <LocaleSettings />
      </CollapsibleSection>

      {/* ── Export Account Data ───────────────────────────────────────────── */}
      <CollapsibleSection
        id="account-export"
        title="Export Account Data"
        icon={<Download size={20} aria-hidden="true" />}
      >
        <ExportAccountSettings />
      </CollapsibleSection>

      {/* ── Privacy & Security ────────────────────────────────────────────── */}
      <CollapsibleSection
        id="account-privacy"
        title="Privacy &amp; Security"
        icon={<ShieldCheck size={20} aria-hidden="true" />}
      >
        <p className="settings-account__privacy-text">
          Your personal and financial information is encrypted in transit and at
          rest. We comply with industry-standard security practices and financial
          data protection regulations. Your data is retained for the duration of
          your account and for 90&nbsp;days after deletion as required by
          financial regulations.
        </p>
      </CollapsibleSection>
    </main>
  );
}

export default SettingsAccount;
