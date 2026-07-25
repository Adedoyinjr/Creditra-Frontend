import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KbdHint } from '../KbdHint';

describe('KbdHint', () => {
  it('renders a single key correctly', () => {
    render(<KbdHint keys="Esc" label="Close" />);
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('renders multiple keys with separators', () => {
    render(<KbdHint keys={['←', '→']} label="Navigate" />);
    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('Navigate')).toBeInTheDocument();
  });

  it('provides screen reader accessible text', () => {
    render(<KbdHint keys={['←', '→']} label="Inspect month" />);
    const srElement = document.querySelector('.sr-only');
    expect(srElement).toBeInTheDocument();
    expect(srElement?.textContent).toContain('Inspect month (← →)');
  });

  it('uses custom description when provided', () => {
    render(<KbdHint keys="?" description="Open help overlay" />);
    const srElement = document.querySelector('.sr-only');
    expect(srElement?.textContent).toBe('Open help overlay');
  });

  it('applies badge variant class when specified', () => {
    const { container } = render(<KbdHint keys="Tab" variant="badge" />);
    expect(container.firstChild).toHaveClass('kbd-hint-badge');
  });

  it('applies custom className', () => {
    const { container } = render(<KbdHint keys="Enter" className="custom-hint" />);
    expect(container.firstChild).toHaveClass('custom-hint');
  });
});
