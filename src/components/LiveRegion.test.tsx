import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  it('renders a visually hidden div with aria attributes', () => {
    render(<LiveRegion message="Test message" />);
    const region = screen.getByRole('status');
    
    expect(region).toBeInTheDocument();
    expect(region).toHaveClass('sr-only');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveTextContent('Test message');
  });

  it('updates the announcement when the message changes', () => {
    const { rerender } = render(<LiveRegion message="Initial message" />);
    expect(screen.getByRole('status')).toHaveTextContent('Initial message');

    rerender(<LiveRegion message="Updated message" />);
    expect(screen.getByRole('status')).toHaveTextContent('Updated message');
  });

  it('does not clear the announcement when message is set to null or empty', () => {
    const { rerender } = render(<LiveRegion message="Persistent message" />);
    expect(screen.getByRole('status')).toHaveTextContent('Persistent message');

    rerender(<LiveRegion message="" />);
    // The previous message should persist to give screen readers time to announce it.
    expect(screen.getByRole('status')).toHaveTextContent('Persistent message');

    rerender(<LiveRegion message={null} />);
    expect(screen.getByRole('status')).toHaveTextContent('Persistent message');
  });

  it('allows overriding className and aria-live', () => {
    render(<LiveRegion message="Test" className="custom-class" aria-live="assertive" />);
    const region = screen.getByRole('status');
    
    expect(region).toHaveClass('custom-class');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });
});
