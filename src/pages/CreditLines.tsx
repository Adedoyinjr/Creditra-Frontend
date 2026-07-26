import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { RepaymentPlanChart } from '../components/RepaymentPlanChart';
import { Skeleton } from '../components/Skeleton';
import { KbdHint } from '../components/KbdHint';
import { CreditLineRowMenu } from '../components/CreditLineRowMenu';
import { formatCountdown, getCountdownAriaLabel } from '../utils/dates';
import {
  HealthFactorChart,
  buildHealthHistory,
  deriveHealthFactor,
} from '../components/HealthFactorChart';
import { MOCK_CREDIT_LINES } from '../data/mockData';
import type { CreditLineStatus, SortField, SortDirection } from '../types/creditLine';
import {
  COLOR,
  UTIL_COLOR,
  fmt,
  fmtDate,
  fmtDateTime,
  relativeTime,
  getUtilizationLevel,
  utilizationPct,
} from "../utils/tokens";
import "./CreditLines.css";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useInertBackdrop } from "../hooks/useInertBackdrop";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import CompareLinesPanel from "../components/CompareLinesPanel";
import { CollateralSubstitutionModal } from "../components/CollateralSubstitutionModal";
import { NoLines } from "../components/illustrations";
import {
  RepaymentSchedule,
  buildRepaymentScheduleFromLines,
} from "../components/RepaymentSchedule";
import { EmptyState } from "../components/EmptyState";

