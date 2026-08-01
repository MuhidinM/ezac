import type { Dispatch, SetStateAction } from "react";

export type QuestionnaireStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "review" | "success";

export type HouseholdMember = {
  id: string;
  name: string;
  sex: "male" | "female" | "";
  age: string;
  relationship: string;
  occupation: string;
  monthlyIncome: string;
};

export type AssessmentInfo = {
  assessmentNumber: string;
  beneficiaryId: string;
  region: string;
  zone: string;
  woreda: string;
  kebele: string;
  dateOfAssessment: string;
  assessmentOfficerName: string;
  supervisorName: string;
};

export type ApplicantInfo = {
  fullName: string;
  sex: "male" | "female" | "";
  age: string;
  maritalStatus: "single" | "married" | "widowed" | "divorced" | "separated" | "";
  telephone: string;
  nationalId: string;
  religion: string;
  primaryLanguage: string;
};

export type AsnafCategory = {
  poor: boolean;
  needy: boolean;
  debtor: boolean;
  wayfarer: boolean;
  zakatAdministrator: boolean;
  reconciliationOfHearts: boolean;
  fiSabilillah: boolean;
  other: boolean;
  otherSpecify: string;
};

export type HouseholdSummary = {
  members: HouseholdMember[];
  childrenUnder18: string;
  olderPersons60Plus: string;
  personsWithDisabilities: string;
  chronicallyIllMembers: string;
  pregnantOrLactatingWomen: string;
  femaleHeadedHousehold: "yes" | "no" | "";
};

export type FinanceSection = {
  income: Record<string, string>;
  expenditure: Record<string, string>;
  assets: Record<string, boolean>;
  assetsOther: string;
  estimatedTotalAssetValue: string;
};

export type HousingSection = {
  housingType: "owned" | "rented" | "borrowed" | "temporary_shelter" | "";
  roofMaterial: "iron_sheet" | "thatch" | "plastic" | "other" | "";
  wallMaterial: "concrete" | "wood" | "mud" | "other" | "";
  floorMaterial: "cement" | "earth" | "tile" | "";
  numberOfRooms: string;
  waterSource: "piped" | "protected_well" | "unprotected_well" | "river" | "other" | "";
  toiletFacility: "flush" | "pit_latrine" | "none" | "";
  electricity: "grid" | "solar" | "generator" | "none" | "";
  cookingFuel: "electricity" | "gas" | "charcoal" | "firewood" | "other" | "";
};

export type HealthFoodSection = {
  mealsPerDay: "one" | "two" | "three_or_more" | "";
  foodShortagePreviousMonth: "yes" | "no" | "";
  skippedMealsDueToLack: "yes" | "no" | "";
  receivedFoodAssistance: "yes" | "no" | "";
  chronicIllnessInHousehold: "yes" | "no" | "";
  disabilityInHousehold: "yes" | "no" | "";
  medicalExpensesDifficult: "yes" | "no" | "";
  hasHealthInsurance: "yes" | "no" | "";
  childrenAttendingSchool: "all" | "some" | "none" | "";
  nonAttendanceReasons: Record<string, boolean>;
};

export type DebtVulnerabilitySection = {
  outstandingDebtAmount: string;
  debtPurpose: Record<string, boolean>;
  vulnerabilityFlags: Record<string, boolean>;
  socialSupport: Record<string, "yes" | "no" | "">;
};

export type OfficerAssessment = {
  housingCondition: string;
  householdCleanliness: string;
  visibleAssets: string;
  generalObservations: string;
  documentsVerified: Record<string, boolean>;
  communityVerificationConducted: "yes" | "no" | "";
  homeVisitCompleted: "yes" | "no" | "";
  gpsRecorded: "yes" | "no" | "";
  photographsTaken: "yes" | "no" | "";
  recommendedRiskCategory: "high" | "medium" | "low" | "";
  compositePovertyScore: string;
  recommendation: "approve" | "conditional" | "defer" | "reject" | "";
  reasonForDecision: string;
  officerName: string;
  officerDate: string;
  supervisorName: string;
  supervisorDate: string;
};

export type QuestionnaireState = {
  assessment: AssessmentInfo;
  applicant: ApplicantInfo;
  asnaf: AsnafCategory;
  household: HouseholdSummary;
  finance: FinanceSection;
  housing: HousingSection;
  healthFood: HealthFoodSection;
  debtVulnerability: DebtVulnerabilitySection;
  officerAssessment: OfficerAssessment;
};

export type StepErrors = Record<string, string>;

export type StepProps = {
  state: QuestionnaireState;
  setState: Dispatch<SetStateAction<QuestionnaireState>>;
  errors: StepErrors;
};
