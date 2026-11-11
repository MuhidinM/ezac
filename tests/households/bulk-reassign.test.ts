import { describe, expect, it } from "vitest";

import type { FieldOfficer } from "@/lib/api/backoffice-types";
import { ApiError } from "@/lib/api/errors";
import {
  activeBranchIds,
  officersForBranches,
  reassignFailures,
  reassignedCount,
} from "@/lib/backoffice/bulk-reassign";

function officer(id: string, active: boolean, branches: { id: string; active?: boolean }[]): FieldOfficer {
  return {
    id,
    fullName: `Officer ${id}`,
    phone: null,
    email: null,
    active,
    assignments: branches.map((branch, index) => ({
      id: `${id}-${index}`,
      branchId: branch.id,
      active: branch.active ?? true,
    })),
  };
}

describe("activeBranchIds", () => {
  it("lists the branches of active assignments once each", () => {
    const item = officer("1", true, [{ id: "3" }, { id: "5", active: false }, { id: "3" }]);
    expect(activeBranchIds(item)).toEqual(["3"]);
  });

  it("skips region-wide assignments without a branch", () => {
    const item: FieldOfficer = {
      ...officer("1", true, []),
      assignments: [{ id: "a", branchId: null, region: "Afar", active: true }],
    };
    expect(activeBranchIds(item)).toEqual([]);
  });
});

describe("officersForBranches", () => {
  const officers = [
    officer("5", true, [{ id: "3" }]),
    officer("6", true, [{ id: "3", active: false }, { id: "7" }]),
    officer("7", false, [{ id: "3" }]),
    officer("3", true, [{ id: "3" }]),
  ];

  it("offers active officers working in one of the branches, never the officer being emptied", () => {
    expect(officersForBranches(officers, ["3"], "3").map((item) => item.id)).toEqual(["5"]);
    expect(officersForBranches(officers, ["3", "7"], "3").map((item) => item.id)).toEqual(["5", "6"]);
  });

  it("offers every other active officer when the officer has no branch", () => {
    expect(officersForBranches(officers, [], "3").map((item) => item.id)).toEqual(["5", "6"]);
  });
});

describe("reassignFailures", () => {
  it("reads the blocked assessments from a 409 REASSIGN_FAILED", () => {
    const error = new ApiError(
      "Some assessments cannot be reassigned",
      409,
      [],
      { failures: [{ assessmentId: 12, reason: "Officer does not work in Bole Branch" }, "Locked", null] },
      "REASSIGN_FAILED",
    );
    expect(reassignFailures(error)).toEqual([
      { assessmentId: "12", message: "Officer does not work in Bole Branch" },
      { assessmentId: null, message: "Locked" },
    ]);
  });

  it("is empty for other errors", () => {
    expect(reassignFailures(new Error("offline"))).toEqual([]);
    expect(reassignFailures(new ApiError("Bad", 400))).toEqual([]);
  });
});

describe("reassignedCount", () => {
  it("reads a count or a list of moved ids", () => {
    expect(reassignedCount({ reassigned: 4 })).toBe(4);
    expect(reassignedCount({ assessmentIds: ["1", "2"] })).toBe(2);
    expect(reassignedCount(["1"])).toBe(1);
    expect(reassignedCount(3)).toBe(3);
  });

  it("is null when the answer doesn't say", () => {
    expect(reassignedCount(null)).toBeNull();
    expect(reassignedCount({ message: "done" })).toBeNull();
  });
});
