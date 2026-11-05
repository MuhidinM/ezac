import type {
  Assessment,
  AssessmentSections,
  AssessmentStatus,
  AssessmentValidation,
  DuplicateStatus,
  HouseholdMember,
  LifecycleStatus,
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

type SectionsComplete = AssessmentValidation["sectionsComplete"];

/** A data step is complete when none of its sections is incomplete and at least one is known complete. */
export function isStepComplete(definition: StepDefinition, complete: SectionsComplete) {
  return (
    definition.sections.every((section) => complete[section] !== false) &&
    definition.sections.some((section) => complete[section] === true)
  );
}

/** Where a draft resumes: the first data step still incomplete, else review & submit. */
export function firstIncompleteStep(complete: SectionsComplete): StepId {
  const step = STEPS.find((item) => item.id !== 8 && !isStepComplete(item, complete));
  return step?.id ?? 8;
}

// ---- Reading the detail response ----------------------------------------------

/** The household an assessment is about; the detail endpoint only nests it in `applicant`. */
export function assessmentBeneficiaryId(assessment: Assessment): string | null {
  const id = assessment.beneficiaryId ?? assessment.applicant?.beneficiaryId;
  return id === null || id === undefined || String(id) === "" ? null : String(id);
}

/** The officer's reason for their recommendation (sent as `reason`, written as `recommendationReason`). */
export function recommendationReasonOf(assessment: Assessment): string | null {
  const recommendation = assessment.recommendation;
  return recommendation?.reason || recommendation?.recommendationReason || null;
}

/** The backend prefixes an ADMIN send-back's comment with this. */
const HEAD_OFFICE_SEND_BACK = /^\s*sent back by admin\s*:\s*/i;

/**
 * The latest review comment, and whether head office (not the branch) sent
 * the assessment back. The comment comes without the backend's prefix.
 */
export function reviewInfo(assessment: Assessment) {
  const raw = assessment.signOffs?.reviewComment ?? null;
  const byHeadOffice = !!raw && HEAD_OFFICE_SEND_BACK.test(raw);
  const comment = raw ? raw.replace(HEAD_OFFICE_SEND_BACK, "").trim() || null : null;
  return { byHeadOffice, comment };
}

/**
 * Who made the latest review. Falls back to the branch supervisor's name only
 * when the reviewer is (or may be) that supervisor, never for a head-office send-back.
 */
export function reviewerName(assessment: Assessment): string | null {
  const signOffs = assessment.signOffs ?? {};
  if (signOffs.reviewedByName) return signOffs.reviewedByName;
  if (reviewInfo(assessment).byHeadOffice) return null;
  const supervisorSub = assessment.assessmentInfo?.supervisorSub;
  if (signOffs.reviewedBy && supervisorSub && signOffs.reviewedBy !== supervisorSub) return null;
  return assessment.assessmentInfo?.supervisorName ?? null;
}

// ---- What a household can still go through -----------------------------------

/** The parts of a beneficiary record that decide whether it can be assessed or whitelisted. */
export type HouseholdState = {
  beneficiaryType?: string | null;
  verificationStatus?: string | null;
  lifecycleStatus?: LifecycleStatus | null;
  duplicateStatus?: DuplicateStatus | null;
};

/** Why an assessment can't be started for this household, or null. Mirrors the backend's refusals. */
export function assessmentBlockedReason(household: HouseholdState | null | undefined): string | null {
  if (!household) return null;
  if (household.beneficiaryType && household.beneficiaryType !== "individual") {
    return "Only individuals are assessed.";
  }
  if (household.verificationStatus === "rejected") {
    return "This registration was rejected, so the household can't be assessed.";
  }
  if (household.duplicateStatus === "CONFIRMED_DUPLICATE") return "Confirmed duplicates can't be assessed.";
  if (household.duplicateStatus === "POTENTIAL") return "Resolve the possible duplicate first.";
  if (household.lifecycleStatus === "EXITED") {
    return "This household has exited the programme, so it can't be assessed.";
  }
  if (household.lifecycleStatus === "GRADUATED") {
    return "This household has graduated, so it can't be assessed.";
  }
  if (household.lifecycleStatus === "INACTIVE") {
    return "This household is inactive. An admin must reinstate it before it can be assessed.";
  }
  return null;
}

/** Why this household can't be whitelisted, or null. Mirrors the backend's refusals. */
export function whitelistBlockedReason(household: HouseholdState | null | undefined): string | null {
  if (!household) return null;
  if (household.verificationStatus === "rejected") {
    return "This registration was rejected, so the household can't be whitelisted.";
  }
  if (household.duplicateStatus === "CONFIRMED_DUPLICATE") {
    return "This is a confirmed duplicate, so it can't be whitelisted.";
  }
  if (household.lifecycleStatus === "EXITED") {
    return "This household has exited the programme, so it can't be whitelisted.";
  }
  if (household.lifecycleStatus === "GRADUATED") {
    return "This household has graduated, so it can't be whitelisted.";
  }
  return null;
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

/**
 * Section M. The detail endpoint returns a top-level `vulnerabilities` array
 * while PATCH takes `vulnerability.vulnerabilities`; read either, so a
 * re-save never sends an empty list over the stored one.
 */
function vulnerabilitiesOf(assessment: Assessment): string[] {
  if (Array.isArray(assessment.vulnerabilities)) return assessment.vulnerabilities;
  const nested = assessment.vulnerability?.vulnerabilities;
  return Array.isArray(nested) ? nested : [];
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
    vulnerability: { vulnerabilities: vulnerabilitiesOf(assessment) },
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
