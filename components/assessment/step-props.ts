import type {
  Assessment,
  AssessmentTotals,
  HouseholdSummary,
} from "@/lib/api/backoffice-types";
import type { AssessmentDraft } from "@/lib/backoffice/assessment-steps";

export type StepProps = {
  draft: AssessmentDraft;
  /** Merge fields into one section of the draft. */
  patch: <K extends keyof AssessmentDraft>(
    section: K,
    value: Partial<AssessmentDraft[K]>,
  ) => void;
  /** Field errors keyed by API path, e.g. `housing.roofType`. */
  errors: Record<string, string>;
  assessment: Assessment;
  totals?: AssessmentTotals | null;
  summary?: HouseholdSummary | null;
};
