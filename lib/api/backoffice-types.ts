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

export type AssessmentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RETURNED"
  | "SUPERVISOR_APPROVED"
  | "APPROVED"
  | "CONDITIONALLY_APPROVED"
  | "DEFERRED"
  | "REJECTED";

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
