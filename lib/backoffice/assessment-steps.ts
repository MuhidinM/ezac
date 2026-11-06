import type {
  Assessment,
  AssessmentSections,
  AssessmentStatus,
  AssessmentValidation,
  DuplicateStatus,
  HouseholdMember,
  LifecycleStatus,
  PoolStatus,
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

/** Plain names for the answers the backend checks, keyed by error path. */
const FIELD_LABELS: Record<string, string> = {
  "assessmentInfo.assessmentDate": "Assessment date",
  "asnaf.categories": "Asnaf categories",
  "asnaf.otherText": "Other Asnaf category",
  "household.members": "Household members",
  "household.femaleHeadedHousehold": "Female-headed household",
  "income.otherText": "Describe other income",
  "expenditure.otherText": "Describe other spending",
  "assets.owned": "Owned assets",
  "assets.otherText": "Other assets",
  "assets.estimatedTotalValue": "Estimated total value of assets",
  "housing.tenure": "Tenure",
  "housing.roofType": "Roof",
  "housing.roofOtherText": "Other roof type",
  "housing.wallType": "Walls",
  "housing.wallOtherText": "Other wall type",
  "housing.floorType": "Floor",
  "housing.rooms": "Number of rooms",
  "housing.waterSource": "Water source",
  "housing.waterOtherText": "Other water source",
  "housing.toiletType": "Toilet",
  "housing.electricitySource": "Electricity",
  "housing.cookingFuel": "Cooking fuel",
  "housing.cookingFuelOtherText": "Other cooking fuel",
  "foodSecurity.mealsPerDay": "Meals per day",
  "foodSecurity.foodShortageLastMonth": "Food shortage in the last month",
  "foodSecurity.skippedMeals": "Skipped meals",
  "foodSecurity.receivedFoodAssistance": "Received food assistance",
  "health.chronicIllness": "Chronic illness in the household",
  "health.disability": "Disability in the household",
  "health.medicalExpensesUnaffordable": "Can't afford medical expenses",
  "health.hasHealthInsurance": "Has health insurance",
  "education.childrenSchoolAttendance": "School attendance of children aged 7–18",
  "education.nonAttendanceReasons": "Reasons for not attending school",
  "debt.outstandingDebt": "Outstanding debt",
  "debt.purposes": "What the debt was for",
  "vulnerability.vulnerabilities": "Vulnerabilities",
  "socialSupport.government": "Government programme support",
  "socialSupport.ngo": "NGO support",
  "socialSupport.family": "Family support",
  "socialSupport.mosqueCommunity": "Mosque or community support",
  "observation.housingCondition": "Housing condition",
  "observation.cleanliness": "Cleanliness",
  "observation.visibleAssets": "Visible assets",
  "observation.general": "General remarks",
  "verification.documentsVerified": "Documents verified",
  "verification.communityVerificationDone": "Community verification done",
  "verification.homeVisitDone": "Home visit done",
  "verification.emergencyProcedure": "Emergency procedure",
  "verification.emergencyReason": "Emergency reason",
  "verification.gpsRecorded": "GPS location recorded",
  "verification.gpsLat": "Latitude",
  "verification.gpsLng": "Longitude",
  "verification.photosTaken": "Photos taken",
  "verification.photoConsent": "Household consented to photos",
  "beneficiary.fullName": "Full name",
  "beneficiary.phone": "Phone",
  "beneficiary.dateOfBirth": "Date of birth",
  "beneficiary.estimatedAge": "Estimated age",
  "beneficiary.gender": "Sex",
  "beneficiary.maritalStatus": "Marital status",
  "beneficiary.religion": "Religion",
  "beneficiary.primaryLanguage": "Primary language",
  "beneficiary.zone": "Zone",
  "beneficiary.woreda": "Woreda",
  "beneficiary.kebele": "Kebele",
  "beneficiary.addressLine": "Address",
  "beneficiary.bankCode": "Bank",
  "beneficiary.bankNameOther": "Bank name",
  "beneficiary.bankAccountNumber": "Bank account number",
  "beneficiary.bankAccountHolderName": "Bank account holder name",
  documents: "Documents",
};

const MEMBER_LABELS: Record<string, string> = {
  name: "name",
  relationship: "relationship",
  sex: "sex",
  age: "age",
  occupation: "occupation",
  monthlyIncome: "monthly income",
  attendsSchool: "attends school",
};

/** "roofOtherText" → "Roof other text": a last resort for paths we have no name for. */
function humanize(key: string) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_.]/g, " ").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A plain label for an error path like `debt.purposes` or `household.members[2].age`. */
export function fieldLabel(field: string): string {
  const member = /^household\.members\[(\d+)\](?:\.(\w+))?/.exec(field);
  if (member) {
    const number = Number(member[1]) + 1;
    const part = member[2] ? (MEMBER_LABELS[member[2]] ?? humanize(member[2]).toLowerCase()) : null;
    return part ? `Household member ${number}: ${part}` : `Household member ${number}`;
  }
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const [section, ...rest] = field.split(".");
  if (section === "income" && rest.length) return `Income: ${humanize(rest.join(".")).toLowerCase()}`;
  if (section === "expenditure" && rest.length) return `Spending: ${humanize(rest.join(".")).toLowerCase()}`;
  return humanize(rest.length ? rest.join(".") : section);
}

/** "required when there is outstanding debt" → "Required when there is outstanding debt". */
export function issueText(message: string): string {
  const text = message.trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Required";
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

/** The breadcrumb for an assessment: the household's name, else the assessment number. */
export function assessmentCrumb(assessment: Assessment | null | undefined): string | null {
  if (!assessment) return null;
  return assessment.applicant?.fullName?.trim() || assessment.assessmentNumber?.trim() || null;
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
  /** The household's live pool status (from its assessment or a fast-track entry). */
  poolStatus?: PoolStatus | null;
};

/**
 * Pool states that mean the household is in, or on its way into, the pool.
 * DISBURSED is left out: a paid-out household has left the pool.
 */
const LIVE_POOL: PoolStatus[] = ["AWAITING_POOL", "POOLED"];

export function isLivePoolStatus(status: PoolStatus | null | undefined): status is PoolStatus {
  return !!status && LIVE_POOL.includes(status);
}

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
