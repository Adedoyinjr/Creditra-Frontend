/**
 * react-router-dom stub for the test environment.
 *
 * Provides the minimum surface needed by suite tests when the real package
 * is unavailable or aliased away in vitest.config.ts.
 */

import { createElement, Fragment } from 'react';

/*
 * Module-level "current location", set by MemoryRouter when it renders and
 * read back by useLocation/useSearchParams. Tests render synchronously and
 * read immediately after, so a shared variable is sufficient for this stub.
 */
let currentPathname = '/';
let currentSearch = '';

function applyEntry(entry: string) {
  const qIndex = entry.indexOf('?');
  currentPathname = qIndex >= 0 ? entry.slice(0, qIndex) : entry;
  currentSearch = qIndex >= 0 ? entry.slice(qIndex) : '';
}

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return createElement(Fragment, null, children);
}

/** Parses initialEntries[0] into the current location, then renders children. */
export function MemoryRouter({
  children,
  initialEntries,
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) {
  applyEntry(initialEntries?.[0] ?? '/');
  return createElement(Fragment, null, children);
}

export function Link({
  to,
  children,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return createElement('a', { href: to, ...props }, children);
}

export function NavLink({
  to,
  children,
  className,
  end: _end,
  ...props
}: {
  to: string;
  children: React.ReactNode | ((args: { isActive: boolean }) => React.ReactNode);
  className?: string | ((args: { isActive: boolean }) => string);
  end?: boolean;
  [key: string]: unknown;
}) {
  const isActive = false;
  const cls = typeof className === 'function' ? className({ isActive }) : className;
  const content = typeof children === 'function' ? children({ isActive }) : children;
  return createElement('a', { href: to, className: cls, ...props }, content);
}

export function Routes({ children }: { children: React.ReactNode }) {
  return createElement(Fragment, null, children);
}

export function Route(_props: Record<string, unknown>) {
  return null;
}

export function Navigate(_props: Record<string, unknown>) {
  return null;
}

export function useSearchParams() {
  const params = new URLSearchParams(currentSearch);
  return [params, (_: URLSearchParams) => {}] as const;
}

export function useNavigate() {
  return () => {};
}

export function useLocation() {
  return {
    pathname: currentPathname,
    search: currentSearch,
    hash: '',
    state: null,
  };
}

export function useParams() {
  return {};
}

/**
 * Minimal `matchPath` implementation that mirrors the subset of the real
 * react-router-dom v6 behaviour used by `RouteAnnouncer`:
 *
 *   matchPath({ path: '/credit-lines', end: true }, '/credit-lines')  → object
 *   matchPath({ path: '/', end: true }, '/credit-lines')             → null
 *
 * Supports the `end: true` modifier (exact match required) and a `path`
 * string (no param interpolation). Returns `{ params: {} }` on match so
 * callers that destructure `match.params` keep working.
 */
export function matchPath(
  options: { path: string; end?: boolean } | string,
  pathname: string
): { params: Record<string, string>; pathname: string; pattern: string } | null {
  const path = typeof options === 'string' ? options : options.path;
  const end = typeof options === 'string' ? false : options.end;

  if (end) {
    return path === pathname
      ? { params: {}, pathname, pattern: path }
      : null;
  }

  if (pathname === path || pathname.startsWith(path.endsWith('/') ? path : `${path}/`)) {
    return { params: {}, pathname, pattern: path };
  }
  return null;
}
