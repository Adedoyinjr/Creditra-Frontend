import type {
  DrawWizardMicroStepId,
  MicroIndicatorTone,
} from "@/lib/draw-wizard-micro-progress";
import "./DrawWizardMicroProgress.css";

interface DrawWizardMicroIndicatorProps {
  stepId: DrawWizardMicroStepId;
  tone: MicroIndicatorTone;
  label: string;
}

/**
 * Compact inline validity chip rendered beneath a wizard step header.
 * Uses semantic tokens only (--success, --warning, --muted).
 */
export function DrawWizardMicroIndicator({
  stepId,
  tone,
  label,
}: DrawWizardMicroIndicatorProps) {
  return (
    <p
      className="draw-wizard-micro-indicator"
      data-step={stepId}
      data-tone={tone}
      data-testid={`draw-micro-indicator-${stepId}`}
      id={`draw-wizard-micro-${stepId}`}
    >
      <span className="draw-wizard-micro-indicator__icon" aria-hidden="true" />
      <span className="draw-wizard-micro-indicator__text">{label}</span>
    </p>
  );
}
