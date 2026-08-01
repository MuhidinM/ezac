import type { NgoRegistrationState, StepErrors } from "./types";
import { AID_TYPES } from "./initial-state";

export function validateStep1(state: NgoRegistrationState): StepErrors {
  const errors: StepErrors = {};
  const s = state.step1;

  if (!s.orgName.trim()) errors.orgName = "Organization name is required";
  if (!s.orgType) errors.orgType = "Please select organization type";
  if (s.orgType === "other" && !s.orgTypeOther.trim())
    errors.orgTypeOther = "Please specify organization type";
  if (!s.yearEstablished.trim()) errors.yearEstablished = "Year established is required";
  else if (!/^\d{4}$/.test(s.yearEstablished))
    errors.yearEstablished = "Enter a valid 4-digit year";
  if (!s.registrationNumber.trim())
    errors.registrationNumber = "Registration number is required";
  if (!s.licenseExpiryDate.trim())
    errors.licenseExpiryDate = "License expiry date is required";
  if (!s.contactName.trim()) errors.contactName = "Contact name is required";
  if (!s.contactTitle.trim()) errors.contactTitle = "Job title is required";
  if (!s.contactPhone.trim()) errors.contactPhone = "Phone number is required";
  if (!s.region.trim()) errors.region = "Region is required";
  if (!s.woreda.trim()) errors.woreda = "Woreda is required";

  return errors;
}

export function validateStep2(state: NgoRegistrationState): StepErrors {
  const errors: StepErrors = {};
  const s = state.step2;

  if (!s.beneficiaryStats.totalRegistered.trim())
    errors.totalRegistered = "Total registered beneficiaries is required";
  if (!s.beneficiaryStats.activeReceiving.trim())
    errors.activeReceiving = "Active beneficiaries is required";
  if (!s.selectionMethod) errors.selectionMethod = "Please select a method";
  if (s.selectionMethod === "other" && !s.selectionMethodOther.trim())
    errors.selectionMethodOther = "Please specify selection method";

  return errors;
}

export function validateStep3(state: NgoRegistrationState): StepErrors {
  const errors: StepErrors = {};
  const hasAidType = AID_TYPES.some((k) => state.step3.aidTypes[k]);
  if (!hasAidType) errors.aidTypes = "Select at least one type of aid provided";
  if (state.step3.aidTypes.other && !state.step3.aidTypeOther.trim())
    errors.aidTypeOther = "Please specify other aid type";

  return errors;
}

export function validateStep4(state: NgoRegistrationState): StepErrors {
  const errors: StepErrors = {};
  const s = state.step4;

  if (!s.totalBudget.trim()) errors.totalBudget = "Total annual budget is required";
  if (!s.requestedAmount.trim())
    errors.requestedAmount = "Requested aid amount is required";
  if (!s.intendedUse.trim()) errors.intendedUse = "Intended use is required";
  if (!s.bankName.trim()) errors.bankName = "Bank name is required";
  if (!s.accountName.trim()) errors.accountName = "Account name is required";
  if (!s.accountNumber.trim()) errors.accountNumber = "Account number is required";

  return errors;
}

export function validateStep5(state: NgoRegistrationState): StepErrors {
  const errors: StepErrors = {};
  const s = state.step5;

  if (!s.declarationAgreed)
    errors.declarationAgreed = "You must agree to the declaration";
  if (!s.applicantName.trim()) errors.applicantName = "Applicant name is required";
  if (!s.applicantTitle.trim()) errors.applicantTitle = "Applicant title is required";
  if (!s.applicantDate.trim()) errors.applicantDate = "Date is required";

  if (
    s.decisionOverride &&
    s.decisionOverride !== getAutoDecisionFromScores(s.reviewerScores) &&
    !s.overrideReason.trim()
  ) {
    errors.overrideReason = "Please provide a reason for overriding the decision";
  }

  return errors;
}

function getAutoDecisionFromScores(
  scores: NgoRegistrationState["step5"]["reviewerScores"],
): string {
  const total =
    Number(scores.legal || 0) +
    Number(scores.reach || 0) +
    Number(scores.programs || 0) +
    Number(scores.financialNeed || 0) +
    Number(scores.shariah || 0) +
    Number(scores.accountability || 0);

  if (total >= 80) return "approve";
  if (total >= 60) return "conditional";
  if (total >= 40) return "defer";
  return "reject";
}

export function validateStep(step: number, state: NgoRegistrationState): StepErrors {
  switch (step) {
    case 1:
      return validateStep1(state);
    case 2:
      return validateStep2(state);
    case 3:
      return validateStep3(state);
    case 4:
      return validateStep4(state);
    case 5:
      return validateStep5(state);
    default:
      return {};
  }
}
