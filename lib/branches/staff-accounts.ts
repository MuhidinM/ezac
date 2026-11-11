/**
 * Staff sign-in accounts (ADMIN, BRANCH and FIELD_OFFICER logins) and their
 * open sessions, as auth-service lists them for ADMIN:
 * `GET /api/auth/v1/admin/staff` and `GET /api/auth/v1/admin/users/{sub}/sessions`.
 */

export type StaffRoleFilter = "" | "ADMIN" | "BRANCH" | "FIELD_OFFICER";

export type StaffAccount = {
  /** Sign-in account id. */
  sub: string;
  username: string;
  displayName: string | null;
  email: string | null;
  roles: string[];
  active: boolean;
  passwordChangeRequired: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type StaffSession = {
  id: string;
  ipAddress: string | null;
  startedAt: string | null;
  lastAccessAt: string | null;
  clients: string[];
};

export const STAFF_ROLE_LABELS: Record<Exclude<StaffRoleFilter, "">, string> = {
  ADMIN: "Administrator",
  BRANCH: "Branch officer",
  FIELD_OFFICER: "Field officer",
};

/** The EZAC roles of an account, as labels, in a fixed order. Other roles are left out. */
export function staffRoleLabels(roles: readonly string[] | null | undefined): string[] {
  const held = new Set(roles ?? []);
  return (Object.keys(STAFF_ROLE_LABELS) as (keyof typeof STAFF_ROLE_LABELS)[])
    .filter((role) => held.has(role))
    .map((role) => STAFF_ROLE_LABELS[role]);
}

const ROLES = new Set<string>(["ADMIN", "BRANCH", "FIELD_OFFICER"]);
const ACTIVE = new Set<string>(["true", "false"]);
const MAX_SEARCH = 100;

/**
 * The upstream query for the staff list, from whatever the browser sent:
 * known roles only, `active` as true/false, a trimmed search, page from 1 and
 * a limit of 1-200 (the backend's range).
 */
export function staffListQuery(params: URLSearchParams): URLSearchParams {
  const query = new URLSearchParams();
  const role = params.get("role") ?? "";
  if (ROLES.has(role)) query.set("role", role);
  const active = params.get("active") ?? "";
  if (ACTIVE.has(active)) query.set("active", active);
  const search = (params.get("search") ?? "").trim().slice(0, MAX_SEARCH);
  if (search) query.set("search", search);
  const page = Number(params.get("page"));
  if (Number.isInteger(page) && page >= 1) query.set("page", String(page));
  const limit = Number(params.get("limit"));
  if (Number.isInteger(limit) && limit >= 1) query.set("limit", String(Math.min(limit, 200)));
  return query;
}

/** The name to show for an account: its display name, else its login. */
export function staffName(account: Pick<StaffAccount, "displayName" | "username">): string {
  return account.displayName?.trim() || account.username;
}

/** Whether the account is the signed-in user's own (ending its sessions signs them out too). */
export function isOwnAccount(account: Pick<StaffAccount, "username">, username: string | null | undefined): boolean {
  return !!username && account.username.trim().toLowerCase() === username.trim().toLowerCase();
}

/**
 * Branch and field officer accounts can't change their own name (ADMIN can):
 * their names belong to their branch or officer record, which an administrator
 * edits (the backend refuses the change with DISPLAY_NAME_NOT_EDITABLE).
 */
export function canEditOwnName(roles: readonly string[]): boolean {
  if (roles.includes("ADMIN")) return true;
  return !roles.includes("BRANCH") && !roles.includes("FIELD_OFFICER");
}
