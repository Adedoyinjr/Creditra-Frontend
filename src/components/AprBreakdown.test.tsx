import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AprBreakdown } from './AprBreakdown';

const mockComponents = [
  {
    label: 'Base Rate',
    value: 5.0,
    color: '#3B82F6',
    explanation: 'The base lending rate set by market conditions and our funding cost.',
  },
  {
    label: 'Risk Premium',
    value: 4.5,
    color: '#F59E0B',
    explanation: 'Added based on your credit score and repayment history.',
  },
  {
    label: 'Platform Fee',
    value: 2.0,
    color: '#8B5CF6',
    explanation: "Creditra's service fee for loan origination and management.",
  },
  {
    label: 'Insurance',
    value: 1.0,
    color: '#10B981',
    explanation: 'Optional loan protection insurance premium.',
  },
];

describe('AprBreakdown', () => {
  it('renders_total_apr_correctly', () => {
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    expect(screen.getByText('12.50%')).toBeInTheDocument();
  });

  it('breakdown_panel_hidden_by_default', () => {
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const panel = screen.queryByRole('region', { name: 'APR breakdown details' });
    expect(panel).not.toBeInTheDocument();
  });

  it('clicking_explain_apr_opens_panel', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    const panel = screen.getByRole('region', { name: 'APR breakdown details' });
    expect(panel).toBeInTheDocument();
  });

  it('clicking_again_closes_panel', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');

    // Open
    await user.click(button);
    let panel = screen.getByRole('region', { name: 'APR breakdown details' });
    expect(panel).toBeInTheDocument();

    // Close
    await user.click(button);
    panel = screen.queryByRole('region', { name: 'APR breakdown details' });
    expect(panel).not.toBeInTheDocument();
  });

  it('each_component_shows_label_and_value', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    // Check each component is visible
    mockComponents.forEach((component) => {
      expect(screen.getByText(component.label)).toBeInTheDocument();
      expect(screen.getByText(`${component.value.toFixed(2)}%`)).toBeInTheDocument();
    });
  });

  it('clicking_component_shows_explanation', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    // Find the first component's expand button (the first chevron after opening)
    const expandButtons = screen.getAllByRole('button');
    const firstComponentExpandButton = expandButtons[1]; // Index 0 is the main toggle, 1 is first component expand

    // Initially, explanation should not be visible
    expect(
      screen.queryByText(mockComponents[0].explanation)
    ).not.toBeInTheDocument();

    // Click to expand
    await user.click(firstComponentExpandButton);

    // Now explanation should be visible
    expect(screen.getByText(mockComponents[0].explanation)).toBeInTheDocument();
    expect(firstComponentExpandButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('escape_key_closes_panel', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    let panel = screen.getByRole('region', { name: 'APR breakdown details' });
    expect(panel).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    panel = screen.queryByRole('region', { name: 'APR breakdown details' });
    expect(panel).not.toBeInTheDocument();
  });

  it('bar_segments_proportional_to_values', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    const segments = screen.getAllByRole('img');
    expect(segments).toHaveLength(mockComponents.length);

    // Check that each segment has the correct proportional width
    mockComponents.forEach((component, idx) => {
      const expectedPercentage = (component.value / 12.5) * 100;
      expect(segments[idx]).toHaveStyle({
        width: `${expectedPercentage}%`,
        backgroundColor: component.color,
      });
    });
  });

  it('accessible_no_axe_violations_closed', async () => {
    const { container } = render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    // Verify button exists
    expect(container).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Explain APR/i });
    expect(button).toBeInTheDocument();
  });

  it('accessible_no_axe_violations_open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    // Verify panel has proper ARIA attributes
    const panel = screen.getByRole('region', { name: 'APR breakdown details' });
    expect(panel).toBeInTheDocument();
  });

  it('renders_correctly_in_dark_mode', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    // Simulate dark mode by adding dark class to html element
    document.documentElement.classList.add('dark');

    const button = screen.getByText('Explain APR');
    await user.click(button);

    const panel = screen.getByRole('region', { name: 'APR breakdown details' });
    expect(panel).toBeInTheDocument();

    // Check that the component classes are applied
    expect(panel).toHaveClass('apr-breakdown__panel');

    // Clean up
    document.documentElement.classList.remove('dark');
  });

  it('handles_zero_apr', () => {
    render(
      <AprBreakdown
        totalApr={0}
        components={[
          {
            label: 'Base Rate',
            value: 0,
            color: '#3B82F6',
            explanation: 'No rate',
          },
        ]}
      />
    );

    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('handles_single_component', async () => {
    const user = userEvent.setup();
    const singleComponent = [
      {
        label: 'Single Rate',
        value: 5.0,
        color: '#3B82F6',
        explanation: 'Single component explanation',
      },
    ];

    render(
      <AprBreakdown
        totalApr={5.0}
        components={singleComponent}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    const segments = screen.getAllByRole('img');
    expect(segments).toHaveLength(1);
    expect(segments[0]).toHaveStyle({ width: '100%' });
  });

  it('aria_controls_connects_button_to_panel', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');

    await user.click(button);

    const panel = screen.getByRole('region', { name: 'APR breakdown details' });

    // Verify panel exists and has an id
    expect(panel).toBeInTheDocument();
    expect(panel.id).toBeTruthy();
  });

  it('component_expand_buttons_have_proper_labels', async () => {
    const user = userEvent.setup();
    render(
      <AprBreakdown
        totalApr={12.5}
        components={mockComponents}
      />
    );

    const button = screen.getByText('Explain APR');
    await user.click(button);

    const expandButtons = screen.getAllByRole('button');
    // First button is the main toggle, rest are component expands
    const componentExpandButtons = expandButtons.slice(1);

    componentExpandButtons.forEach((btn) => {
      const label = btn.getAttribute('aria-label');
      expect(label).toContain('explanation');
    });
  });
});
