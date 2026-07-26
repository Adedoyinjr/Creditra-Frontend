import { useEffect, useRef, useState } from "react";

/** Minimum scroll delta (px) before toggling collapse state. */
const SCROLL_THRESHOLD = 8;

/** Do not collapse until the user has scrolled past this offset. */
const MIN_SCROLL_Y = 48;

/**
 * Tracks vertical scroll direction and returns whether a sticky chrome
 * element should be in its collapsed (peek) state.
 *
 * - Scroll **down** past {@link MIN_SCROLL_Y} → collapsed.
 * - Scroll **up** → expanded.
 *
 * Scroll handling is rAF-throttled and uses a passive listener so it
 * does not block the main thread on mobile.
 */
export function useScrollCollapse(enabled = true): boolean {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setIsCollapsed(false);
      return;
    }

    lastScrollY.current = window.scrollY;

    const update = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (Math.abs(delta) >= SCROLL_THRESHOLD) {
        if (delta > 0 && currentY > MIN_SCROLL_Y) {
          setIsCollapsed(true);
        } else if (delta < 0) {
          setIsCollapsed(false);
        }
        lastScrollY.current = currentY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return isCollapsed;
}
