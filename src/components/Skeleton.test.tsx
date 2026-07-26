/**
 * @fileoverview Tests for src/components/Skeleton.tsx
 *
 * Covers:
 *   - Existing behaviour (class names, style props, aria attributes, shapes)
 *   - GrantFox FWC26: `variant` prop (`default` | `subtle`)
 *   - GrantFox FWC26: CSS token declarations in Skeleton.css
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── CSS token tests ───────────────────────────────────────────────────────

describe('Skeleton.css — themed tokens (FWC26)', () => {
  const cssPath = resolve(__dirname, './Skeleton.css');
  const css = readFileSync(cssPath, 'utf-8');

  it('declares --skeleton-bg token using var(--surface-raised) (not --border)', () => {
    expect(css).toContain('--skeleton-bg');
    expect(css).toContain('var(--surface-raised');
    // Must NOT fall back to --border for the base background
    expect(css).not.toMatch(/background(-color)?:\s*var\(--border\)/);
  });

  it('uses --skeleton-bg as the background-color (not a hard-coded hex)', () => {
    expect(css).toMatch(/background-color:\s*var\(--skeleton-bg\)/);
  });

  it('declares --skeleton-highlight token for the shimmer stripe', () => {
    expect(css).toContain('--skeleton-highlight');
  });

  it('uses --skeleton-highlight in the shimmer gradient', () => {
    expect(css).toContain('var(--skeleton-highlight)');
  });

  it('declares --skeleton-radius token', () => {
    expect(css).toContain('--skeleton-radius');
  });

  it('suppresses shimmer animation under prefers-reduced-motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    const rmBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(rmBlock).toContain('animation: none');
  });

  it('suppresses shimmer animation under [data-motion="reduced"]', () => {
    expect(css).toContain('[data-motion="reduced"]');
    const motionBlock = css.slice(css.indexOf('[data-motion="reduced"]'));
    expect(motionBlock).toContain('animation: none');
  });
});

// ── Component behaviour tests ─────────────────────────────────────────────

describe('Skeleton', () => {
  it('renders correctly with given custom styles', () => {
    const { container } = render(
      <Skeleton width="100px" height="50px" className="custom-class" />
    );
    const element = container.firstChild as HTMLElement;

    expect(element).toBeInTheDocument();
    expect(element.className).toContain('skeleton');
    expect(element.className).toContain('custom-class');
    expect(element.style.width).toBe('100px');
    expect(element.style.height).toBe('50px');
  });

  it('applies the skeleton shape (radius token) via CSS', () => {
    render(<Skeleton data-testid="skeleton-element" />);
    const element = screen.getByTestId('skeleton-element');

    // jsdom can't reliably resolve CSS variables/computed styles,
    // so we assert the skeleton carries the class rule that defines border-radius.
    expect(element.className).toContain('skeleton');
  });

  it('spreads additional HTML attributes properly', () => {
    render(<Skeleton data-testid="skeleton-element" aria-hidden="true" />);
    const element = screen.getByTestId('skeleton-element');

    expect(element).toBeInTheDocument();
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies shape classes correctly', () => {
    const { container: containerRect } = render(<Skeleton shape="rectangular" />);
    expect((containerRect.firstChild as HTMLElement).className).toContain(
      'skeleton--rectangular'
    );

    const { container: containerCirc } = render(<Skeleton shape="circular" />);
    expect((containerCirc.firstChild as HTMLElement).className).toContain(
      'skeleton--circular'
    );

    const { container: containerRound } = render(<Skeleton shape="rounded" />);
    expect((containerRound.firstChild as HTMLElement).className).toContain(
      'skeleton--rounded'
    );
  });

  // ── FWC26: variant prop ────────────────────────────────────────────────

  it('defaults to variant="default" (no skeleton--subtle class)', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('skeleton--subtle')).toBe(false);
  });

  it('variant="default" does not add skeleton--subtle class', () => {
    const { container } = render(<Skeleton variant="default" />);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('skeleton--subtle')).toBe(false);
  });

  it('variant="subtle" adds skeleton--subtle class', () => {
    const { container } = render(<Skeleton variant="subtle" />);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('skeleton--subtle')).toBe(true);
  });

  it('variant="subtle" still carries base skeleton class', () => {
    const { container } = render(<Skeleton variant="subtle" />);
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('skeleton')).toBe(true);
  });

  it('custom className is preserved alongside variant class', () => {
    const { container } = render(
      <Skeleton variant="subtle" className="my-custom" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.classList.contains('skeleton--subtle')).toBe(true);
    expect(el.classList.contains('my-custom')).toBe(true);
  });

  it('style prop is merged with width/height', () => {
    const { container } = render(
      <Skeleton width="80px" height="20px" style={{ borderRadius: '50%' }} />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('80px');
    expect(el.style.height).toBe('20px');
    expect(el.style.borderRadius).toBe('50%');
  });

  it('numeric width/height values are applied as-is (px assumed by React)', () => {
    const { container } = render(<Skeleton width={120} height={40} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('40px');
  });
});
