import { CreditLine, DrawStep } from "@/types/draw-credit.types";

export interface WizardDraftState {
  step: DrawStep;
  selectedCreditLine: CreditLine | null;
  amount: number;
}

const DRAFT_KEY = "grantfox_draw_wizard_draft";

export const saveDraft = (state: WizardDraftState): void => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save wizard draft to localStorage", e);
  }
};

export const loadDraft = (): WizardDraftState | null => {
  try {
    const data = localStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    return JSON.parse(data) as WizardDraftState;
  } catch (e) {
    console.error("Failed to load wizard draft from localStorage", e);
    return null;
  }
};

export const clearDraft = (): void => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.error("Failed to clear wizard draft from localStorage", e);
  }
};
