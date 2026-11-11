import { describe, expect, it } from "vitest";

import { draftHasChanges, draftRules } from "@/lib/zakat/rules-draft";

const oldVersion = {
  nisab: { basis: "gold", goldGrams: 85, silverGrams: 595 },
  livestockAverageUnitPriceEtb: { sheep: 9000, goat: 7000, cattle: 60000, camel: 180000 },
};

describe("draftRules", () => {
  it("drops the old livestock prices and leaves the source untouched", () => {
    const draft = draftRules(oldVersion);
    expect(draft).toEqual({ nisab: { basis: "gold", goldGrams: 85, silverGrams: 595 } });
    expect(oldVersion.livestockAverageUnitPriceEtb).toBeDefined();
    (draft.nisab as { goldGrams: number }).goldGrams = 90;
    expect(oldVersion.nisab.goldGrams).toBe(85);
  });
});

describe("draftHasChanges with old livestock prices", () => {
  it("doesn't count the dropped field as a change", () => {
    expect(draftHasChanges(draftRules(oldVersion), "", oldVersion)).toBe(false);
  });

  it("still sees a real change", () => {
    const draft = draftRules(oldVersion);
    (draft.nisab as { basis: string }).basis = "silver";
    expect(draftHasChanges(draft, "", oldVersion)).toBe(true);
  });
});
