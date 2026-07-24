/**
 * CreditLineSelector
 *
 * Step 1 of the draw-credit flow. Renders a list of available credit lines
 * for the user to choose from.
 *
 * Design-token classes used (all from `src/index.css` `.dc-*` block):
 *   dc-credit-line-list, dc-credit-line-item, dc-credit-line-item__name,
 *   dc-credit-line-item__meta, dc-credit-line-item__label,
 *   dc-credit-line-item__value, dc-credit-line-item__value--warning,
 *   dc-credit-line-item__warning-badge, dc-progress-track, dc-progress-bar,
 *   dc-progress-bar--warning, dc-chevron
 *
 * Accessibility:
 *   - Each button has an aria-label describing the credit line and available balance.
 *   - Utilization progress bar is a <div role="progressbar"> with aria-valuenow/min/max.
 *   - High-utilization badge has role="status" so it is announced by screen readers.
 */

import { CreditLine } from "@/types/draw-credit.types";
import { AlertCircle, ChevronRight } from "lucide-react";

interface CreditLineSelectorProps {
  creditLines: CreditLine[];
  onSelect: (creditLine: CreditLine) => void;
}

export function CreditLineSelector({
  creditLines,
  onSelect,
}: CreditLineSelectorProps) {
  return (
    <div className="dc-step">
      {/* Step header */}
      <div>
        <h2 className="dc-step__title">Select Credit Line</h2>
        <p className="dc-step__subtitle">
          Choose which line of credit to draw from
        </p>
      </div>

      {/* Credit-line list */}
      <ul className="dc-credit-line-list" role="list">
        {creditLines.map((line) => {
          const isHighUtilization = line.utilization > 80;

          return (
            <li key={line.id}>
              <button
                onClick={() => onSelect(line)}
                className="dc-credit-line-item"
                aria-label={`Select ${line.name} credit line, available balance $${line.available.toLocaleString()}`}
              >
                <div className="dc-credit-line-item__inner">
                  <div className="dc-credit-line-item__body">
                    {/* Name */}
                    <div className="dc-credit-line-item__name">{line.name}</div>

                    {/* Meta row: available, utilization, warning badge */}
                    <div className="dc-credit-line-item__meta">
                      <div>
                        <span className="dc-credit-line-item__label">
                          Available:
                        </span>
                        <span className="dc-credit-line-item__value">
                          ${line.available.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="dc-credit-line-item__label">
                          Utilization:
                        </span>
                        <span
                          className={
                            isHighUtilization
                              ? "dc-credit-line-item__value--warning"
                              : "dc-credit-line-item__value"
                          }
                        >
                          {line.utilization}%
                        </span>
                      </div>

                      {/* High-utilization badge — announced as a status region */}
                      {isHighUtilization && (
                        <div
                          className="dc-credit-line-item__warning-badge"
                          role="status"
                        >
                          <AlertCircle
                            className="dc-banner__icon"
                            aria-hidden="true"
                          />
                          <span>High utilization</span>
                        </div>
                      )}
                    </div>

                    {/* Utilization progress bar */}
                    <div
                      className="dc-progress-track"
                      role="progressbar"
                      aria-valuenow={line.utilization}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${line.name} utilization: ${line.utilization}%`}
                    >
                      <div
                        className={`dc-progress-bar${isHighUtilization ? " dc-progress-bar--warning" : ""}`}
                        style={{ width: `${line.utilization}%` }}
                      />
                    </div>
                  </div>

                  {/* Chevron — colour handled by CSS hover rule on parent */}
                  <ChevronRight
                    className="dc-chevron"
                    width={20}
                    height={20}
                    aria-hidden="true"
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
