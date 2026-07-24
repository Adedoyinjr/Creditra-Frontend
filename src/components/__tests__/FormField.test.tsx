import { render, screen, act } from '@testing-library/react';
import { FormField } from '../FormField';

/**
 * Tests for FormField — particularly the debounced `aria-live` error
 * announcement introduced in (#452).
 *
 * The 300 ms default debounce is the original behaviour; the
 * `announceDelayMs` prop exposes it so callers can tune the cadence
 * for critical (or test-only) forms.
 */
describe('FormField', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('renders label and input', () => {
    render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
      />
    );
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
  });

  test('shows error visually immediately', () => {
    render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Error message"
      />
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  test('sets aria-invalid when error exists', () => {
    render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Error message"
      />
    );
    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows the error visually immediately while delaying the alert announcement', () => {
    const { rerender } = render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
      />
    );

    // Update error
    rerender(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="First error"
      />
    );

    expect(screen.getByText('First error')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('First error');
  });

  test('announces the settled error after rapid validation changes', () => {
    const { rerender } = render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="First error"
      />
    );

    rerender(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Second error"
      />
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Second error');
  });

  test('honors a custom announceDelayMs prop — short delay', () => {
    const { rerender } = render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        announceDelayMs={50}
      />
    );

    rerender(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Custom delay error"
        announceDelayMs={50}
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Custom delay error',
    );
  });

  test('announceDelayMs={0} disables the debounce entirely', () => {
    const { rerender } = render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        announceDelayMs={0}
      />
    );

    rerender(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Immediate error"
        announceDelayMs={0}
      />
    );

    // No timer advance — the announcement should be live immediately.
    expect(screen.getByRole('alert')).toHaveTextContent('Immediate error');
  });
});
