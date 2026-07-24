/**
 * HealthTipsPanel.test.tsx
 *
 * Focused test suite for the HealthTipsPanel component.
 *
 * Coverage areas:
 *   1. Rendering — panel appears with correct structure
 *   2. Content   — tips are displayed correctly
 *   3. Pagination — next/prev navigation, page dots, keyboard arrow keys
 *   4. Dismiss   — dismiss button hides panel and persists to localStorage
 *   5. Accessibility — ARIA roles, labels, live regions, landmark
 *   6. Edge cases — single tip, exact-page-boundary tip count
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HealthTipsPanel, HEALTH_TIPS, type HealthTip } from './HealthTipsPanel';

// ─── Fixtures ──────────────────────────────────────────────────────────────

/** A small deterministic set of tips used across most tests. */
const THREE_TIPS: HealthTip[] = [
  {
    id: 't1',
    category: 'score',
    title: 'Pay on time',
    body: 'Tip body one.',
    impact: 'high',
  },
  {
    id: 't2',
    category: 'utilization',
    title: 'Keep utilization low',
    body: 'Tip body two.',
    impact: 'high',
  },
  {
    id: 't3',
    category: 'history',
    title: 'Keep old lines open',
    body: 'Tip body three.',
    impact: 'medium',
  },
];

const ONE_TIP: HealthTip[] = [THREE_TIPS[0]];

// ─── Storage mock ──────────────────────────────────────────────────────────

const { mockReadJson, mockWriteJson, mockStore } = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    mockReadJson: vi.fn((key: string, fallback: unknown) => {
      const val = store[key];
      return val !== undefined ? val : fallback;
    }),
    mockWriteJson: vi.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
    mockStore: store,
  };
});

vi.mock('../utils/storage', () => ({
  readJson: mockReadJson,
  writeJson: mockWriteJson,
}));

// ─── Test setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Clear the store so dismiss state doesn't leak between tests
  for (const key of Object.keys(mockStore)) {
    delete mockStore[key];
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── 1. Rendering ───────────────────────────────────────────────────────────

describe('HealthTipsPanel — rendering', () => {
  it('renders the panel with a visible heading', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    expect(screen.getByRole('region', { name: /health tips/i })).toBeInTheDocument();
    expect(screen.getByText('Health Tips')).toBeInTheDocument();
  });

  it('renders the subtitle copy', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    expect(
      screen.getByText(/contextual tips to build and protect your credit health/i),
    ).toBeInTheDocument();
  });

  it('renders the footer counter', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    // First page shows tips 1–2 of 3
    expect(screen.getByText(/1.+2 of 3/i)).toBeInTheDocument();
  });

  it('renders with all default HEALTH_TIPS when no tips prop is supplied', () => {
    render(<HealthTipsPanel />);
    // At least one tip from the default set should be visible
    expect(screen.getByRole('region', { name: /health tips/i })).toBeInTheDocument();
    // Default pageSize = 2, so we have tips in the document
    expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 2. Content ─────────────────────────────────────────────────────────────

describe('HealthTipsPanel — content', () => {
  it('shows the first pageSize tips on initial render', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    expect(screen.getByText('Pay on time')).toBeInTheDocument();
    expect(screen.getByText('Keep utilization low')).toBeInTheDocument();
    expect(screen.queryByText('Keep old lines open')).not.toBeInTheDocument();
  });

  it('displays tip title and body text', () => {
    render(<HealthTipsPanel tips={ONE_TIP} pageSize={1} />);
    expect(screen.getByText('Pay on time')).toBeInTheDocument();
    expect(screen.getByText('Tip body one.')).toBeInTheDocument();
  });

  it('displays category badge for each visible tip', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    // First tip is 'score' category → 'Score' badge
    expect(screen.getByText('Score')).toBeInTheDocument();
    // Second tip is 'utilization' → 'Utilization'
    expect(screen.getByText('Utilization')).toBeInTheDocument();
  });

  it('displays the impact badge for each visible tip', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    // Both visible tips are 'high' impact
    expect(screen.getAllByText('High impact')).toHaveLength(2);
  });

  it('each tip is rendered as an <article> with an accessible label', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const articles = screen.getAllByRole('article');
    expect(articles[0]).toHaveAttribute('aria-label', 'Health tip: Pay on time');
    expect(articles[1]).toHaveAttribute('aria-label', 'Health tip: Keep utilization low');
  });
});

