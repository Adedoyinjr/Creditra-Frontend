/**
 * TrustBadges
 *
 * Renders a horizontal strip of security/trust assurance badges on auth pages
 * (login, register) as part of the GrantFox FWC26 campaign.
 *
 * Three badges are shown by default:
 *  - Audited contract — smart-contract security audit badge
 *  - Secure connection — HTTPS / in-transit encryption assurance
 *  - Open source — publicly verifiable codebase
 *
 * Design principles:
 *  - Color is never the sole signal; every badge pairs an icon with a label.
 *  - Icons carry `aria-hidden="true"`; the visible label is the accessible name.
 *  - The container uses `role="list"` so screen readers announce item count.
 *  - Styling uses CSS custom properties from `src/index.css` exclusively — no
 *    one-off hex values.
 *  - `prefers-reduced-motion` is respected via the companion CSS file.
 */

import { ShieldCheck, Lock, Code } from 'lucide-react';
import './TrustBadges.css';

export interface TrustBadge {
  /** Unique identifier — used as the React key. */
  id: string;
  /** Short visible label shown beside the icon. */
  label: string;
  /** BEM modifier appended to `.trust-badges__badge` for per-variant accent. */
  variant: 'audit' | 'secure' | 'open-source';
  /** Rendered icon component (aria-hidden, presentational). */
  icon: React.ReactNode;
}

/** Default badge definitions. Override via the `badges` prop if needed. */
const DEFAULT_BADGES: TrustBadge[] = [
  {
    id: 'audited',
    label: 'Audited contract',
    variant: 'audit',
    icon: <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'secure',
    label: 'Secure connection',
    variant: 'secure',
    icon: <Lock size={16} strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: 'open-source',
    label: 'Open source',
    variant: 'open-source',
    icon: <Code size={16} strokeWidth={2} aria-hidden="true" />,
  },
];

export interface TrustBadgesProps {
  /**
   * Override the default badge set.
   * Pass an empty array to render nothing (the container is still mounted).
   */
  badges?: TrustBadge[];
  /** Optional class name appended to the outermost element. */
  className?: string;
}

/**
 * TrustBadges component.
 *
 * @example
 * // Default usage — render the standard three badges below the login card:
 * <TrustBadges />
 *
 * @example
 * // Custom badge set:
 * <TrustBadges badges={[{ id: 'ssl', label: 'SSL encrypted', variant: 'secure', icon: <Lock size={16} aria-hidden="true" /> }]} />
 */
export function TrustBadges({
  badges = DEFAULT_BADGES,
  className = '',
}: TrustBadgesProps) {
  const rootClass = ['trust-badges', className].filter(Boolean).join(' ');

  return (
    <ul className={rootClass} role="list" aria-label="Security assurances">
      {badges.map(({ id, label, variant, icon }) => (
        <li
          key={id}
          className={`trust-badges__badge trust-badges__badge--${variant}`}
        >
          <span className="trust-badges__icon">{icon}</span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
