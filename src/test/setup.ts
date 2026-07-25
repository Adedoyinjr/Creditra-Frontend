import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

const createLocalStorage = (): Storage => {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (key: string) => (key in store ? store[key] : null),
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
  };
};

const localStorage = createLocalStorage();

Object.defineProperty(window, "localStorage", {
  value: localStorage,
  configurable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: localStorage,
  configurable: true,
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
  configurable: true,
});

Object.defineProperty(window, "IntersectionObserver", {
  value: IntersectionObserverMock,
  configurable: true,
});

Object.defineProperty(globalThis, "IntersectionObserver", {
  value: IntersectionObserverMock,
  configurable: true,
});

beforeEach(() => {
  window.localStorage.clear();
  // Ensure ResizeObserver polyfill is in place per test
  Object.defineProperty(window, "ResizeObserver", {
    value: ResizeObserverMock,
    configurable: true,
  });
});

// JSDOM does not implement window.matchMedia — provide a stub that always
// reports non-mobile so components that branch on media queries work in tests.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom does not implement scrollTo; body-scroll-lock and similar hooks call it.
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});
