import { describe, expect, it } from "vitest";

import type { StaffAssignment } from "@/lib/api/backoffice-types";
import { assignmentHistory } from "@/lib/branches/assignments";
import { oneTimeCredentials } from "@/lib/branches/credentials";
import {
  canEditOwnName,
  isOwnAccount,
  staffListQuery,
  staffName,
  staffRoleLabels,
} from "@/lib/branches/staff-accounts";
import { versionOf, withVersion } from "@/lib/branches/version";

describe("versionOf / withVersion", () => {
  it("reads a whole, non-negative version", () => {
    expect(versionOf({ version: 0 })).toBe(0);
    expect(versionOf({ version: 3 })).toBe(3);
    expect(versionOf({ version: -1 })).toBeUndefined();
    expect(versionOf({ version: "2" })).toBeUndefined();
    expect(versionOf(null)).toBeUndefined();
  });

  it("adds the version to an edit body, or leaves the body alone", () => {
    expect(withVersion({ active: false }, { version: 2 })).toEqual({ active: false, version: 2 });
    expect(withVersion({ active: false }, {})).toEqual({ active: false });
  });
});

describe("oneTimeCredentials", () => {
  it("prefers the username the backend sent", () => {
    expect(oneTimeCredentials({ username: "+251911000000", initialPassword: "Tmp#12345a", passwordChangeRequired: true }, "x")).toEqual({
      login: "+251911000000",
      initialPassword: "Tmp#12345a",
      passwordChangeRequired: true,
    });
  });

  it("falls back to the phone, and marks a replayed create as having no password", () => {
    expect(oneTimeCredentials({ initialPassword: null }, " +251922000000 ")).toEqual({
      login: "+251922000000",
      initialPassword: null,
      passwordChangeRequired: true,
    });
  });
});

describe("assignmentHistory", () => {
  const rows: StaffAssignment[] = [
    { id: "1", branchId: "3", active: false, createdAt: "2026-01-01T00:00:00Z", deactivatedAt: "2026-02-01T00:00:00Z" },
    { id: "2", branchId: "5", active: false, createdAt: "2026-02-01T00:00:00Z", deactivatedAt: "2026-03-01T00:00:00Z" },
    { id: "3", branchId: "3", active: true, createdAt: "2026-03-01T00:00:00Z" },
    { id: "4", branchId: "3", active: false, createdAt: "2025-06-01T00:00:00Z", deactivatedAt: "2025-12-01T00:00:00Z" },
  ];

  it("keeps every ended row, the same branch more than once, newest first", () => {
    expect(assignmentHistory(rows).map((row) => row.id)).toEqual(["2", "1", "4"]);
  });

  it("doesn't reorder the list it was given", () => {
    assignmentHistory(rows);
    expect(rows.map((row) => row.id)).toEqual(["1", "2", "3", "4"]);
  });
});

describe("staff accounts", () => {
  it("builds a clean upstream query", () => {
    const query = staffListQuery(
      new URLSearchParams({ role: "BRANCH", active: "yes", search: "  bole ", page: "2", limit: "500", other: "x" }),
    );
    expect(query.toString()).toBe("role=BRANCH&search=bole&page=2&limit=200");
    expect(staffListQuery(new URLSearchParams({ role: "DONOR", page: "0" })).toString()).toBe("");
  });

  it("labels EZAC roles only, in a fixed order", () => {
    expect(staffRoleLabels(["offline_access", "FIELD_OFFICER", "ADMIN"])).toEqual(["Administrator", "Field officer"]);
    expect(staffRoleLabels(null)).toEqual([]);
  });

  it("names an account by its display name, else its login", () => {
    expect(staffName({ displayName: " Amina ", username: "amina" })).toBe("Amina");
    expect(staffName({ displayName: null, username: "+251911" })).toBe("+251911");
  });

  it("recognises the signed-in user's own account", () => {
    expect(isOwnAccount({ username: "Platform.Admin" }, "platform.admin")).toBe(true);
    expect(isOwnAccount({ username: "approver.admin" }, "platform.admin")).toBe(false);
    expect(isOwnAccount({ username: "x" }, null)).toBe(false);
  });

  it("lets only admins and role-less accounts change their own name", () => {
    expect(canEditOwnName(["ADMIN"])).toBe(true);
    expect(canEditOwnName(["ADMIN", "BRANCH"])).toBe(true);
    expect(canEditOwnName(["BRANCH"])).toBe(false);
    expect(canEditOwnName(["FIELD_OFFICER"])).toBe(false);
    expect(canEditOwnName([])).toBe(true);
  });
});
