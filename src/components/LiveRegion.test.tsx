/**
 * LiveRegion.test.tsx
 *
 * Unit tests for the LiveRegion accessibility component (ariallive-v7).
 * Verifies the rendered ARIA attributes and visual-hiding behaviour.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveRegion from './LiveRegion';

describe('LiveRegion', () => {
  it('renders with role="status"', () => {
    render(<LiveRegion message="Hello" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the message text', () => {
    render(<LiveRegion message="Payment confirmed" />);
    expect(screen.getByTestId('live-region')).toHaveTextContent('Payment confirmed');
  });

  it('defaults to aria-live="polite"', () => {
    render(<LiveRegion message="test" />);
    expect(screen.getByTestId('live-region')).toHaveAttribute('aria-live', 'polite');
  });

  it('accepts aria-live="assertive"', () => {
    render(<LiveRegion message="urgent" politeness="assertive" />);
    expect(screen.getByTestId('live-region')).toHaveAttribute('aria-live', 'assertive');
  });

  it('defaults to aria-atomic="true"', () => {
    render(<LiveRegion message="test" />);
    expect(screen.getByTestId('live-region')).toHaveAttribute('aria-atomic', 'true');
  });

  it('can set aria-atomic="false"', () => {
    render(<LiveRegion message="test" atomic={false} />);
    expect(screen.getByTestId('live-region')).toHaveAttribute('aria-atomic', 'false');
  });

  it('carries the sr-only class for visual hiding', () => {
    render(<LiveRegion message="hidden" />);
    expect(screen.getByTestId('live-region')).toHaveClass('sr-only');
  });

  it('renders an empty message without throwing', () => {
    render(<LiveRegion message="" />);
    expect(screen.getByTestId('live-region')).toBeInTheDocument();
    expect(screen.getByTestId('live-region').textContent).toBe('');
  });

  it('updates text content when message prop changes', () => {
    const { rerender } = render(<LiveRegion message="step one" />);
    expect(screen.getByTestId('live-region')).toHaveTextContent('step one');
    rerender(<LiveRegion message="step two" />);
    expect(screen.getByTestId('live-region')).toHaveTextContent('step two');
  });
});
