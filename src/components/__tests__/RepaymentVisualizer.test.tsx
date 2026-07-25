import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepaymentVisualizer } from '../RepaymentVisualizer';

const BASE = {
  principal: 100_000,
  apr: 8.5,
  monthlyPayment: 2500,
};

describe('RepaymentVisualizer', () => {
  it('renders the section heading', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.getByRole('region', { name: 'Repayment plan visualizer' })).toBeInTheDocument();
    expect(screen.getByText('Repayment Plan')).toBeInTheDocument();
  });

  it('shows empty state when principal is 0', () => {
    render(<RepaymentVisualizer {...BASE} principal={0} />);
    expect(
      screen.getByText(/Enter a valid principal/i),
    ).toBeInTheDocument();
  });

  it('shows empty state when monthlyPayment is 0', () => {
    render(<RepaymentVisualizer {...BASE} monthlyPayment={0} />);
    expect(screen.getByText(/Enter a valid principal/i)).toBeInTheDocument();
  });

  it('renders the SVG chart with accessible role and tabIndex', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('tabindex', '0');
  });

  it('renders term and total interest summary', () => {
    render(<RepaymentVisualizer {...BASE} />);
    // summary line contains "months" and "$X total interest"
    // Use getAllByText since the SR table caption also contains these words
    expect(screen.getAllByText(/month/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/total interest/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the SR-only data table with correct headers', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const tables = screen.getAllByRole('table');
    // At least one table (SR table always present)
    expect(tables.length).toBeGreaterThanOrEqual(1);
    // SR table has required column headers
    expect(screen.getAllByRole('columnheader', { name: /Month/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('columnheader', { name: /Interest/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('columnheader', { name: /Principal/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders a legend with principal and interest labels', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.getAllByText(/Principal remaining/i).length).toBeGreaterThanOrEqual(1);
    // "Cumulative interest" appears in the legend and also as a table header
    expect(screen.getAllByText(/Cumulative interest/i).length).toBeGreaterThanOrEqual(1);
  });

  it('schedule table toggle expands visible rows', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const summary = screen.getByText(/Schedule table/i);
    // Open details
    fireEvent.click(summary);
    // Should now show a "Show all" button or visible table rows
    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThanOrEqual(2);
  });

  it('caps term at maxMonths', () => {
    // Very low payment — would take forever; capped at maxMonths=6
    render(<RepaymentVisualizer principal={100_000} apr={8.5} monthlyPayment={3000} maxMonths={6} />);
    // "6 month" appears in both the visible header and SR table caption
    expect(screen.getAllByText(/6 month/).length).toBeGreaterThanOrEqual(1);
  });

  it('has no tooltip by default', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouse move over SVG', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');
    // Simulate mousemove — jsdom won't compute getBoundingClientRect but fires the handler
    fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
    // Tooltip should appear (role="status" aria-live)
    expect(screen.getByRole('status')).toBeInTheDocument();
    // "Month" appears in the tooltip heading AND in the SR table caption; use getAllByText
    expect(screen.getAllByText(/Month/).length).toBeGreaterThanOrEqual(1);
  });

  it('hides tooltip on mouse leave', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');
    fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.mouseLeave(svg);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

// ─── Keyboard shortcut hints & navigation tests ───────────────────────────

describe('RepaymentVisualizer — keyboard shortcut hints & navigation', () => {
  it('renders keyboard shortcut hints in header and legend bar', () => {
    render(<RepaymentVisualizer {...BASE} />);
    expect(screen.getAllByText('Inspect month').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inspect').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getAllByText('←').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('→').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('navigates schedule data points using ArrowRight and ArrowLeft keys', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');

    // Press ArrowRight to move to month 1
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-valuenow', '1');

    // Press ArrowRight again to move to month 2
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(svg).toHaveAttribute('aria-valuenow', '2');

    // Press ArrowLeft to move back to month 1
    fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    expect(svg).toHaveAttribute('aria-valuenow', '1');
  });

  it('jumps to start and end of schedule using Home and End keys', () => {
    render(<RepaymentVisualizer principal={100_000} apr={8.5} monthlyPayment={3000} maxMonths={6} />);
    const svg = screen.getByRole('img');

    // Press End key to jump to last month (month 6)
    fireEvent.keyDown(svg, { key: 'End' });
    expect(svg).toHaveAttribute('aria-valuenow', '6');

    // Press Home key to jump back to month 1
    fireEvent.keyDown(svg, { key: 'Home' });
    expect(svg).toHaveAttribute('aria-valuenow', '1');
  });

  it('clears active tooltip when pressing Escape key', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');

    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.keyDown(svg, { key: 'Escape' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

// ─── Accessibility caption / aria-label tests (chart-captions feature) ────────

describe('RepaymentVisualizer — accessible chart captions', () => {
  it('SVG has the default aria-label when chartAriaLabel is omitted', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute(
      'aria-label',
      'Stacked area chart showing principal and cumulative interest over repayment months',
    );
  });

  it('SVG uses the chartAriaLabel override when provided', () => {
    const customLabel = 'Home improvement loan repayment chart at 8.5% APR';
    render(<RepaymentVisualizer {...BASE} chartAriaLabel={customLabel} />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('aria-label', customLabel);
  });

  it('changing chartAriaLabel prop updates the SVG aria-label', () => {
    const { rerender } = render(<RepaymentVisualizer {...BASE} chartAriaLabel="First label" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'First label');

    rerender(<RepaymentVisualizer {...BASE} chartAriaLabel="Second label" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Second label');
  });

  it('removing chartAriaLabel reverts the SVG to the default aria-label', () => {
    const { rerender } = render(
      <RepaymentVisualizer {...BASE} chartAriaLabel="Custom label" />,
    );
    rerender(<RepaymentVisualizer {...BASE} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Stacked area chart showing principal and cumulative interest over repayment months',
    );
  });

  it('SR table caption is auto-generated from term and total interest when caption is omitted', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const caption = document.querySelector('table.sr-only caption');
    expect(caption).toBeInTheDocument();
  });

  it('does not render the SVG or SR table when principal is 0', () => {
    render(<RepaymentVisualizer {...BASE} principal={0} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('table.sr-only')).not.toBeInTheDocument();
  });
});

// ─── Responsive breakpoints (Tailwind) tests ───────────────────────────────

describe('RepaymentVisualizer — responsive breakpoints', () => {
  it('section wrapper has responsive padding classes', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const section = screen.getByRole('region', { name: 'Repayment plan visualizer' });
    expect(section).toHaveClass('p-4', 'sm:p-5', 'md:p-6');
  });

  it('header uses responsive flex layout', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const heading = screen.getByText('Repayment Plan');
    const header = heading.closest('header');
    expect(header).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between');
  });

  it('legend uses responsive flex layout', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const legendItem = screen.getAllByText(/Principal remaining/i)[0];
    const legendWrapper = legendItem.parentElement;
    expect(legendWrapper).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-3', 'sm:gap-4');
  });

  it('visible table wrapper has responsive negative margin for bleed', () => {
    render(<RepaymentVisualizer {...BASE} />);
    const summary = screen.getByText(/Schedule table/i);
    fireEvent.click(summary); // Open details
    
    const table = screen.getAllByRole('table').find((t) => !t.classList.contains('sr-only'));
    const wrapper = table?.parentElement;
    expect(wrapper).toHaveClass('overflow-x-auto', '-mx-4', 'sm:mx-0', 'px-4', 'sm:px-0');
  });
});
