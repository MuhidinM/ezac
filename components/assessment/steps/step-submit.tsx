"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, RotateCw, Send, TriangleAlert } from "lucide-react";

import { FieldSection, SelectField, TextAreaField } from "@/components/assessment/fields";
import { ScoreBreakdown, ScoreHeadline } from "@/components/assessment/score-breakdown";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import type {
  Assessment,
  AssessmentValidation,
  OfficerRecommendation,
  SubmitAssessmentBody,
} from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import {
  STEPS,
  fieldLabel,
  issueText,
  recommendationReasonOf,
  stepForField,
  type StepId,
} from "@/lib/backoffice/assessment-steps";
import { OFFICER_RECOMMENDATION } from "@/lib/backoffice/options";
import { SIGNED_OUT_KEY } from "@/lib/auth/client-session";

const MIN_DISAGREE_REASON = 20;

/**
 * The recommendation, reason and warning comments aren't part of the draft
 * (they are sent with the submission), so they are kept for this tab to
 * survive moving between steps and reloading.
 */
type SubmitInputs = {
  recommendation: OfficerRecommendation | null;
  reason: string;
  acknowledgements: Record<string, string>;
};

const STORAGE_PREFIX = "ezac_assessment_submit_";

function storageKey(assessmentId: string) {
  return `${STORAGE_PREFIX}${assessmentId}`;
}

