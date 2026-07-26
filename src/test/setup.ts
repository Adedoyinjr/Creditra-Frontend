import "@testing-library/jest-dom";
import "../index.css";
import { beforeEach } from "vitest";

// jsdom does not implement window.matchMedia. Stub it so components that
// call matchMedia (e.g. usePrefersReducedMotion, RepaymentVisualizer) do
// not throw in the test environment.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

