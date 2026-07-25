import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * The initial value is read synchronously on first render (SSR-safe).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

/** Tailwind `md` breakpoint — sticky summary is mobile-only (below 768px). */
export const BELOW_MD_MEDIA = "(max-width: 767px)";
