import type { AppRole, StaffRole } from "@/lib/api/types";

export const ACCESS_TOKEN_COOKIE = "ezac_access_token";
export const REFRESH_TOKEN_COOKIE = "ezac_refresh_token";

export const STAFF_ROLES = ["ADMIN", "FIELD_OFFICER"] as const;
export const APP_ROLES = ["ADMIN", "FIELD_OFFICER", "BRANCH"] as const;

export function hasStaffRole(roles: string[]): boolean {
  return STAFF_ROLES.some((role) => roles.includes(role));
}

export function isAdminRole(roles: string[]): boolean {
  return roles.includes("ADMIN");
}

export function isBranchRole(roles: string[]): boolean {
  return roles.includes("BRANCH");
}

export function filterStaffRoles(roles: string[]): StaffRole[] {
  return STAFF_ROLES.filter((role) => roles.includes(role));
}

export function filterAppRoles(roles: string[]): AppRole[] {
  return APP_ROLES.filter((role) => roles.includes(role));
}

/** Default post-login destination based on roles from /me. */
export function defaultDashboardPath(roles: string[]): string {
  if (hasStaffRole(roles)) return "/dashboard/beneficiary";
  if (isBranchRole(roles)) return "/dashboard/branch";
  return "/dashboard";
}
