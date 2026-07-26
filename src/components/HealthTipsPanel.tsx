/**
 * HealthTipsPanel — Contextual credit-health education panel.
 *
 * Surfaces bite-sized tips about improving and protecting your credit score
 * on the Dashboard sidebar. Tips are categorised (score, utilization,
 * history, behaviour) and can be cycled with keyboard-accessible navigation.
 *
 * Accessibility:
 *   - role="region" + aria-labelledby for landmark navigation
 *   - All interactive controls labelled (aria-label)
 *   - Focus-visible outlines meet 2px / 2px-offset spec from index.css
 *   - Navigation arrows meet 44×44 px touch-target requirement
 *   - Keyboard: Arrow keys / Enter / Space cycle tips
 *   - Live region announces current tip to screen readers
 *   - prefers-reduced-motion → disables enter animation on tip cards
 *   - Dismiss preference persisted in localStorage via utils/storage
 *
 * Design tokens:
 *   Every colour and spacing value is drawn from CSS custom properties
 *   declared in src/index.css — no inline hex values.
 */

import { useState, useId, useCallback, useEffect } from 'react';
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  TrendingUp,
  CreditCard,
  Clock,
} from 'lucide-react';
import { readJson, writeJson } from '../utils/storage';
import './HealthTipsPanel.css';

// ─── Tip data ─────────────────────────────────────────────────────────────────

/** Category taxonomy for tip grouping and icon mapping. */
export type TipCategory = 'score' | 'utilization' | 'history' | 'behaviour';

/** A single educational tip entry. */
export interface HealthTip {
  /** Stable identifier — never re-use or re-order. */
  id: string;
  category: TipCategory;
  /** Short headline displayed prominently. */
  title: string;
  /** Supporting explanation (1–2 sentences). */
  body: string;
  /** Relative impact badge shown beneath the tip. */
  impact: 'high' | 'medium' | 'low';
}

