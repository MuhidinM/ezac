import type { AppRole } from "@/lib/api/types";

export const ACCESS_TOKEN_COOKIE = "ezac_access_token";
export const REFRESH_TOKEN_COOKIE = "ezac_refresh_token";

export const STAFF_ROLES = ["ADMIN", "FIELD_OFFICER"] as const;
export const APP_ROLES = ["ADMIN", "FIELD_OFFICER", "BRANCH"] as const;

function normalizedRoleSet(roles: string[]): Set<string> {
  return new Set(roles.map((role) => role.trim().toUpperCase()).filter(Boolean));
}

export function hasStaffRole(roles: string[]): boolean {
  const set = normalizedRoleSet(roles);
  return STAFF_ROLES.some((role) => set.has(role));
}

export function isAdminRole(roles: string[]): boolean {
  return normalizedRoleSet(roles).has("ADMIN");
}

export function isBranchRole(roles: string[]): boolean {
  return normalizedRoleSet(roles).has("BRANCH");
}

export function filterAppRoles(roles: string[]): AppRole[] {
  const set = normalizedRoleSet(roles);
  return APP_ROLES.filter((role) => set.has(role));
}

/** Default post-login destination based on roles from /me. */
export function defaultDashboardPath(roles: string[]): string {
  if (isBranchRole(roles) && !hasStaffRole(roles)) return "/dashboard/branch";
  return "/dashboard/beneficiary";
}
