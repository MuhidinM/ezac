import type { QuestionnaireState, QuestionnaireStep } from "./types";

const DRAFT_KEY = "ezac_mtt_qst_001_draft";

export type QuestionnaireDraft = {
  state: QuestionnaireState;
  currentStep: QuestionnaireStep;
  savedAt: string;
};

export function saveDraft(state: QuestionnaireState, currentStep: QuestionnaireStep): void {
  if (typeof window === "undefined") return;
  const draft: QuestionnaireDraft = {
    state,
    currentStep,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): QuestionnaireDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuestionnaireDraft;
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
