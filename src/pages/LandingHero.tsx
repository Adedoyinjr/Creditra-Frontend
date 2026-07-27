import { useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { getHeroCopy, getVariant, VariantId } from "../copy/landing";
import type { CreditLineStatus } from "../types/creditLine";
import "../styles/patterns.css";
import "../components/LandingPage.css";

/** Visual & non-color cues mapped to each credit line status for color-blind accessibility */
export interface StatusChipConfig {
  status: CreditLineStatus;
  label: string;
  cue: string;
  patternClass: string;
  chipClass: string;
  description: string;
}

export const HERO_STATUS_CONFIGS: Record<CreditLineStatus, StatusChipConfig> = {
  Active: {
    status: "Active",
    label: "Active",
    cue: "A",
    patternClass: "status-pattern--active",
    chipClass: "landing-hero-status-chip--active",
    description: "Credit line is fully active with healthy performance.",
  },
  Suspended: {
    status: "Suspended",
    label: "Suspended",
    cue: "!",
    patternClass: "status-pattern--suspended",
    chipClass: "landing-hero-status-chip--suspended",
    description: "Line temporarily suspended pending repayment activity.",
  },
  Frozen: {
    status: "Frozen",
    label: "Frozen",
    cue: "F",
    patternClass: "status-pattern--frozen",
    chipClass: "landing-hero-status-chip--frozen",
    description: "Line administratively frozen; drawing disabled.",
  },
  Defaulted: {
    status: "Defaulted",
    label: "Defaulted",
    cue: "X",
    patternClass: "status-pattern--defaulted",
    chipClass: "landing-hero-status-chip--defaulted",
    description: "Line in default state; immediate action required.",
  },
  Closed: {
    status: "Closed",
    label: "Closed",
    cue: "C",
    patternClass: "status-pattern--closed",
    chipClass: "landing-hero-status-chip--closed",
    description: "Line closed after full settlement.",
  },
};

export interface LandingHeroProps {
  /** Optional variant ID override for A/B testing copy. */
  variantId?: VariantId;
  /** Initial selected status for demo/interactive state. Defaults to 'Active'. */
  initialStatus?: CreditLineStatus;
  /** Callback invoked when a user clicks/selects a status chip. */
  onStatusSelect?: (status: CreditLineStatus) => void;
  /** Optional custom class name applied to container section. */
  className?: string;
}

/**
 * LandingHero component for Creditra landing page.
 *
 * Implements WCAG 2.1 AA color-blind safe status chips (Issue #682) by pairing:
 * 1. Design-token surface tints
 * 2. Distinct background SVG/gradient pattern overlays (.status-pattern--*)
 * 3. Enclosed text glyph cues ('A', '!', 'F', 'X', 'C')
 * 4. Explicit screen reader announcements via role="status" and aria-label
 */
export function LandingHero({
  variantId,
  initialStatus = "Active",
  onStatusSelect,
  className = "",
}: LandingHeroProps) {
  const reduceMotion = usePrefersReducedMotion();
  const activeVariant = variantId ?? getVariant();
  const heroCopy = getHeroCopy(activeVariant);

  const [currentStatus, setCurrentStatus] = useState<CreditLineStatus>(initialStatus);

  const handleChipClick = (status: CreditLineStatus) => {
    setCurrentStatus(status);
    onStatusSelect?.(status);
  };

  const activeConfig = HERO_STATUS_CONFIGS[currentStatus];

  return (
    <section
      className={`landing-section landing-hero relative overflow-hidden ${className}`}
      aria-labelledby="landing-hero-title"
    >
      <div className="max-w-300 mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Left Column: Hero Text & CTAs */}
        <div className="space-y-6">
          <h1 id="landing-hero-title" className="landing-hero__title">
            {heroCopy.title}
          </h1>
          <p className="landing-hero__copy">{heroCopy.subtitle}</p>
          <div className="landing-hero__actions">
            <button
              type="button"
              className="landing-button landing-button--primary"
            >
              {heroCopy.primaryCta}
            </button>
            <a
              href="#how"
              className="landing-button landing-button--secondary"
            >
              {heroCopy.secondaryCta}
            </a>
          </div>
        </div>

        {/* Right Column: Adaptive Credit Card Preview with Status Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.8 }}
          className="landing-hero-card flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#8b949e] font-medium text-sm">
                Dynamic Credit Limit
              </span>

              {/* Status Chip Indicator */}
              <span
                role="status"
                aria-live="polite"
                aria-label={`Credit line status: ${activeConfig.label}. ${activeConfig.description}`}
                className={`landing-hero-status-chip ${activeConfig.chipClass} ${activeConfig.patternClass}`}
                title={`Status: ${activeConfig.label}`}
              >
                <span
                  className="landing-hero-status-chip__cue"
                  aria-hidden="true"
                >
                  {activeConfig.cue}
                </span>
                <span>{activeConfig.label}</span>
              </span>
            </div>

            {/* Credit limit progress bar */}
            <div
              className="w-full h-4 bg-[#21262d] rounded overflow-hidden"
              role="progressbar"
              aria-valuenow={currentStatus === "Defaulted" ? 10 : 85}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Adaptive credit limit preview"
            >
              <motion.div
                initial={{ width: reduceMotion ? "85%" : "20%" }}
                animate={{
                  width:
                    currentStatus === "Defaulted"
                      ? "10%"
                      : currentStatus === "Suspended" || currentStatus === "Frozen"
                      ? "45%"
                      : currentStatus === "Closed"
                      ? "0%"
                      : "85%",
                }}
                transition={{ duration: reduceMotion ? 0 : 0.5 }}
                className={`h-4 rounded ${
                  currentStatus === "Active"
                    ? "bg-[#3fb950]"
                    : currentStatus === "Suspended"
                    ? "bg-[#d29922]"
                    : currentStatus === "Defaulted"
                    ? "bg-[#f85149]"
                    : currentStatus === "Frozen"
                    ? "bg-[#58a6ff]"
                    : "bg-[#8b949e]"
                }`}
              />
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-semibold text-white">
                  {currentStatus === "Closed"
                    ? "$0"
                    : currentStatus === "Defaulted"
                    ? "$5,000"
                    : "$48,750"}
                </p>
                <p className="text-xs text-[#8b949e] mt-1">
                  {activeConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Color-Blind Safe Status Chips Selector */}
          <div className="mt-8 pt-4 border-t border-[#21262d]">
            <p className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider mb-2">
              Color-Blind Safe Status Demo
            </p>
            <div
              className="landing-hero-status-chips"
              role="group"
              aria-label="Select credit line status mode"
            >
              {(Object.keys(HERO_STATUS_CONFIGS) as CreditLineStatus[]).map(
                (statusKey) => {
                  const cfg = HERO_STATUS_CONFIGS[statusKey];
                  const isSelected = currentStatus === statusKey;

                  return (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => handleChipClick(statusKey)}
                      aria-pressed={isSelected}
                      aria-label={`Select status: ${cfg.label}`}
                      className={`landing-hero-status-chip ${cfg.chipClass} ${
                        cfg.patternClass
                      } ${isSelected ? "ring-2 ring-white/30" : "opacity-80 hover:opacity-100"}`}
                    >
                      <span
                        className="landing-hero-status-chip__cue"
                        aria-hidden="true"
                      >
                        {cfg.cue}
                      </span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LandingHero;
