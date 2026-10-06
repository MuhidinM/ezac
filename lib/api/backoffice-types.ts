/**
 * Types for the means-testing back office (beneficiary-service v1):
 * field officers, assessments, scoring and duplicate review.
 * Ids are strings; money is ETB per month.
 */

// ---- Field officers ---------------------------------------------------------

export type StaffAssignment = {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  region?: string | null;
  active: boolean;
  createdAt?: string | null;
  deactivatedAt?: string | null;
};

export type FieldOfficer = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  username?: string | null;
  active: boolean;
  assignments: StaffAssignment[];
  createdAt?: string | null;
  /** DRAFT + RETURNED assessments. */
  openAssessments?: number | null;
  submittedThisMonth?: number | null;
};

/** One-time credentials from a password reset. */
export type PasswordResetResponse = {
  username?: string | null;
  initialPassword: string;
  passwordChangeRequired: boolean;
};

// ---- Staff "me" ---------------------------------------------------------------

export type StaffBranchOption = {
  id: string;
  name: string;
  region?: string | null;
  zone?: string | null;
  woreda?: string | null;
  active: boolean;
  codeStats?: { available: number } | null;
};

export type StaffMe = {
  sub: string;
  roles: string[];
  fieldOfficer?: Omit<FieldOfficer, "assignments"> | null;
  branch?: StaffBranchOption | null;
  assignments?: StaffAssignment[];
  /** Branches the caller can register beneficiaries into. */
  branches: StaffBranchOption[];
};

// ---- Lifecycle ----------------------------------------------------------------

export type LifecycleAction = "INACTIVE" | "GRADUATED" | "EXITED" | "REINSTATED";

export type LifecycleHistory = {
  lifecycleStatus: LifecycleStatus;
  history: {
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    changedBy?: string | null;
    changedByName?: string | null;
    changedAt: string;
  }[];
};

export type CreateFieldOfficerBody = {
  fullName: string;
  phone: string;
  email: string;
  branchId?: string;
  region?: string;
};

export type CreateFieldOfficerResponse = {
  officer: FieldOfficer;
  username: string;
  initialPassword: string;
  passwordChangeRequired: boolean;
};

// ---- Beneficiary lifecycle, risk and duplicates -----------------------------

export type LifecycleStatus =
  | "PENDING_ASSESSMENT"
  | "UNDER_ASSESSMENT"
  | "ASSESSED"
  | "ACTIVE"
  | "INACTIVE"
  | "GRADUATED"
  | "EXITED";

export type RiskCategory = "HIGH" | "MEDIUM" | "LOW";

export type DuplicateStatus =
  | "NONE"
  | "POTENTIAL"
  | "CONFIRMED_DISTINCT"
  | "CONFIRMED_DUPLICATE";

/**
 * The branch supervisor's review is the final decision (no committee step);
 * approved households are then pooled for disbursement by ADMIN.
 */
export type AssessmentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RETURNED"
  | "APPROVED"
  | "REJECTED"
  | "DEFERRED"
  | "CANCELLED";

export type DuplicateCandidate = {
  id: string;
  fullName: string | null;
  phone: string | null;
  nationalId: string | null;
  dateOfBirth: string | null;
  woreda?: string | null;
  kebele?: string | null;
  branchName?: string | null;
  createdAt?: string | null;
  duplicateStatus?: DuplicateStatus | null;
};

export type DuplicateReview = {
  duplicateStatus: DuplicateStatus;
  reasons: ("national_id" | "phone" | "name_dob" | string)[];
  candidates: DuplicateCandidate[];
};

export type DuplicateResolution = "CONFIRMED_DISTINCT" | "CONFIRMED_DUPLICATE";

// ---- Assessments ------------------------------------------------------------

export type OfficerRecommendation = "approve" | "conditional_approval" | "defer" | "reject";

export type BranchDecision = "APPROVED" | "REJECTED" | "DEFERRED";

export type HouseholdMember = {
  name: string | null;
  sex: "male" | "female" | null;
  age: number | null;
  relationship: string | null;
  occupation: string | null;
  monthlyIncome: number | null;
  hasDisability: boolean | null;
  chronicallyIll: boolean | null;
  pregnantOrLactating: boolean | null;
  attendsSchool: boolean | null;
};

/** Backend-derived counts; keys are shown generically. */
export type HouseholdSummary = Record<string, number | boolean | null>;

export type AssessmentSections = {
  assessmentInfo: { assessmentDate: string | null };
  asnaf: { categories: string[]; otherText: string | null };
  household: {
    members: HouseholdMember[];
    femaleHeadedHousehold: boolean | null;
    summary?: HouseholdSummary | null;
  };
  income: {
    salary: number | null;
    selfEmployment: number | null;
    agriculture: number | null;
    livestock: number | null;
    smallBusiness: number | null;
    casualLabour: number | null;
    remittances: number | null;
    pension: number | null;
    other: number | null;
    otherText: string | null;
  };
  expenditure: {
    food: number | null;
    rent: number | null;
    utilities: number | null;
    education: number | null;
    medical: number | null;
    transportation: number | null;
    clothing: number | null;
    debtRepayment: number | null;
    other: number | null;
    otherText: string | null;
  };
  assets: { owned: string[]; otherText: string | null; estimatedTotalValue: number | null };
  housing: {
    tenure: string | null;
    roofType: string | null;
    roofOtherText: string | null;
    wallType: string | null;
    wallOtherText: string | null;
    floorType: string | null;
    rooms: number | null;
    waterSource: string | null;
    waterOtherText: string | null;
    toiletType: string | null;
    electricitySource: string | null;
    cookingFuel: string | null;
    cookingFuelOtherText: string | null;
  };
  foodSecurity: {
    mealsPerDay: string | null;
    foodShortageLastMonth: boolean | null;
    skippedMeals: boolean | null;
    receivedFoodAssistance: boolean | null;
  };
  health: {
    chronicIllness: boolean | null;
    disability: boolean | null;
    medicalExpensesUnaffordable: boolean | null;
    hasHealthInsurance: boolean | null;
  };
  education: { childrenSchoolAttendance: string | null; nonAttendanceReasons: string[] };
  debt: { outstandingDebt: number | null; purposes: string[] };
  vulnerability: { vulnerabilities: string[] };
  socialSupport: {
    government: boolean | null;
    ngo: boolean | null;
    family: boolean | null;
    mosqueCommunity: boolean | null;
  };
  observation: {
    housingCondition: string | null;
    cleanliness: string | null;
    visibleAssets: string | null;
    general: string | null;
  };
  verification: {
    documentsVerified: string[];
    communityVerificationDone: boolean | null;
    homeVisitDone: boolean | null;
    emergencyProcedure: boolean | null;
    emergencyReason: string | null;
    gpsRecorded: boolean | null;
    gpsLat: number | null;
    gpsLng: number | null;
    photosTaken: boolean | null;
    photoConsent: boolean | null;
  };
};

