import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FormMessage } from './FormMessage';

interface BaseFormFieldProps {
  /** Stable id for the input. Also drives the label's `htmlFor` and the help/error `aria-describedby`. */
  id: string;
  /** Visible label text. Required by spec — there is no label-less variant. */
  label: string;
  /**
   * When true, a "required" indicator is rendered and `aria-required` is
   * set on the input. The visible marker is paired with screen-reader text
   * so the requirement is announced.
   */
  required?: boolean;
  /** Optional helper text shown under the input; wired up via `aria-describedby`. */
  helpText?: string;
  /**
   * Optional error message. When present, `aria-invalid` is set on the
   * input and the error text is wired up via `aria-describedby` so screen
   * readers announce both help and error together.
   */
  error?: string;
  /** Pass-through class name on the field wrapper. */
  className?: string;
  /**
   * Debounce window (ms) for the screen-reader announcement of the
   * error message.  The visual error renders immediately; only the
   * `aria-live` readback is delayed so rapid edits to a field
   * ("1" → "10" → "100") produce one readback instead of three.
   *
   * Defaults to 300 ms — long enough to coalesce a typical typing
   * burst, short enough to feel responsive.  Set to `0` to read each
   * change instantly (useful in tests + critical forms).
   *
   * The value is forwarded to the inner `FormMessage` debounce hook so
   * the announcement cadence is owned by `FormField` itself rather
   * than buried in a child component.  This addresses GitHub
   * issue #452 ("Add debounce-announce on FormField errors").
   */
  announceDelayMs?: number;
}

interface InputFormFieldProps extends BaseFormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'aria-describedby' | 'aria-invalid' | 'required'>;
  as?: 'input';
}

interface TextareaFormFieldProps extends BaseFormFieldProps {
  as: 'textarea';
  inputProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'aria-describedby' | 'aria-invalid' | 'required'>;
}

interface CustomFormFieldProps extends BaseFormFieldProps {
  as: 'custom';
  children: (props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid': boolean;
    'aria-required': boolean;
  }) => ReactNode;
}

type FormFieldProps = InputFormFieldProps | TextareaFormFieldProps | CustomFormFieldProps;

/**
 * FormField — standardized form field component with accessibility built-in.
 *
 * Features:
 * - Programmatic label association via htmlFor/id
 * - Required indicator with screen reader announcement
 * - Help text linked via aria-describedby
 * - Error messaging with aria-invalid and aria-describedby
 * - Debounced live-region announcement (configurable via
 *   `announceDelayMs`, default 300 ms) so rapid error toggles
 *   collapse into one readback (#452).
 * - Consistent spacing and color tokens
 * - Focus management with visible focus rings
 *
 * Usage:
 * <FormField
 *   id="email"
 *   label="Email Address"
 *   type="email"
 *   required
 *   helpText="We'll never share your email"
 *   error={errors.email}
 *   inputProps={{ value, onChange, placeholder: "you@example.com" }}
 * />
 */
export function FormField(props: FormFieldProps) {
  const {
    id,
    label,
    required = false,
    helpText,
    error,
    className = '',
    announceDelayMs,
  } = props;

  const helpTextId = `${id}-help`;
  const errorId = `${id}-error`;
  
  const describedByParts: string[] = [];
  if (helpText) describedByParts.push(helpTextId);
  if (error) describedByParts.push(errorId);
  const describedBy = describedByParts.length > 0 ? describedByParts.join(' ') : '';

  const sharedInputProps = {
    id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': !!error,
    'aria-required': required,
  };

  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id} className="form-field__label">
        {label}
        {required && (
          <span className="form-field__required" aria-label="required">
            *
          </span>
        )}
      </label>

      {helpText && (
        <p id={helpTextId} className="form-field__help">
          {helpText}
        </p>
      )}

      {props.as === 'textarea' ? (
        <textarea
          {...sharedInputProps}
          {...props.inputProps}
          className={`form-field__input form-field__textarea ${error ? 'form-field__input--error' : ''}`}
        />
      ) : props.as === 'custom' ? (
        props.children(sharedInputProps)
      ) : (
        <input
          type={props.type || 'text'}
          {...sharedInputProps}
          {...props.inputProps}
          className={`form-field__input ${error ? 'form-field__input--error' : ''}`}
        />
      )}

      {error && (
        // `announceDelayMs` is optionally forwarded.  React drops
        // `undefined` props, so passing unconditionally is safe.
        <FormMessage
          id={errorId}
          title={error}
          type="danger"
          tone="inline"
          reserveSpace={false}
          announceDelayMs={announceDelayMs}
        />
      )}
    </div>
  );
}
