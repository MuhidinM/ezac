import { describe, expect, it } from "vitest";

import {
  hasBankAccount,
  notEligibleByHousehold,
  openPayoutState,
  POOL_LIST_DEFAULTS,
  poolBlock,
  poolFilterErrors,
  poolQuery,
  poolStepBack,
} from "@/lib/zakat/pool-list";

const query = (patch: Partial<typeof POOL_LIST_DEFAULTS>) => poolQuery({ ...POOL_LIST_DEFAULTS, ...patch }, 270, 25);

describe("poolQuery", () => {
  it("sends only page and limit for the default list", () => {
    expect(query({}).params.toString()).toBe("page=1&limit=25");
  });

  it("sends the sort field and direction together", () => {
    expect(query({ sort: "approvedAt:asc" }).params.toString()).toBe("page=1&limit=25&sort=approvedAt&order=asc");
    expect(query({ sort: "score:desc" }).params.toString()).toBe("page=1&limit=25&sort=score");
  });

  it("falls back to the default order for an unknown sort", () => {
    expect(query({ sort: "priority:asc" }).params.toString()).toBe("page=1&limit=25");
  });

  it("sends set filters and leaves out an invalid score range", () => {
    const { params, errors } = query({ region: "Afar", scoreMin: "200", scoreMax: "100", page: 2 });
    expect(params.toString()).toBe("page=2&limit=25&region=Afar");
    expect(errors.score).toMatch(/lowest score/);
  });
});

describe("poolFilterErrors", () => {
  it("checks scores against the maximum and the date order", () => {
    expect(poolFilterErrors({ scoreMin: "-1", scoreMax: "", approvedFrom: "", approvedTo: "" }, 270).score).toMatch(/0 to 270/);
    expect(poolFilterErrors({ scoreMin: "", scoreMax: "", approvedFrom: "2026-11-05", approvedTo: "2026-11-01" }, 270).approved).toBeDefined();
    expect(poolFilterErrors({ scoreMin: "10", scoreMax: "20", approvedFrom: "", approvedTo: "" }, 270)).toEqual({});
  });
});

describe("poolStepBack", () => {
  const page = (items: number, totalPages: number) => ({ items: Array.from({ length: items }), pagination: { totalPages } });

  it("stays when the page has rows, is the first, or hasn't loaded", () => {
    expect(poolStepBack(page(3, 2), 2)).toBeNull();
    expect(poolStepBack(page(0, 0), 1)).toBeNull();
    expect(poolStepBack(undefined, 3)).toBeNull();
  });

  it("goes back to the last page that has rows", () => {
    expect(poolStepBack(page(0, 2), 3)).toBe(2);
    expect(poolStepBack(page(0, 1), 5)).toBe(1);
    expect(poolStepBack(page(0, 0), 2)).toBe(1);
  });
});

describe("pool rows", () => {
  const row = { verificationStatus: "verified" as const, duplicateStatus: "NONE" as const, hasBankAccount: true };

  it("reads an open payout as open, none or unknown", () => {
    expect(openPayoutState({ openPayout: true })).toBe("open");
    expect(openPayoutState({ openPayout: false })).toBe("none");
    // Left out when payment-service didn't answer: unknown, never "no".
    expect(openPayoutState({})).toBe("unknown");
  });

  it("blocks pooling from the row's own fields", () => {
    expect(poolBlock(row)).toBeNull();
    expect(poolBlock({ ...row, verificationStatus: "pending" })).toMatch(/Not verified/);
    expect(poolBlock({ ...row, duplicateStatus: "POTENTIAL" })).toMatch(/duplicate/);
    expect(poolBlock({ ...row, hasBankAccount: false })).toMatch(/No bank account/);
    // Older rows without the flag fall back to the account itself.
    expect(hasBankAccount({ bankAccount: { accountNumber: "1000" } as never })).toBe(true);
  });

  it("reads NOT_ELIGIBLE reasons per household from every shape", () => {
    const list = [
      { beneficiaryId: "12", reason: "NOT_VERIFIED" },
      { beneficiaryId: 12, reason: "NO_BANK_ACCOUNT" },
      { beneficiaryId: "13", reason: "SOMETHING_NEW" },
    ];
    const expected = {
      "12": ["Not verified yet. Verify the household first.", "No bank account on file."],
      "13": ["SOMETHING_NEW"],
    };
    expect(notEligibleByHousehold(list)).toEqual(expected);
    expect(notEligibleByHousehold({ errors: list })).toEqual(expected);
    expect(notEligibleByHousehold(null, [{ field: "beneficiaryId[12]", message: "Not verified" }])).toEqual({ "12": ["Not verified"] });
    expect(notEligibleByHousehold(null)).toEqual({});
  });
});
