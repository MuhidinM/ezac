import type { NgoRegistrationState, NgoRegistrationStep } from "./types";

const DRAFT_KEY = "ezac_ngo_reg_draft";

export type NgoRegistrationDraft = {
  state: NgoRegistrationState;
  currentStep: NgoRegistrationStep;
  savedAt: string;
};

export function saveDraft(
  state: NgoRegistrationState,
  currentStep: NgoRegistrationStep,
): void {
  if (typeof window === "undefined") return;
  const draft: NgoRegistrationDraft = {
    state,
    currentStep,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): NgoRegistrationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NgoRegistrationDraft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export function hasDraft(): boolean {
  return loadDraft() !== null;
}
