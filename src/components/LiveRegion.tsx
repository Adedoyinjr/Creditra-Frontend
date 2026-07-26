import React, { useEffect, useState } from "react";

interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive";
  atomic?: boolean;
}

/**
 * LiveRegion component provides a reusable way to announce dynamic updates 
 * to assistive technologies (screen readers) via aria-live.
 *
 * It uses the project's standard "sr-only" utility class to remain visually 
 * hidden while fully participating in the accessibility tree.
 */
export function LiveRegion({
  message,
  politeness = "polite",
  atomic = true,
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
    }
  }, [message]);

  return (
    <div
      className="sr-only"
      role="status"
      aria-live={politeness}
      aria-atomic={atomic ? "true" : "false"}
    >
      {announcement}
    </div>
  );
}
