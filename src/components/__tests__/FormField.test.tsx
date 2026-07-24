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

  describe('aria-describedby', () => {
    test('is omitted when there is no help text or error', () => {
      render(<FormField id="username" label="Username" type="text" />);
      expect(screen.getByLabelText('Username')).not.toHaveAttribute('aria-describedby');
    });

    test('points at the help text id when only helpText is set', () => {
      render(
        <FormField
          id="username"
          label="Username"
          type="text"
          helpText="Letters and numbers only"
        />
      );
      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('aria-describedby', 'username-help');
      expect(screen.getByText('Letters and numbers only')).toHaveAttribute('id', 'username-help');
    });

    test('points at the error id when only error is set', () => {
      render(<FormField id="username" label="Username" type="text" error="Username is taken" />);
      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('aria-describedby', 'username-error');
      expect(screen.getByText('Username is taken').closest('#username-error')).not.toBeNull();
    });

    test('references both help and error ids, help first, when both are set', () => {
      render(
        <FormField
          id="username"
          label="Username"
          type="text"
          helpText="Letters and numbers only"
          error="Username is taken"
        />
      );
      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('aria-describedby', 'username-help username-error');
    });

    test('scopes ids to the field id so two fields never collide', () => {
      render(
        <>
          <FormField id="email" label="Email" type="email" error="Invalid email" />
          <FormField id="password" label="Password" type="password" error="Too short" />
        </>
      );
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', 'email-error');
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'password-error');
    });

    test('wires up textarea fields the same way as inputs', () => {
      render(
        <FormField
          id="bio"
          label="Bio"
          as="textarea"
          helpText="Max 200 characters"
          error="Too long"
        />
      );
      const textarea = screen.getByLabelText('Bio');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('aria-describedby', 'bio-help bio-error');
    });

    test('passes aria-describedby through to custom-rendered fields', () => {
      render(
        <FormField id="amount" label="Amount" as="custom" helpText="USD only" error="Required">
          {(fieldProps) => <input {...fieldProps} data-testid="custom-input" />}
        </FormField>
      );
      expect(screen.getByTestId('custom-input')).toHaveAttribute(
        'aria-describedby',
        'amount-help amount-error'
      );
    });
  });
});
