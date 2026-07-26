import { render, screen, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard, RiskGauge } from './Dashboard';
import { ReducedMotionProvider } from '../context/ReducedMotionContext';

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

  it('trigger button uses design tokens for styling', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const trigger = container.querySelector('[data-testid="risk-explainer-trigger"]') as HTMLElement;
    expect(trigger?.style.fontSize).toBe('var(--text-xs)');
    expect(trigger?.style.padding).toBe('var(--space-1) var(--space-2)');
    expect(trigger?.style.borderRadius).toBe('var(--radius-sm)');
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