// ─── 3. Pagination ──────────────────────────────────────────────────────────

describe('HealthTipsPanel — pagination', () => {
  it('shows navigation when there is more than one page', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    expect(screen.getByRole('navigation', { name: /health tips navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next tips/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous tips/i })).toBeInTheDocument();
  });

  it('hides navigation when all tips fit on one page', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={3} />);
    expect(screen.queryByRole('navigation', { name: /health tips navigation/i })).not.toBeInTheDocument();
  });

  it('advances to the next page on "Next tips" click', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const nextBtn = screen.getByRole('button', { name: /next tips/i });
    fireEvent.click(nextBtn);
    // Now on page 2 → shows tip 3 only
    expect(screen.getByText('Keep old lines open')).toBeInTheDocument();
    expect(screen.queryByText('Pay on time')).not.toBeInTheDocument();
  });

  it('wraps from the last page back to the first on "Next tips" click', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const nextBtn = screen.getByRole('button', { name: /next tips/i });
    fireEvent.click(nextBtn); // → page 2
    fireEvent.click(nextBtn); // → wraps to page 1
    expect(screen.getByText('Pay on time')).toBeInTheDocument();
  });

  it('goes to the previous page on "Previous tips" click', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const nextBtn = screen.getByRole('button', { name: /next tips/i });
    const prevBtn = screen.getByRole('button', { name: /previous tips/i });
    fireEvent.click(nextBtn); // page 2
    fireEvent.click(prevBtn); // back to page 1
    expect(screen.getByText('Pay on time')).toBeInTheDocument();
  });

  it('wraps from page 1 to last page on "Previous tips" click', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const prevBtn = screen.getByRole('button', { name: /previous tips/i });
    fireEvent.click(prevBtn); // wrap to last page
    expect(screen.getByText('Keep old lines open')).toBeInTheDocument();
  });

  it('renders the correct number of page dots', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    // 3 tips / pageSize 2 = 2 pages → 2 dots
    const dotList = screen.getByRole('tablist', { name: /tip pages/i });
    const dots = within(dotList).getAllByRole('tab');
    expect(dots).toHaveLength(2);
  });

  it('first dot is active (aria-selected) on initial render', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const dotList = screen.getByRole('tablist', { name: /tip pages/i });
    const dots = within(dotList).getAllByRole('tab');
    expect(dots[0]).toHaveAttribute('aria-selected', 'true');
    expect(dots[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking a page dot navigates directly to that page', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const dotList = screen.getByRole('tablist', { name: /tip pages/i });
    const dots = within(dotList).getAllByRole('tab');
    fireEvent.click(dots[1]); // click page 2 dot
    expect(screen.getByText('Keep old lines open')).toBeInTheDocument();
    expect(dots[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('footer counter updates after navigation', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: /next tips/i }));
    // Page 2 → tip 3 of 3
    expect(screen.getByText(/3.+3 of 3/i)).toBeInTheDocument();
  });
});

// ─── 3a. Keyboard navigation ─────────────────────────────────────────────────

describe('HealthTipsPanel — keyboard navigation', () => {
  it('ArrowRight on the nav element advances the page', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const nav = screen.getByRole('navigation', { name: /health tips navigation/i });
    fireEvent.keyDown(nav, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(screen.getByText('Keep old lines open')).toBeInTheDocument();
  });

  it('ArrowLeft on the nav element goes to the previous page', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const nav = screen.getByRole('navigation', { name: /health tips navigation/i });
    fireEvent.keyDown(nav, { key: 'ArrowRight', code: 'ArrowRight' }); // page 2
    fireEvent.keyDown(nav, { key: 'ArrowLeft', code: 'ArrowLeft' });   // back to page 1
    expect(screen.getByText('Pay on time')).toBeInTheDocument();
  });
});

