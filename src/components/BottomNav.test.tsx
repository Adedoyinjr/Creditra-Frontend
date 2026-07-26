import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * Helper to render BottomNav inside a MemoryRouter with an initial route.
 */
function renderNav(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  // ─── Structure ───────────────────────────────────────────────────────────

  it('renders a navigation landmark with correct aria-label', () => {
    renderNav();
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('bottom-nav');
  });

  it('renders all five navigation items', () => {
    renderNav();
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  it('renders each item with the expected label', () => {
    renderNav();
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Dashboard')).toBeInTheDocument();
    expect(within(nav).getByText('Transactions')).toBeInTheDocument();
    expect(within(nav).getByText('Credit Lines')).toBeInTheDocument();
    expect(within(nav).getByText('Open Credit')).toBeInTheDocument();
    expect(within(nav).getByText('Auctions')).toBeInTheDocument();
  });

  // ─── Routes / hrefs ──────────────────────────────────────────────────────

  it('links to the correct routes', () => {
    renderNav();
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');

    const expected = [
      { name: 'Dashboard', href: '/' },
      { name: 'Transactions', href: '/transactions' },
      { name: 'Credit Lines', href: '/credit-lines' },
      { name: 'Open Credit', href: '/open-credit' },
      { name: 'Auctions', href: '/dutch-auctions' },
    ];

    for (const { name, href } of expected) {
      const link = within(nav).getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
    }
  });

  // ─── Active state (aria-current) ─────────────────────────────────────────

  it('marks the Dashboard link as active when at /', () => {
    renderNav('/');
    const nav = screen.getByRole('navigation');
    const dashboardLink = within(nav).getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks the Transactions link as active when at /transactions', () => {
    renderNav('/transactions');
    const nav = screen.getByRole('navigation');
    const link = within(nav).getByRole('link', { name: 'Transactions' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('marks the Credit Lines link as active when at /credit-lines', () => {
    renderNav('/credit-lines');
    const nav = screen.getByRole('navigation');
    const link = within(nav).getByRole('link', { name: 'Credit Lines' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('marks the Open Credit link as active when at /open-credit', () => {
    renderNav('/open-credit');
    const nav = screen.getByRole('navigation');
    const link = within(nav).getByRole('link', { name: 'Open Credit' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('marks the Auctions link as active when at /dutch-auctions', () => {
    renderNav('/dutch-auctions');
    const nav = screen.getByRole('navigation');
    const link = within(nav).getByRole('link', { name: 'Auctions' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark any other link active when another is focused', () => {
    renderNav('/transactions');
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    const activeCount = links.filter(
      (l) => l.getAttribute('aria-current') === 'page',
    ).length;
    expect(activeCount).toBe(1);
  });

  // ─── Active state (CSS class) ────────────────────────────────────────────

  it('applies the active class to the current route link', () => {
    renderNav('/credit-lines');
    const nav = screen.getByRole('navigation');
    const link = within(nav).getByRole('link', { name: 'Credit Lines' });
    expect(link).toHaveClass('bottom-nav__link--active');
  });

  it('does not apply the active class to non-matching routes', () => {
    renderNav('/transactions');
    const nav = screen.getByRole('navigation');
    const dashboardLink = within(nav).getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).not.toHaveClass('bottom-nav__link--active');
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('marks only Dashboard active on a deep route that starts with /', () => {
    // Dashboard uses `exact` matching so `/transactions` should not
    // activate it. This test already passes via the active-count test above,
    // but we add an explicit assertion for clarity.
    renderNav('/transactions');
    const nav = screen.getByRole('navigation');
    const dashboardLink = within(nav).getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('gracefully handles an unknown route (404) — no active link', () => {
    renderNav('/some/unknown/path');
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    const activeLinks = links.filter(
      (l) => l.getAttribute('aria-current') === 'page',
    );
    expect(activeLinks).toHaveLength(0);
  });

  it('renders semantic <a> elements that are natively keyboard-focusable', () => {
    renderNav();
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    links.forEach((link) => {
      // <Link> renders an <a> element — natively focusable, no explicit tabIndex needed
      expect(link.tagName.toLowerCase()).toBe('a');
      expect(link).not.toHaveAttribute('tabIndex');
    });
  });

  // ─── CSS class structure ─────────────────────────────────────────────────

  it('applies base class to all links', () => {
    renderNav();
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('bottom-nav__link');
    });
  });

  it('renders icons inside each link', () => {
    renderNav();
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    links.forEach((link) => {
      // Each link should contain an SVG (the Lucide icon)
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('marks SVG icons as aria-hidden', () => {
    renderNav();
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    links.forEach((link) => {
      const svg = link.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
