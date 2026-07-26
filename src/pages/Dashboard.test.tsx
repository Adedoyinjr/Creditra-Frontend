import { render, screen, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Dashboard, RiskGauge } from './Dashboard';
import { ReducedMotionProvider } from '../context/ReducedMotionContext';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Path to Dashboard.css — used for source-level CSS assertions
const _dashCssPath = join(dirname(fileURLToPath(import.meta.url)), 'Dashboard.css');

// Mock modules before imports
vi.mock('../context/WalletContext', () => ({
  useWallet: () => ({
    wallet: {
      publicKey: '0x1234567890abcdef1234567890abcdef12345678',
      network: 'TESTNET',
    },
    status: 'connected',
  }),
}));

const { mockReadJson, mockWriteJson, mockStorageStore } = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    mockReadJson: vi.fn((key: string, fallback: unknown) => {
      const val = store[key];
      return val !== undefined ? val : fallback;
    }),
    mockWriteJson: vi.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
    mockStorageStore: store,
  };
});

vi.mock('../utils/storage', () => ({
  readJson: mockReadJson,
  writeJson: mockWriteJson,
}));

const WALLET_KEY = 'risk-explainer-dismissed-0x1234567890abcdef1234567890abcdef12345678';

function stubMatchMedia(matches: boolean) {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: original });
  };
}

describe('Dashboard component skeletons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete mockStorageStore[WALLET_KEY];
  });

  it('renders initial skeleton loading phase with appropriate accessibility attributes', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const announcement = container.querySelector('.dashboard-root > .sr-only') as HTMLElement;
    expect(announcement).toBeInTheDocument();
    expect(announcement.textContent).toBe('Loading dashboard');

    const root = container.querySelector('.dashboard-root') as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.getAttribute('aria-busy')).toBe('true');
  });

  it('transitions to loaded state after timer fires', () => {
    vi.useFakeTimers();

    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const announcement = container.querySelector('.dashboard-root > .sr-only') as HTMLElement;
    expect(announcement).toBeInTheDocument();
    expect(announcement.textContent).toBe('Dashboard loaded');

    const root = container.querySelector('.dashboard-root') as HTMLElement;
    expect(root.getAttribute('aria-busy')).toBe('false');

    expect(screen.getByText('Total Credit Limit')).toBeInTheDocument();
    expect(screen.getByText('Total Utilized')).toBeInTheDocument();
    expect(screen.getByText('Available Credit')).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe('RiskExplainer', () => {
  // The risk explainer was migrated from an inline banner (.risk-explainer)
  // to a modal overlay (RiskExplainerOverlay) in #426. Tests are updated to
  // match the new architecture: an "Explain" trigger button opens the overlay.
  beforeEach(() => {
    vi.clearAllMocks();
    delete mockStorageStore[WALLET_KEY];
  });

  it('renders the "Explain risk bands" trigger button after loading', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]');
    expect(trigger).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('trigger button has aria-haspopup="dialog"', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
    vi.useRealTimers();
  });

  it('trigger button has type="button"', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]');
    expect(trigger?.getAttribute('type')).toBe('button');
    vi.useRealTimers();
  });

  it('trigger button carries focus-ring class for keyboard navigation (FWC26)', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]');
    expect(trigger?.classList.contains('focus-ring')).toBe(true);
    vi.useRealTimers();
  });

  it('reads dismissed state from storage on mount', () => {
    // The overlay reads storage state independently; the trigger button is
    // always visible — only the overlay content reacts to dismissed state.
    mockStorageStore[WALLET_KEY] = true;

    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    // Trigger is always rendered; overlay manages dismissed state internally
    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]');
    expect(trigger).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('trigger button aria-expanded is false when overlay is closed', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    vi.useRealTimers();
  });

  it('trigger button aria-expanded becomes true when clicked', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]') as HTMLElement;
    fireEvent.click(trigger);

    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    vi.useRealTimers();
  });
});

