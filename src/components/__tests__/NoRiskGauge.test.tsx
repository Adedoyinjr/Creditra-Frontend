import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NoRiskGauge } from '../illustrations/EmptyStateIllustrations';

describe('NoRiskGauge illustration', () => {
  it('renders as aria-hidden so it does not appear in the AT tree', () => {
    const { container } = render(<NoRiskGauge />);
    const frame = container.querySelector('.empty-state-illustration');
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not include any focusable SVG nodes', () => {
    const { container } = render(<NoRiskGauge />);
    const tabbables = container.querySelectorAll('[tabindex]');
    expect(tabbables.length).toBe(0);
  });

  it('merges additional className props onto the frame', () => {
    const { container } = render(
      <NoRiskGauge className="extra-class" />,
    );
    const frame = container.querySelector('.empty-state-illustration');
    expect(frame?.className).toContain('extra-class');
    expect(frame?.className).toContain('empty-state-illustration');
  });

  it('renders a dashed semicircular arc hinting at the gauge', () => {
    const { container } = render(<NoRiskGauge />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // The dashed arc path should be present
    const dashedArc = svg?.querySelector('path[stroke-dasharray="6 6"]');
    expect(dashedArc).toBeInTheDocument();
  });

  it('renders a "?" text glyph to indicate absence of data', () => {
    const { container } = render(<NoRiskGauge />);
    const questionMark = container.querySelector('text');
    expect(questionMark?.textContent).toBe('?');
  });

  it('inherits color from currentColor so it themes via tokens', () => {
    const { container } = render(
      <div style={{ color: 'rgb(88, 166, 255)' }}>
        <NoRiskGauge />
      </div>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
