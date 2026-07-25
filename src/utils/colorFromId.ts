/**
 * Deterministic color identity for account / entity scanning.
 *
 * Maps a stable string id to a palette color so list rows and cards keep a
 * consistent left-edge stripe across renders and sessions. Used by linked
 * accounts (and reusable anywhere a per-entity color stripe is needed).
 *
 * Accessibility:
 * - Palette colors are drawn from design tokens with ≥ 3:1 contrast against
 *   `--surface` (#161b22) for non-text UI components (WCAG 1.4.11).
 * - Callers must not rely on color alone — pair the stripe with a text label
 *   (WCAG 1.4.1 Use of Color).
 */

import type { CSSProperties } from 'react';
import { COLOR } from './tokens';

/**
 * Fixed accent palette for per-account color stripes.
 * Order is stable — never re-order without migrating persisted UI expectations.
 */
export const ACCOUNT_STRIPE_PALETTE: readonly string[] = [
  COLOR.accent, // blue
  COLOR.success, // green
  COLOR.warning, // amber
  '#a371f7', // purple — AA ≥ 3:1 on #161b22
  '#39d0d8', // teal
  COLOR.danger, // red
] as const;

/**
 * djb2 XOR hash — identical algorithm to `lineAccentColor` in tokens.ts so
 * credit-line and account identities stay consistent if they share an id.
 */
function hashId(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) ^ id.charCodeAt(i);
    hash = hash | 0;
  }
  return hash;
}

/**
 * Map any stable string id to a palette color.
 *
 * @param id  Account / entity identifier (e.g. linked-account UUID).
 * @returns   One of `ACCOUNT_STRIPE_PALETTE` — same id → same color always.
 *
 * @example
 *   colorFromId('acct-google-1') // => '#58a6ff' (stable)
 */
export function colorFromId(id: string): string {
  if (!id) {
    return ACCOUNT_STRIPE_PALETTE[0];
  }
  const hash = hashId(id);
  return ACCOUNT_STRIPE_PALETTE[Math.abs(hash) % ACCOUNT_STRIPE_PALETTE.length];
}

/**
 * Zero-width CSS style for a 3 px left-edge identity stripe.
 * Absolute positioning keeps layout width unchanged (no CLS).
 */
export function accountStripeStyle(id: string): CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    background: colorFromId(id),
    borderRadius: '4px 0 0 4px',
    pointerEvents: 'none',
  };
}
