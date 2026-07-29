import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip (alias for AccessibleTooltip)', () => {
  it('renders with a label and exposes the tooltip content', () => {
    render(<Tooltip label="This is a helpful hint" />);
    // The trigger with aria-label "More information"
    expect(
      screen.getByLabelText('More information'),
    ).toBeInTheDocument();
    // The tooltip content
    const tooltip = document.getElementById(
      screen.getByLabelText('More information').getAttribute('aria-describedby')!,
    );
    expect(tooltip).toHaveTextContent('This is a helpful hint');
  });

  it('renders children as inline content when provided', () => {
    render(<Tooltip label="Definition">Apr</Tooltip>);
    expect(screen.getByText('Apr')).toBeInTheDocument();
  });

  it('is focusable via keyboard', () => {
    render(<Tooltip label="Extra info" />);
    const trigger = screen.getByLabelText('More information');
    expect(trigger).toHaveAttribute('tabindex', '0');
  });
});
