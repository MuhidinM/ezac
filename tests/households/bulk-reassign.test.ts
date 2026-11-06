import { describe, expect, it, vi } from "vitest";

import type { FieldOfficer } from "@/lib/api/backoffice-types";
import { type ReassignItem, groupByBranch, officersForBranch, runInOrder } from "@/lib/backoffice/bulk-reassign";

function assessment(id: string, branchId: string | null, branchName?: string): ReassignItem {
  return { id, beneficiaryId: `b${id}`, status: "DRAFT", branchId, branchName };
}

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

describe("groupByBranch", () => {
  it("splits assessments by branch in first-seen order", () => {
    const groups = groupByBranch([
      assessment("1", "3", "Bole Branch"),
      assessment("2", "7", "QA Test Branch"),
      assessment("3", "3", "Bole Branch"),
    ]);
    expect(groups.map((group) => [group.branchId, group.branchName, group.items.map((item) => item.id)])).toEqual([
      ["3", "Bole Branch", ["1", "3"]],
      ["7", "QA Test Branch", ["2"]],
    ]);
  });

  it("names a branch without a name, and keeps rows without a branch together", () => {
    const groups = groupByBranch([assessment("1", "9"), assessment("2", null)]);
    expect(groups.map((group) => group.branchName)).toEqual(["Branch #9", "Unknown branch"]);
    expect(groups[1].branchId).toBe("");
  });
});

describe("officersForBranch", () => {
  const officers = [
    officer("5", true, [{ id: "3" }]),
    officer("6", true, [{ id: "3", active: false }, { id: "7" }]),
    officer("7", false, [{ id: "3" }]),
    officer("3", true, [{ id: "3" }]),
  ];

  it("offers active officers with an active assignment in the branch, never the officer being emptied", () => {
    expect(officersForBranch(officers, "3", "3").map((item) => item.id)).toEqual(["5"]);
    expect(officersForBranch(officers, "7", "3").map((item) => item.id)).toEqual(["6"]);
  });

  it("offers every other active officer when the branch is unknown", () => {
    expect(officersForBranch(officers, "", "3").map((item) => item.id)).toEqual(["5", "6"]);
  });
});

describe("runInOrder", () => {
  it("runs every task in order and reports progress", async () => {
    const seen: number[] = [];
    const progress = vi.fn();
    const result = await runInOrder([1, 2, 3], async (item) => void seen.push(item), progress);
    expect(seen).toEqual([1, 2, 3]);
    expect(progress.mock.calls).toEqual([[1], [2], [3]]);
    expect(result).toEqual({ done: 3, failed: null });
  });

  it("stops at the first failure and leaves the rest untried", async () => {
    const seen: number[] = [];
    const refused = new Error("Officer does not work in this branch");
    const result = await runInOrder([1, 2, 3], async (item) => {
      if (item === 2) throw refused;
      seen.push(item);
    });
    expect(seen).toEqual([1]);
    expect(result).toEqual({ done: 1, failed: { item: 2, error: refused } });
  });
});
