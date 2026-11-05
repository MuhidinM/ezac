"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

import { ApplicantCard, applicantDetails } from "@/components/assessment/applicant-card";
import { StepNav, type StepState } from "@/components/assessment/step-nav";
import type { StepProps } from "@/components/assessment/step-props";
import { StepFinance } from "@/components/assessment/steps/step-finance";
import { StepHousehold } from "@/components/assessment/steps/step-household";
import { StepHousing } from "@/components/assessment/steps/step-housing";
import { StepInfo } from "@/components/assessment/steps/step-info";
import { StepSubmit, clearSubmitInputs } from "@/components/assessment/steps/step-submit";
import { StepVerification } from "@/components/assessment/steps/step-verification";
import { StepVulnerability } from "@/components/assessment/steps/step-vulnerability";
import { StepWellbeing } from "@/components/assessment/steps/step-wellbeing";
import { AssessmentStatusBadge } from "@/components/backoffice/status-badges";
import { BasicDetailsDialog, bankLockFor } from "@/components/beneficiary/basic-details-dialog";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import type {
  Assessment,
  AssessmentDocument,
  AssessmentListItem,
  AssessmentValidation,
} from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, fieldErrorMap } from "@/lib/api/errors";
import type { BeneficiaryDetail, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import {
  STEPS,
  assessmentBeneficiaryId,
  draftFromAssessment,
  firstIncompleteStep,
  isStepComplete,
  issueText,
  reviewInfo,
  stepBody,
  stepForField,
  type AssessmentDraft,
  type StepId,
} from "@/lib/backoffice/assessment-steps";

/** Sent by the idle sign-out (components/auth/idle-sign-out.tsx). */
const IDLE_WARNING_EVENT = "ezac:idle-warning";
const BEFORE_SIGN_OUT_EVENT = "ezac:before-sign-out";

function apiPath(id: string) {
  return `/bff/backoffice/assessments/${encodeURIComponent(id)}`;
}

export function AssessmentWizard({ initial }: { initial: Assessment }) {
  const router = useRouter();
  const path = apiPath(initial.id);
  const beneficiaryId = assessmentBeneficiaryId(initial);
  // Sex and location for the basic details card; the assessment's applicant lacks them.
  const { data: beneficiary, mutate: setBeneficiary } = useResource<BeneficiaryDetail>(
    beneficiaryId ? `/bff/beneficiaries/${encodeURIComponent(beneficiaryId)}` : null,
  );
  // The household's other assessments: an approved one settles the bank account.
  const { session } = useSession();
  const { data: history } = useResource<AssessmentListItem[] | PaginatedItems<AssessmentListItem>>(
    beneficiaryId ? `/bff/backoffice/beneficiaries/${encodeURIComponent(beneficiaryId)}/assessments` : null,
  );
  const bankLock = bankLockFor({
    isAdmin: session?.isAdmin ?? false,
    assessments: Array.isArray(history) ? history : history?.items,
    poolStatus: beneficiary?.poolStatus ?? initial.pool?.status,
  });

  const [assessment, setAssessment] = useState(initial);
  const [draft, setDraft] = useState<AssessmentDraft>(() => draftFromAssessment(initial));
  const [documents, setDocuments] = useState<AssessmentDocument[]>(initial.documents ?? []);
  // A returned assessment opens on review; a draft moves to its first
  // incomplete step once the first validation lands.
  const [step, setStep] = useState<StepId>(initial.status === "RETURNED" ? 8 : 1);
  const userPickedStep = useRef(initial.status === "RETURNED");
  // Set once the session is ending, so the unsaved-changes prompt doesn't hold up the sign-out.
  const signingOut = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [validation, setValidation] = useState<AssessmentValidation | null>(null);
  // True until the first validation lands; later refreshes keep the old result on screen.
  const [isValidating, setIsValidating] = useState(true);
  const [showValidation, setShowValidation] = useState(initial.status === "RETURNED");
  const [basicOpen, setBasicOpen] = useState(false);

  const validate = useCallback(async () => {
    try {
      setValidation(await apiClient<AssessmentValidation>(`${path}/validation`));
    } catch {
      // Progress stays as last known; the submit step explains failures.
    } finally {
      setIsValidating(false);
    }
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    apiClient<AssessmentValidation>(`${path}/validation`)
      .then((result) => {
        if (cancelled) return;
        setValidation(result);
        // Resume a draft where the work stops, unless the officer already moved.
        if (!userPickedStep.current) {
          userPickedStep.current = true;
          const resume = firstIncompleteStep(result.sectionsComplete ?? {});
          if (resume === 8) setShowValidation(true);
          setStep(resume);
        }
      })
      .catch(() => {
        if (!cancelled) userPickedStep.current = true;
      })
      .finally(() => {
        if (!cancelled) setIsValidating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  // Unsaved answers would be lost on tab close.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!signingOut.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const patch: StepProps["patch"] = useCallback((section, value) => {
    setDraft((prev) => ({ ...prev, [section]: { ...prev[section], ...value } }));
    setIsDirty(true);
  }, []);

  /**
   * Save the current step; resolves false when the user must stay put.
   * `keepalive` lets the request finish while the page signs out.
   */
  async function save(options?: { keepalive?: boolean }): Promise<boolean> {
    if (step === 8 || !isDirty) return true;
    setIsSaving(true);
    setSaveError(null);
    setSaveFieldErrors({});
    try {
      const updated = await apiClient<Assessment>(path, {
        method: "PATCH",
        body: JSON.stringify(stepBody(step, draft)),
        keepalive: options?.keepalive,
      });
      setAssessment(updated);
      setDraft(draftFromAssessment(updated));
      if (updated.documents) setDocuments(updated.documents);
      setIsDirty(false);
      setSavedAt(new Date());
      void validate();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSaveError(`${error.message}. Opening the latest version…`);
        setTimeout(() => router.push(`/dashboard/assessments/${initial.id}`), 1500);
        return false;
      }
      setSaveError(error instanceof ApiError ? error.message : "Couldn't save this step");
      if (error instanceof ApiError) setSaveFieldErrors(fieldErrorMap(error.errors));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // The listeners below outlive renders; they call the latest save.
  const saveLatest = useRef(save);
  const savingNow = useRef(isSaving);
  useEffect(() => {
    saveLatest.current = save;
    savingNow.current = isSaving;
  });

  // Idle sign-out: save the open step when the one-minute warning opens, and
  // again just before signing out, so unsaved answers aren't lost.
  useEffect(() => {
    function saveInBackground() {
      if (savingNow.current) return null;
      return saveLatest.current({ keepalive: true });
    }
    function onIdleWarning() {
      void saveInBackground();
    }
    function onBeforeSignOut(event: Event) {
      signingOut.current = true;
      // Unsubmitted review inputs stay out of the next person's session on a shared PC.
      clearSubmitInputs(initial.id);
      const saving = saveInBackground();
      if (saving) {
        (event as CustomEvent<{ waitUntil?: (work: Promise<unknown>) => void } | null>).detail?.waitUntil?.(saving);
      }
    }
    window.addEventListener(IDLE_WARNING_EVENT, onIdleWarning);
    window.addEventListener(BEFORE_SIGN_OUT_EVENT, onBeforeSignOut);
    return () => {
      window.removeEventListener(IDLE_WARNING_EVENT, onIdleWarning);
      window.removeEventListener(BEFORE_SIGN_OUT_EVENT, onBeforeSignOut);
    };
  }, [initial.id]);

  async function goTo(next: StepId) {
    if (next === step) return;
    userPickedStep.current = true;
    if (!(await save())) return;
    if (next === 8) {
      setShowValidation(true);
      void validate();
    }
    setStep(next);
    document.getElementById("assessment-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function refreshApplicant() {
    try {
      const fresh = await apiClient<Assessment>(path);
      setAssessment((prev) => ({ ...prev, applicant: fresh.applicant }));
    } catch {
      // Keep the old card; the next save refreshes it anyway.
    }
    void validate();
  }

  const validationErrors = useMemo(() => {
    if (!showValidation || !validation) return {};
    return Object.fromEntries(
      (validation.errors ?? []).map((issue) => [issue.field, issueText(issue.message)]),
    );
  }, [showValidation, validation]);

  const errors = { ...validationErrors, ...saveFieldErrors };

  const stepStates = useMemo(() => {
    const complete = validation?.sectionsComplete ?? {};
    const issueSteps = new Set(
      showValidation ? (validation?.errors ?? []).map((issue) => stepForField(issue.field)) : [],
    );
    const states = {} as Record<StepId, StepState>;
    for (const definition of STEPS) {
      if (definition.id === 8) {
        states[8] = validation?.valid ? "complete" : "todo";
        continue;
      }
      const done = isStepComplete(definition, complete);
      states[definition.id] = issueSteps.has(definition.id) ? "issues" : done ? "complete" : "todo";
    }
    return states;
  }, [validation, showValidation]);

  const basicMissing = (validation?.errors ?? []).filter((issue) => stepForField(issue.field) === 0);
  const definition = STEPS.find((item) => item.id === step)!;
  const stepProps: StepProps = {
    draft,
    patch,
    errors,
    assessment,
    totals: validation?.totals ?? assessment.totals,
    summary: assessment.household?.summary ?? validation?.householdSummary,
  };
  const name = assessment.applicant?.fullName ?? "Beneficiary";
  const applicant = applicantDetails(assessment, beneficiary);
  const review = reviewInfo(assessment);
  // A draft waits for its first validation, which picks the step to resume on.
  const resuming = isValidating && initial.status !== "RETURNED";

  return (
    <section className="space-y-6" id="assessment-top">
      <PageHeader
        back={
          beneficiaryId
            ? { href: `/dashboard/beneficiary/${beneficiaryId}`, label: name }
            : { href: "/dashboard/assessments", label: "Assessments" }
        }
        title="Household assessment"
        meta={<AssessmentStatusBadge status={assessment.status} />}
        description={
          assessment.status === "RETURNED"
            ? `${review.byHeadOffice ? "Sent back by head office" : "Returned by the supervisor"}. Make the corrections and submit again.`
            : "Answers are saved each time you move to another step."
        }
        actions={
          step !== 8 ? (
            <Button variant="outline" onClick={() => void save()} disabled={!isDirty || isSaving}>
              <Save />
              {isSaving ? "Saving…" : isDirty ? "Save draft" : "Saved"}
            </Button>
          ) : null
        }
      />

      {assessment.status === "RETURNED" && review.comment ? (
        <InlineAlert tone="warning" title={review.byHeadOffice ? "Head office's comment" : "Supervisor's comment"}>
          {review.comment}
        </InlineAlert>
      ) : null}

      <ApplicantCard
        applicant={applicant}
        onEdit={beneficiaryId ? () => setBasicOpen(true) : undefined}
        missingCount={showValidation ? basicMissing.length : 0}
      />

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <StepNav current={step} states={stepStates} onSelect={(next) => void goTo(next)} disabled={isSaving} />
        </aside>

        <div className="min-w-0 space-y-5">
          <div>
            <p className="text-xs font-medium text-[#007050]">
              Step {step} of 8{definition.letters ? ` · Section ${definition.letters}` : ""}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-[#001539]">{definition.title}</h2>
            <p className="text-sm text-black/55">{definition.description}</p>
          </div>

          {saveError ? <InlineAlert>{saveError}</InlineAlert> : null}

          {resuming ? <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" role="status" aria-label="Loading" /> : null}
          {!resuming && step === 1 ? <StepInfo {...stepProps} /> : null}
          {!resuming && step === 2 ? <StepHousehold {...stepProps} /> : null}
          {!resuming && step === 3 ? <StepFinance {...stepProps} /> : null}
          {!resuming && step === 4 ? <StepHousing {...stepProps} /> : null}
          {!resuming && step === 5 ? <StepWellbeing {...stepProps} /> : null}
          {!resuming && step === 6 ? <StepVulnerability {...stepProps} /> : null}
          {!resuming && step === 7 ? (
            <StepVerification
              {...stepProps}
              documents={documents}
              onDocumentUploaded={(document) => {
                setDocuments((prev) => [...prev, document]);
                void validate();
              }}
            />
          ) : null}
          {!resuming && step === 8 ? (
            <StepSubmit
              assessment={assessment}
              validation={validation}
              isValidating={isValidating}
              onGoToStep={(next) => void goTo(next)}
              onEditBasicDetails={() => setBasicOpen(true)}
              onSubmitted={(submitted) => router.push(`/dashboard/assessments/${submitted.id}`)}
            />
          ) : null}

          {step !== 8 ? (
            <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
              <Button
                variant="outline"
                onClick={() => void goTo((step - 1) as StepId)}
                disabled={step === 1 || isSaving}
              >
                <ArrowLeft />
                Back
              </Button>
              <p className="hidden text-xs text-black/45 sm:block">
                {isDirty
                  ? "Unsaved changes"
                  : savedAt
                    ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : null}
              </p>
              <Button onClick={() => void goTo((step + 1) as StepId)} disabled={isSaving}>
                {isSaving ? "Saving…" : step === 7 ? "Review & submit" : "Save & continue"}
                <ArrowRight />
              </Button>
            </div>
          ) : (
            <div className="border-t border-black/[0.06] pt-5">
              <Button variant="outline" onClick={() => void goTo(7)}>
                <ArrowLeft />
                Back to verification
              </Button>
            </div>
          )}
        </div>
      </div>

      {beneficiaryId ? (
        <BasicDetailsDialog
          beneficiaryId={beneficiaryId}
          initial={applicant}
          open={basicOpen}
          onOpenChange={setBasicOpen}
          onSaved={(updated) => {
            if (beneficiary && updated) setBeneficiary({ ...beneficiary, ...updated });
            void refreshApplicant();
          }}
          externalErrors={validationErrors}
          bankLock={bankLock}
        />
      ) : null}
    </section>
  );
}

export function AssessmentLocked({ assessment }: { assessment: Assessment }) {
  return (
    <InlineAlert
      tone="info"
      title="This assessment is no longer editable"
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/assessments/${assessment.id}`}>View assessment</Link>
        </Button>
      }
    >
      Only draft or returned assessments can be edited.
    </InlineAlert>
  );
}
