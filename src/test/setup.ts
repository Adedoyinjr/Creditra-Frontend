import "@testing-library/jest-dom";
import "../index.css";

// jsdom does not implement matchMedia; provide a minimal stub so components
// using media queries (e.g. prefers-reduced-motion) render under test.
// Defined as configurable so suites that stub matchMedia themselves
// (the *.reduced-motion tests) can still override and restore it.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

