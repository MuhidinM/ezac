"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Send, TriangleAlert } from "lucide-react";

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
import { STEPS, recommendationReasonOf, stepForField, type StepId } from "@/lib/backoffice/assessment-steps";
import { OFFICER_RECOMMENDATION } from "@/lib/backoffice/options";

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

function storageKey(assessmentId: string) {
  return `ezac_assessment_submit_${assessmentId}`;
}

function readSubmitInputs(assessmentId: string): Partial<SubmitInputs> | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(assessmentId));
    const value = raw ? (JSON.parse(raw) as unknown) : null;
    return value && typeof value === "object" ? (value as Partial<SubmitInputs>) : null;
  } catch {
    return null;
  }
}

function writeSubmitInputs(assessmentId: string, inputs: SubmitInputs) {
  try {
    window.sessionStorage.setItem(storageKey(assessmentId), JSON.stringify(inputs));
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

export function StepSubmit({
  assessment,
  validation,
  isValidating,
  onGoToStep,
  onEditBasicDetails,
  onSubmitted,
}: {
  assessment: Assessment;
  validation: AssessmentValidation | null;
  isValidating: boolean;
  onGoToStep: (step: StepId) => void;
  onEditBasicDetails: () => void;
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

  useEffect(() => {
    writeSubmitInputs(assessment.id, { recommendation, reason, acknowledgements });
  }, [assessment.id, recommendation, reason, acknowledgements]);

  if (isValidating && !validation) {
    return <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" />;
  }
  if (!validation) {
    return <InlineAlert>Couldn&apos;t check this assessment. Try again in a moment.</InlineAlert>;
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
                      <p className="text-sm font-medium text-[#001539]">{title}</p>
                      <ul className="mt-1 space-y-0.5 text-sm text-black/60">
                        {issues.map((issue) => (
                          <li key={issue.field}>
                            <code className="text-xs text-black/45">{issue.field}</code> — {issue.message}
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
        <p className="mr-auto flex items-center gap-2 text-sm text-black/55">
          {canSubmit ? (
            <>
              <CheckCircle2 className="size-4 text-[#007050]" />
              Ready to submit. The form becomes read-only afterwards.
            </>
          ) : (
            "Complete the items above to enable submission."
          )}
        </p>
        <Button onClick={() => void submit()} disabled={!canSubmit || isSubmitting}>
          <Send />
          {isSubmitting ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
    </div>
  );
}
