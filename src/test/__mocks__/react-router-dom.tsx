/**
 * react-router-dom stub for the test environment.
 *
 * Provides the minimum surface needed by suite tests when the real package
 * is unavailable or aliased away in vitest.config.ts.
 */

import { createElement, Fragment } from 'react';

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return createElement(Fragment, null, children);
}

/** Alias used by CommandPalette and other overlay tests. */
export function MemoryRouter({ children }: { children: React.ReactNode }) {
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

export function useNavigate() {
  return () => {};
}

export function useLocation() {
  return { pathname: '/', search: '', hash: '', state: null };
}

export function useParams() {
  return {};
}

export function useSearchParams() {
  const params = new URLSearchParams();
  const setParams = () => {};
  return [params, setParams] as const;
}