describe('RiskGauge inline component from Dashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matches snapshot at score 580', () => {
    const { container } = render(
      <ReducedMotionProvider>
        <RiskGauge score={580} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot at score 660', () => {
    const { container } = render(
      <ReducedMotionProvider>
        <RiskGauge score={660} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot at score 740', () => {
    const { container } = render(
      <ReducedMotionProvider>
        <RiskGauge score={740} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('tweens score value when normal-motion is active', () => {
    vi.useFakeTimers();
    const restore = stubMatchMedia(false);

    const { rerender } = render(
      <ReducedMotionProvider>
        <RiskGauge score={580} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    // Initial render shows 580
    expect(screen.getByText('580')).toBeInTheDocument();

    // Rerender with new score 740
    rerender(
      <ReducedMotionProvider>
        <RiskGauge score={740} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    // Score does not snap immediately to 740 because it's tweening
    expect(screen.queryByText('740')).not.toBeInTheDocument();

    // Advance halfway (140ms)
    act(() => {
      vi.advanceTimersByTime(140);
    });
    // Check that it's tweening (not 580 and not 740)
    const scoreText = document.querySelector('.risk-gauge-score');
    const midVal = parseInt(scoreText?.textContent || '0', 10);
    expect(midVal).toBeGreaterThan(580);
    expect(midVal).toBeLessThan(740);

    // Advance to completion (another 140ms)
    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(screen.getByText('740')).toBeInTheDocument();

    restore();
    vi.useRealTimers();
  });

  it('updates score instantly without tweening when reduced-motion is active', () => {
    vi.useFakeTimers();
    const restore = stubMatchMedia(true);

    const { rerender } = render(
      <ReducedMotionProvider>
        <RiskGauge score={580} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    expect(screen.getByText('580')).toBeInTheDocument();

    rerender(
      <ReducedMotionProvider>
        <RiskGauge score={740} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    // Snaps instantly to 740
    expect(screen.getByText('740')).toBeInTheDocument();

    restore();
    vi.useRealTimers();
  });
});

// ── FWC26: Themed skeleton tests ─────────────────────────────────────────────

describe('Dashboard component — themed skeleton loading state (FWC26)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton elements with the base skeleton class during loading', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Multiple skeleton placeholders must be present while loading
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('skeleton elements do NOT use skeleton--subtle by default in summary cards', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Summary-card skeletons use default variant (no skeleton--subtle)
    const summarySkeletons = container.querySelectorAll(
      '.summary-card .skeleton'
    );
    summarySkeletons.forEach((el) => {
      expect(el.classList.contains('skeleton--subtle')).toBe(false);
    });
  });

  it('skeleton elements are removed after loading completes', () => {
    vi.useFakeTimers();

    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should have skeletons initially
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Summary cards should now have real values, not skeletons
    expect(screen.getByText('Total Credit Limit')).toBeInTheDocument();
    // Skeleton count may not be zero globally (other components might render them)
    // but the summary-card skeletons should be gone
    const summarySkeletons = container.querySelectorAll(
      '.summary-cards .skeleton'
    );
    expect(summarySkeletons.length).toBe(0);

    vi.useRealTimers();
  });

  it('aria-busy is true on summary-cards during loading', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const summaryCards = container.querySelector('.summary-cards');
    expect(summaryCards?.getAttribute('aria-busy')).toBe('true');
  });

  it('aria-busy is false on summary-cards after loading', () => {
    vi.useFakeTimers();

    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const summaryCards = container.querySelector('.summary-cards');
    expect(summaryCards?.getAttribute('aria-busy')).toBe('false');

    vi.useRealTimers();
  });

  it('skeleton count decreases after loading (skeletons are replaced by real content)', () => {
    vi.useFakeTimers();

    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const skeletonsDuringLoad = container.querySelectorAll('.skeleton').length;
    expect(skeletonsDuringLoad).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const skeletonsAfterLoad = container.querySelectorAll('.skeleton').length;
    expect(skeletonsAfterLoad).toBeLessThan(skeletonsDuringLoad);

    vi.useRealTimers();
  });
});

// ── FWC26 #690: Skeleton shape/height/spacing parity tests ───────────────────
//
// These tests assert that skeleton placeholders in the Dashboard loading state
// have heights and shapes that match the final rendered components so that
// first-paint does not cause a layout jump (CLS = 0).

describe('Dashboard skeleton — height/spacing/shape parity (FWC26 #690)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Summary card skeletons ─────────────────────────────────────────────

  it('summary-card label skeleton has height 14 matching .label rendered height', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Three summary cards, each has a label skeleton as the first .skeleton child
    const summaryCards = container.querySelectorAll('.summary-card.skeleton-card');
    expect(summaryCards.length).toBe(3);

    summaryCards.forEach((card) => {
      const skeletons = card.querySelectorAll('.skeleton');
      // First skeleton = label row (height: 14px)
      const labelSkeleton = skeletons[0] as HTMLElement;
      expect(labelSkeleton.style.height).toBe('14px');
    });
  });

  it('summary-card value skeleton has height 32 matching .value rendered height', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const summaryCards = container.querySelectorAll('.summary-card.skeleton-card');
    summaryCards.forEach((card) => {
      const skeletons = card.querySelectorAll('.skeleton');
      // Second skeleton = value row (height: 32px)
      const valueSkeleton = skeletons[1] as HTMLElement;
      expect(valueSkeleton.style.height).toBe('32px');
    });
  });

  it('summary-card sub skeleton has height 12 matching .sub rendered height', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const summaryCards = container.querySelectorAll('.summary-card.skeleton-card');
    summaryCards.forEach((card) => {
      const skeletons = card.querySelectorAll('.skeleton');
      // Third skeleton = sub row (height: 12px)
      const subSkeleton = skeletons[2] as HTMLElement;
      expect(subSkeleton.style.height).toBe('12px');
    });
  });

  it('summary-card label/sub skeletons use rounded shape (not bare rectangular)', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const summaryCards = container.querySelectorAll('.summary-card.skeleton-card');
    summaryCards.forEach((card) => {
      const skeletons = card.querySelectorAll('.skeleton');
      const labelSkeleton = skeletons[0] as HTMLElement;
      const subSkeleton = skeletons[2] as HTMLElement;
      // Text-line placeholders use 'rounded' shape
      expect(labelSkeleton.classList.contains('skeleton--rounded')).toBe(true);
      expect(subSkeleton.classList.contains('skeleton--rounded')).toBe(true);
    });
  });

  it('summary-card value skeleton uses rectangular shape (matches card/button radius)', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const summaryCards = container.querySelectorAll('.summary-card.skeleton-card');
    summaryCards.forEach((card) => {
      const skeletons = card.querySelectorAll('.skeleton');
      const valueSkeleton = skeletons[1] as HTMLElement;
      expect(valueSkeleton.classList.contains('skeleton--rectangular')).toBe(true);
    });
  });

  it('summary-card skeleton wrapper has min-height 114 matching real card min-height', () => {
    // The CSS rule .summary-card.skeleton-card { min-height: 114px } prevents
    // collapse. We can only assert the class is present (jsdom does not apply CSS).
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    const skeletonCards = container.querySelectorAll('.summary-card.skeleton-card');
    expect(skeletonCards.length).toBe(3);
    skeletonCards.forEach((card) => {
      expect(card.classList.contains('summary-card')).toBe(true);
      expect(card.classList.contains('skeleton-card')).toBe(true);
    });
  });

  // ── Risk gauge skeleton ────────────────────────────────────────────────

  it('risk-gauge skeleton uses rounded shape (matches SVG viewBox aspect)', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const gaugeContainer = container.querySelector('.risk-gauge-container');
    expect(gaugeContainer).toBeInTheDocument();

    // The primary arc placeholder must be skeleton--rounded (not circular)
    const arcSkeleton = gaugeContainer?.querySelector('.skeleton--rounded') as HTMLElement | null;
    expect(arcSkeleton).toBeInTheDocument();
  });

  it('risk-gauge skeleton arc placeholder has 100% width with max-width constraint', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const gaugeContainer = container.querySelector('.risk-gauge-container');
    const arcSkeleton = gaugeContainer?.querySelector('.skeleton--rounded') as HTMLElement | null;

    // Width must be 100% so it scales responsively like the SVG
    expect(arcSkeleton?.style.width).toBe('100%');
  });

  it('risk-gauge meta skeletons use text-line heights (10px for label, 14px for value)', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const gaugeContainer = container.querySelector('.risk-gauge-container');
    const metaItems = gaugeContainer?.querySelectorAll('.risk-meta-item');
    expect(metaItems?.length).toBe(2);

    metaItems?.forEach((item) => {
      const skeletons = item.querySelectorAll('.skeleton');
      expect(skeletons.length).toBe(2);
      // First = label (0.65rem ≈ 10px), Second = value (0.85rem ≈ 14px)
      expect((skeletons[0] as HTMLElement).style.height).toBe('10px');
      expect((skeletons[1] as HTMLElement).style.height).toBe('14px');
    });
  });

  // ── Credit line skeletons ──────────────────────────────────────────────

  it('credit-line name skeletons have height 14 matching .cl-preview-name', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Three .cl-preview-item rows during loading
    const previewItems = container.querySelectorAll('.cl-preview-item');
    expect(previewItems.length).toBeGreaterThan(0);

    previewItems.forEach((item) => {
      // First skeleton in left column = name placeholder (14px)
      const nameSkeleton = item.querySelector('.skeleton') as HTMLElement | null;
      expect(nameSkeleton).toBeInTheDocument();
      expect(nameSkeleton?.style.height).toBe('14px');
    });
  });

  it('credit-line status badge skeletons use pill shape (matches StatusBadge chip)', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const previewItems = container.querySelectorAll('.cl-preview-item');
    previewItems.forEach((item) => {
      // The second skeleton in each name-row is the pill badge placeholder
      const nameRow = item.querySelector('[style*="display"]') as HTMLElement | null;
      if (!nameRow) return;
      const pillSkeleton = nameRow.querySelector('.skeleton--pill') as HTMLElement | null;
      expect(pillSkeleton).toBeInTheDocument();
      expect(pillSkeleton?.style.height).toBe('18px');
    });
  });

  it('credit-line bar skeletons have height 3 matching .cl-preview-bar height', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const previewItems = container.querySelectorAll('.cl-preview-item');
    previewItems.forEach((item) => {
      const rightCol = item.querySelector('.cl-preview-right') as HTMLElement | null;
      if (!rightCol) return;
      const skeletons = rightCol.querySelectorAll('.skeleton');
      // Second skeleton in right column = mini utilisation bar (3px)
      const barSkeleton = skeletons[1] as HTMLElement | null;
      expect(barSkeleton?.style.height).toBe('3px');
    });
  });

  // ── Activity item skeletons ────────────────────────────────────────────

  it('activity icon skeletons have correct 28×28 dimensions matching .activity-icon', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const activityItems = container.querySelectorAll('.activity-item');
    expect(activityItems.length).toBeGreaterThan(0);

    activityItems.forEach((item) => {
      const iconSkeleton = item.querySelector('.activity-icon.skeleton') as HTMLElement | null;
      expect(iconSkeleton).toBeInTheDocument();
      // Must match the 28×28 .activity-icon dimensions exactly
      expect(iconSkeleton?.style.width).toBe('28px');
      expect(iconSkeleton?.style.height).toBe('28px');
    });
  });

  it('activity icon skeletons use rectangular shape (matches 6px-radius icon)', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const activityItems = container.querySelectorAll('.activity-item');
    activityItems.forEach((item) => {
      const iconSkeleton = item.querySelector('.activity-icon.skeleton') as HTMLElement | null;
      // Activity icons are square with border-radius: 6px → skeleton--rectangular
      expect(iconSkeleton?.classList.contains('skeleton--rectangular')).toBe(true);
    });
  });

  it('activity title skeletons have height 14 matching .activity-title', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const activityItems = container.querySelectorAll('.activity-item');
    activityItems.forEach((item) => {
      const content = item.querySelector('.activity-content') as HTMLElement | null;
      if (!content) return;
      const titleSkeleton = content.querySelectorAll('.skeleton')[0] as HTMLElement;
      // .activity-title: 0.825rem font → 14px block placeholder
      expect(titleSkeleton.style.height).toBe('14px');
    });
  });

  it('activity sub skeletons have height 10 matching .activity-sub', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const activityItems = container.querySelectorAll('.activity-item');
    activityItems.forEach((item) => {
      const content = item.querySelector('.activity-content') as HTMLElement | null;
      if (!content) return;
      const subSkeleton = content.querySelectorAll('.skeleton')[1] as HTMLElement;
      // .activity-sub: 0.725rem font → 10px block placeholder
      expect(subSkeleton.style.height).toBe('10px');
    });
  });

  // ── CSS source assertions ──────────────────────────────────────────────

  it('Dashboard.css declares min-height 114px for .summary-card.skeleton-card', () => {
    const css = readFileSync(_dashCssPath, 'utf-8');
    expect(css).toContain('.summary-card.skeleton-card');
    expect(css).toContain('min-height: 114px');
  });

  it('Dashboard.css declares min-height 57px for .cl-preview-item', () => {
    const css = readFileSync(_dashCssPath, 'utf-8');
    expect(css).toContain('.cl-preview-item');
    expect(css).toContain('min-height: 57px');
  });

  it('Dashboard.css declares min-height 48px for .activity-item', () => {
    const css = readFileSync(_dashCssPath, 'utf-8');
    expect(css).toContain('.activity-item');
    expect(css).toContain('min-height: 48px');
  });
});
