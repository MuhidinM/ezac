import type {
  Assessment,
  AssessmentSections,
  AssessmentStatus,
  HouseholdMember,
  SectionKey,
} from "@/lib/api/backoffice-types";

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type StepDefinition = {
  id: StepId;
  title: string;
  /** Lettered sections from the paper form, e.g. "A + C". */
  letters: string;
  description: string;
  sections: SectionKey[];
};

/** The seven data steps from the API guide (§6.2) plus review & submit. */
export const STEPS: StepDefinition[] = [
  {
    id: 1,
    title: "Assessment & Asnaf",
    letters: "A, C",
    description: "Assessment date and the Asnaf categories that apply.",
    sections: ["assessmentInfo", "asnaf"],
  },
  {
    id: 2,
    title: "Household",
    letters: "D",
    description: "Everyone who lives and eats in the household.",
    sections: ["household"],
  },
  {
    id: 3,
    title: "Income & assets",
    letters: "E, F, G",
    description: "Monthly income and spending in ETB, and what the household owns.",
    sections: ["income", "expenditure", "assets"],
  },
  {
    id: 4,
    title: "Housing",
    letters: "H",
    description: "Tenure, construction, water, sanitation and energy.",
    sections: ["housing"],
  },
  {
    id: 5,
    title: "Food, health & education",
    letters: "I, J, K",
    description: "Food security, health and school attendance.",
    sections: ["foodSecurity", "health", "education"],
  },
  {
    id: 6,
    title: "Debt & vulnerability",
    letters: "L, M, N",
    description: "Outstanding debt, vulnerabilities and support received.",
    sections: ["debt", "vulnerability", "socialSupport"],
  },
  {
    id: 7,
    title: "Observation & verification",
    letters: "O, P",
    description: "Officer observations, verification steps, documents and photos.",
    sections: ["observation", "verification"],
  },
  {
    id: 8,
    title: "Review & submit",
    letters: "",
    description: "Check completeness, review the score and submit.",
    sections: [],
  },
];

export const EDITABLE_STATUSES: AssessmentStatus[] = ["DRAFT", "RETURNED"];

export function isEditable(status: AssessmentStatus) {
  return EDITABLE_STATUSES.includes(status);
}

/** Step that owns an error path like `housing.roofType`; 0 = basic details. */
export function stepForField(field: string): StepId | 0 {
  const section = field.split(/[.[]/)[0];
  if (section === "beneficiary") return 0;
  if (section === "documents") return 7;
  const step = STEPS.find((item) => item.sections.includes(section as SectionKey));
  return step?.id ?? 8;
}

// ---- Draft state -------------------------------------------------------------

export type AssessmentDraft = AssessmentSections;

export function emptyMember(): HouseholdMember {
  return {
    name: "",
    sex: null,
    age: null,
    relationship: null,
    occupation: null,
    monthlyIncome: null,
    hasDisability: false,
    chronicallyIll: false,
    pregnantOrLactating: false,
    attendsSchool: null,
  };
}

/** Fill every section so step forms never deal with undefined. */
export function draftFromAssessment(assessment: Assessment): AssessmentDraft {
  return {
    assessmentInfo: { assessmentDate: assessment.assessmentInfo?.assessmentDate ?? null },
    asnaf: {
      categories: assessment.asnaf?.categories ?? [],
      otherText: assessment.asnaf?.otherText ?? null,
    },
    household: {
      members: (assessment.household?.members ?? []).map((member) => ({
        ...emptyMember(),
        ...member,
      })),
      femaleHeadedHousehold: assessment.household?.femaleHeadedHousehold ?? null,
    },
    income: {
      salary: null,
      selfEmployment: null,
      agriculture: null,
      livestock: null,
      smallBusiness: null,
      casualLabour: null,
      remittances: null,
      pension: null,
      other: null,
      otherText: null,
      ...assessment.income,
    },
    expenditure: {
      food: null,
      rent: null,
      utilities: null,
      education: null,
      medical: null,
      transportation: null,
      clothing: null,
      debtRepayment: null,
      other: null,
      otherText: null,
      ...assessment.expenditure,
    },
    assets: {
      owned: [],
      otherText: null,
      estimatedTotalValue: null,
      ...assessment.assets,
    },
    housing: {
      tenure: null,
      roofType: null,
      roofOtherText: null,
      wallType: null,
      wallOtherText: null,
      floorType: null,
      rooms: null,
      waterSource: null,
      waterOtherText: null,
      toiletType: null,
      electricitySource: null,
      cookingFuel: null,
      cookingFuelOtherText: null,
      ...assessment.housing,
    },
    foodSecurity: {
      mealsPerDay: null,
      foodShortageLastMonth: null,
      skippedMeals: null,
      receivedFoodAssistance: null,
      ...assessment.foodSecurity,
    },
    health: {
      chronicIllness: null,
      disability: null,
      medicalExpensesUnaffordable: null,
      hasHealthInsurance: null,
      ...assessment.health,
    },
    education: {
      childrenSchoolAttendance: null,
      nonAttendanceReasons: [],
      ...assessment.education,
    },
    debt: { outstandingDebt: null, purposes: [], ...assessment.debt },
    vulnerability: { vulnerabilities: [], ...assessment.vulnerability },
    socialSupport: {
      government: null,
      ngo: null,
      family: null,
      mosqueCommunity: null,
      ...assessment.socialSupport,
    },
    observation: {
      housingCondition: null,
      cleanliness: null,
      visibleAssets: null,
      general: null,
      ...assessment.observation,
    },
    verification: {
      documentsVerified: [],
      communityVerificationDone: null,
      homeVisitDone: null,
      emergencyProcedure: false,
      emergencyReason: null,
      gpsRecorded: null,
      gpsLat: null,
      gpsLng: null,
      photosTaken: null,
      photoConsent: null,
      ...assessment.verification,
    },
  };
}

export function hasSchoolAgeChildren(members: HouseholdMember[]) {
  return members.some(
    (member) => member.relationship !== "self" && member.age !== null && member.age >= 7 && member.age <= 18,
  );
}

/**
 * PATCH body for a step. Each section sent replaces the stored one, so whole
 * sections go out; derived data (household summary) is left to the backend.
 */
export function stepBody(step: StepId, draft: AssessmentDraft) {
  const definition = STEPS.find((item) => item.id === step);
  const body: Partial<Record<SectionKey, unknown>> = {};
  for (const section of definition?.sections ?? []) {
    if (section === "household") {
      body.household = {
        members: draft.household.members,
        femaleHeadedHousehold: draft.household.femaleHeadedHousehold,
      };
    } else if (section === "education" && !hasSchoolAgeChildren(draft.household.members)) {
      // The backend sets not_applicable when there are no children aged 7–18.
      continue;
    } else {
      body[section] = draft[section];
    }
  }
  return body;
}
