import type { Dispatch, SetStateAction } from "react";

export type NgoRegistrationStep = 1 | 2 | 3 | 4 | 5 | "review" | "success";

export type OrgType =
  | "local_ngo"
  | "cbo"
  | "islamic_society"
  | "foundation"
  | "other"
  | "";

export type RegisteredWith =
  | "ministry_of_justice"
  | "charities_societies"
  | "regional_authority"
  | "other"
  | "";

export type CoverageArea = {
  id: string;
  region: string;
  zone: string;
  woreda: string;
  urbanRural: "urban" | "rural" | "";
};

export type AidTypeKey =
  | "cash"
  | "food"
  | "medical"
  | "education"
  | "housing"
  | "livelihood"
  | "psychosocial"
  | "emergency"
  | "other";

export type ProgramDetail = {
  name: string;
  beneficiariesReached: string;
  frequency: "one_time" | "monthly" | "quarterly" | "annually" | "";
  avgValuePerBeneficiary: string;
};

export type FundingSourceEntry = {
  id: string;
  sourceKey: string;
  description: string;
  annualAmount: string;
  confirmed: "yes" | "no" | "partial" | "";
};

export type ReviewerScores = {
  legal: string;
  reach: string;
  programs: string;
  financialNeed: string;
  shariah: string;
  accountability: string;
};

export type EligibilityDecision = "approve" | "conditional" | "defer" | "reject" | "";

export type Step1State = {
  orgName: string;
  shortName: string;
  orgType: OrgType;
  orgTypeOther: string;
  yearEstablished: string;
  registrationNumber: string;
  registeredWith: RegisteredWith;
  registeredWithOther: string;
  licenseExpiryDate: string;
  tin: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactNationalId: string;
  region: string;
  zone: string;
  woreda: string;
  kebele: string;
  fullAddress: string;
  documentsToAttach: Record<string, boolean>;
};

export type Step2State = {
  regionsCount: string;
  woredasCount: string;
  kebelesCount: string;
  coverageAreas: CoverageArea[];
  beneficiaryStats: {
    totalRegistered: string;
    activeReceiving: string;
    female: string;
    children: string;
    elderly: string;
    disability: string;
    orphans: string;
    widows: string;
    idp: string;
  };
  selectionMethod: string;
  selectionMethodOther: string;
};

export type Step3State = {
  aidTypes: Record<AidTypeKey, boolean>;
  aidTypeOther: string;
  programs: Partial<Record<AidTypeKey, ProgramDetail>>;
  distributionMethods: Record<string, boolean>;
  monitoring: {
    followUpVisits: "yes" | "no" | "";
    beneficiaryFeedback: "yes" | "no" | "";
    complaintsMechanism: "yes" | "no" | "";
    writtenReports: "yes" | "no" | "";
  };
};

export type Step4State = {
  totalBudget: string;
  securedBudget: string;
  fundingSources: FundingSourceEntry[];
  fundingSourceFlags: Record<string, boolean>;
  fundingSourceOther: string;
  previousDonorAid: {
    received: "yes" | "no" | "";
    donorName: string;
    year: string;
    amount: string;
    purpose: string;
    reportingOnTime: "yes" | "no" | "";
  };
  requestedAmount: string;
  intendedUse: string;
  timeline: "3_months" | "6_months" | "12_months" | "";
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
};

export type Step5State = {
  shariahDeclarations: Record<string, boolean>;
  shariahAdvisorName: string;
  shariahContact: string;
  declarationAgreed: boolean;
  applicantName: string;
  applicantTitle: string;
  applicantDate: string;
  reviewerScores: ReviewerScores;
  decisionOverride: EligibilityDecision;
  overrideReason: string;
  reviewerName: string;
  reviewerTitle: string;
  reviewerDate: string;
  supervisorName: string;
  supervisorDate: string;
};

export type NgoRegistrationState = {
  step1: Step1State;
  step2: Step2State;
  step3: Step3State;
  step4: Step4State;
  step5: Step5State;
};

export type StepErrors = Record<string, string>;

export type NgoStepProps = {
  state: NgoRegistrationState;
  setState: Dispatch<SetStateAction<NgoRegistrationState>>;
  errors: StepErrors;
};

export const NGO_SECTION_NAMES: Record<number, string> = {
  1: "Organization Identity",
  2: "Geographic Coverage",
  3: "Aid Programs",
  4: "Financial Situation",
  5: "Shariah & Assessment",
};
