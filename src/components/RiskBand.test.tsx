import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskBand } from './RiskBand';

describe('RiskBand Component', () => {
  it('renders children correctly', () => {
    render(
      <RiskBand level="success">
        <div data-testid="child-element">Test Content</div>
      </RiskBand>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with the correct pattern modifier class based on level prop', () => {
    const { rerender } = render(<RiskBand level="success">Content</RiskBand>);
    expect(screen.getByTestId('risk-band-pattern-success')).toHaveClass('risk-band__pattern--success');

    rerender(<RiskBand level="warning">Content</RiskBand>);
    expect(screen.getByTestId('risk-band-pattern-warning')).toHaveClass('risk-band__pattern--warning');

    rerender(<RiskBand level="danger">Content</RiskBand>);
    expect(screen.getByTestId('risk-band-pattern-danger')).toHaveClass('risk-band__pattern--danger');
  });

  it('passes additional props to the root wrapper element', () => {
    render(
      <RiskBand level="success" data-custom="value" id="test-id" className="extra-class">
        Content
      </RiskBand>
    );

    const rootElement = screen.getByText('Content').closest('.risk-band');
    expect(rootElement).toHaveAttribute('data-custom', 'value');
    expect(rootElement).toHaveAttribute('id', 'test-id');
    expect(rootElement).toHaveClass('extra-class');
  });

  it('pattern container is hidden from assistive tech', () => {
    render(<RiskBand level="warning">Content</RiskBand>);
    const patternEl = screen.getByTestId('risk-band-pattern-warning');
    expect(patternEl).toHaveAttribute('aria-hidden', 'true');
  });
});
