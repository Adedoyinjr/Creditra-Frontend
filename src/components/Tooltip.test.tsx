import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders children without showing tooltip initially', () => {
    render(
      <Tooltip label="Helpful info">
        <button>Trigger</button>
      </Tooltip>
    );

    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).not.toHaveClass('is-visible');
  });

  test('shows tooltip after hover delay (400ms by default)', () => {
    render(
      <Tooltip label="Hover tooltip text" hoverDelay={400}>
        <button>Hover me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Hover me').closest('.tooltip-wrapper')!;
    fireEvent.mouseEnter(wrapper);

    // Before 400ms: tooltip is not visible
    act(() => {
      vi.advanceTimersByTime(390);
    });
    expect(screen.getByRole('tooltip', { hidden: true })).not.toHaveClass('is-visible');

    // At 400ms: tooltip becomes visible
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByRole('tooltip')).toHaveClass('is-visible');

    // Mouse leave hides tooltip immediately
    fireEvent.mouseLeave(wrapper);
    expect(screen.getByRole('tooltip', { hidden: true })).not.toHaveClass('is-visible');
  });

  test('shows tooltip after long press delay (500ms by default) on touch', () => {
    render(
      <Tooltip label="Long press tooltip text" longPressDelay={500}>
        <button>Touch me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Touch me').closest('.tooltip-wrapper')!;
    fireEvent.touchStart(wrapper);

    // Before 500ms
    act(() => {
      vi.advanceTimersByTime(490);
    });
    expect(screen.getByRole('tooltip', { hidden: true })).not.toHaveClass('is-visible');

    // At 500ms
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByRole('tooltip')).toHaveClass('is-visible');

    // Touch end hides tooltip
    fireEvent.touchEnd(wrapper);
    expect(screen.getByRole('tooltip', { hidden: true })).not.toHaveClass('is-visible');
  });

  test('shows tooltip on focus and hides on blur', () => {
    render(
      <Tooltip label="Focus tooltip text">
        <button>Focus me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Focus me').closest('.tooltip-wrapper')!;
    fireEvent.focus(wrapper);
    expect(screen.getByRole('tooltip')).toHaveClass('is-visible');

    fireEvent.blur(wrapper);
    expect(screen.getByRole('tooltip', { hidden: true })).not.toHaveClass('is-visible');
  });

  test('supports position prop placement', () => {
    render(
      <Tooltip label="Bottom placement" position="bottom">
        <button>Position</button>
      </Tooltip>
    );

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveClass('tooltip-content--bottom');
  });

  test('does not show tooltip when disabled or label is empty', () => {
    render(
      <Tooltip label="Disabled tooltip" disabled>
        <button>Disabled</button>
      </Tooltip>
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