/** Ordered tip list — add new tips at the end. */
export const HEALTH_TIPS: HealthTip[] = [
  {
    id: 'ht-001',
    category: 'utilization',
    title: 'Keep utilization below 30 %',
    body: 'Credit utilization is the second largest factor in your score. Aim to use less than 30 % of each line to signal responsible borrowing.',
    impact: 'high',
  },
  {
    id: 'ht-002',
    category: 'score',
    title: 'Pay on time, every time',
    body: 'Payment history is the single biggest driver of your risk score — a single missed payment can drop your score by up to 100 points.',
    impact: 'high',
  },
  {
    id: 'ht-003',
    category: 'history',
    title: 'Keep your oldest lines open',
    body: 'The average age of your credit lines contributes to your score. Closing an old line shortens your history and can lower your score.',
    impact: 'medium',
  },
  {
    id: 'ht-004',
    category: 'behaviour',
    title: 'Avoid many hard inquiries',
    body: 'Each hard inquiry stays on your record for 12 months. Space out new credit applications to minimise the temporary score dip.',
    impact: 'medium',
  },
  {
    id: 'ht-005',
    category: 'utilization',
    title: 'Spread draws across lines',
    body: 'Instead of maxing a single line, spread utilization evenly. Per-line utilization matters as much as overall utilization.',
    impact: 'medium',
  },
  {
    id: 'ht-006',
    category: 'score',
    title: 'Review your score monthly',
    body: 'Regular score checks help you catch errors early. Checking your own score is a soft inquiry and does not affect your rating.',
    impact: 'low',
  },
  {
    id: 'ht-007',
    category: 'behaviour',
    title: 'Make micro-repayments frequently',
    body: 'Small, regular repayments reduce your average daily balance faster than a single lump-sum payment at month end, cutting interest.',
    impact: 'medium',
  },
  {
    id: 'ht-008',
    category: 'history',
    title: 'Build a diversified credit mix',
    body: 'Lenders reward a healthy mix of credit types. Combining revolving lines with term loans demonstrates broader borrowing competence.',
    impact: 'low',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  TipCategory,
  { label: string; Icon: React.FC<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }> }
> = {
  score: { label: 'Score', Icon: TrendingUp },
  utilization: { label: 'Utilization', Icon: CreditCard },
  history: { label: 'History', Icon: Clock },
  behaviour: { label: 'Behaviour', Icon: BookOpen },
};

const IMPACT_LABEL: Record<HealthTip['impact'], string> = {
  high: 'High impact',
  medium: 'Medium impact',
  low: 'Low impact',
};

const DISMISSED_KEY = 'health-tips-panel-dismissed';

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TipCardProps {
  tip: HealthTip;
  /** Zero-based index within the visible list — used for animation delay. */
  index: number;
}

function TipCard({ tip, index }: TipCardProps) {
  const meta = CATEGORY_META[tip.category];
  const Icon = meta.Icon;

  return (
    <article
      className={`htp-tip htp-tip--${tip.category}`}
      style={{ animationDelay: `${index * 0.06}s` }}
      aria-label={`Health tip: ${tip.title}`}
    >
      {/* Category pill */}
      <div className="htp-tip-meta">
        <span className={`htp-category-badge htp-category-badge--${tip.category}`}>
          <Icon size={11} aria-hidden="true" />
          <span>{meta.label}</span>
        </span>
        <span className={`htp-impact-badge htp-impact-badge--${tip.impact}`}>
          {IMPACT_LABEL[tip.impact]}
        </span>
      </div>

      {/* Content */}
      <h3 className="htp-tip-title">{tip.title}</h3>
      <p className="htp-tip-body">{tip.body}</p>
    </article>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface HealthTipsPanelProps {
  /**
   * Override which tips to display. Defaults to HEALTH_TIPS.
   * Useful for tests that want a deterministic subset.
   */
  tips?: HealthTip[];
  /**
   * Number of tips visible at once.
   * @default 2
   */
  pageSize?: number;
}

/**
 * HealthTipsPanel — sticky educational sidebar panel.
 *
 * Renders a paginated list of credit-health tips. The user can navigate
 * forward/back through pages of `pageSize` tips (default: 2) and dismiss
 * the panel entirely (preference persisted in localStorage).
 */
export function HealthTipsPanel({ tips = HEALTH_TIPS, pageSize = 2 }: HealthTipsPanelProps) {
  const headingId = useId();

  // ── Dismiss state ────────────────────────────────────────────────────────
  const [dismissed, setDismissed] = useState<boolean>(() =>
    readJson<boolean>(DISMISSED_KEY, false),
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    writeJson(DISMISSED_KEY, true);
  }, []);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(tips.length / pageSize);
  const [page, setPage] = useState(0);

  // Clamp page when tips prop changes (e.g. in tests)
  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const visibleTips = tips.slice(page * pageSize, (page + 1) * pageSize);

  const handlePrev = useCallback(() => {
    setPage((p) => (p > 0 ? p - 1 : totalPages - 1));
  }, [totalPages]);

  const handleNext = useCallback(() => {
    setPage((p) => (p < totalPages - 1 ? p + 1 : 0));
  }, [totalPages]);

  // Keyboard navigation on the nav row
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    },
    [handlePrev, handleNext],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (dismissed) return null;

  return (
    <section
      className="htp-panel card"
      role="region"
      aria-labelledby={headingId}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="htp-header">
        <h2 id={headingId} className="htp-heading">
          <Lightbulb size={16} className="htp-heading-icon" aria-hidden="true" />
          Health Tips
        </h2>

        <button
          type="button"
          className="htp-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss health tips panel"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Subtitle */}
      <p className="htp-subtitle">
        Contextual tips to build and protect your credit health.
      </p>

      {/* ── Tip cards ───────────────────────────────────────────────────── */}
      {/*
        The live region wraps the tip list so screen readers announce when the
        user navigates to a new page of tips.
      */}
      <div
        className="htp-tips-list"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Credit health tips, page ${page + 1} of ${totalPages}`}
      >
        {visibleTips.map((tip, i) => (
          <TipCard key={tip.id} tip={tip} index={i} />
        ))}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <nav
          className="htp-nav"
          aria-label="Health tips navigation"
          onKeyDown={handleKeyDown}
        >
          <button
            type="button"
            className="htp-nav-btn"
            onClick={handlePrev}
            aria-label="Previous tips"
            disabled={totalPages <= 1}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>

          {/* Page dots */}
          <div className="htp-page-dots" role="tablist" aria-label="Tip pages">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                role="tab"
                type="button"
                className={`htp-dot${i === page ? ' htp-dot--active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-selected={i === page}
              />
            ))}
          </div>

          <button
            type="button"
            className="htp-nav-btn"
            onClick={handleNext}
            aria-label="Next tips"
            disabled={totalPages <= 1}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}

      {/* ── Footer copy ─────────────────────────────────────────────────── */}
      <p className="htp-footer">
        Tip {page * pageSize + 1}–{Math.min((page + 1) * pageSize, tips.length)} of{' '}
        {tips.length}
      </p>
    </section>
  );
}