export type SectionKey = keyof AssessmentSections;

export type AssessmentTotals = {
  totalMonthlyIncome?: number | null;
  totalMonthlyExpenditure?: number | null;
  membersMonthlyIncome?: number | null;
  [key: string]: number | null | undefined;
};

export type ScoreSection = {
  key: string;
  label: string;
  score: number;
  max: number;
  reason?: string | null;
  inputs?: Record<string, unknown> | null;
};

export type AssessmentScore = {
  id?: string;
  status?: "CURRENT" | "SUPERSEDED" | string;
  totalScore: number;
  maxScore: number;
  riskCategory: RiskCategory;
  preliminaryRecommendation?: OfficerRecommendation | null;
  scoringConfigVersion?: number | null;
  calculatedAt?: string | null;
  calculatedBy?: string | null;
  calculatedByName?: string | null;
  sections: ScoreSection[];
  dataQualityFlags?: (string | { code?: string; message?: string })[] | null;
};

export type AssessmentDocument = {
  id: string;
  documentType: string;
  originalFilename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  uploadedAt?: string | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
};

export type AssessmentApplicant = {
  id?: string;
  beneficiaryId?: string;
  bin?: string | null;
  fullName?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  dateOfBirth?: string | null;
  estimatedAge?: number | null;
  gender?: string | null;
  maritalStatus?: string | null;
  religion?: string | null;
  primaryLanguage?: string | null;
  primaryLanguageOther?: string | null;
  region?: string | null;
  zone?: string | null;
  woreda?: string | null;
  kebele?: string | null;
  addressLine?: string | null;
};

export type AssessmentSignOffs = {
  submittedBy?: string | null;
  submittedByName?: string | null;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  cancelledBy?: string | null;
  cancelledByName?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
};

export type Assessment = Partial<AssessmentSections> & {
  id: string;
  assessmentNumber?: string | null;
  beneficiaryId: string;
  status: AssessmentStatus;
  applicant?: AssessmentApplicant | null;
  assessmentInfo?: AssessmentSections["assessmentInfo"] & {
    region?: string | null;
    zone?: string | null;
    woreda?: string | null;
    kebele?: string | null;
    officerSub?: string | null;
    officerName?: string | null;
    supervisorSub?: string | null;
    supervisorName?: string | null;
    branchId?: string | null;
    branchName?: string | null;
  };
  totals?: AssessmentTotals | null;
  warningAcknowledgements?: Record<string, string> | null;
  recommendation?: {
    officerRecommendation?: OfficerRecommendation | null;
    recommendationReason?: string | null;
    systemRecommendation?: OfficerRecommendation | null;
  } | null;
  signOffs?: AssessmentSignOffs | null;
  documents?: AssessmentDocument[] | null;
  score?: AssessmentScore | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AssessmentListItem = {
  id: string;
  assessmentNumber?: string | null;
  beneficiaryId: string;
  beneficiaryName?: string | null;
  fullName?: string | null;
  bin?: string | null;
  status: AssessmentStatus;
  assessmentDate?: string | null;
  totalScore?: number | null;
  maxScore?: number | null;
  riskCategory?: RiskCategory | null;
  branchName?: string | null;
  officerName?: string | null;
  submittedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ValidationIssue = { field: string; message: string };
export type ValidationWarning = { code: string; message: string };

export type AssessmentValidation = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationWarning[];
  sectionsComplete: Partial<Record<SectionKey | "beneficiary", boolean>>;
  householdSummary?: HouseholdSummary | null;
  totals?: AssessmentTotals | null;
  scorePreview?: AssessmentScore | null;
};

export type SubmitAssessmentBody = {
  officerRecommendation: OfficerRecommendation;
  recommendationReason: string;
  warningAcknowledgements: Record<string, string>;
};

// ---- Analytics ----------------------------------------------------------------

export type DateRange = { from: string; to: string };

export type OfficerStats = {
  officerId: string;
  fullName: string;
  range: DateRange;
  byStatus: Partial<Record<AssessmentStatus, number>>;
  averageDaysToSubmit: number | null;
  /** Share (0–1) of submitted assessments returned at least once. */
  returnRate: number | null;
  submittedInRange: number;
  coverage: {
    assignmentId: string;
    branchId?: string | null;
    branchName?: string | null;
    region?: string | null;
    beneficiaries: number;
    pendingAssessment: number;
    assessed: number;
  }[];
};
