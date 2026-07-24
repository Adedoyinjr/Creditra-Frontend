/**
 * SupportForm — inline contact form for the GrantFox FWC26 campaign.
 *
 * Rendered inside SupportWidget when the user selects the "Contact" tab.
 * The form collects a subject and message, validates both fields client-side
 * before allowing submission, and cycles through three display states:
 *
 *   idle → submitting → success  (or back to idle on error)
 *
 * Submission behaviour is decoupled from transport: the caller supplies an
 * `onSubmit` prop so the component stays testable and backend-agnostic.
 * The default no-op simulates a brief async call so the pending state is
 * visible in Storybook / local development.
 *
 * Accessibility notes:
 * - All inputs are associated with labels via `htmlFor`/`id`.
 * - Required fields carry `aria-required` and a visible "*" marker whose
 *   screen-reader text reads "required".
 * - `aria-describedby` wires inline error messages to their inputs.
 * - Submit button uses `aria-busy` while pending (via PendingButton).
 * - Success and error outcomes are announced via a `role="status"` region.
 * - The entire form is reset when the widget panel closes (`isOpen` → false).
 *
 * Design tokens:
 * - Colors and spacing reference CSS custom properties from `:root`
 *   (src/index.css) — no hard-coded hex values.
 * - Dark-mode and high-contrast work automatically because the tokens adapt
 *   via `[data-contrast="high"]` in index.css.
 */

import { useEffect, useId, useReducer } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { FormField } from "./FormField";
import { PendingButton } from "./PendingButton";
import "./SupportForm.css";

// ─── Public API ───────────────────────────────────────────────────────────────

/** Shape passed to the `onSubmit` callback. */
export interface SupportFormData {
  subject: string;
  message: string;
}

export interface SupportFormProps {
  /**
   * Called with validated form data when the user submits.
   * Should return a Promise; rejection triggers the error state.
   * Defaults to a 600 ms no-op (useful in development / Storybook).
   */
  onSubmit?: (data: SupportFormData) => Promise<void>;
  /**
   * When this flips from true → false (i.e. the widget closes) the form
   * resets to its idle state so it's clean the next time it's opened.
   */
  isOpen?: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const MIN_SUBJECT_LEN = 3;
const MAX_SUBJECT_LEN = 120;
const MIN_MESSAGE_LEN = 10;
const MAX_MESSAGE_LEN = 1000;

export interface FieldErrors {
  subject?: string;
  message?: string;
}

/**
 * Validate the raw field values.
 * Returns an error map — empty object means all fields are valid.
 */
export function validateSupportForm(
  subject: string,
  message: string,
): FieldErrors {
  const errors: FieldErrors = {};

  const trimmedSubject = subject.trim();
  if (!trimmedSubject) {
    errors.subject = "Subject is required.";
  } else if (trimmedSubject.length < MIN_SUBJECT_LEN) {
    errors.subject = `Subject must be at least ${MIN_SUBJECT_LEN} characters.`;
  } else if (trimmedSubject.length > MAX_SUBJECT_LEN) {
    errors.subject = `Subject must be ${MAX_SUBJECT_LEN} characters or fewer.`;
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    errors.message = "Message is required.";
  } else if (trimmedMessage.length < MIN_MESSAGE_LEN) {
    errors.message = `Message must be at least ${MIN_MESSAGE_LEN} characters.`;
  } else if (trimmedMessage.length > MAX_MESSAGE_LEN) {
    errors.message = `Message must be ${MAX_MESSAGE_LEN} characters or fewer.`;
  }

  return errors;
}

// ─── State machine ────────────────────────────────────────────────────────────

type FormStatus = "idle" | "submitting" | "success" | "error";

interface FormState {
  subject: string;
  message: string;
  /** Errors are only populated after the first submit attempt. */
  errors: FieldErrors;
  /** True once the user has attempted to submit at least once. */
  touched: boolean;
  status: FormStatus;
  /** Human-readable failure reason surfaced from a rejected onSubmit. */
  submitError: string;
}

type FormAction =
  | { type: "SET_SUBJECT"; value: string }
  | { type: "SET_MESSAGE"; value: string }
  | { type: "SUBMIT_VALIDATE_FAIL"; errors: FieldErrors }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "RESET" };

