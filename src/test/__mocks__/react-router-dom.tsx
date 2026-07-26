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

// BrowserRouter — renders children directly
export function BrowserRouter({ children }: { children: React.ReactNode }) {
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

// Hooks
export function useNavigate() {
  return () => {};
}

export function useLocation() {
  return { pathname: "/", search: "", hash: "", state: null };
}

export function useParams() {
  return {};
}

// MemoryRouter — renders children directly (same as BrowserRouter)
export function MemoryRouter({
  children,
  initialEntries,
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) {
  // Expose the first entry via the search hook so useSearchParams works
  const first = (initialEntries && initialEntries[0]) ?? "/";
  const searchStr = first.includes("?") ? first.slice(first.indexOf("?")) : "";
  _currentSearch = searchStr;
  return createElement(Fragment, null, children);
}

// Internal store for the current search string so useSearchParams can read it
let _currentSearch = "";

// NavLink — same as Link but with optional activeClassName
export function NavLink({
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

// useSearchParams — parses the active MemoryRouter entry's search string
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const params = new URLSearchParams(_currentSearch.replace(/^\?/, ""));
  return [params, () => {}];
}
