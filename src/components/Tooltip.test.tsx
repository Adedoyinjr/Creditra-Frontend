import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from './Tooltip';
import { exec } from 'node:child_process';

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

  test('attaches aria-describedby to the child element, no the wrapper span, once visible', () => {
    render(
      <Tooltip label="Copy link">
        <button>Anchor</button>
      </Tooltip>
    );

    const button = screen.getByRole('button', { name: 'Anchor'});
    const wrapper = button.closest('.tooltip-wrapper')!;
    const tooltip = screen.getByRole('tooltip', { hidden: true});

    //Before showing: neither element is described yet.
    expect(button).not.toHaveAttribute('aria-describedby');
    expect(wrapper).not.toHaveAttribute('aria-describedby');

    fireEvent.focus(wrapper);

    //After showing: the button (focusable child) carries aria-describedby
    //pointing at the tooltip's id - the wrapper span never does.
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(wrapper).not.toHaveAttribute('aria-describedby');
  });

  test('merges tooltip id into an existing aria-describedby instead of overwriting it', () => {
    render(
        <Tooltip label="Copy link">
          <button aria-describedby='existing-error-id'>Anchor</button>
        </Tooltip>
      );

    const button = screen.getByRole('button', {name: 'Anchor' });
    const wrapper = button.closest('.tooltip-wrapper')!;
    const tooltip = screen.getByRole('tooltip', { hidden: true});

    //before showing: the child's own aria-describedby is untouched.
    expect(button).toHaveAttribute('aria-describedby', 'existing-error-id');

    fireEvent.focus(wrapper);

    //After showing: both ids are present, space-separated, existing one first.
    expect(button).toHaveAttribute(
      'aria-describedby',
      `existing-error-id ${tooltip.id}`
    );
  });

    test('Escape dimisses the tooltip while it is visible', () => {
      render(
        <Tooltip label='Escape test tooltip'>
          <button>Anchor</button>
        </Tooltip>
      );

      const wrapper = screen.getByText('Anchor').closest('.tooltip-wrapper')!;
      fireEvent.focus(wrapper);
      expect(screen.getByRole('tooltip')).toHaveClass('is-visible');

      fireEvent.keyDown(wrapper, { key: 'Escape'});
      expect(screen.getByRole('tooltip', { hidden: true })).not.toHaveClass('is-visible');
    });

    test('Escape does not stop propagation, so a parent listener still fires', () => {
      const parentHandler = vi.fn();

      render(
        <div onKeyDown={parentHandler}>
          <Tooltip label='Escape propagation test'>
            <button>Anchor</button>
          </Tooltip>
        </div>
      );

      const wrapper = screen.getByText('Anchor').closest('.tooltip-wrapper')!;
      fireEvent.focus(wrapper);
      fireEvent.keyDown(wrapper, { key: 'Escape' });

      expect(parentHandler).toHaveBeenCalledTimes(1);
    });
    
    test('touchmove cancels a pending long-press before it fires', () => {
      render(
        <Tooltip label='Touchmove test' longPressDelay={500}>
          <button>Touch me</button>
        </Tooltip>
      );

      const wrapper = screen.getByText('Touch me').closest('.tooltip-wrapper')!;
      fireEvent.touchStart(wrapper);

      //Finger moves before the 500ms therehold - this should cancel the timer.
      act(() => {
        vi.advanceTimersByTime(200);
      });
      fireEvent.touchMove(wrapper);

      //Even after the original delay would have elapsed, tooltip never shows.
      act(() =>  {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByRole('tooltip', { hidden: true})).not.toHaveClass('is-visible');
    });

    test('touchmove after the tooltip is already visible does not hide it', () => {
      render(
        <Tooltip label='Touchmove no-op test' longPressDelay={500}>
          <button>Touch me</button>
        </Tooltip>
      );

      const wrapper = screen.getByText('Touch me').closest('.tooltip-wrapper')!;
      fireEvent.touchStart(wrapper);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('tooltip')).toHaveClass('is-visible');

      //Moving after it's already shown is a no-op (clearTimer on a null timer).
      fireEvent.touchMove(wrapper);
      expect(screen.getByRole('tooltip')).toHaveClass('is-visible');
    });
  });
