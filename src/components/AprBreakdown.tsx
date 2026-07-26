import { ChevronDown } from 'lucide-react';
import { useState, useId, useEffect } from 'react';
import './AprBreakdown.css';

interface AprComponent {
  /** Label shown to the user */
  label: string;
  /** Rate in percentage points (e.g. 3.5 for 3.5%) */
  value: number;
  /** Color for the visual bar segment */
  color: string;
  /** Detailed explanation shown when expanded */
  explanation: string;
}

interface AprBreakdownProps {
  /** Total APR as a percentage (e.g. 12.5 for 12.5%) */
  totalApr: number;
  /** Individual components that sum to totalApr */
  components: AprComponent[];
  /** Optional CSS class */
  className?: string;
}

/**
 * AprBreakdown — Interactive explanation of APR components.
 *
 * Shows a visual breakdown of how the total APR is calculated
 * from its constituent parts (base rate, risk premium, platform fee, etc.).
 * Designed for borrowers who want to understand their loan costs.
 *
 * Features:
 * - Summary row with toggle button to show/hide breakdown
 * - Stacked bar chart showing component proportions
 * - Expandable explanations for each component
 * - Full WCAG 2.1 AA accessibility support
 * - Smooth animations with respect for prefers-reduced-motion
 * - Dark mode support
 */
export function AprBreakdown({ totalApr, components, className = '' }: AprBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const panelId = useId();
  const buttonId = useId();

  // Handle Escape key to close panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const formatPct = (value: number) => `${value.toFixed(2)}%`;

  const classes = ['apr-breakdown', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Summary row with toggle button */}
      <div className="apr-breakdown__summary">
        <div className="apr-breakdown__summary-content">
          <span className="apr-breakdown__summary-label">Your APR:</span>
          <span className="apr-breakdown__summary-value">{formatPct(totalApr)}</span>
        </div>
        <button
          id={buttonId}
          className="apr-breakdown__toggle"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <span className="apr-breakdown__toggle-text">Explain APR</span>
          <ChevronDown
            size={16}
            className="apr-breakdown__toggle-icon"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Breakdown panel - toggleable */}
      {isOpen && (
        <div
          id={panelId}
          className="apr-breakdown__panel"
          role="region"
          aria-label="APR breakdown details"
        >
          {/* Stacked bar chart */}
          <div className="apr-breakdown__chart">
            <div className="apr-breakdown__bar">
              {components.map((component, idx) => {
                const percentage = totalApr > 0 ? (component.value / totalApr) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="apr-breakdown__segment"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: component.color,
                    }}
                    aria-label={`${component.label}: ${formatPct(component.value)}`}
                    role="img"
                  />
                );
              })}
            </div>
          </div>

          {/* Component breakdown list */}
          <div className="apr-breakdown__components">
            {components.map((component, idx) => (
              <div key={idx} className="apr-breakdown__component">
                {/* Component header with color swatch */}
                <div className="apr-breakdown__component-header">
                  <div className="apr-breakdown__component-swatch">
                    <div
                      className="apr-breakdown__swatch-color"
                      style={{ backgroundColor: component.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="apr-breakdown__component-info">
                    <span className="apr-breakdown__component-label">
                      {component.label}
                    </span>
                    <span className="apr-breakdown__component-value">
                      {formatPct(component.value)}
                    </span>
                  </div>
                  <button
                    className="apr-breakdown__component-expand"
                    aria-expanded={expandedIndex === idx}
                    onClick={() =>
                      setExpandedIndex(expandedIndex === idx ? null : idx)
                    }
                    type="button"
                    aria-label={`${
                      expandedIndex === idx ? 'Collapse' : 'Expand'
                    } explanation for ${component.label}`}
                  >
                    <ChevronDown
                      size={16}
                      className="apr-breakdown__expand-icon"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {/* Expandable explanation */}
                {expandedIndex === idx && (
                  <div className="apr-breakdown__explanation">
                    <p className="apr-breakdown__explanation-text">
                      {component.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total summary row */}
          <div className="apr-breakdown__total">
            <span className="apr-breakdown__total-label">Total APR:</span>
            <span className="apr-breakdown__total-value">{formatPct(totalApr)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
