import { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { PayoffProjection } from '@/components/PayoffProjection';
import { RepaymentVisualizer } from '@/components/RepaymentVisualizer';
import { InlineHelpOverlay } from '@/components/InlineHelpOverlay';
import { EmptyState } from '@/components/EmptyState';
import { NoOutstandingDebt } from '@/components/illustrations';
import LiveRegion from '@/components/LiveRegion';
import { formatMoney, getRepayAmountValidation, requiresRepayConfirmation } from '@/utils/amountValidation';
import { suggestRepayAmount } from '@/utils/suggestRepay';
import { isTypedAmountMatch, TypedAmountConfirmField } from '@/components/TypedAmountConfirm';
import type { CreditLine } from '@/types/creditLine';
import { MOCK_CREDIT_LINES } from '@/data/mockData';
// Task cb-v7: pattern fills beyond color — import CSS so utilization bars and
// severity banners convey meaning via texture as well as hue (WCAG 1.4.1).
import '@/styles/patterns.css';

type RepayStep = 'input' | 'review' | 'success';

/**
 * SEVERITY_CONFIG — token-pinned colours for the inline feedback banner.
 *
 * Task tokens-v7: all border/bg/color values now reference CSS custom
 * properties defined in src/index.css so dark-mode and theming changes only
 * need to happen in one place.  The alpha-variant tokens (--accent-border,
 * --accent-tint, etc.) are already declared in :root.
 *
 * Task cb-v7: each severity also carries a `patternClass` that adds a CSS
 * pattern texture to the banner (see src/styles/patterns.css) so severity is
 * conveyed by shape AND colour, satisfying WCAG 1.4.1 (Use of Color).
 */
const SEVERITY_CONFIG = {
  info: {
    border: 'var(--accent-border)',
    bg: 'var(--accent-tint)',
    color: 'var(--accent)',
    patternClass: 'rp-severity--info',
    icon: <Info size={16} aria-hidden="true" />,
  },
  success: {
    border: 'var(--success-border)',
    bg: 'var(--success-tint)',
    color: 'var(--success)',
    patternClass: 'rp-severity--success',
    icon: <CheckCircle size={16} aria-hidden="true" />,
  },
  warning: {
    border: 'var(--warning-border)',
    bg: 'var(--warning-tint)',
    color: 'var(--warning)',
    patternClass: 'rp-severity--warning',
    icon: <AlertTriangle size={16} aria-hidden="true" />,
  },
  danger: {
    border: 'var(--error-border)',
    bg: 'var(--error-tint)',
    color: 'var(--error)',
    patternClass: 'rp-severity--danger',
    icon: <AlertCircle size={16} aria-hidden="true" />,
  },
} as const;

export default function RepayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('line');

  const [step, setStep] = useState<RepayStep>('input');
  const [selectedId, setSelectedId] = useState<string>(preselectedId ?? '');
  const [amountStr, setAmountStr] = useState('');
  const [confirmAmountStr, setConfirmAmountStr] = useState('');
  const [isAutoSchedule, setIsAutoSchedule] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  // Task ariallive-v7: centralised SR announcement for step transitions and
  // validation feedback.  The LiveRegion component renders this via
  // aria-live="polite" so screen readers pick it up without focus moves.
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const helpTriggerRef = useRef<HTMLButtonElement>(null);

  const creditLines = useMemo(
    () => MOCK_CREDIT_LINES.filter((cl) => cl.status === 'Active' && cl.utilized > 0),
    [],
  );

  const selectedLine = useMemo(
    () => MOCK_CREDIT_LINES.find((cl) => cl.id === selectedId) ?? null,
    [selectedId],
  );

  const walletBalance = 50000;

  const validation = useMemo(
    () =>
      selectedLine
        ? getRepayAmountValidation(amountStr, selectedLine.utilized, walletBalance)
        : null,
    [amountStr, selectedLine, walletBalance],
  );

  const suggestedAmount = useMemo(
    () =>
      selectedLine
        ? suggestRepayAmount(
            selectedLine.utilized,
            selectedLine.limit,
            walletBalance,
            selectedLine.apr,
            selectedLine.nextPaymentAmount,
          )
        : 0,
    [selectedLine, walletBalance],
  );

  const amount = validation?.amount ?? 0;
  const isInvalid = !validation?.isValid;
  const needsConfirm = requiresRepayConfirmation(amount);
  const isConfirmDisabled = needsConfirm && !isTypedAmountMatch(confirmAmountStr, amount);

  const activeTone = validation
    ? SEVERITY_CONFIG[validation.feedback.severity]
    : SEVERITY_CONFIG.info;

  const handlePercent = (pct: number) => {
    if (!validation) return;
    let target = (validation.maxRepayAmount * pct) / 100;
    if (target > walletBalance) target = walletBalance;
    setAmountStr(target.toFixed(2));
  };

  const handleSmartPay = () => {
    if (!selectedLine) return;
    setAmountStr(suggestedAmount.toFixed(2));
    setSrAnnouncement(`Smart Pay amount set: ${formatMoney(suggestedAmount)}`);
  };

  const handleReview = () => {
    if (!isInvalid && amount > 0) {
      setConfirmAmountStr('');
      setStep('review');
      // Announce the transition so SR users know they've moved to the review step.
      setSrAnnouncement(`Review step: repaying ${formatMoney(amount)}. Confirm or go back.`);
    }
  };

  const handleConfirm = () => {
    setStep('success');
    // Announce payment success immediately so SR users don't need to explore.
    setSrAnnouncement(`Payment successful! You repaid ${formatMoney(amount)}.`);
  };

  const handleNewRepay = () => {
    setAmountStr('');
    setIsAutoSchedule(false);
    setStep('input');
    setSrAnnouncement('Starting a new repayment. Select an amount.');
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('input');
      setSrAnnouncement('Back to input step. Edit your repayment amount.');
    } else if (!preselectedId) {
      setSelectedId('');
    } else {
      navigate(-1);
    }
  };

  if (!selectedLine) {
    return (
      // Task resp-v7: max-w-lg on mobile scales down more tightly than max-w-2xl;
      // px-4 on all viewports, wider padding introduced at sm via sm:px-6.
      <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:px-6">
        {/* Task ariallive-v7: always-mounted live region at top of page */}
        <LiveRegion message={srAnnouncement} />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <header className="mt-4">
          <p className="text-xs font-semibold uppercase text-muted">Repay Credit</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Select a credit line to repay
          </h1>
        </header>

        {creditLines.length === 0 ? (
          // Themed empty state (issue #581): no repayable balances yet.
          // The illustration + headline announce the situation; CTAs nudge
          // the user toward either opening a new line or returning home.
          <EmptyState
            data-testid="repay-empty-state"
            tone="success"
            eyebrow="All caught up"
            illustration={
              <NoOutstandingDebt className="empty-state-illustration--muted" />
            }
            title="Nothing to repay right now"
            description="You don\u2019t have any active credit lines with an outstanding balance. Make a new draw or come back later when a repayment is scheduled."
            primaryAction={{
              label: 'Request a credit line',
              to: '/open-credit',
            }}
            secondaryAction={{
              label: 'Back to dashboard',
              to: '/',
            }}
          />
        ) : (
          <div className="mt-4 space-y-3">
            {creditLines.map((cl) => {
              const utilization = Math.round((cl.utilized / cl.limit) * 100);
              // Task cb-v7: map utilization level to pattern class so the bar
              // conveys severity via texture, not colour alone (WCAG 1.4.1).
              const barClass =
                utilization > 80
                  ? 'rp-progress--high'
                  : utilization > 50
                    ? 'rp-progress--medium'
                    : 'rp-progress--low';
              return (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(cl.id);
                    setSrAnnouncement(`Selected ${cl.name}. ${formatMoney(cl.utilized)} outstanding.`);
                  }}
                  className="w-full rounded-lg border border-border bg-surface p-4 text-left transition-all hover:border-accent hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{cl.name}</p>
                      <p className="mt-0.5 text-sm text-muted">{cl.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatMoney(cl.utilized)}
                      </p>
                      <p className="text-sm text-muted">{utilization}% utilized</p>
                    </div>
                  </div>
                  {/* Task cb-v7: pattern fill on progress bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all ${barClass}`}
                      style={{ width: `${utilization}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const oldPct = Math.round((selectedLine.utilized / selectedLine.limit) * 100);
  const remainingDebt = validation?.remainingDebt ?? selectedLine.utilized;
  const newPct = Math.round((remainingDebt / selectedLine.limit) * 100);

  return (
    // Task resp-v7: narrower horizontal padding on xs (px-4), wider at sm
    // (sm:px-6); vertical padding tighter on mobile (py-4) and relaxed at sm.
    // max-w-4xl stays but the page no longer bleeds edge-to-edge on narrow
    // viewports because the outer px already provides breathing room.
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-8">
      {/* Task ariallive-v7: always-mounted live region at the top of the page
          so the browser registers it before any dynamic content is injected.
          Announcing step changes (input→review→success) and Smart Pay fills. */}
      <LiveRegion message={srAnnouncement} />

      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {step === 'input' ? 'Back to credit lines' : 'Back to input'}
      </button>

      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted">
            {step === 'success' ? 'Repayment Complete' : 'Repay Credit'}
          </p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {step === 'success'
              ? 'Payment successful!'
              : step === 'review'
                ? 'Review your repayment'
                : 'Make a repayment'}
          </h1>
          {step !== 'success' && (
            <p className="text-sm text-muted">
              {selectedLine.name} &middot; {selectedLine.apr}% APR
            </p>
          )}
        </header>

        {step === 'input' && (
          <>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase text-muted">
                Current debt
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {formatMoney(selectedLine.utilized)}
              </p>
              {/* Task cb-v7: pattern class on the bar in addition to colour */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all ${
                    oldPct > 80
                      ? 'rp-progress--high'
                      : oldPct > 50
                        ? 'rp-progress--medium'
                        : 'rp-progress--low'
                  }`}
                  style={{ width: `${oldPct}%` }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                {oldPct}% of {formatMoney(selectedLine.limit)} limit
              </p>
            </div>

            {/* Task resp-v7: column layout triggers at md (768 px) instead of lg
                (1024 px) so the aside doesn't stack on tablet viewports where
                there's enough room for a two-column layout. */}
            <div className="grid gap-6 md:grid-cols-[1fr_320px] md:items-start lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="repay-amount"
                      className="text-sm font-semibold text-foreground"
                    >
                      Amount to repay
                    </label>
                    <span className="text-xs text-muted">
                      Wallet: {formatMoney(walletBalance)}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercent(pct)}
                        className="flex-1 rounded-md border border-accent/30 px-2 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        aria-label={`Set amount to ${pct === 100 ? 'maximum' : `${pct} percent`}`}
                      >
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleSmartPay}
                      className="flex-1 rounded-md border border-success/30 px-2 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
                      aria-label={`Smart Pay suggested repayment of ${formatMoney(suggestedAmount)}`}
                    >
                      Smart Pay
                    </button>
                  </div>

                  <div className="relative mt-3">
                    <span
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted"
                      aria-hidden="true"
                    >
                      $
                    </span>
                    <input
                      id="repay-amount"
                      type="number"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="0.00"
                      min={1}
                      step={0.01}
                      aria-invalid={validation?.feedback.severity === 'danger' || undefined}
                      className="w-full rounded-lg border bg-background px-3 py-3 pl-8 text-lg font-semibold text-foreground outline-none transition-colors focus:ring-2 focus:ring-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      style={{
                        // Task tokens-v7: token-referenced colors only — no raw hex.
                        borderColor:
                          validation?.feedback.severity === 'danger'
                            ? 'var(--error)'
                            : validation?.feedback.severity === 'warning'
                              ? 'var(--warning)'
                              : amount > 0
                                ? 'var(--accent)'
                                : 'var(--border)',
                      }}
                    />
                  </div>

                  {/* Task cb-v7: patternClass adds a subtle background texture
                      so severity is distinguishable without colour alone.
                      Task tokens-v7: border/bg/color reference CSS tokens. */}
                  <div
                    className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${activeTone.patternClass}`}
                    style={{
                      border: `1px solid ${activeTone.border}`,
                      background: activeTone.bg,
                      color: activeTone.color,
                    }}
                    role={validation?.feedback.severity === 'danger' ? 'alert' : 'status'}
                    aria-live="polite"
                  >
                    <span className="mt-0.5 inline-flex shrink-0">
                      {activeTone.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {validation?.feedback.title ?? ''}
                      </p>
                      <p className="mt-0.5 text-xs opacity-80">
                        {validation?.feedback.message ?? ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs font-semibold uppercase text-muted">
                    Preview
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Remaining debt</span>
                      <span
                        className={`font-semibold ${
                          amount > 0 && remainingDebt === 0
                            ? 'text-success'
                            : 'text-foreground'
                        }`}
                      >
                        {formatMoney(remainingDebt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">New utilization</span>
                      <span className="font-semibold text-foreground">
                        {newPct}%
                        <span className="ml-1.5 text-muted line-through">
                          {oldPct}%
                        </span>
                      </span>
                    </div>
                    {/* Task cb-v7: ghost bar uses rp-progress--ghost (30% opacity
                        overlay) and the live bar uses the pattern class so both
                        old and new utilization are told apart without colour. */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full rp-progress--ghost transition-all"
                        style={{ width: `${oldPct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all ${
                          remainingDebt === 0
                            ? 'rp-progress--low'
                            : newPct > 80
                              ? 'rp-progress--high'
                              : newPct > 50
                                ? 'rp-progress--medium'
                                : 'rp-progress--low'
                        }`}
                        style={{ width: `${newPct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <label
                        htmlFor="auto-schedule-toggle"
                        className="text-sm font-medium text-foreground cursor-pointer"
                        onClick={() => setIsAutoSchedule(!isAutoSchedule)}
                      >
                        Auto-schedule
                      </label>
                      <p className="text-xs text-muted">Repeat this payment monthly</p>
                    </div>
                    <button
                      id="auto-schedule-toggle"
                      type="button"
                      role="switch"
                      aria-checked={isAutoSchedule}
                      onClick={() => setIsAutoSchedule(!isAutoSchedule)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isAutoSchedule ? 'bg-accent' : 'bg-border'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isAutoSchedule ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={isInvalid || amount <= 0}
                    className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Review Repayment
                  </button>
                </div>
              </div>

              {/* Task resp-v7: sticky top adjusted so the aside doesn't hide
                  behind the fixed header (60px) on tablet/desktop. */}
              <aside className="md:sticky md:top-[4.5rem]">
                <PayoffProjection
                  currentDebt={selectedLine.utilized}
                  apr={selectedLine.apr}
                  repayAmount={amount}
                  limit={selectedLine.limit}
                  nextPaymentAmount={selectedLine.nextPaymentAmount}
                />
              </aside>
            </div>

            <RepaymentVisualizer
              principal={selectedLine.utilized}
              apr={selectedLine.apr}
              monthlyPayment={
                selectedLine.nextPaymentAmount ??
                Math.max(
                  selectedLine.utilized * 0.025,
                  selectedLine.utilized * (selectedLine.apr / 100 / 12),
                )
              }
            />

            <div className="flex items-center justify-between">
              <button
                ref={helpTriggerRef}
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="rounded-md text-sm font-semibold text-blue-300 underline-offset-4 transition-colors hover:text-blue-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                I need help
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-md text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted">You are about to repay</p>
              <p className="mt-2 text-4xl font-bold text-foreground">
                {formatMoney(amount)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Remaining debt after</span>
                  <span
                    className={`font-semibold ${
                      remainingDebt === 0 ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {formatMoney(remainingDebt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Wallet balance</span>
                  <span className="font-semibold text-success">
                    {formatMoney(walletBalance)}
                  </span>
                </div>
                {isAutoSchedule && (
                  <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                    <span className="text-muted">Auto-schedule</span>
                    <span className="font-semibold text-accent">Monthly</span>
                  </div>
                )}
              </div>
            </div>

            <PayoffProjection
              currentDebt={selectedLine.utilized}
              apr={selectedLine.apr}
              repayAmount={amount}
              limit={selectedLine.limit}
              nextPaymentAmount={selectedLine.nextPaymentAmount}
            />

            {needsConfirm && (
              <TypedAmountConfirmField
                amount={amount}
                value={confirmAmountStr}
                onChange={setConfirmAmountStr}
                idPrefix="repay-page-confirm"
              />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                aria-disabled={isConfirmDisabled || undefined}
                className="flex-[2] rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Repayment
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
              <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">
                You repaid {formatMoney(amount)}!
              </h2>
              <p className="mt-1 text-muted">
                Your transaction was successful.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Remaining debt</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(remainingDebt)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">Credit line utilization</span>
                <span className="font-semibold text-foreground">
                  Reduced to {newPct}%
                </span>
              </div>
              {isAutoSchedule && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted">Auto-schedule</span>
                  <span className="font-semibold text-accent">Active</span>
                </div>
              )}
            </div>

            <PayoffProjection
              currentDebt={selectedLine.utilized}
              apr={selectedLine.apr}
              repayAmount={amount}
              limit={selectedLine.limit}
              nextPaymentAmount={selectedLine.nextPaymentAmount}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                onClick={handleNewRepay}
                className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Make another repayment
              </button>
            </div>
          </div>
        )}
      </div>

      <InlineHelpOverlay
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        triggerRef={helpTriggerRef}
      />
    </div>
  );
}
