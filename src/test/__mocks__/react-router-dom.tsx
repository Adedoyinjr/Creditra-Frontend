/**
 * react-router-dom stub for the test environment.
 *
 * Creditra-Frontend does not have react-router-dom installed in the test
 * node_modules (the CI/offline environment uses a shared node_modules symlink
 * from another project that lacks this package). This stub provides the
 * minimum surface needed by the existing tests (ErrorBoundary.test.tsx,
 * NotFound.test.tsx) so the full suite can run.
 *
 * DrawCreditPage itself has no router dependency — its tests require nothing
 * from this module.
 */

import { createElement, Fragment } from "react";

/*
 * Module-level "current location", set by BrowserRouter/MemoryRouter when they
 * render and read back by useLocation/useSearchParams. Tests render
 * synchronously and read immediately after, so a shared variable is sufficient
 * for this stub (no reactive updates needed).
 */
let currentPathname = "/";
let currentSearch = "";

function applyEntry(entry: string) {
  const qIndex = entry.indexOf("?");
  currentPathname = qIndex >= 0 ? entry.slice(0, qIndex) : entry;
  currentSearch = qIndex >= 0 ? entry.slice(qIndex) : "";
}

// BrowserRouter — renders children directly
export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return createElement(Fragment, null, children);
}

// MemoryRouter — parses initialEntries[0] into the current location, then
// renders children. Supports the `initialEntries={['/path?query']}` pattern.
export function MemoryRouter({
  children,
  initialEntries,
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) {
  applyEntry(initialEntries?.[0] ?? "/");
  return createElement(Fragment, null, children);
}

// Link — renders a plain <a>
export function Link({
  to,
  children,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return createElement("a", { href: to, ...props }, children);
}

// Route / Routes / Navigate — pass-through stubs
export function Routes({ children }: { children: React.ReactNode }) {
  return createElement(Fragment, null, children);
}

export function Route(_props: Record<string, unknown>) {
  return null;
}

export function Navigate(_props: Record<string, unknown>) {
  return null;
}

// useSearchParams — parses currentSearch into a URLSearchParams-like object
export function useSearchParams() {
  const params = new URLSearchParams(currentSearch);
  return [params, (_: URLSearchParams) => {}] as const;
}

// Hooks
export function useNavigate() {
  return () => {};
}

export function useLocation() {
  return { pathname: currentPathname, search: currentSearch, hash: "", state: null };
}

export function useParams() {
  return {};
}
