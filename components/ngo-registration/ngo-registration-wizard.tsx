"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { StepNavigation } from "@/components/questionnaire/step-navigation";
import { QuestionnaireShell } from "@/components/questionnaire/questionnaire-shell";
import { getSelectedBranch } from "@/lib/registration/session";

import { clearDraft, hasDraft, loadDraft, saveDraft } from "./draft-storage";
import { createInitialState } from "./initial-state";
import {
  calculateTotalScore,
  generateReferenceNumber,
  getAutoDecision,
} from "./scoring";
import { Step1Identity } from "./steps/step1-identity";
import { Step2Coverage } from "./steps/step2-coverage";
import { Step3Programs } from "./steps/step3-programs";
import { Step4Finance } from "./steps/step4-finance";
import { Step5Shariah } from "./steps/step5-shariah";
import { StepReview } from "./steps/step-review";
import { StepSuccess } from "./steps/step-success";
import type {
  EligibilityDecision,
  NgoRegistrationState,
  NgoRegistrationStep,
  StepErrors,
} from "./types";
import { validateStep } from "./validation";

const SECTION_NAMES: Record<number, string> = {
  1: "Organization Identity",
  2: "Geographic Coverage",
  3: "Aid Programs",
  4: "Financial Situation",
  5: "Shariah & Assessment",
};

export function NgoRegistrationWizard() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [state, setState] = useState<NgoRegistrationState>(createInitialState);
  const [currentStep, setCurrentStep] = useState<NgoRegistrationStep>(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState({
    referenceNumber: "",
    submittedAt: "",
    score: 0,
    decision: "" as EligibilityDecision,
  });

  useEffect(() => {
    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }
    setBranchId(branch.branchId);
    setBranchName(branch.branchName);
    if (hasDraft()) setShowResumeBanner(true);
  }, [router]);

  const handleSaveDraft = useCallback(() => {
    saveDraft(state, currentStep);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [state, currentStep]);

  function handleResumeDraft() {
    const draft = loadDraft();
    if (draft) {
      setState(draft.state);
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
      if (currentStep < 5) {
        setCurrentStep((currentStep + 1) as NgoRegistrationStep);
      } else {
        setCurrentStep("review");
      }
    }
  }

  function handlePrevious() {
    setErrors({});
    if (currentStep === "review") {
      setCurrentStep(5);
    } else if (typeof currentStep === "number" && currentStep > 1) {
      setCurrentStep((currentStep - 1) as NgoRegistrationStep);
    }
  }

  function handleSubmit() {
    setIsSubmitting(true);
    const score = calculateTotalScore(state.step5.reviewerScores);
    const autoDecision = getAutoDecision(score);
    const decision = state.step5.decisionOverride || autoDecision;
    const referenceNumber = generateReferenceNumber();
    const submittedAt = new Date().toISOString();

    const payload = {
      formId: "EZAC-NGO-REG-001",
      referenceNumber,
      branchId,
      branchName,
      submittedAt,
      eligibilityScore: score,
      decision,
      ...state,
    };
    console.log("EZAC NGO Application Submitted:", payload);

    setSubmitResult({ referenceNumber, submittedAt, score, decision });
    clearDraft();
    setCurrentStep("success");
    setIsSubmitting(false);
  }

  function handlePrint() {
    window.print();
  }

  function handleStartNew() {
    setState(createInitialState());
    setCurrentStep(1);
    setErrors({});
    clearDraft();
  }

  const stepProps = { state, setState, errors };

  function renderStep() {
    switch (currentStep) {
      case 1:
        return <Step1Identity {...stepProps} />;
      case 2:
        return <Step2Coverage {...stepProps} />;
      case 3:
        return <Step3Programs {...stepProps} />;
      case 4:
        return <Step4Finance {...stepProps} />;
      case 5:
        return <Step5Shariah {...stepProps} />;
      case "review":
        return (
          <StepReview state={state} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        );
      case "success":
        return (
          <StepSuccess
            referenceNumber={submitResult.referenceNumber}
            orgName={state.step1.orgName}
            contactName={state.step1.contactName}
            submittedAt={submitResult.submittedAt}
            score={submitResult.score}
            decision={submitResult.decision}
            onPrint={handlePrint}
            onStartNew={handleStartNew}
          />
        );
      default:
        return null;
    }
  }

  if (!branchId || !branchName) {
    return (
      <QuestionnaireShell title="NGO Aid Application" formId="EZAC-NGO-REG-001" showProgress={false}>
        <p className="text-base text-[#5a6e62]">Loading...</p>
      </QuestionnaireShell>
    );
  }

  const isSuccess = currentStep === "success";
  const isReview = currentStep === "review";
  const numericStep = typeof currentStep === "number" ? currentStep : 5;

  return (
    <QuestionnaireShell
      title="NGO Aid Application"
      formId="EZAC-NGO-REG-001"
      totalSteps={5}
      sectionName={typeof currentStep === "number" ? SECTION_NAMES[currentStep] : undefined}
      branchName={branchName}
      currentStep={currentStep}
      showProgress={!isSuccess && !isReview}
      progressLabel={isReview ? "Review your application" : undefined}
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
            nextLabel={numericStep === 5 ? "Review" : "Next"}
            showPrevious={numericStep > 1}
          />
        ) : isReview ? (
          <StepNavigation onPrevious={handlePrevious} showPrevious />
        ) : undefined
      }
    >
      {renderStep()}
    </QuestionnaireShell>
  );
}
