import type { HouseholdMember, QuestionnaireState } from "./types";

function createMember(): HouseholdMember {
  return {
    id: crypto.randomUUID(),
    name: "",
    sex: "",
    age: "",
    relationship: "",
    occupation: "",
    monthlyIncome: "",
  };
}

export const INCOME_SOURCES = [
  "salaryWages",
  "selfEmployment",
  "agriculture",
  "livestock",
  "smallBusiness",
  "casualLabour",
  "remittances",
  "pension",
  "other",
] as const;

export const INCOME_LABELS: Record<(typeof INCOME_SOURCES)[number], string> = {
  salaryWages: "Salary / Wages",
  selfEmployment: "Self Employment",
  agriculture: "Agriculture",
  livestock: "Livestock",
  smallBusiness: "Small Business",
  casualLabour: "Casual Labour",
  remittances: "Remittances",
  pension: "Pension",
  other: "Other",
};

export const EXPENDITURE_ITEMS = [
  "food",
  "rent",
  "utilities",
  "education",
  "medical",
  "transportation",
  "clothing",
  "debtRepayment",
  "other",
] as const;

export const EXPENDITURE_LABELS: Record<(typeof EXPENDITURE_ITEMS)[number], string> = {
  food: "Food",
  rent: "Rent",
  utilities: "Utilities",
  education: "Education",
  medical: "Medical",
  transportation: "Transportation",
  clothing: "Clothing",
  debtRepayment: "Debt Repayment",
  other: "Other",
};

export const ASSET_ITEMS = [
  "house",
  "agriculturalLand",
  "businessPremises",
  "livestock",
  "vehicle",
  "motorcycle",
  "cart",
  "television",
  "refrigerator",
  "computer",
  "mobilePhone",
  "savings",
  "other",
] as const;

export const ASSET_LABELS: Record<(typeof ASSET_ITEMS)[number], string> = {
  house: "House",
  agriculturalLand: "Agricultural Land",
  businessPremises: "Business Premises",
  livestock: "Livestock",
  vehicle: "Vehicle",
  motorcycle: "Motorcycle",
  cart: "Cart",
  television: "Television",
  refrigerator: "Refrigerator",
  computer: "Computer",
  mobilePhone: "Mobile Phone",
  savings: "Savings",
  other: "Other",
};

export const DEBT_PURPOSES = [
  "medical",
  "food",
  "business",
  "education",
  "housing",
  "other",
] as const;

export const VULNERABILITY_FLAGS = [
  "widow",
  "orphan",
  "disability",
  "elderlyLivingAlone",
  "childHeadedHousehold",
  "refugee",
  "internallyDisplaced",
  "disasterAffected",
  "chronicIllness",
  "femaleHeadedHousehold",
  "noStableEmployment",
] as const;

export const VULNERABILITY_LABELS: Record<(typeof VULNERABILITY_FLAGS)[number], string> = {
  widow: "Widow",
  orphan: "Orphan",
  disability: "Disability",
  elderlyLivingAlone: "Elderly Living Alone",
  childHeadedHousehold: "Child-headed Household",
  refugee: "Refugee",
  internallyDisplaced: "Internally Displaced",
  disasterAffected: "Disaster Affected",
  chronicIllness: "Chronic Illness",
  femaleHeadedHousehold: "Female-headed Household",
  noStableEmployment: "No Stable Employment",
};

export const SOCIAL_SUPPORT_ITEMS = [
  "governmentSupport",
  "ngoSupport",
  "familySupport",
  "mosqueCommunitySupport",
] as const;

export const SOCIAL_SUPPORT_LABELS: Record<(typeof SOCIAL_SUPPORT_ITEMS)[number], string> = {
  governmentSupport: "Government support",
  ngoSupport: "NGO support",
  familySupport: "Family support",
  mosqueCommunitySupport: "Mosque / Community support",
};

