import type { QuestionnaireState, StepErrors } from "./types";

export function validateStep1(state: QuestionnaireState): StepErrors {
  const errors: StepErrors = {};
  const { applicant, asnaf } = state;

  if (!applicant.fullName.trim()) errors.fullName = "Full name is required";
  if (!applicant.sex) errors.sex = "Please select sex";
  if (!applicant.age.trim()) errors.age = "Age is required";
  else if (Number(applicant.age) < 0 || Number(applicant.age) > 150)
    errors.age = "Please enter a valid age";
  if (!applicant.maritalStatus) errors.maritalStatus = "Please select marital status";
  if (asnaf.other && !asnaf.otherSpecify.trim())
    errors.asnafOther = "Please specify the other category";

  return errors;
}

export function validateStep2(state: QuestionnaireState): StepErrors {
  const errors: StepErrors = {};
  const { household } = state;

  household.members.forEach((member, index) => {
    if (!member.name.trim()) errors[`member_${index}_name`] = "Name is required";
    if (!member.sex) errors[`member_${index}_sex`] = "Sex is required";
    if (!member.age.trim()) errors[`member_${index}_age`] = "Age is required";
  });

  if (!household.femaleHeadedHousehold)
    errors.femaleHeadedHousehold = "Please select an option";

  return errors;
}

export function validateStep3(_state: QuestionnaireState): StepErrors {
  return {};
}

export function validateStep4(_state: QuestionnaireState): StepErrors {
  return {};
}

export function validateStep5(_state: QuestionnaireState): StepErrors {
  return {};
}

export function validateStep6(_state: QuestionnaireState): StepErrors {
  return {};
}

export function validateStep7(state: QuestionnaireState): StepErrors {
  const errors: StepErrors = {};
  const { officerAssessment: oa } = state;

  if (!oa.recommendedRiskCategory)
    errors.recommendedRiskCategory = "Please select a risk category";
  if (!oa.recommendation) errors.recommendation = "Please select a recommendation";
  if (!oa.reasonForDecision.trim())
    errors.reasonForDecision = "Reason for decision is required";
  if (!oa.officerName.trim()) errors.officerName = "Officer name is required";
  if (!oa.officerDate.trim()) errors.officerDate = "Officer date is required";

  return errors;
}

export function validateStep(step: number, state: QuestionnaireState): StepErrors {
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
    case 6:
      return validateStep6(state);
    case 7:
      return validateStep7(state);
    default:
      return {};
  }
}
