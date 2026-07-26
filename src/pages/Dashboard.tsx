import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ActivityFeed from "../components/ActivityFeed";
import { CopyToClipboard } from "../components/CopyToClipboard";
import { CopyLoanButton } from "../components/CopyLoanButton";
import { StatusBadge } from "../components/StatusBadge";
import { useWallet } from "../context/WalletContext";
import { Sparkline } from "../components/Sparkline";
import { RiskBandsPanel } from "../components/RiskBandsPanel";
import { WhatsChangedPanel } from "../components/WhatsChangedPanel";
import { RiskExplainerOverlay } from "../components/RiskExplainerOverlay";
import { MOCK_CREDIT_LINES } from "../data/mockData";
import type { Transaction } from "../types/creditLine";
import {
  COLOR,
  UTIL_COLOR,
  fmt,
  fmtDate,
  utilizationPct,
  RISK_COLOR,
  getUtilizationLevel,
} from "../utils/tokens";
import { readJson, writeJson } from "../utils/storage";
import "./Dashboard.css";
import "../styles/patterns.css";
import { Skeleton } from "../components/Skeleton";
import { NoDataGraph } from "../components/illustrations";
import CompareLinesPanel from "../components/CompareLinesPanel";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useInertBackdrop } from "../hooks/useInertBackdrop";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useReducedMotion } from "../context/ReducedMotionContext";
import { getUtilizationLevel } from "../utils/tokens";
import { TipJar } from "../components/TipJar";
import { NextSteps } from "../components/NextSteps";
import { WhatChanged } from "../components/WhatChanged";
import { HealthTipsPanel } from "../components/HealthTipsPanel";
import { DashboardTour } from "../components/DashboardTour";
import { ContinuePrompt } from "../components/ContinuePrompt";
import { SyncIndicator } from "../components/SyncIndicator";

export { RiskGauge };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
};

const TX_ICON: Record<string, string> = {
  Draw: "↗",
  Repay: "↙",
  Fee: "📋",
  Interest: "📈",
};

const TX_COLOR: Record<string, string> = {
  Draw: COLOR.danger,
  Repay: COLOR.success,
  Fee: COLOR.muted,
  Interest: COLOR.warning,
};

// ─── Risk Score Gauge ─────────────────────────────────────────────────────────

const easeCubicBezier = (x: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const x1 = 0.16;
  const x2 = 0.3;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
    const diff = currentX - x;
    if (Math.abs(diff) < 1e-6) break;
    const dXdt = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
    t -= diff / (dXdt || 1);
  }
  return 3 * t * (1 - t) + t * t * t;
};

