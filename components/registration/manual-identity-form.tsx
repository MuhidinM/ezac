"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createInitialState } from "@/components/questionnaire/initial-state";
import { QuestionnaireShell } from "@/components/questionnaire/questionnaire-shell";
import { Step1Identification } from "@/components/questionnaire/steps/step1-identification";
import type { QuestionnaireState, StepErrors } from "@/components/questionnaire/types";
import { validateStep1 } from "@/components/questionnaire/validation";
import { Button } from "@/components/ui/button";
import { getSelectedBranch } from "@/lib/registration/session";

export function ManualIdentityForm() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [state, setState] = useState<QuestionnaireState>(createInitialState);
  const [errors, setErrors] = useState<StepErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }
    setBranchId(branch.branchId);
    setBranchName(branch.branchName);
  }, [router]);

  function handleSubmit() {
    setError(null);
    const stepErrors = validateStep1(state);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      formId: "EZAC-IND-REG",
      registrationType: "manual" as const,
      branchId,
      branchName,
      submittedAt: new Date().toISOString(),
      assessment: state.assessment,
      applicant: state.applicant,
      asnaf: state.asnaf,
    };
    console.log("EZAC Individual Registration Submitted:", payload);
    setSubmitted(true);
    setIsSubmitting(false);
  }

  if (!branchId || !branchName) {
    return (
      <QuestionnaireShell title="Individual Registration" formId="EZAC-IND-REG" showProgress={false}>
        <p className="text-base text-black/55">Loading...</p>
      </QuestionnaireShell>
    );
  }

  if (submitted) {
    return (
      <QuestionnaireShell branchName={branchName} showProgress={false}>
        <div className="py-12 text-center">
          <h2 className="font-serif-display text-2xl font-semibold text-[#001539]">
            Individual Registration Submitted
          </h2>
          <p className="mt-2 text-base text-black/55">
            Registration data has been logged. Check the browser console for the
            JSON payload.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" asChild>
              <a href="/dashboard/beneficiary">Back to beneficiaries</a>
            </Button>
            <Button asChild>
              <a href="/dashboard/register/type">Register another</a>
            </Button>
          </div>
        </div>
      </QuestionnaireShell>
    );
  }

  return (
    <QuestionnaireShell
      title="Individual Registration"
      formId="EZAC-IND-REG"
      branchName={branchName}
      showProgress={false}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" asChild className="min-h-[48px] flex-1">
            <a href="/dashboard/register/type">Back</a>
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="form-btn-primary flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </button>
        </div>
      }
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-3 text-sm text-[#c0392b]">
          {error}
        </p>
      ) : null}
      <Step1Identification state={state} setState={setState} errors={errors} />
    </QuestionnaireShell>
  );
}
