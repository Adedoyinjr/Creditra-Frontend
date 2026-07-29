import { useEffect, useState } from "react";

interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive";
  atomic?: boolean;
  /** Optional id, useful when a page renders more than one live region. */
  id?: string;
  /** Optional className appended to the sr-only wrapper. */
  className?: string;
}

/**
 * LiveRegion component provides a reusable way to announce dynamic updates
 * to assistive technologies (screen readers) via aria-live.
 *
 * It uses the project's standard "sr-only" utility class to remain visually
 * hidden while fully participating in the accessibility tree.
 *
 * ## Behaviour
 *
 * - When `message` changes, the region content is updated and announced
 *   by the screen reader (respecting the `politeness` setting).
 * - When `message` is set to an empty string, the region is cleared so
 *   stale text is not re-announced on subsequent updates.
 * - Uses `aria-atomic={atomic}` so the entire content is announced as one
 *   unit by default.
 */
export function LiveRegion({
  message,
  politeness = "polite",
  atomic = true,
  id,
  className,
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    setAnnouncement(message);
  }, [message]);

  const cls = className ? `sr-only ${className}` : "sr-only";

  return (
    <div
      id={id}
      className={cls}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic ? "true" : "false"}
    >
      {announcement}
    </div>
  );
}
