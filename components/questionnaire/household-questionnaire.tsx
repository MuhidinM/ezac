"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { clearDraft, hasDraft, loadDraft, saveDraft } from "./draft-storage";
import { createInitialState } from "./initial-state";
import { QuestionnaireShell } from "./questionnaire-shell";
import { StepNavigation } from "./step-navigation";
import { Step1Identification } from "./steps/step1-identification";
import { Step2Household } from "./steps/step2-household";
import { Step3Finance } from "./steps/step3-finance";
import { Step4Housing } from "./steps/step4-housing";
import { Step5HealthFood } from "./steps/step5-health-food";
import { Step6DebtVulnerability } from "./steps/step6-debt-vulnerability";
import { Step7Assessment } from "./steps/step7-assessment";
import { StepReview } from "./steps/step-review";
import { StepSuccess } from "./steps/step-success";
import type { QuestionnaireState, QuestionnaireStep, StepErrors } from "./types";
import { applyHouseholdAssessment } from "./poverty-assessment";
import { validateStep } from "./validation";
import { getSelectedBranch } from "@/lib/registration/session";

export function HouseholdQuestionnaire() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [state, setState] = useState<QuestionnaireState>(createInitialState);
  const [currentStep, setCurrentStep] = useState<QuestionnaireStep>(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState({ assessmentNumber: "", beneficiaryId: "" });

  useEffect(() => {
    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }
    setBranchId(branch.branchId);
    setBranchName(branch.branchName);
    if (hasDraft()) {
      setShowResumeBanner(true);
    }
  }, [router]);

  const handleSaveDraft = useCallback(() => {
    saveDraft(state, currentStep);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [state, currentStep]);

  function handleResumeDraft() {
    const draft = loadDraft();
    if (draft) {
      const restored =
        draft.currentStep === 7
          ? applyHouseholdAssessment(draft.state)
          : draft.state;
      setState(restored);
      setCurrentStep(draft.currentStep);
    }
    setShowResumeBanner(false);
  }

  function handleDiscardDraft() {
    clearDraft();
    setShowResumeBanner(false);
  }

  function handleNext() {
    if (typeof currentStep === "number") {
      const stepErrors = validateStep(currentStep, state);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      setErrors({});
      if (currentStep < 7) {
        const nextStep = (currentStep + 1) as QuestionnaireStep;
        if (nextStep === 7) {
          setState((prev) => applyHouseholdAssessment(prev));
        }
        setCurrentStep(nextStep);
      } else {
        setCurrentStep("review");
      }
    }
  }

  function handlePrevious() {
    setErrors({});
    if (currentStep === "review") {
      setCurrentStep(7);
      setState((prev) => applyHouseholdAssessment(prev));
    } else if (typeof currentStep === "number" && currentStep > 1) {
      setCurrentStep((currentStep - 1) as QuestionnaireStep);
    }
  }

  function handleSubmit() {
    setIsSubmitting(true);
    const payload = {
      formId: "EZAC-MTT-QST-001",
      branchId,
      branchName,
      submittedAt: new Date().toISOString(),
      ...state,
    };
    console.log("EZAC Household Assessment Submitted:", payload);

    setSubmittedId({
      assessmentNumber: state.assessment.assessmentNumber,
      beneficiaryId: state.assessment.beneficiaryId,
    });
    clearDraft();
    setCurrentStep("success");
    setIsSubmitting(false);
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const payload = {
      formId: "EZAC-MTT-QST-001",
      branchId,
      branchName,
      submittedAt: new Date().toISOString(),
      ...state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ezac-assessment-${state.assessment.assessmentNumber || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stepProps = { state, setState, errors };

  function renderStep() {
    switch (currentStep) {
      case 1:
        return <Step1Identification {...stepProps} />;
      case 2:
        return <Step2Household {...stepProps} />;
      case 3:
        return <Step3Finance {...stepProps} />;
      case 4:
        return <Step4Housing {...stepProps} />;
      case 5:
        return <Step5HealthFood {...stepProps} />;
      case 6:
        return <Step6DebtVulnerability {...stepProps} />;
      case 7:
        return <Step7Assessment {...stepProps} />;
      case "review":
        return (
          <StepReview
            state={state}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case "success":
        return (
          <StepSuccess
            assessmentNumber={submittedId.assessmentNumber}
            beneficiaryId={submittedId.beneficiaryId}
            onPrint={handlePrint}
            onDownload={handleDownload}
          />
        );
      default:
        return null;
    }
  }

  if (!branchId || !branchName) {
    return (
      <QuestionnaireShell showProgress={false}>
        <p className="text-base text-[#5a6e62]">Loading...</p>
      </QuestionnaireShell>
    );
  }

  const isSuccess = currentStep === "success";
  const isReview = currentStep === "review";
  const numericStep = typeof currentStep === "number" ? currentStep : 7;

  return (
    <QuestionnaireShell
      title="EZAC Household Assessment"
      formId="EZAC-MTT-QST-001"
      totalSteps={7}
      branchName={branchName}
      currentStep={currentStep}
      showProgress={!isSuccess && !isReview}
      progressLabel={isReview ? "Review your answers" : undefined}
      onSaveDraft={isSuccess ? undefined : handleSaveDraft}
      draftSaved={draftSaved}
      showResumeBanner={showResumeBanner}
      onResumeDraft={handleResumeDraft}
      onDiscardDraft={handleDiscardDraft}
      footer={
        !isSuccess && !isReview ? (
          <StepNavigation
            onPrevious={numericStep > 1 ? handlePrevious : undefined}
            onNext={handleNext}
            nextLabel={numericStep === 7 ? "Review" : "Next"}
            showPrevious={numericStep > 1}
          />
        ) : isReview ? (
          <StepNavigation
            onPrevious={handlePrevious}
            showPrevious
          />
        ) : undefined
      }
    >
      {renderStep()}
    </QuestionnaireShell>
  );
}
