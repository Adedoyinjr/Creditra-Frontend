import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

const DEFAULT_ANNOUNCEMENT_DELAY_MS = 300;

interface FormMessageProps {
  /** Optional stable id so callers can wire `aria-describedby`. */
  id?: string;
  /** Strong leading line; omit for message-only renders. */
  title?: ReactNode;
  /** Body text or rich node. Optional so `reserveSpace` can render an empty slot. */
  message?: ReactNode;
  /**
   * Visual treatment. `inline` is compact, used directly under inputs;
   * `alert` is the bigger boxed style used above modal forms.
   */
  tone?: "inline" | "alert";
  /**
   * Severity. Drives both the icon and the colour band. `error` is kept
   * as an alias of `danger` so callers from other parts of the app can
   * use the more conventional name.
   */
  type?: "success" | "danger" | "warning" | "info" | "error";
  /**
   * When true, the slot reserves vertical space (`min-height`) even
   * while empty. Used by forms that would otherwise jitter as the
   * message appears/disappears.
   */
  reserveSpace?: boolean;
  /** Override the default reserved height (52 px inline, 88 px alert). */
  minHeight?: number;
  /**
   * Time (ms) to wait before announcing the message to screen readers.
   * The visual message is rendered immediately; only the `aria-live`
   * readback is debounced. Defaults to 300 ms, which is long enough to
   * coalesce rapid edits ("10" → "100" → "1000") into a single
   * readback but short enough to feel responsive.
   *
   * Setting to `0` disables the debounce — useful in tests and for
   * critical errors that must be read immediately.
   */
  announceDelayMs?: number;
  /** Pass-through inline style for one-off layout tweaks. */
  style?: CSSProperties;
  /** Pass-through class name appended to the slot container. */
  className?: string;
}

function getPlainText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getPlainText).filter(Boolean).join(" ");
  }

  if (typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode };
    return getPlainText(props.children);
  }

  return "";
}

function useDebouncedAnnouncement(text: string, delay: number) {
  const [announcedText, setAnnouncedText] = useState("");

  useEffect(() => {
    // `delay === 0` is a valid signal to skip the debounce entirely
    // (used by tests + critical errors).  We do not read the live
    // region straight off the prop because passing `delay === 0` to
    // setTimeout would still queue a microtask-deferred readback.
    if (!text) {
      setAnnouncedText("");
      return;
    }

    if (delay <= 0) {
      setAnnouncedText(text);
      return;
    }

    const timer = window.setTimeout(() => {
      setAnnouncedText(text);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay, text]);

  return announcedText;
}

/**
 * Tone-coded inline message for form fields and form-level alerts.
 *
 * The visual message is rendered immediately, but the live announcement is
 * debounced (default 300 ms) so assistive technology hears the settled
 * validation state instead of every intermediate keystroke.  Callers can
 * override the debounce with `announceDelayMs` — `0` disables it.
 *
 * Use `reserveSpace` on the canonical version below an input to prevent
 * layout shift when a message toggles on or off.
 */
export function FormMessage({
  id,
  title,
  message,
  tone = "inline",
  type = "danger",
  reserveSpace = false,
  minHeight,
  announceDelayMs = DEFAULT_ANNOUNCEMENT_DELAY_MS,
  style,
  className = "",
}: FormMessageProps) {
  const hasContent = Boolean(title) || Boolean(message);
  const announcement = useDebouncedAnnouncement(
    [getPlainText(title), getPlainText(message)].filter(Boolean).join(" "),
    announceDelayMs,
  );

  if (!hasContent && !reserveSpace) {
    return null;
  }

  const slotClassName = [
    "form-message-slot",
    tone === "alert" ? "form-message-slot--alert" : "form-message-slot--inline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={slotClassName}
      style={{
        minHeight: reserveSpace
          ? minHeight ?? (tone === "alert" ? 88 : 52)
          : undefined,
        ...style,
      }}
    >
      {hasContent ? (
        <>
          <div
            id={id}
            className={`form-message form-message--${type === 'error' ? 'danger' : type} form-message--${tone}`}
          >
            {type === 'success' && <CheckCircle className="form-message__icon" aria-hidden="true" />}
            {(type === 'danger' || type === 'error') && <AlertCircle className="form-message__icon" aria-hidden="true" />}
            {type === 'warning' && <AlertTriangle className="form-message__icon" aria-hidden="true" />}
            {type === 'info' && <Info className="form-message__icon" aria-hidden="true" />}
            <div className="form-message__content">
              {title ? <strong className="form-message__title">{title}</strong> : null}
              {message ? <p className="form-message__text">{message}</p> : null}
            </div>
          </div>
          {announcement ? (
            <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
              {announcement}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