export const DOCUMENTS_VERIFIED = [
  "nationalId",
  "medicalReport",
  "disabilityCertificate",
  "debtDocuments",
  "schoolCertificate",
  "other",
] as const;

export const NON_ATTENDANCE_REASONS = [
  "poverty",
  "disability",
  "distance",
  "other",
] as const;

function emptyRecord<T extends readonly string[]>(keys: T): Record<T[number], string> {
  return Object.fromEntries(keys.map((k) => [k, ""])) as Record<T[number], string>;
}

function falseRecord<T extends readonly string[]>(keys: T): Record<T[number], boolean> {
  return Object.fromEntries(keys.map((k) => [k, false])) as Record<T[number], boolean>;
}

function emptySocialSupport(): Record<(typeof SOCIAL_SUPPORT_ITEMS)[number], "yes" | "no" | ""> {
  return Object.fromEntries(
    SOCIAL_SUPPORT_ITEMS.map((k) => [k, ""]),
  ) as Record<(typeof SOCIAL_SUPPORT_ITEMS)[number], "yes" | "no" | "">;
}

export function createInitialState(): QuestionnaireState {
  return {
    assessment: {
      assessmentNumber: "",
      beneficiaryId: "",
      region: "",
      zone: "",
      woreda: "",
      kebele: "",
      dateOfAssessment: new Date().toISOString().slice(0, 10),
      assessmentOfficerName: "",
      supervisorName: "",
    },
    applicant: {
      fullName: "",
      sex: "",
      age: "",
      maritalStatus: "",
      telephone: "",
      nationalId: "",
      religion: "",
      primaryLanguage: "",
    },
    asnaf: {
      poor: false,
      needy: false,
      debtor: false,
      wayfarer: false,
      zakatAdministrator: false,
      reconciliationOfHearts: false,
      fiSabilillah: false,
      other: false,
      otherSpecify: "",
    },
    household: {
      members: [createMember()],
      childrenUnder18: "",
      olderPersons60Plus: "",
      personsWithDisabilities: "",
      chronicallyIllMembers: "",
      pregnantOrLactatingWomen: "",
      femaleHeadedHousehold: "",
    },
    finance: {
      income: emptyRecord(INCOME_SOURCES),
      expenditure: emptyRecord(EXPENDITURE_ITEMS),
      assets: falseRecord(ASSET_ITEMS),
      assetsOther: "",
      estimatedTotalAssetValue: "",
    },
    housing: {
      housingType: "",
      roofMaterial: "",
      wallMaterial: "",
      floorMaterial: "",
      numberOfRooms: "",
      waterSource: "",
      toiletFacility: "",
      electricity: "",
      cookingFuel: "",
    },
    healthFood: {
      mealsPerDay: "",
      foodShortagePreviousMonth: "",
      skippedMealsDueToLack: "",
      receivedFoodAssistance: "",
      chronicIllnessInHousehold: "",
      disabilityInHousehold: "",
      medicalExpensesDifficult: "",
      hasHealthInsurance: "",
      childrenAttendingSchool: "",
      nonAttendanceReasons: falseRecord(NON_ATTENDANCE_REASONS),
    },
    debtVulnerability: {
      outstandingDebtAmount: "",
      debtPurpose: falseRecord(DEBT_PURPOSES),
      vulnerabilityFlags: falseRecord(VULNERABILITY_FLAGS),
      socialSupport: emptySocialSupport(),
    },
    officerAssessment: {
      housingCondition: "",
      householdCleanliness: "",
      visibleAssets: "",
      generalObservations: "",
      documentsVerified: falseRecord(DOCUMENTS_VERIFIED),
      communityVerificationConducted: "",
      homeVisitCompleted: "",
      gpsRecorded: "",
      photographsTaken: "",
      recommendedRiskCategory: "",
      compositePovertyScore: "",
      recommendation: "",
      reasonForDecision: "",
      officerName: "",
      officerDate: new Date().toISOString().slice(0, 10),
      supervisorName: "",
      supervisorDate: "",
    },
  };
}

export { createMember };
