import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COPY_FEEDBACK_DURATION_MS, CopyToClipboard } from './CopyToClipboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render the component with sensible defaults and a mock clipboard. */
function setup(
  props: Partial<React.ComponentProps<typeof CopyToClipboard>> = {},
  clipboardImpl?: { writeText: ReturnType<typeof vi.fn> },
) {
  const clipboard = clipboardImpl ?? {
    writeText: vi.fn().mockResolvedValue(undefined),
  };

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: clipboard,
  });

  const utils = render(
    <CopyToClipboard
      value="GABC123"
      ariaLabel="Copy wallet address"
      {...props}
    />,
  );

  const button = screen.getByRole('button', { name: /copy wallet address/i });
  return { ...utils, button, clipboard };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('renders an idle Copy button by default', () => {
    const { button } = setup();
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(button).toHaveAttribute('data-copy-state', 'idle');
  });

  it('copies the supplied value and shows temporary feedback', async () => {
    const { button, clipboard } = setup();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(clipboard.writeText).toHaveBeenCalledWith('GABC123');
    expect(screen.getByText('Copied')).toBeInTheDocument();
    expect(button).toHaveAttribute('data-copy-state', 'copied');

    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DURATION_MS);
    });

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(button).toHaveAttribute('data-copy-state', 'idle');
  });

  it('announces success to screen readers via a polite live region', async () => {
    setup();
    const button = screen.getByRole('button', { name: /copy wallet address/i });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Copied: Copy wallet address');
  });

  it('clears the announcement when the button resets to idle', async () => {
    setup();
    const button = screen.getByRole('button', { name: /copy wallet address/i });

    await act(async () => {
      fireEvent.click(button);
    });

    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DURATION_MS);
    });

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  // ── Custom labels ─────────────────────────────────────────────────────────

  it('uses custom copyLabel, copiedLabel, and errorLabel when provided', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="abc"
        ariaLabel="Copy address"
        copyLabel="Copiar"
        copiedLabel="¡Copiado!"
        errorLabel="Error"
      />,
    );

    expect(screen.getByText('Copiar')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('¡Copiado!')).toBeInTheDocument();
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it('shows error state when the clipboard write fails', async () => {
    const clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
    };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy wallet address"
      />,
    );

    const button = screen.getByRole('button', { name: /copy wallet address/i });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(button).toHaveAttribute('data-copy-state', 'error');
  });

  it('announces error to screen readers via the live region', async () => {
    const clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
    };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy wallet address"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy wallet address/i }));
    });

    expect(screen.getByRole('status')).toHaveTextContent('Failed to copy: Copy wallet address');
  });

  it('auto-resets from error state to idle after the feedback duration', async () => {
    const clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
    };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy wallet address"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy wallet address/i }));
    });

    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DURATION_MS);
    });

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('data-copy-state', 'idle');
  });

  it('uses a custom errorLabel when the copy fails', async () => {
    const clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
    };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy wallet address"
        errorLabel="Try again"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  // ── onCopied callback ─────────────────────────────────────────────────────

  it('calls onCopied with the copied value on success', async () => {
    const onCopied = vi.fn();
    const { button } = setup({ onCopied });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(onCopied).toHaveBeenCalledOnce();
    expect(onCopied).toHaveBeenCalledWith('GABC123');
  });

  it('does not call onCopied when the copy fails', async () => {
    const onCopied = vi.fn();
    const clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy wallet address"
        onCopied={onCopied}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(onCopied).not.toHaveBeenCalled();
  });

  // ── onError callback ──────────────────────────────────────────────────────

  it('calls onError with the caught error when the copy fails', async () => {
    const onError = vi.fn();
    const err = new Error('Permission denied');
    const clipboard = { writeText: vi.fn().mockRejectedValue(err) };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy wallet address"
        onError={onError}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('does not call onError on success', async () => {
    const onError = vi.fn();
    const { button } = setup({ onError });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(onError).not.toHaveBeenCalled();
  });

  // ── stopPropagation ───────────────────────────────────────────────────────

  it('stops event propagation when stopPropagation=true', async () => {
    const parentClick = vi.fn();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={parentClick}>
        <CopyToClipboard
          value="GABC123"
          ariaLabel="Copy wallet address"
          stopPropagation
        />
      </div>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy wallet address/i }));
    });

    expect(parentClick).not.toHaveBeenCalled();
  });

  it('propagates click to parent when stopPropagation is not set', async () => {
    const parentClick = vi.fn();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={parentClick}>
        <CopyToClipboard
          value="GABC123"
          ariaLabel="Copy wallet address"
        />
      </div>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy wallet address/i }));
    });

    expect(parentClick).toHaveBeenCalledOnce();
  });

  // ── Surface variant ───────────────────────────────────────────────────────

  it('renders the surface variant with a displayed value', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    const { container } = render(
      <CopyToClipboard
        value="GABC123XYZ"
        displayValue="GABC…XYZ"
        ariaLabel="Copy wallet address"
        variant="surface"
      />,
    );

    // Root should carry the surface modifier class
    expect(container.firstChild).toHaveClass('copy-affordance--surface');
    // Truncated display text is shown
    expect(screen.getByText('GABC…XYZ')).toBeInTheDocument();

    // The full value is what actually gets copied
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy wallet address/i }));
    });

    expect(clipboard.writeText).toHaveBeenCalledWith('GABC123XYZ');
  });

  // ── Multiple rapid clicks ─────────────────────────────────────────────────

  it('resets the feedback timer when the button is clicked again while in copied state', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy wallet address"
      />,
    );

    const button = screen.getByRole('button', { name: /copy wallet address/i });

    // First click
    await act(async () => {
      fireEvent.click(button);
    });
    expect(screen.getByText('Copied')).toBeInTheDocument();

    // Advance half the duration
    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DURATION_MS / 2);
    });

    // Second click re-arms the timer
    await act(async () => {
      fireEvent.click(button);
    });
    expect(clipboard.writeText).toHaveBeenCalledTimes(2);

    // Advancing another full duration should now reset
    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_DURATION_MS);
    });

    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  // ── displayValue rendering ────────────────────────────────────────────────

  it('renders displayValue when provided, and not otherwise', () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const { rerender } = render(
      <CopyToClipboard
        value="GABC123"
        displayValue="GABC…"
        ariaLabel="Copy address"
      />,
    );
    expect(screen.getByText('GABC…')).toBeInTheDocument();

    rerender(
      <CopyToClipboard
        value="GABC123"
        ariaLabel="Copy address"
      />,
    );
    expect(screen.queryByText('GABC…')).not.toBeInTheDocument();
  });
});
