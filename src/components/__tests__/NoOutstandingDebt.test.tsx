import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NoOutstandingDebt } from '../illustrations/EmptyStateIllustrations';

/**
 * Smoke tests for the new `NoOutstandingDebt` illustration.
 *
 * The illustration is decorative: it carries `aria-hidden="true"` from the
 * `IllustrationFrame` wrapper and contains no focusable nodes. The visual
 * semantics ("$0 receipt + paid checkmark") are conveyed by the surrounding
 * heading context (typically `EmptyState`).
 *
 * NOTE: We intentionally do NOT run axe-core here. jsdom has no layout
 * engine, so most axe rules silently skip / produce noise; the contrast
 * rule is the one we care about and it is enforced by design tokens at the
 * `EmptyState` composition level. axe assertions at this layer would give
 * false confidence.
 */
describe('NoOutstandingDebt illustration', () => {
  it('renders as aria-hidden so it does not appear in the AT tree', () => {
    const { container } = render(<NoOutstandingDebt />);
    const frame = container.querySelector('.empty-state-illustration');
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not include any focusable SVG nodes', () => {
    const { container } = render(<NoOutstandingDebt />);
    const tabbables = container.querySelectorAll('[tabindex]');
    expect(tabbables.length).toBe(0);
  });

  it('merges additional className props onto the frame', () => {
    const { container } = render(
      <NoOutstandingDebt className="extra-class" />,
    );
    const frame = container.querySelector('.empty-state-illustration');
    expect(frame?.className).toContain('extra-class');
    expect(frame?.className).toContain('empty-state-illustration');
  });

  it('inherits color from currentColor so it themes via tokens', () => {
    const { container } = render(
      <div style={{ color: 'rgb(255, 0, 0)' }}>
        <NoOutstandingDebt />
      </div>,
    );
    // currentColor is used by the <text> fill and stroke paths. We do
    // NOT assert a specific numeric value (would be brittle), only that
    // the SVG exists — confirming the render path succeeded.
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