/** When this browser last signed out (any tab, any way), from client-session's broadcast key. */
function lastSignOut(): number {
  try {
    return Number(window.localStorage.getItem(SIGNED_OUT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function readSubmitInputs(assessmentId: string): Partial<SubmitInputs> | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(assessmentId));
    const value = raw ? (JSON.parse(raw) as unknown) : null;
    if (!value || typeof value !== "object") return null;
    // Inputs typed before a sign-out (the menu, the idle timer, an ended
    // session) belong to the person who signed out: on a shared PC the next
    // person must not inherit them.
    const savedAt = Number((value as { savedAt?: unknown }).savedAt) || 0;
    if (savedAt <= lastSignOut()) {
      clearSubmitInputs(assessmentId);
      return null;
    }
    return value as Partial<SubmitInputs>;
  } catch {
    return null;
  }
}

function writeSubmitInputs(assessmentId: string, inputs: SubmitInputs) {
  try {
    window.sessionStorage.setItem(storageKey(assessmentId), JSON.stringify({ ...inputs, savedAt: Date.now() }));
  } catch {
    // Storage blocked: the inputs just don't survive a reload.
  }
}

/** Forget the kept inputs (after submitting, or when the session ends). */
export function clearSubmitInputs(assessmentId: string) {
  try {
    window.sessionStorage.removeItem(storageKey(assessmentId));
  } catch {
    // Nothing was kept.
  }
}

/** Forget the kept inputs of every assessment in this tab (at sign-out). */
export function clearAllSubmitInputs() {
  try {
    const store = window.sessionStorage;
    const keys: string[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    for (const key of keys) store.removeItem(key);
  } catch {
    // Nothing was kept.
  }
}

export function StepSubmit({
  assessment,
  validation,
  isValidating,
  onGoToStep,
  onEditBasicDetails,
  onRetryValidation,
  onSubmitted,
}: {
  assessment: Assessment;
  validation: AssessmentValidation | null;
  isValidating: boolean;
  onGoToStep: (step: StepId) => void;
  onEditBasicDetails: () => void;
  /** Runs the completeness check again after it failed. */
  onRetryValidation: () => Promise<void>;
  onSubmitted: (assessment: Assessment) => void;
}) {
  const preview = validation?.scorePreview ?? null;
  const systemRecommendation = preview?.preliminaryRecommendation ?? null;

  // What this tab kept wins over what was last submitted (a returned assessment).
  const [kept] = useState(() => readSubmitInputs(assessment.id));
  const [recommendation, setRecommendation] = useState<OfficerRecommendation | null>(
    kept?.recommendation ?? assessment.recommendation?.officerRecommendation ?? null,
  );
  const [reason, setReason] = useState(
    (typeof kept?.reason === "string" && kept.reason) || (recommendationReasonOf(assessment) ?? ""),
  );
  const [acknowledgements, setAcknowledgements] = useState<Record<string, string>>(() => ({
    ...assessment.warningAcknowledgements,
    ...kept?.acknowledgements,
  }));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The wizard's re-checks keep isValidating false (they keep the old result on
  // screen), so the Retry button tracks its own request.
  const [isRetrying, setIsRetrying] = useState(false);

  async function retryValidation() {
    setIsRetrying(true);
    try {
      await onRetryValidation();
    } finally {
      setIsRetrying(false);
    }
  }

  useEffect(() => {
    writeSubmitInputs(assessment.id, { recommendation, reason, acknowledgements });
  }, [assessment.id, recommendation, reason, acknowledgements]);

  if (isValidating && !validation) {
    return <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" />;
  }
  if (!validation) {
    return (
      <InlineAlert
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => void retryValidation()} loading={isRetrying}>
            <RotateCw />
            Retry
          </Button>
        }
      >
        Couldn&apos;t check this assessment. Your answers are saved; try the check again.
      </InlineAlert>
    );
  }

  // Pre-select the system's recommendation until the officer picks one.
  const chosen = recommendation ?? systemRecommendation;
  const disagrees = !!chosen && !!systemRecommendation && chosen !== systemRecommendation;
  const warnings = validation.warnings ?? [];
  const missingComments = warnings.filter((warning) => !acknowledgements[warning.code]?.trim());
  const reasonTooShort = disagrees && reason.trim().length < MIN_DISAGREE_REASON;
  const canSubmit =
    validation.valid && !!chosen && !!reason.trim() && !reasonTooShort && missingComments.length === 0;

  const grouped = new Map<StepId | 0, { field: string; message: string }[]>();
  for (const issue of validation.errors ?? []) {
    const step = stepForField(issue.field);
    grouped.set(step, [...(grouped.get(step) ?? []), issue]);
  }

  async function submit() {
    if (!chosen) return;
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});
    const body: SubmitAssessmentBody = {
      officerRecommendation: chosen,
      recommendationReason: reason.trim(),
      warningAcknowledgements: Object.fromEntries(
        warnings.map((warning) => [warning.code, acknowledgements[warning.code]?.trim() ?? ""]),
      ),
    };
    try {
      const submitted = await apiClient<Assessment>(
        `/bff/backoffice/assessments/${encodeURIComponent(assessment.id)}/submit`,
        { method: "POST", body: JSON.stringify(body) },
      );
      clearSubmitInputs(assessment.id);
      onSubmitted(submitted);
    } catch (submitError) {
      setError(errorMessage(submitError, "Submission failed"));
      if (submitError instanceof ApiError) setFieldErrors(fieldErrorMap(submitError.errors));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {grouped.size > 0 ? (
        <FieldSection
          title="Still to complete"
          description="Submit unlocks once every required answer is in."
          aside={<TriangleAlert className="size-5 text-amber-500" />}
        >
          <ul className="divide-y divide-black/[0.06]">
            {[...grouped.entries()]
              .sort(([a], [b]) => a - b)
              .map(([step, issues]) => {
                const title =
                  step === 0 ? "Basic details" : (STEPS.find((item) => item.id === step)?.title ?? "Other");
                return (
                  <li key={step} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{title}</p>
                      <ul className="mt-1 space-y-0.5 text-sm text-black/60">
                        {issues.map((issue) => (
                          <li key={issue.field}>
                            <span className="font-medium text-black/75">{fieldLabel(issue.field)}:</span>{" "}
                            {issueText(issue.message)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => (step === 0 ? onEditBasicDetails() : onGoToStep(step as StepId))}
                    >
                      {step === 0 ? "Edit details" : "Go to step"}
                      <ArrowRight />
                    </Button>
                  </li>
                );
              })}
          </ul>
        </FieldSection>
      ) : (
        <InlineAlert tone="success" title="All sections complete">
          Review the score below, add your recommendation and submit for supervisor review.
        </InlineAlert>
      )}

      {preview ? (
        <FieldSection title="Score preview" description="What this submission will be scored. Nothing is saved yet.">
          <div className="space-y-6">
            <ScoreHeadline score={preview} />
            <ScoreBreakdown score={preview} />
          </div>
        </FieldSection>
      ) : null}

      {warnings.length > 0 ? (
        <FieldSection
          title="Data warnings"
          description="Warnings don't block submission, but each one needs a short explanation."
        >
          <div className="space-y-4">
            {warnings.map((warning) => (
              <TextAreaField
                key={warning.code}
                id={`warning-${warning.code}`}
                label={
                  <span className="flex items-center gap-1.5">
                    <TriangleAlert className="size-3.5 text-amber-500" />
                    {warning.message}
                  </span>
                }
                rows={2}
                value={acknowledgements[warning.code] ?? ""}
                onChange={(value) =>
                  setAcknowledgements((prev) => ({ ...prev, [warning.code]: value ?? "" }))
                }
                error={fieldErrors[`warningAcknowledgements.${warning.code}`]}
                placeholder="Explain why this is correct"
                required
              />
            ))}
          </div>
        </FieldSection>
      ) : null}

      <FieldSection title="Officer recommendation">
        <div className="space-y-4">
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <div className="max-w-sm">
            <SelectField
              id="recommendation"
              label="Recommendation"
              options={OFFICER_RECOMMENDATION}
              value={chosen}
              onChange={(value) => setRecommendation(value as OfficerRecommendation | null)}
              hint={
                systemRecommendation
                  ? `System recommends: ${OFFICER_RECOMMENDATION.find((o) => o.value === systemRecommendation)?.label}`
                  : undefined
              }
              error={fieldErrors.officerRecommendation}
              required
            />
          </div>
          <TextAreaField
            id="recommendation-reason"
            label="Reason"
            value={reason}
            onChange={(value) => setReason(value ?? "")}
            hint={
              disagrees
                ? `You differ from the system, so explain in at least ${MIN_DISAGREE_REASON} characters (${reason.trim().length}/${MIN_DISAGREE_REASON}).`
                : "Summarise why this household should receive this outcome."
            }
            error={fieldErrors.recommendationReason}
            required
          />
        </div>
      </FieldSection>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-black/[0.06] bg-white px-5 py-4 shadow-xs">
        <p className="mr-auto flex items-center gap-2 text-sm text-black/60">
          {canSubmit ? (
            <>
              <CheckCircle2 className="size-4 text-brand" />
              Ready to submit. The form becomes read-only afterwards.
            </>
          ) : (
            "Complete the items above to enable submission."
          )}
        </p>
        <Button onClick={() => void submit()} disabled={!canSubmit} loading={isSubmitting} loadingText="Submitting…">
          <Send />
          Submit for review
        </Button>
      </div>
    </div>
  );
}
