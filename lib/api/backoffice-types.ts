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