const initialState: FormState = {
  subject: "",
  message: "",
  errors: {},
  touched: false,
  status: "idle",
  submitError: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_SUBJECT": {
      const newSubject = action.value;
      // Re-validate on every keystroke once the form has been submitted once
      const errors = state.touched
        ? validateSupportForm(newSubject, state.message)
        : state.errors;
      return { ...state, subject: newSubject, errors };
    }

    case "SET_MESSAGE": {
      const newMessage = action.value;
      const errors = state.touched
        ? validateSupportForm(state.subject, newMessage)
        : state.errors;
      return { ...state, message: newMessage, errors };
    }

    case "SUBMIT_VALIDATE_FAIL":
      return { ...state, touched: true, errors: action.errors, status: "idle" };

    case "SUBMIT_START":
      return { ...state, status: "submitting" };

    case "SUBMIT_SUCCESS":
      return { ...initialState, status: "success" };

    case "SUBMIT_ERROR":
      return {
        ...state,
        status: "error",
        submitError: action.message,
      };

    case "RESET":
      return { ...initialState };
  }
}

// ─── Default submit handler (dev / Storybook) ─────────────────────────────────

const DEFAULT_SUBMIT_DELAY_MS = 600;

async function defaultOnSubmit(_data: SupportFormData): Promise<void> {
  return new Promise((resolve) =>
    window.setTimeout(resolve, DEFAULT_SUBMIT_DELAY_MS),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Inline support form for the GrantFox FWC26 campaign.
 *
 * @example
 * <SupportForm onSubmit={async (data) => postToApi(data)} isOpen={isWidgetOpen} />
 */
export function SupportForm({
  onSubmit = defaultOnSubmit,
  isOpen = true,
}: SupportFormProps) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const formId = useId();

  const subjectId = `${formId}-subject`;
  const messageId = `${formId}-message`;
  const outcomeId = `${formId}-outcome`;

  // Reset the form when the parent widget closes so it's clean on next open.
  useEffect(() => {
    if (!isOpen) {
      dispatch({ type: "RESET" });
    }
  }, [isOpen]);

  const hasFieldErrors = Object.keys(state.errors).length > 0;
  const isPending = state.status === "submitting";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate first — mark touched so errors show immediately
    const errors = validateSupportForm(state.subject, state.message);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SUBMIT_VALIDATE_FAIL", errors });
      return;
    }

    dispatch({ type: "SUBMIT_START" });

    try {
      await onSubmit({
        subject: state.subject.trim(),
        message: state.message.trim(),
      });
      dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      dispatch({ type: "SUBMIT_ERROR", message });
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (state.status === "success") {
    return (
      <div
        className="support-form support-form--success"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <CheckCircle
          className="support-form__success-icon"
          size={32}
          aria-hidden="true"
        />
        <p className="support-form__success-title">Message sent!</p>
        <p className="support-form__success-body">
          We&apos;ll get back to you at your registered email address within one
          business day.
        </p>
        <button
          type="button"
          className="support-form__reset-btn"
          onClick={() => dispatch({ type: "RESET" })}
        >
          Send another message
        </button>
      </div>
    );
  }

  // ── Idle / submitting / error states ───────────────────────────────────────
  return (
    <form
      className="support-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Contact support"
    >
      {/* Submit-level error announcement */}
      {state.status === "error" && (
        <div
          id={outcomeId}
          className="support-form__submit-error"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <AlertCircle
            className="support-form__error-icon"
            size={16}
            aria-hidden="true"
          />
          {state.submitError}
        </div>
      )}

      <FormField
        id={subjectId}
        label="Subject"
        required
        helpText={`${state.subject.length} / ${MAX_SUBJECT_LEN}`}
        error={state.errors.subject}
        inputProps={{
          value: state.subject,
          maxLength: MAX_SUBJECT_LEN,
          placeholder: "Briefly describe your issue",
          autoComplete: "off",
          onChange: (e) =>
            dispatch({ type: "SET_SUBJECT", value: e.target.value }),
        }}
      />

      <FormField
        id={messageId}
        label="Message"
        as="textarea"
        required
        helpText={`${state.message.length} / ${MAX_MESSAGE_LEN}`}
        error={state.errors.message}
        inputProps={{
          value: state.message,
          maxLength: MAX_MESSAGE_LEN,
          placeholder: "Describe your issue in detail…",
          rows: 4,
          onChange: (e) =>
            dispatch({ type: "SET_MESSAGE", value: e.target.value }),
        }}
      />

      <PendingButton
        type="submit"
        pending={isPending}
        pendingLabel="Sending…"
        disabled={state.touched && hasFieldErrors}
        className="support-form__submit"
        aria-describedby={state.status === "error" ? outcomeId : undefined}
      >
        Send message
      </PendingButton>
    </form>
  );
}

export default SupportForm;
