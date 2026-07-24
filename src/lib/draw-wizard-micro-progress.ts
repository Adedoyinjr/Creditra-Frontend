import { CreditLine } from "@/types/draw-credit.types";
import { getDrawAmountValidation } from "@/utils/amountValidation";

/** Semantic tone for a step micro-indicator — maps to --muted, --warning, --success. */
export type MicroIndicatorTone = "muted" | "warning" | "success";

export type DrawWizardMicroStepId = "select" | "amount" | "preview" | "confirm";

export interface DrawWizardMicroStepState {
  id: DrawWizardMicroStepId;
  tone: MicroIndicatorTone;
  /** Compact visible label shown beneath the step header. */
  label: string;
  /** Plain-language string for aria-live announcements on state change. */
  announcement: string;
}

export interface DrawWizardMicroProgressInput {
  selectedCreditLine: CreditLine | null;
  /** Whole-dollar draw amount from the wizard (0 when unset). */
  amount: number;
  /** Whether the user has ticked the confirmation checkbox on the confirm step. */
  confirmationAcknowledged: boolean;
  /** True when the confirm step is the active wizard screen. */
  isOnConfirmStep: boolean;
}

function selectStepState(line: CreditLine | null): DrawWizardMicroStepState {
  if (line) {
    return {
      id: "select",
      tone: "success",
      label: "Line selected",
      announcement: `Select line: ${line.name} chosen.`,
    };
  }

  return {
    id: "select",
    tone: "muted",
    label: "Select a line",
    announcement: "Select line: waiting for credit line selection.",
  };
}

function amountStepState(
  line: CreditLine | null,
  amount: number,
): DrawWizardMicroStepState {
  if (!line) {
    return {
      id: "amount",
      tone: "muted",
      label: "Amount pending",
      announcement: "Amount: waiting for credit line.",
    };
  }

  if (amount <= 0) {
    return {
      id: "amount",
      tone: "muted",
      label: "Enter amount",
      announcement: "Amount: enter a draw amount within your available credit.",
    };
  }

  const validation = getDrawAmountValidation(String(amount), line);

  if (!validation.isValid) {
    return {
      id: "amount",
      tone: "warning",
      label: "Amount out of bounds",
      announcement: `Amount: ${validation.feedback.title}. ${validation.feedback.message}`,
    };
  }

  return {
    id: "amount",
    tone: "success",
    label: "Amount valid",
    announcement: "Amount: within available credit limits.",
  };
}

function previewStepState(
  line: CreditLine | null,
  amount: number,
): DrawWizardMicroStepState {
  if (!line) {
    return {
      id: "preview",
      tone: "muted",
      label: "Preview pending",
      announcement: "Preview: waiting for credit line and amount.",
    };
  }

  const validation = getDrawAmountValidation(String(amount), line);
  const previewReady = amount > 0 && validation.isValid;

  if (!previewReady) {
    return {
      id: "preview",
      tone: "muted",
      label: "Preview pending",
      announcement: "Preview: enter a valid amount to compute costs.",
    };
  }

  return {
    id: "preview",
    tone: "success",
    label: "Preview ready",
    announcement: "Preview: draw costs computed.",
  };
}

function confirmStepState(
  isOnConfirmStep: boolean,
  confirmationAcknowledged: boolean,
): DrawWizardMicroStepState {
  if (!isOnConfirmStep) {
    return {
      id: "confirm",
      tone: "muted",
      label: "Confirm pending",
      announcement: "Confirmation: complete earlier steps first.",
    };
  }

  if (!confirmationAcknowledged) {
    return {
      id: "confirm",
      tone: "warning",
      label: "Acknowledge terms",
      announcement: "Confirmation: accept the authorization terms to continue.",
    };
  }

  return {
    id: "confirm",
    tone: "success",
    label: "Terms acknowledged",
    announcement: "Confirmation: terms acknowledged.",
  };
}

/**
 * Derives per-step micro-progress indicators for the draw wizard header.
 * Pure function — safe to unit test and call on every render.
 */
export function computeDrawWizardMicroProgress(
  input: DrawWizardMicroProgressInput,
): DrawWizardMicroStepState[] {
  const { selectedCreditLine, amount, confirmationAcknowledged, isOnConfirmStep } =
    input;

  return [
    selectStepState(selectedCreditLine),
    amountStepState(selectedCreditLine, amount),
    previewStepState(selectedCreditLine, amount),
    confirmStepState(isOnConfirmStep, confirmationAcknowledged),
  ];
}

/**
 * Builds a single polite live-region sentence when any step's announcement
 * changes. Returns an empty string when nothing changed.
 */
export function buildMicroProgressAnnouncement(
  previous: DrawWizardMicroStepState[] | null,
  current: DrawWizardMicroStepState[],
): string {
  if (!previous) {
    return "";
  }

  const changed = current.filter((step, index) => {
    const prior = previous[index];
    return (
      !prior ||
      prior.tone !== step.tone ||
      prior.announcement !== step.announcement
    );
  });

  if (changed.length === 0) {
    return "";
  }

  return changed.map((step) => step.announcement).join(" ");
}