// ─── 4. Dismiss ─────────────────────────────────────────────────────────────

describe('HealthTipsPanel — dismiss', () => {
  it('dismiss button is present and accessible', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const btn = screen.getByRole('button', { name: /dismiss health tips panel/i });
    expect(btn).toBeInTheDocument();
  });

  it('clicking dismiss removes the panel from the DOM', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const btn = screen.getByRole('button', { name: /dismiss health tips panel/i });
    fireEvent.click(btn);
    expect(screen.queryByRole('region', { name: /health tips/i })).not.toBeInTheDocument();
  });

  it('clicking dismiss calls writeJson with the dismissed key', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss health tips panel/i }));
    expect(mockWriteJson).toHaveBeenCalledWith('health-tips-panel-dismissed', true);
  });

  it('does not render when storage returns dismissed = true', () => {
    mockStore['health-tips-panel-dismissed'] = true;
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    expect(screen.queryByRole('region', { name: /health tips/i })).not.toBeInTheDocument();
  });
});

// ─── 5. Accessibility ────────────────────────────────────────────────────────

describe('HealthTipsPanel — accessibility', () => {
  it('panel has role="region" with an accessible name', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const region = screen.getByRole('region', { name: /health tips/i });
    expect(region).toBeInTheDocument();
  });

  it('tip list has aria-live="polite" for screen-reader announcements', () => {
    const { container } = render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('live region label includes current page and total pages', () => {
    const { container } = render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveAttribute('aria-label', 'Credit health tips, page 1 of 2');
  });

  it('live region label updates after navigation', () => {
    const { container } = render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: /next tips/i }));
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveAttribute('aria-label', 'Credit health tips, page 2 of 2');
  });

  it('heading is connected to region via aria-labelledby', () => {
    const { container } = render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    const region = container.querySelector('[role="region"]') as HTMLElement;
    const labelledById = region.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    const heading = container.querySelector(`#${CSS.escape(labelledById!)}`) as HTMLElement;
    expect(heading).not.toBeNull();
    expect(heading.textContent).toMatch(/health tips/i);
  });

  it('page dot buttons have descriptive aria-labels', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    expect(screen.getByRole('tab', { name: /page 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /page 2/i })).toBeInTheDocument();
  });
});

// ─── 6. Edge cases ───────────────────────────────────────────────────────────

describe('HealthTipsPanel — edge cases', () => {
  it('renders correctly with a single tip and no pagination nav', () => {
    render(<HealthTipsPanel tips={ONE_TIP} pageSize={2} />);
    expect(screen.getByText('Pay on time')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText(/1.+1 of 1/i)).toBeInTheDocument();
  });

  it('renders all tips on one page when pageSize >= tips.length', () => {
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={5} />);
    expect(screen.getByText('Pay on time')).toBeInTheDocument();
    expect(screen.getByText('Keep utilization low')).toBeInTheDocument();
    expect(screen.getByText('Keep old lines open')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('shows tips from the full HEALTH_TIPS list (smoke test)', () => {
    render(<HealthTipsPanel pageSize={HEALTH_TIPS.length} />);
    // Every default tip should appear
    for (const tip of HEALTH_TIPS) {
      expect(screen.getByText(tip.title)).toBeInTheDocument();
    }
  });

  it('footer counter shows exact last-page range correctly', () => {
    // 3 tips, pageSize 2 → page 2 has only 1 tip (tips 3–3 of 3)
    render(<HealthTipsPanel tips={THREE_TIPS} pageSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: /next tips/i }));
    expect(screen.getByText(/3.+3 of 3/i)).toBeInTheDocument();
  });
});
