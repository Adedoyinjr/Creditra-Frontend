import { describe, it, expect } from 'vitest';
import {
  colorFromId,
  accountStripeStyle,
  ACCOUNT_STRIPE_PALETTE,
} from './colorFromId';

describe('colorFromId', () => {
  it('returns a palette color for a non-empty id', () => {
    const color = colorFromId('acct-google-1');
    expect(ACCOUNT_STRIPE_PALETTE).toContain(color);
  });

  it('is stable across calls for the same id', () => {
    expect(colorFromId('user-42')).toBe(colorFromId('user-42'));
  });

  it('tends to differ for distinct ids', () => {
    const a = colorFromId('account-alpha');
    const b = colorFromId('account-beta');
    // Not a hard guarantee for every pair, but these two land on different slots.
    expect(a).not.toBe(b);
  });

  it('falls back to the first palette entry for empty id', () => {
    expect(colorFromId('')).toBe(ACCOUNT_STRIPE_PALETTE[0]);
  });

  it('covers every palette slot across a range of ids', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(colorFromId(`id-${i}`));
    }
    expect(seen.size).toBe(ACCOUNT_STRIPE_PALETTE.length);
  });
});

describe('accountStripeStyle', () => {
  it('returns a 3px absolute left stripe using colorFromId', () => {
    const style = accountStripeStyle('acct-1');
    expect(style.width).toBe(3);
    expect(style.position).toBe('absolute');
    expect(style.left).toBe(0);
    expect(style.background).toBe(colorFromId('acct-1'));
    expect(style.pointerEvents).toBe('none');
  });
});