export function RiskGauge({
  score,
  trend,
  lastUpdated,
  history,
}: {
  score: number;
  trend: "improving" | "declining" | "stable";
  lastUpdated: string;
  history?: number[];
}) {
  const radius = 55;
  const cx = 80;
  const cy = 75;
  const circumference = Math.PI * radius;
  const normalizedScore = Math.min(850, Math.max(0, score));
  const offset = circumference - (normalizedScore / 850) * circumference;

  const gaugeColor = RISK_COLOR(normalizedScore);
  const trendArrow =
    trend === "improving" ? "▲" : trend === "declining" ? "▼" : "─";
  const trendColor =
    trend === "improving"
      ? COLOR.success
      : trend === "declining"
        ? COLOR.danger
        : COLOR.muted;

  const { isReducedMotionActive } = useReducedMotion();
  const [displayedScore, setDisplayedScore] = useState(normalizedScore);
  const prevScoreRef = useRef(normalizedScore);

  useEffect(() => {
    if (isReducedMotionActive) {
      setDisplayedScore(normalizedScore);
      prevScoreRef.current = normalizedScore;
      return;
    }

    const startScore = prevScoreRef.current;
    const endScore = normalizedScore;
    if (startScore === endScore) return;

    const duration = 280;
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeCubicBezier(progress);

      const currentVal = startScore + (endScore - startScore) * easedProgress;
      setDisplayedScore(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevScoreRef.current = endScore;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [normalizedScore, isReducedMotionActive]);

  const scoreFormatter = useMemo(() => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }), []);

  /*
   * v7 color-blind tier glyph (closes #565):
   *   ▲ ≥700    (strong)        — triangle: "look up"
   *   ◆ 600–699 (fair)          — diamond:  "watch"
   *   ● <600    (below)         — circle:   "act now"
   *
   * The glyph sits in the risk-meta row next to the numerically displayed
   * score, providing a shape cue that survives any colour filter.
   */
  const tier =
    normalizedScore >= 700 ? 'strong' :
    normalizedScore >= 600 ? 'fair' : 'below';
  const tierGlyph = tier === 'strong' ? '▲' : tier === 'fair' ? '◆' : '●';
  const tierLabel =
    tier === 'strong' ? 'Strong risk score' :
    tier === 'fair' ? 'Fair risk score' : 'Below recommended risk score';

  return (
    <div className="risk-gauge-container">
      <svg
        className="risk-gauge-svg"
        viewBox="0 0 160 100"
        role="img"
        aria-labelledby={`risk-gauge-title-${tier}`}
      >
        <title id={`risk-gauge-title-${tier}`}>
          Risk score {scoreFormatter.format(Math.round(displayedScore))} — band {tier}
        </title>
        <path
          className="risk-gauge-bg"
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        />
        <path
          className="risk-gauge-fill"
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          stroke={gaugeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text x={cx} y={cy - 12} className="risk-gauge-score">
          {scoreFormatter.format(Math.round(displayedScore))}
        </text>
        <text x={cx} y={cy - 38} className="risk-gauge-label">
          Risk Score
        </text>
      </svg>
      {/* Shape-coded tier glyph (v7).  Visually this mirrors the band colour
          but is independently perceivable by colour-blind users; screen
          readers get an explicit label via the sr-only span. */}
      <span className="risk-gauge-tier-wrap" style={{ color: gaugeColor }}>
        <span
          className="risk-gauge-tier-glyph"
          aria-hidden="true"
          data-tier={tier}
        >
          {tierGlyph}
        </span>
        <span className="sr-only">{tierLabel}</span>
      </span>

      <div className="risk-meta">
        <div className="risk-meta-item">
          <span className="rm-label">Trend</span>
          <span className="rm-value" style={{ color: trendColor, display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{trendArrow} {trend.charAt(0).toUpperCase() + trend.slice(1)}</span>
            {history && history.length > 0 && (
              <Sparkline data={history} width={60} height={24} color={trendColor} />
            )}
          </span>
        </div>
        <div className="risk-meta-item">
          <span className="rm-label">Last Updated</span>
          <span className="rm-value" style={{ color: COLOR.muted }}>
            {fmtDate(lastUpdated)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Risk Explainer ───────────────────────────────────────────────────────────

function RiskExplainer({ score, address }: { score: number; address?: string }) {
  const [dismissed, setDismissed] = useState(() => {
    if (!address) return true;
    return readJson(`risk-explainer-dismissed-${address}`, false);
  });

  if (dismissed || !address) return null;

  const band = RISK_COLOR(score);

  const message = band === COLOR.success
    ? 'Strong credit position \u2014 you\u2019re above the recommended threshold for new draws.'
    : band === COLOR.warning
    ? 'Fair credit position \u2014 within acceptable range, though keep an eye on your utilization.'
    : 'Below the recommended threshold \u2014 consider improving your score before new draws.';

  const handleDismiss = () => {
    setDismissed(true);
    writeJson(`risk-explainer-dismissed-${address}`, true);
  };

  return (
    <div className="risk-explainer" role="status" style={{ borderLeftColor: band }}>
      <p className="risk-explainer-text">{message}</p>
      <button
        className="risk-explainer-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss risk score explainer"
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Dashboard Component ──────────────────────────────────────────────────────

export function Dashboard() {
  const { wallet, status } = useWallet();
  const creditLines = MOCK_CREDIT_LINES;

  const [repayCount, setRepayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  // `isExplainOpen` now drives the centred RiskExplainerOverlay (#426).
  // The slide-out panel (`RiskBandsPanel`) keeps its own local state and
  // is unaffected.

  // ─── Sync timestamps ─────────────────────────────────────────────────────
  const [riskSyncedAt, setRiskSyncedAt] = useState<Date>(() => new Date());
  const [creditSyncedAt, setCreditSyncedAt] = useState<Date>(() => new Date());
  const [activitySyncedAt, setActivitySyncedAt] = useState<Date>(() => new Date());

  const handleRiskRefresh = useCallback(async () => {
    await new Promise<void>((r) => setTimeout(r, 600));
    setRiskSyncedAt(new Date());
  }, []);

  const handleCreditRefresh = useCallback(async () => {
    await new Promise<void>((r) => setTimeout(r, 600));
    setCreditSyncedAt(new Date());
  }, []);

  const handleActivityRefresh = useCallback(async () => {
    await new Promise<void>((r) => setTimeout(r, 600));
    setActivitySyncedAt(new Date());
  }, []);
  const explainTriggerRef = useRef<HTMLButtonElement>(null);
  const [selectedCompareLines, setSelectedCompareLines] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const compareTriggerRef = useRef<HTMLButtonElement>(null);


  const handleCloseCompare = () => {
    setShowCompare(false);
    setSelectedCompareLines([]);
  };

  const handleOpenCompare = () => {
    if (selectedCompareLines.length === 2) {
      setShowCompare(true);
    }
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedCompareLines((prev) => {
      if (prev.includes(id)) {
        return prev.filter((lineId) => lineId !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const comparePanelRef = useFocusTrap({
    isActive: showCompare,
    triggerRef: compareTriggerRef,
    onEscape: handleCloseCompare,
  });

  useInertBackdrop({ isInert: showCompare, modalId: "compare-lines-drawer-dashboard" });
  useBodyScrollLock({ isLocked: showCompare });

  const selectedCreditLines = useMemo(
    () => creditLines.filter((line) => selectedCompareLines.includes(line.id)),
    [creditLines, selectedCompareLines],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const activeLines = useMemo(
    () =>
      creditLines.filter(
        (cl) => cl.status === "Active" || cl.status === "Suspended",
      ),
    [creditLines, repayCount],
  );

  const activeLinesOnly = useMemo(
    () => creditLines.filter((cl) => cl.status === "Active"),
    [creditLines, repayCount],
  );


  const totalLimit = activeLinesOnly.reduce((s, cl) => s + cl.limit, 0);
  const totalUtilized = activeLinesOnly.reduce((s, cl) => s + cl.utilized, 0);
  const totalAvailable = totalLimit - totalUtilized;
  const overallPct = utilizationPct(totalUtilized, totalLimit || 1);
  const overallLevel =
    totalLimit > 0 ? getUtilizationLevel(totalUtilized, totalLimit) : "low";

  const avgRiskScore =
    activeLinesOnly.length > 0
      ? Math.round(
          activeLinesOnly.reduce((s, cl) => s + cl.riskScore, 0) /
            activeLinesOnly.length,
        )
      : 0;

  const recentActivity = useMemo(() => {
    const all: (Transaction & { lineName: string; lineId: string })[] = [];
    creditLines.forEach((cl) => {
      cl.transactions.forEach((tx) => {
        all.push({ ...tx, lineName: cl.name, lineId: cl.id });
      });
    });
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, 5);
  }, [creditLines, repayCount]);


  const notifications = useMemo(() => {
    const notes: {
      icon: string;
      content: React.ReactNode;
      type: "info" | "warning" | "danger";
      time?: string;
    }[] = [];

    creditLines.forEach((cl) => {
      if (cl.status === "Suspended") {
        notes.push({
          icon: "⚠️",
          content: (
            <>
              <strong>{cl.name}</strong> has been suspended. Make a repayment to
              restore access.
            </>
          ),
          type: "warning",
          time: cl.updatedAt,
        });
      }
      if (cl.status === "Defaulted") {
        notes.push({
          icon: "🚨",
          content: (
            <>
              <strong>{cl.name}</strong> is in default (90+ days overdue).
              Contact support immediately.
            </>
          ),
          type: "danger",
          time: cl.updatedAt,
        });
      }
      if (cl.status === "Active") {
        const util = cl.utilized / cl.limit;
        if (util >= 0.75) {
          notes.push({
            icon: "📊",
            content: (
              <>
                <strong>{cl.name}</strong> utilization is at{" "}
                {Math.round(util * 100)}%. Consider a repayment.
              </>
            ),
            type: "warning",
          });
        }
        if (cl.nextPaymentDate) {
          const daysUntil = Math.ceil(
            (new Date(cl.nextPaymentDate).getTime() - Date.now()) / 86400000,
          );
          if (daysUntil > 0 && daysUntil <= 7) {
            notes.push({
              icon: "🗓️",
              content: (
                <>
                  Payment of <strong>{fmt(cl.nextPaymentAmount ?? 0)}</strong>{" "}
                  due in {daysUntil} day{daysUntil !== 1 ? "s" : ""} for{" "}
                  {cl.name}.
                </>
              ),
              type: "info",
            });
          }
        }
      }
    });
    return notes;
  }, [creditLines, repayCount]);


  const hasLines = creditLines.length > 0;
  const hasUtilized = totalUtilized > 0;
  const isConnected = status === "connected" && wallet;

  const truncAddr = wallet?.publicKey
    ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-4)}`
    : "";

  if (!loading && !hasLines) {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle">Your credit overview at a glance</p>
          </div>
          {isConnected && (
            <div className="wallet-info">
              <CopyToClipboard
                value={wallet.publicKey}
                displayValue={truncAddr}
                ariaLabel="Copy connected wallet address"
                variant="surface"
                className="wallet-address-chip"
                valueClassName="wallet-address-value"
              />
               <span
                 className={`network-badge ${wallet.network === "TESTNET" ? "testnet" : "mainnet"}`}
                 title={
                   wallet.network === "TESTNET"
                     ? "Testnet (no real funds)"
                     : "Mainnet (real funds)"
                 }
                 aria-label={
                   wallet.network === "TESTNET"
                     ? "Testnet network (test funds)"
                     : "Mainnet network (real funds)"
                 }
               >
                 <span className="dot" />
                 <span className="network-icon" aria-hidden="true">
                   {wallet.network === "TESTNET" ? "⚠️" : "✅"}
                 </span>
                 {wallet.network === "TESTNET" ? "Testnet" : "Mainnet"}
               </span>
            </div>
          )}
        </div>
        <div className="empty-state">
          <NoDataGraph className="empty-state-illustration--muted" />
          <h2>No credit lines yet</h2>
          <p>
            Start your credit journey by requesting a credit evaluation. We'll
            analyze your on-chain activity to determine your credit limit and
            terms.
          </p>
          <Link to="/open-credit" className="empty-state-btn">
            Request Credit Evaluation
          </Link>
        </div>
      </>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={loading}
      className="dashboard-root"
    >
      <span className="sr-only">
        {loading ? "Loading dashboard" : "Dashboard loaded"}
      </span>

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Your credit overview at a glance</p>
        </div>
        {isConnected && (
          <div className="wallet-info">
            <CopyToClipboard
              value={wallet.publicKey}
              displayValue={truncAddr}
              ariaLabel="Copy connected wallet address"
              variant="surface"
              className="wallet-address-chip"
              valueClassName="wallet-address-value"
            />
             <span
               className={`network-badge ${wallet.network === "TESTNET" ? "testnet" : "mainnet"}`}
               title={
                 wallet.network === "TESTNET"
                   ? "Testnet (no real funds)"
                   : "Mainnet (real funds)"
               }
               aria-label={
                 wallet.network === "TESTNET"
                   ? "Testnet network (test funds)"
                   : "Mainnet network (real funds)"
               }
             >
               <span className="dot" />
               <span className="network-icon" aria-hidden="true">
                 {wallet.network === "TESTNET" ? "⚠️" : "✅"}
               </span>
               {wallet.network === "TESTNET" ? "Testnet" : "Mainnet"}
             </span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-cards" data-tour-target="summaryCards" aria-busy={loading}>
        {loading ? (
          <>
            <div className="summary-card skeleton-card">
              <Skeleton
                style={{
                  width: "60%",
                  height: "var(--space-3)",
                  marginBottom: "var(--space-4)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Skeleton
                style={{
                  width: "80%",
                  height: "var(--space-8)",
                  marginBottom: "var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Skeleton
                style={{ width: "40%", height: "var(--space-3)", borderRadius: "var(--radius-sm)" }}
              />
            </div>
            <div className="summary-card skeleton-card">
              <Skeleton
                style={{
                  width: "60%",
                  height: "var(--space-3)",
                  marginBottom: "var(--space-4)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Skeleton
                style={{
                  width: "80%",
                  height: "var(--space-8)",
                  marginBottom: "var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Skeleton
                style={{ width: "40%", height: "var(--space-3)", borderRadius: "var(--radius-sm)" }}
              />
            </div>
            <div className="summary-card skeleton-card">
              <Skeleton
                style={{
                  width: "60%",
                  height: "var(--space-3)",
                  marginBottom: "var(--space-4)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Skeleton
                style={{
                  width: "80%",
                  height: "var(--space-8)",
                  marginBottom: "var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Skeleton
                style={{ width: "40%", height: "var(--space-3)", borderRadius: "var(--radius-sm)" }}
              />
            </div>
          </>
        ) : (
          <>
            {/*
              v7 color-blind summary cards (closes #565):
              Each card carries a modifier class that drives the pattern
              stripe defined in src/styles/patterns.css.  Pattern alone
              (independent of colour) communicates card identity to a
              colour-blind user scanning the row.
            */}
            <div className="summary-card summary-card--accent">
              <div className="glow" style={{ background: COLOR.accent }} />
              <p className="label">
                Total Credit Limit
                <WhatChanged metricId="total-limit" currentValue={totalLimit} format="currency" label="Total Credit Limit" />
              </p>
              {/* num-tabular: prevents digit-width jitter as credit values change (FWC26) */}
              <p className="value num-tabular" style={{ color: COLOR.accent }}>
                {fmt(totalLimit)}
              </p>
              <p className="sub">
                Across {activeLinesOnly.length} active line
                {activeLinesOnly.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div
              className={`summary-card summary-card--util summary-card--util-${overallLevel}`}
            >
              <div
                className="glow"
                style={{ background: UTIL_COLOR[overallLevel] }}
              />
              <p className="label">
                Total Utilized
                <WhatChanged metricId="total-utilized" currentValue={totalUtilized} format="currency" label="Total Utilized" />
              </p>
              <p className="value num-tabular" style={{ color: UTIL_COLOR[overallLevel] }}>
                {fmt(totalUtilized)}
              </p>
              <p className="sub">{overallPct}% of total limit</p>
            </div>
            <div className="summary-card summary-card--available">
              <div className="glow" style={{ background: COLOR.success }} />
              <p className="label">
                Available Credit
                <WhatChanged metricId="available-credit" currentValue={totalAvailable} format="currency" label="Available Credit" />
              </p>
              <p className="value num-tabular" style={{ color: COLOR.success }}>
                {fmt(totalAvailable)}
              </p>
              <p className="sub">Ready to draw</p>
            </div>
          </>
        )}
      </div>

      {!loading && <ActivityFeed />}

      {!loading && hasLines && <ContinuePrompt creditLines={creditLines} />}

      <div className="dashboard-grid">
        <div>
          <div className="card" style={{ animationDelay: "0.1s" }}>
            <h2>
              <span className="icon">📊</span> Credit Summary
              {!loading && (
                <SyncIndicator
                  lastSyncedAt={creditSyncedAt}
                  onRefresh={handleCreditRefresh}
                  className="sync-indicator--card-header"
                />
              )}
            </h2>
            <div className="util-bar-container">
              <div className="util-bar-header">
                <span style={{ color: COLOR.muted }}>Utilization</span>
                {/* num-tabular: stable percentage display (FWC26) */}
                <span
                  className="num-tabular"
                  style={{ fontWeight: "var(--font-semibold)", color: UTIL_COLOR[overallLevel] }}
                >
                  {overallPct}%
                </span>
              </div>
              <div className="util-bar-track">
                {/*
                  v7 color-blind util bar (closes #565):
                  `util-fill--{level}` modifier drives the diagonal-stripe
                  (medium) / cross-hatch (high) overlay rendered by
                  src/styles/patterns.css.  The inline `background` colour
                  is preserved underneath.
                */}
                <div
                  className={`util-bar-fill util-fill--${overallLevel}`}
                  style={{
                    width: `${overallPct}%`,
                    background: UTIL_COLOR[overallLevel],
                  }}
                />
              </div>
            </div>
            <div className="credit-breakdown">
              <div className="credit-breakdown-item">
                <p className="cb-label">Total Limit</p>
                {/* num-tabular: stable breakdown amounts (FWC26) */}
                <p className="cb-value num-tabular" style={{ color: COLOR.accent }}>
                  {fmt(totalLimit)}
                </p>
              </div>
              <div className="credit-breakdown-item">
                <p className="cb-label">Utilized</p>
                <p
                  className="cb-value num-tabular"
                  style={{ color: UTIL_COLOR[overallLevel] }}
                >
                  {fmt(totalUtilized)}
                </p>
              </div>
              <div className="credit-breakdown-item">
                <p className="cb-label">Available</p>
                <p className="cb-value num-tabular" style={{ color: COLOR.success }}>
                  {fmt(totalAvailable)}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Score */}
          <div className="card" data-tour-target="riskGauge" style={{ animationDelay: '0.15s' }} aria-busy={loading}>
            <h2>
              <span className="icon">🛡️</span> Risk Score
              {!loading && (
                <button
                  ref={explainTriggerRef}
                  type="button"
                  onClick={() => setIsExplainOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isExplainOpen}
                  aria-label="Explain risk bands"
                  className="risk-explainer-trigger focus-ring"
                  data-testid="risk-explainer-trigger"
                  style={{
                    marginLeft: "auto",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-semibold)",
                    padding: "var(--space-1) var(--space-2)",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "1px solid var(--border, #30363d)",
                    color: "var(--muted, #8b949e)",
                    cursor: "pointer",
                    minHeight: "32px",
                  }}
                >
                  Explain
                </button>
              )}
            </h2>
            {loading ? (
              /* ── Risk-gauge skeleton ─────────────────────────────────────────
                 The final RiskGauge renders:
                   <svg viewBox="0 0 160 100" max-width:160px; height:auto>
                   Two .risk-meta-item rows side-by-side (label + value)

                 The skeleton mirrors the SVG's 160:100 aspect ratio with a
                 rounded-rectangle placeholder (not a circle — the arc spans
                 the full width).  Meta items use text-line heights matching
                 .rm-label (0.65rem) and .rm-value (0.85rem).
              ─────────────────────────────────────────────────────────────── */
              <div className="risk-gauge-container" aria-hidden="true">
                {/* SVG arc placeholder: 160px wide × 100px tall, rounded to match card radius */}
                <Skeleton
                  width="100%"
                  style={{ maxWidth: '160px', aspectRatio: '160 / 100', marginBottom: '0.75rem' }}
                  shape="rounded"
                />
                <div className="risk-meta" style={{ width: '100%' }}>
                  <div className="risk-meta-item" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                    {/* .rm-label — 0.65rem ≈ 10px cap height, block at 10px */}
                    <Skeleton width={40} height={10} shape="rounded" />
                    {/* .rm-value — 0.85rem ≈ 14px cap height, block at 14px */}
                    <Skeleton width={60} height={14} shape="rounded" />
                  </div>
                  <div className="risk-meta-item" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                    <Skeleton width={60} height={10} shape="rounded" />
                    <Skeleton width={50} height={14} shape="rounded" />
                  </div>
                </div>
              </div>
            ) : (
              <RiskGauge
                score={avgRiskScore}
                trend="improving"
                lastUpdated={activeLinesOnly[0]?.updatedAt ?? new Date().toISOString()}
              />
            )}
          </div>

           <div
             className="card"
             style={{ animationDelay: "0.2s" }}
             aria-busy={loading}
           >
             <h2>
               <span className="icon">💳</span> Active Credit Lines
               {!loading && (
                 <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                   {activeLines.length >= 2 && (
                     <button
                       ref={compareTriggerRef}
                       type="button"
                       onClick={handleOpenCompare}
                       disabled={selectedCompareLines.length !== 2}
                       className="focus-ring"
                       style={{
                         padding: "var(--space-1) var(--space-3)",
                         fontSize: "var(--text-xs)",
                         fontWeight: "var(--font-semibold)",
                         borderRadius: "var(--radius-sm)",
                         background: selectedCompareLines.length === 2 ? "var(--accent)" : "rgba(139,148,158,0.12)",
                         color: selectedCompareLines.length === 2 ? "#0d1117" : "var(--muted)",
                         border: "none",
                         cursor: selectedCompareLines.length === 2 ? "pointer" : "not-allowed",
                         opacity: selectedCompareLines.length === 2 ? 1 : 0.6,
                         transition: "all 0.15s",
                       }}
                     >
                       Compare Selected ({selectedCompareLines.length}/2)
                     </button>
                   )}
                   <span
                     style={{
                       fontSize: "var(--text-xs)",
                       fontWeight: 400,
                       color: COLOR.muted,
                     }}
                   >
                     {activeLines.length} line{activeLines.length !== 1 ? "s" : ""}
                   </span>
                 </div>
               )}
             </h2>
             {loading ? (
               /* ── Credit-line preview skeletons ──────────────────────────────
                  Final .cl-preview-item layout (min-height: 57px):
                    Left:  .cl-preview-name (0.875rem / 14px) + StatusBadge chip
                           .cl-preview-id   (0.7rem monospace / 11px)
                    Right: .cl-preview-amount (0.875rem / 14px)
                           .cl-preview-bar   (80px wide × 3px tall)

                  StatusBadge renders as a full-pill chip → shape="pill".
                  Name/amount/id rows use shape="rounded" text-line heights.
                  The mini utilisation bar is 3px tall → rounded bar.
               ────────────────────────────────────────────────────────────── */
               <>
                 <div className="cl-preview-item" aria-hidden="true">
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div
                       style={{
                         display: "flex",
                         alignItems: "center",
                         gap: "var(--space-2)",
                         marginBottom: "var(--space-1)",
                       }}
                     >
                       <Skeleton
                         style={{
                           width: "100px",
                           height: "var(--space-3)",
                           borderRadius: "2px",
                         }}
                       />
                       <Skeleton
                         style={{
                           width: "50px",
                           height: "var(--space-3)",
                           borderRadius: "var(--radius-sm)",
                         }}
                       />
                     </div>
                     {/* .cl-preview-id — 0.7rem mono / 11px, block at 10px */}
                     <Skeleton width={120} height={10} shape="rounded" />
                   </div>
                   <div
                     className="cl-preview-right"
                     style={{
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "flex-end",
                       gap: "var(--space-1)",
                     }}
                   >
                     <Skeleton
                       style={{
                         width: "80px",
                         height: "var(--space-3)",
                         borderRadius: "2px",
                       }}
                     />
                     <Skeleton
                       style={{
                         width: "60px",
                         height: "6px",
                         borderRadius: "2px",
                       }}
                     />
                   </div>
                 </div>
                 <div className="cl-preview-item" aria-hidden="true">
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div
                       style={{
                         display: "flex",
                         alignItems: "center",
                         gap: "var(--space-2)",
                         marginBottom: "var(--space-1)",
                       }}
                     >
                       <Skeleton
                         style={{
                           width: "80px",
                           height: "var(--space-3)",
                           borderRadius: "2px",
                         }}
                       />
                       <Skeleton
                         style={{
                           width: "50px",
                           height: "var(--space-3)",
                           borderRadius: "var(--radius-sm)",
                         }}
                       />
                     </div>
                     <Skeleton width={100} height={10} shape="rounded" />
                   </div>
                   <div
                     className="cl-preview-right"
                     style={{
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "flex-end",
                       gap: "var(--space-1)",
                     }}
                   >
                     <Skeleton
                       style={{
                         width: "70px",
                         height: "var(--space-3)",
                         borderRadius: "2px",
                       }}
                     />
                     <Skeleton
                       style={{
                         width: "50px",
                         height: "6px",
                         borderRadius: "2px",
                       }}
                     />
                   </div>
                 </div>
                 <div className="cl-preview-item" aria-hidden="true">
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div
                       style={{
                         display: "flex",
                         alignItems: "center",
                         gap: "var(--space-2)",
                         marginBottom: "var(--space-1)",
                       }}
                     >
                       <Skeleton
                         style={{
                           width: "90px",
                           height: "var(--space-3)",
                           borderRadius: "2px",
                         }}
                       />
                       <Skeleton
                         style={{
                           width: "50px",
                           height: "var(--space-3)",
                           borderRadius: "var(--radius-sm)",
                         }}
                       />
                     </div>
                     <Skeleton width={110} height={10} shape="rounded" />
                   </div>
                   <div
                     className="cl-preview-right"
                     style={{
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "flex-end",
                       gap: "var(--space-1)",
                     }}
                   >
                     <Skeleton
                       style={{
                         width: "60px",
                         height: "var(--space-3)",
                         borderRadius: "2px",
                       }}
                     />
                     <Skeleton
                       style={{
                         width: "40px",
                         height: "6px",
                         borderRadius: "2px",
                       }}
                     />
                   </div>
                 </div>
               </>
             ) : (
               <>
                 {activeLines.slice(0, 3).map((cl) => {
                   const pct = utilizationPct(cl.utilized, cl.limit);
                   const level = getUtilizationLevel(cl.utilized, cl.limit);
                   const isSelected = selectedCompareLines.includes(cl.id);
                   return (
                     <div key={cl.id} className="cl-preview-item">
                       {activeLines.length >= 2 && (
                         <div style={{ paddingRight: "0.75rem", display: "flex", alignItems: "center" }}>
                           <label
                             className="cl-row-select"
                             style={{
                               margin: 0,
                               display: "inline-flex",
                               alignItems: "center",
                               justifyContent: "center",
                               cursor: "pointer",
                               minWidth: "44px",
                               minHeight: "44px",
                             }}
                           >
                             <input
                               type="checkbox"
                               checked={isSelected}
                               onChange={() => toggleCompareSelection(cl.id)}
                               aria-label={`Select ${cl.name} for comparison`}
                               style={{
                                 cursor: "pointer",
                                 width: "16px",
                                 height: "16px",
                                 accentColor: "var(--accent)",
                               }}
                             />
                           </label>
                         </div>
                       )}
                       <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "0.2rem" }}>
                           <p className="cl-preview-name">{cl.name}</p>
                           <StatusBadge status={cl.status} />
                         </div>
                         <p className="cl-preview-id">{cl.id}</p>
                       </div>
                       <div className="cl-preview-right">
                         {/* num-tabular: stable utilized/limit amounts (FWC26) */}
                         <div className="cl-preview-amount num-tabular">
                           {fmt(cl.utilized)} <span style={{ color: COLOR.muted, fontWeight: 400, fontSize: "var(--text-xs)" }}>/ {fmt(cl.limit)}</span>
                         </div>
                         <div className="cl-preview-bar">
                           <div className="cl-preview-bar-fill" style={{ width: `${pct}%`, background: UTIL_COLOR[level] }} />
                         </div>
                       </div>
                     </div>
                   );
                 })}
                 <Link to="/credit-lines" className="view-all-link">
                   View all credit lines →
                 </Link>
               </>
             )}
           </div>
         </div>
 
         <div>
           <div className="card" style={{ animationDelay: "0.12s" }}>
             <h2><span className="icon">⚡</span> Quick Actions</h2>
             <div className="quick-actions-grid">
               {!hasLines && (
                 <button
                   className="qa-btn"
                   style={{ borderColor: "rgba(88,166,255,0.3)" }}
                 >
                   <div className="qa-icon" style={{ background: "rgba(88,166,255,0.12)", color: COLOR.accent }}>🆕</div>
                   <div>
                     <div className="qa-label" style={{ color: COLOR.accent }}>Open Credit Line</div>
                     <div className="qa-desc" style={{ color: COLOR.muted }}>Get started with your first line</div>
                   </div>
                   <span className="qa-arrow" style={{ color: COLOR.muted }}>→</span>
                 </button>
               )}
               {hasLines && activeLinesOnly.length > 0 && (
                 <button
                   className="qa-btn"
                   style={{ borderColor: "rgba(88,166,255,0.3)" }}
                 >
                   <div className="qa-icon" style={{ background: "rgba(88,166,255,0.12)", color: COLOR.accent }}>↗</div>
                   <div>
                     <div className="qa-label" style={{ color: COLOR.accent }}>Draw Credit</div>
                     <div className="qa-desc" style={{ color: COLOR.muted }}>{fmt(totalAvailable)} available</div>
                   </div>
                   <span className="qa-arrow" style={{ color: COLOR.muted }}>→</span>
                 </button>
               )}
               {hasUtilized && (
                 <button
                   className="qa-btn"
                   style={{ borderColor: "rgba(63,185,80,0.3)" }}
                 >
                   <div className="qa-icon" style={{ background: "rgba(63,185,80,0.12)", color: COLOR.success }}>↙</div>
                   <div>
                     <div className="qa-label" style={{ color: COLOR.success }}>Repay Credit</div>
                     <div className="qa-desc" style={{ color: COLOR.muted }}>{fmt(totalUtilized)} outstanding</div>
                   </div>
                   <span className="qa-arrow" style={{ color: COLOR.muted }}>→</span>
                 </button>
               )}
               <Link
                 to="/credit-lines"
                 className="qa-btn"
                 style={{ borderColor: "transparent", textDecoration: "none" }}
               >
                 <div className="qa-icon" style={{ background: "rgba(139,148,158,0.12)", color: COLOR.muted }}>📋</div>
                 <div>
                   <div className="qa-label" style={{ color: COLOR.text }}>View Credit Lines</div>
                   <div className="qa-desc" style={{ color: COLOR.muted }}>Manage all your credit lines</div>
                 </div>
                 <span className="qa-arrow" style={{ color: COLOR.muted }}>→</span>
               </Link>
                {hasLines && (
                  <CopyLoanButton creditLines={creditLines} />
                )}
             </div>
           </div>
 
           <div className="card" style={{ animationDelay: "0.18s" }} aria-busy={loading}>
             <h2>
               <span className="icon">📝</span> Recent Activity
               {!loading && (
                 <SyncIndicator
                   lastSyncedAt={activitySyncedAt}
                   onRefresh={handleActivityRefresh}
                   className="sync-indicator--card-header"
                 />
               )}
             </h2>
             {loading ? (
               /* ── Activity-item skeletons ───────────────────────────────────
                  Final .activity-item layout (min-height: 48px):
                    .activity-icon   — 28px × 28px, border-radius: 6px
                    .activity-title  — 0.825rem / 13px text
                    .activity-sub    — 0.725rem / 11px text
                    .activity-amount — 0.825rem / 13px text, right-aligned

                  Icon is 28×28 with 6px radius → shape="rectangular" (not
                  circular — final icons are square with rounded corners).
                  Title and sub use text-line heights at their rendered caps.
               ────────────────────────────────────────────────────────────── */
               <>
                 <div className="activity-item">
                   <Skeleton className="activity-icon" style={{ borderRadius: "6px" }} />
                   <div className="activity-content" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                     <Skeleton style={{ width: "120px", height: "var(--space-3)", borderRadius: "2px" }} />
                     <Skeleton style={{ width: "180px", height: "10px", borderRadius: "2px" }} />
                   </div>
                   <Skeleton style={{ width: "60px", height: "var(--space-3)", marginLeft: "auto", borderRadius: "2px" }} />
                 </div>
                 <div className="activity-item">
                   <Skeleton className="activity-icon" style={{ borderRadius: "6px" }} />
                   <div className="activity-content" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                     <Skeleton style={{ width: "100px", height: "var(--space-3)", borderRadius: "2px" }} />
                     <Skeleton style={{ width: "150px", height: "10px", borderRadius: "2px" }} />
                   </div>
                   <Skeleton style={{ width: "50px", height: "var(--space-3)", marginLeft: "auto", borderRadius: "2px" }} />
                 </div>
                 <div className="activity-item">
                   <Skeleton className="activity-icon" style={{ borderRadius: "6px" }} />
                   <div className="activity-content" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                     <Skeleton style={{ width: "140px", height: "var(--space-3)", borderRadius: "2px" }} />
                     <Skeleton style={{ width: "160px", height: "10px", borderRadius: "2px" }} />
                   </div>
                   <Skeleton style={{ width: "70px", height: "var(--space-3)", marginLeft: "auto", borderRadius: "2px" }} />
                 </div>
               </>
             ) : recentActivity.length === 0 ? (
               <p style={{ color: COLOR.muted, fontSize: "0.8rem", textAlign: "center", padding: "1.5rem 0" }}>
                 No transactions yet
               </p>
             ) : (
               recentActivity.map((tx, i) => (
                 <div key={`${tx.id}-${i}`} className="activity-item">
                   <div
                     className="activity-icon"
                     style={{
                       background: `${TX_COLOR[tx.type]}15`,
                       color: TX_COLOR[tx.type],
                     }}
                   >
                     {TX_ICON[tx.type]}
                   </div>
                   <div className="activity-content">
                     <div className="activity-title">{tx.note || tx.type}</div>
                     <div className="activity-sub">{tx.lineName} · {relativeTime(tx.date)}</div>
                   </div>
                   {/* num-tabular: stable transaction amounts (FWC26) */}
                   <div className="activity-amount num-tabular" style={{ color: TX_COLOR[tx.type] }}>
                     {tx.type === "Repay" ? "+" : "-"}{fmt(tx.amount)}
                   </div>
                 </div>
               ))
             )}
           </div>
 
           {notifications.length > 0 && (
             <div className="card" style={{ animationDelay: "0.22s" }}>
               <h2><span className="icon">🔔</span> Alerts</h2>
               {notifications.map((note, i) => (
                 <div 
                   key={i} 
                   className={`notification-item notification-item--${note.type}`}
                   role={note.type === "danger" ? "alert" : "status"}
                 >
                   <span className="notification-icon" aria-hidden="true">{note.icon}</span>
                   <div>
                     <div className="notification-text">
                       {note.content}
                     </div>
                     {note.time && (
                       <div className="notification-time">{relativeTime(note.time)}</div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>

        {/* Health Tips panel (preserved from orphan block; v7 keeps dashboard tree single-column inside grid) */}
        <HealthTipsPanel />
       </div>

      <DashboardTour />
      {/* Centered risk-band explainer overlay (#426).  Triggered by the
          "Explain risk bands" button rendered next to the risk gauge
          header.  The component manages its own focus trap, body scroll
          lock, and inert backdrop. */}
      <RiskExplainerOverlay
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        triggerRef={explainTriggerRef}
      />
    </div>
  );
}
