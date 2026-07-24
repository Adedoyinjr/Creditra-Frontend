import { useEffect, useRef } from "react";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import {
  buildMicroProgressAnnouncement,
  computeDrawWizardMicroProgress,
  type DrawWizardMicroProgressInput,
  type DrawWizardMicroStepState,
} from "@/lib/draw-wizard-micro-progress";

const ANNOUNCEMENT_DEBOUNCE_MS = 300;

/**
 * Derives per-step micro-progress states and a debounced polite announcement
 * string when any step's validity changes.
 */
export function useDrawWizardMicroProgress(input: DrawWizardMicroProgressInput): {
  steps: DrawWizardMicroStepState[];
  debouncedAnnouncement: string;
} {
  const steps = computeDrawWizardMicroProgress(input);
  const previousRef = useRef<DrawWizardMicroStepState[] | null>(null);
  const announcement = buildMicroProgressAnnouncement(previousRef.current, steps);

  useEffect(() => {
    previousRef.current = steps;
  });

  const debouncedAnnouncement = useDebounceValue(
    announcement,
    ANNOUNCEMENT_DEBOUNCE_MS,
  );

  return { steps, debouncedAnnouncement };
}