function NextAccrualChip({ target }: { target: string }) {
  const [now, setNow] = useState(() => new Date());
  const timerRef = { current: undefined as ReturnType<typeof setInterval> | undefined };

  useEffect(() => {
    const tick = () => setNow(new Date());

    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current !== undefined) {
          clearInterval(timerRef.current);
          timerRef.current = undefined;
        }
      } else {
        if (timerRef.current !== undefined) {
          clearInterval(timerRef.current);
        }
        tick();
        timerRef.current = setInterval(tick, 60000);
      }
    };

    if (!document.hidden) {
      timerRef.current = setInterval(tick, 60000);
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (timerRef.current !== undefined) {
        clearInterval(timerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const label = formatCountdown(target, now);
  const ariaLabel = getCountdownAriaLabel(target, now);

  return (
    <span className="cl-accrual-chip" aria-label={ariaLabel}>
      {label}
    </span>
  );
}

// ─── Credit Line Card ────────────────────────────────────────────────────────

function CreditLineCard({
  line,
  isSelected,
  onToggle,
  onSwapCollateral,
  onRepay,
  onSchedule,
  onDetails,
  onFreeze,
  onUnfreeze,
}: {
  line: (typeof MOCK_CREDIT_LINES)[0];
  isSelected: boolean;
  onToggle: () => void;
  onSwapCollateral?: (
    line: (typeof MOCK_CREDIT_LINES)[0],
    triggerRef: React.RefObject<HTMLButtonElement | null>,
  ) => void;
  onRepay?: () => void;
  onSchedule?: (lineId: string) => void;
  onDetails?: (lineId: string) => void;
  onFreeze?: (lineId: string) => void;
  onUnfreeze?: (lineId: string) => void;
}) {
  const pct = utilizationPct(line.utilized, line.limit);
  const level = getUtilizationLevel(line.utilized, line.limit);
  const swapTriggerRef = useRef<HTMLButtonElement>(null);

  const isDefaulted = line.status === 'Defaulted';
  const canFreeze = line.status === 'Active' || line.status === 'Frozen';

  return (
    <div
      className={`cl-card status-${line.status.toLowerCase()}${isDefaulted ? " cl-row--defaulted" : ""} focus-ring`}
      aria-label={
        isDefaulted ? `Credit line ${line.id} is defaulted` : undefined
      }
      tabIndex={0}
    >
       <div className="cl-card-header">
         <div className="cl-card-title-row">
           <label className="cl-row-select">
             <input
               type="checkbox"
               checked={isSelected}
               onChange={onToggle}
               aria-label={`Select ${line.name} for comparison`}
             />
             <span>Compare</span>
           </label>
           <div>
             <h3 className="cl-name">{line.name}</h3>
             <p className="cl-id">{line.id}</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <StatusBadge status={line.status} />
           <CreditLineRowMenu
             lineId={line.id}
             lineName={line.name}
             frozen={line.status === 'Frozen'}
             onRepay={onRepay}
             onFreeze={canFreeze ? onFreeze : undefined}
             onUnfreeze={canFreeze ? onUnfreeze : undefined}
             onSchedule={onSchedule}
             onDetails={onDetails}
           />
         </div>
       </div>

      <div className="cl-card-body">
        <div className="cl-metrics">
          <div className="cl-metric">
            <span className="cl-metric-label">Limit</span>
            <span className="cl-metric-value amount tabular-nums" style={{ color: COLOR.accent }}>
              {fmt(line.limit)}
            </span>
          </div>
          <div className="cl-metric">
            <span className="cl-metric-label">Utilized</span>
            <span
              className="cl-metric-value amount tabular-nums"
              style={{ color: UTIL_COLOR[level] }}
            >
              {fmt(line.utilized)}
            </span>
          </div>
          <div className="cl-metric">
            <span className="cl-metric-label">Available</span>
            <span className="cl-metric-value amount tabular-nums" style={{ color: COLOR.success }}>
              {fmt(line.limit - line.utilized)}
            </span>
          </div>
        </div>

        <div className="cl-util-bar">
          <div className="cl-util-header">
            <span>Utilization</span>
            <span className="num-tabular" style={{ color: UTIL_COLOR[level] }}>
              {pct}%
            </span>
          </div>
          <div className="cl-util-track">
            <div
              className="cl-util-fill"
              style={{ width: `${pct}%`, background: UTIL_COLOR[level] }}
            />
          </div>
        </div>

        <div className="cl-details">
          <div className="cl-detail">
            <span className="label">APR</span>
            <span className="value num-tabular">{line.apr}%</span>
          </div>
          <div className="cl-detail">
            <span className="label">Risk Score</span>
            <span className="value num-tabular">{line.riskScore}</span>
          </div>
          <div className="cl-detail">
            <span className="label">Opened</span>
            <span className="value">{fmtDate(line.openedAt)}</span>
          </div>
        </div>

        {line.nextInterestAccrualDate && (
          <div className="cl-accrual">
            <NextAccrualChip target={line.nextInterestAccrualDate} />
          </div>
        )}

        {(() => {
          const hf = deriveHealthFactor(line.limit, line.utilized);
          return (
            <HealthFactorChart
              lineName={line.name}
              current={hf}
              data={buildHealthHistory(hf)}
            />
          );
        })()}

        <div className="cl-last-activity">
          <LastActivityStamp
            timestamp={line.lastActivityAt ?? line.updatedAt}
          />
        </div>
      </div>

      <div className="cl-card-detail">
        <RepaymentPlanChart line={line} />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CreditLines({ defaultLoading = true }: { defaultLoading?: boolean }) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<CreditLineStatus | "all">(
    "all",
  );

  const [creditLines, setCreditLines] = useState(MOCK_CREDIT_LINES);
  const hasCreditLines = creditLines.length > 0;

  const [loading, setLoading] = useState(defaultLoading);
  useEffect(() => {
    if (!defaultLoading) return;
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [defaultLoading]);

  const [showCompare, setShowCompare] = useState(false);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [modalTarget, setModalTarget] = useState<{
    line: (typeof MOCK_CREDIT_LINES)[0];
    currentAsset: string;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
  } | null>(null);

  const handleModalClose = () => setModalTarget(null);
  const handleModalSuccess = (_incomingAsset: CollateralAsset) => {
    setModalTarget(null);
  };
  const handleSwapCollateral = (
    line: (typeof MOCK_CREDIT_LINES)[0],
    triggerRef: React.RefObject<HTMLButtonElement | null>,
  ) => {
    setModalTarget({
      line,
      currentAsset: "ETH",
      triggerRef,
    });
  };

  const handleRepay = (lineId: string) => {
    navigate(`/repay?line=${lineId}`);
  };

  const handleFreeze = (lineId: string) => {
    setCreditLines((prev) =>
      prev.map((cl) =>
        cl.id === lineId
          ? {
              ...cl,
              status: 'Frozen' as const,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...cl.statusHistory,
                { status: 'Frozen' as const, date: new Date().toISOString(), note: 'Frozen by user' },
              ],
            }
          : cl,
      ),
    );
  };

  const handleUnfreeze = (lineId: string) => {
    setCreditLines((prev) =>
      prev.map((cl) => {
        if (cl.id !== lineId) return cl;
        const lastNonFrozen = cl.statusHistory
          .filter((s) => s.status !== 'Frozen')
          .pop();
        const restoredStatus = lastNonFrozen?.status || 'Active';
        return {
          ...cl,
          status: restoredStatus,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...cl.statusHistory,
            { status: restoredStatus, date: new Date().toISOString(), note: 'Unfrozen by user' },
          ],
        };
      }),
    );
  };

  const handleSchedule = (lineId: string) => {
    console.log(`Schedule requested for ${lineId}`);
  };

  const handleDetails = (lineId: string) => {
    console.log(`Details requested for ${lineId}`);
  };

  const filteredAndSorted = useMemo(() => {
    let filtered =
      statusFilter === "all"
        ? creditLines
        : creditLines.filter((cl) => cl.status === statusFilter);

    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "limit":
          aVal = a.limit;
          bVal = b.limit;
          break;
        case "utilization":
          aVal = a.utilized / a.limit;
          bVal = b.utilized / b.limit;
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case "apr":
          aVal = a.apr;
          bVal = b.apr;
          break;
        case "riskScore":
          aVal = a.riskScore;
          bVal = b.riskScore;
          break;
      }

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDir === "asc"
        ? aVal - (bVal as number)
        : (bVal as number) - aVal;
    });
  }, [creditLines, sortField, sortDir, statusFilter]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleOpenCompare = () => {
    if (selectedLines.length === 2) {
      setShowCompare(true);
    }
  };

  const handleCloseCompare = () => {
    setShowCompare(false);
    setSelectedLines([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedLines((prev) => {
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
    triggerRef,
    onEscape: handleCloseCompare,
  });

  useInertBackdrop({ isInert: showCompare, modalId: "compare-lines-drawer" });
  useBodyScrollLock({ isLocked: showCompare });

  const selectedCreditLines = useMemo(
    () => creditLines.filter((line) => selectedLines.includes(line.id)),
    [creditLines, selectedLines],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        if (selectedLines.length === 2 && !showCompare) {
          e.preventDefault();
          handleOpenCompare();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (selectedLines.length === 2) {
          e.preventDefault();
          navigate(`/compare-credit-lines?a=${selectedLines[0]}&b=${selectedLines[1]}`);
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/open-credit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLines, showCompare, navigate]);

  return (
    <div className="credit-lines-page">
      <div className="cl-page-header">
        <div>
          <h1>Credit Lines</h1>
          <p className="subtitle">Manage your credit facilities</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            ref={triggerRef}
            className="cl-primary-btn focus-ring"
            onClick={handleOpenCompare}
            disabled={selectedLines.length !== 2}
            style={{ opacity: selectedLines.length === 2 ? 1 : 0.6, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>Compare Selected ({selectedLines.length}/2)</span>
            <KbdHint keys={['C']} description="Compare Selected" />
          </button>
          {/* Full-page compare — only enabled when exactly 2 lines are selected */}
          <Link
            to={
              selectedLines.length === 2
                ? `/compare-credit-lines?a=${selectedLines[0]}&b=${selectedLines[1]}`
                : '#'
            }
            className="cl-primary-btn focus-ring"
            aria-disabled={selectedLines.length !== 2}
            aria-label={
              selectedLines.length === 2
                ? 'Open full-page comparison for the two selected credit lines'
                : 'Select exactly 2 credit lines to open the full comparison page'
            }
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: selectedLines.length === 2 ? 'var(--text)' : 'var(--muted)',
              opacity: selectedLines.length === 2 ? 1 : 0.6,
              pointerEvents: selectedLines.length === 2 ? 'auto' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            tabIndex={selectedLines.length === 2 ? 0 : -1}
          >
            <span>Full Compare →</span>
            <KbdHint keys={['F']} description="Full Compare" />
          </Link>
          <Link 
            to="/open-credit" 
            className="cl-primary-btn focus-ring"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>+ Open New Line</span>
            <KbdHint keys={['N']} description="Open New Line" />
          </Link>
        </div>
      </div>

      <div className="cl-filters">
        <div className="cl-filter-group">
          <label>Status</label>
          <select
            className="focus-ring"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CreditLineStatus | "all")
            }
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Frozen">Frozen</option>
            <option value="Defaulted">Defaulted</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="cl-filter-group">
          <label>Sort By</label>
          <select
            className="focus-ring"
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
          >
            <option value="updatedAt">Last Updated</option>
            <option value="status">Status</option>
            <option value="limit">Credit Limit</option>
            <option value="utilization">Utilization</option>
            <option value="apr">APR</option>
            <option value="riskScore">Risk Score</option>
          </select>
        </div>
        <button
          className="cl-sort-dir focus-ring"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>

      {showCompare && selectedCreditLines.length === 2 && (
        <div
          id="compare-lines-drawer"
          ref={comparePanelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-lines-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: "flex",
            justifyContent: "flex-end",
            background: "rgba(15, 23, 42, 0.45)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              width: "min(480px, 100%)",
              height: "100%",
              position: "relative",
              zIndex: 1201,
            }}
          >
            <CompareLinesPanel
              lines={selectedCreditLines}
              onClose={handleCloseCompare}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="cl-grid" aria-busy="true" data-testid="creditlines-skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="cl-card" style={{ minHeight: '380px' }}>
              <div className="cl-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', padding: '1.25rem 1.25rem 0' }}>
                <div style={{ display: 'flex', gap: '0.75rem', width: '70%' }}>
                  <Skeleton width="18px" height="18px" style={{ borderRadius: '4px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    <Skeleton width="80%" height="18px" style={{ borderRadius: '4px' }} />
                    <Skeleton width="60%" height="12px" style={{ borderRadius: '4px' }} />
                  </div>
                </div>
                <Skeleton width="65px" height="20px" style={{ borderRadius: '4px', flexShrink: 0 }} />
              </div>
              <div className="cl-card-body" style={{ padding: '1rem 1.25rem' }}>
                <div className="cl-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Skeleton height="54px" style={{ borderRadius: '6px' }} />
                  <Skeleton height="54px" style={{ borderRadius: '6px' }} />
                  <Skeleton height="54px" style={{ borderRadius: '6px' }} />
                </div>
                <div className="cl-util-bar" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <Skeleton width="50px" height="10px" />
                    <Skeleton width="30px" height="10px" />
                  </div>
                  <Skeleton height="6px" style={{ borderRadius: '3px' }} />
                </div>
                <div className="cl-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Skeleton height="32px" style={{ borderRadius: '4px' }} />
                  <Skeleton height="32px" style={{ borderRadius: '4px' }} />
                  <Skeleton height="32px" style={{ borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Skeleton height="60px" style={{ borderRadius: '6px' }} />
                  <Skeleton height="80px" style={{ borderRadius: '6px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        !hasCreditLines ? (
          <EmptyState
            illustration={<NoLines className="empty-state-illustration--muted" />}
            title="Get started with Credit Lines"
            description={
              <>
                Credit lines give you access to flexible capital when you need it.
                Open your first line and unlock funding tailored to your business.
                <ul className="cl-empty-features" style={{ marginTop: '1rem', textAlign: 'left', display: 'inline-block' }}>
                  <li>Flexible funding up to $500K</li>
                  <li>Competitive rates from 7.5% APR</li>
                  <li>Quick approval with digital collateral</li>
                </ul>
              </>
            }
            primaryAction={{ label: 'Open Credit Line', to: '/open-credit' }}
          />
        ) : (
          <EmptyState
            illustration={<NoLines className="empty-state-illustration--muted" />}
            title="No matching credit lines"
            description="No credit lines match your current filter. Try a different status or adjust your sort to see more results."
            primaryAction={{
              label: 'Clear Filters',
              onClick: () => {
                setStatusFilter("all");
                setSortField("updatedAt");
                setSortDir("desc");
              }
            }}
          />
        )
      ) : (
        <div className="cl-grid">
          {filteredAndSorted.map((line) => (
            <CreditLineCard
              key={line.id}
              line={line}
              isSelected={selectedLines.includes(line.id)}
              onToggle={() => toggleSelection(line.id)}
              onSwapCollateral={handleSwapCollateral}
              onRepay={() => handleRepay(line.id)}
              onFreeze={handleFreeze}
              onUnfreeze={handleUnfreeze}
              onSchedule={() => handleSchedule(line.id)}
              onDetails={() => handleDetails(line.id)}
            />
          ))}
        </div>
      )}

      {/* ── Repayment Schedule (Issue #428) ───────────────────────────────
       * Aggregate, chronological timeline of every past installment AND
       * forward-looking payment across the user's credit lines. Renders
       * only when at least one credit line has schedule-relevant data
       * (transactions or a configured next payment). Built from the
       * existing mock data via the pure `buildRepaymentScheduleFromLines`
       * helper so the timeline updates as the upstream state changes. */}
      {filteredAndSorted.length > 0 && (
        <section
          className="cl-repayment-schedule"
          aria-labelledby="cl-repayment-schedule-heading"
        >
          <h2 id="cl-repayment-schedule-heading" className="cl-section-title">
            Repayment Schedule
          </h2>
          <p className="cl-section-subtitle">
            Past installments and upcoming payments across your credit lines.
          </p>
          <RepaymentSchedule
            schedule={buildRepaymentScheduleFromLines(filteredAndSorted)}
            title="All scheduled repayments"
          />
        </section>
      )}

      {/* Collateral substitution modal — mounted at page level so it overlays everything */}
      {modalTarget && (
        <CollateralSubstitutionModal
          isOpen
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          creditLineName={modalTarget.line.name}
          loanBalance={modalTarget.line.utilized}
          currentAsset={modalTarget.currentAsset}
          triggerRef={modalTarget.triggerRef}
        />
      )}
    </div>
  );
}
