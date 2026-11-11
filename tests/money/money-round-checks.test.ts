import { describe, expect, it } from "vitest";

import { POOL_LIST_DEFAULTS, poolFilterParams, poolQuery } from "@/lib/zakat/pool-list";
import { cleanReceivingAccount, receivingAccountProblem } from "@/lib/zakat/payments";
import { draftHasChanges } from "@/lib/zakat/rules-draft";

describe("poolFilterParams", () => {
  it("keeps the filters and drops paging and order", () => {
    const { params } = poolQuery({ ...POOL_LIST_DEFAULTS, region: "Afar", sort: "approvedAt:asc", page: 3 }, 270, 25);
    expect(poolFilterParams(params).toString()).toBe("region=Afar");
    // The list's own query is left alone.
    expect(params.get("page")).toBe("3");
  });

  it("leaves out a score range the list leaves out", () => {
    const { params } = poolQuery({ ...POOL_LIST_DEFAULTS, scoreMin: "200", scoreMax: "100" }, 270, 25);
    expect(poolFilterParams(params).has("scoreMin")).toBe(false);
  });
});

describe("receivingAccountProblem", () => {
  it("allows blank and 6 to 20 digits, with spaces or dashes", () => {
    expect(receivingAccountProblem("")).toBeNull();
    expect(receivingAccountProblem("123456")).toBeNull();
    expect(receivingAccountProblem("1000-1234 5678")).toBeNull();
    expect(receivingAccountProblem("1".repeat(20))).toBeNull();
  });

  it("refuses too short, too long and non-digits", () => {
    expect(receivingAccountProblem("12345")).toMatch(/6 to 20/);
    expect(receivingAccountProblem("1".repeat(21))).toMatch(/6 to 20/);
    expect(receivingAccountProblem("12345a")).toMatch(/digits only/);
  });

  it("saves the account without spaces or dashes", () => {
    expect(cleanReceivingAccount(" 1000-1234 5678 ")).toBe("100012345678");
  });
});

describe("draftHasChanges", () => {
  const source = { nisab: "gold", rates: { cash: 0.025 } };

  it("is false with no draft or an untouched copy", () => {
    expect(draftHasChanges(null, "", source)).toBe(false);
    expect(draftHasChanges(structuredClone(source), "  ", source)).toBe(false);
  });

  it("is true once a value or the name changes", () => {
    expect(draftHasChanges({ ...source, rates: { cash: 0.03 } }, "", source)).toBe(true);
    expect(draftHasChanges(structuredClone(source), "New rates", source)).toBe(true);
  });
});
