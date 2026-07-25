import React, { useState, useEffect, useRef, useMemo } from "react";
import { Sparkline } from "../components/Sparkline";
import { EmptyState } from "../components/EmptyState";
import { NoDataGraph } from "../components/illustrations/EmptyStateIllustrations";
import { COLOR, RISK_COLOR, fmtDate } from "../utils/tokens";
import { useReducedMotion } from "../context/ReducedMotionContext";

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
  score = 0,
  trend = "stable",
  lastUpdated = "",
  history,
  isEmpty = false,
  onRefresh,
}: {
  score?: number;
  trend?: "improving" | "declining" | "stable";
  lastUpdated?: string;
  history?: number[];
  /** When true, an empty-state illustration is shown instead of the gauge. */
  isEmpty?: boolean;
  /** Fired when the user clicks the "Check again" CTA on the empty state. */
  onRefresh?: () => void;
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
  const titleId = useRef(`risk-gauge-title-${Math.random().toString(36).slice(2)}`).current;
  const trendLabel = trend.charAt(0).toUpperCase() + trend.slice(1);

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

  // ── Empty state ──
  if (isEmpty) {
    return (
      <EmptyState
        illustration={<NoDataGraph />}
        eyebrow="Risk Score"
        title="No risk data available"
        description="Your risk score will appear here once your credit profile has been analyzed."
        tone="info"
        primaryAction={
          onRefresh
            ? { label: "Check again", onClick: onRefresh }
            : undefined
        }
      />
    );
  }

  const srDescription = `Risk score ${normalizedScore} of 850. Trend: ${trendLabel}.`;

  return (
    <div className="risk-gauge-container">
      {/* Screen-reader description outside the SVG for AT that skip inline <title>. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {srDescription}
      </p>
      <svg
        className="risk-gauge-svg"
        viewBox="0 0 160 100"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={srDescription}
        data-testid="risk-gauge-svg"
        data-reduced-motion={isReducedMotionActive ? "true" : "false"}
      >
        <title id={titleId}>{srDescription}</title>
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
