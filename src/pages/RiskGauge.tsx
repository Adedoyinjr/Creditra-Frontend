import React, { useState, useEffect, useRef, useMemo } from "react";
import { Sparkline } from "../components/Sparkline";
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

  return (
    <div className="risk-gauge-container">
      <svg className="risk-gauge-svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid meet">
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
