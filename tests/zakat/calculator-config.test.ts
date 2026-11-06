import { describe, expect, it } from "vitest";

import {
  livestockDue,
  pricePerGram,
  type CalculatorConfig,
  type LivestockRow,
} from "@/lib/zakat/calculator-config";

import { UAT_LIVESTOCK } from "./fixtures/uat-livestock";

/** Only the price fields matter to pricePerGram; the rest is filler. */
function configWithPrices(
  goldPricePerGramEtb: Record<string, number>,
  silverPricePerGramEtb: number,
): CalculatorConfig {
  return {
    configVersion: 1,
    pricesAsOf: "2026-11-06T00:00:00Z",
    goldPricePerGramEtb,
    silverPricePerGramEtb,
    nisab: { basis: "gold", goldGrams: 85, silverGrams: 595, valueEtb: 0, goldValueEtb: 0, silverValueEtb: 0 },
    wealth: { rate: 0.025, hawlLunarDays: 354 },
    crops: { nisabKg: 653, rainFedRate: 0.1, irrigatedRate: 0.05 },
    livestock: UAT_LIVESTOCK,
  };
}

describe("pricePerGram", () => {
  const config = configWithPrices({ "24k": 12000, "22k": 11500, "21k": 0 }, 240);

  it("uses the price the config gives for a karat", () => {
    expect(pricePerGram(config, "gold", 24)).toBe(12000);
    expect(pricePerGram(config, "gold", 22)).toBe(11500);
  });

  it("scales the 24k price by purity for a karat the config lacks", () => {
    expect(pricePerGram(config, "gold", 18)).toBe(9000);
    expect(pricePerGram(config, "gold", 14)).toBe(7000);
  });

  it("ignores a zero price and scales instead", () => {
    expect(pricePerGram(config, "gold", 21)).toBe(10500);
  });

  it("is 0 when the config has no 24k price to scale from", () => {
    expect(pricePerGram(configWithPrices({}, 240), "gold", 18)).toBe(0);
  });

  it("scales the silver price by purity", () => {
    expect(pricePerGram(config, "silver", 24)).toBe(240);
    expect(pricePerGram(config, "silver", 18)).toBe(180);
  });
});

type Due = ReturnType<typeof livestockDue>;

const items = (...pairs: [kind: string, count: number][]): Due => ({
  items: pairs.map(([kind, count]) => ({ kind, count })),
});

describe("livestockDue: sheep and goats (nisab 40)", () => {
  it.each<[number, Due]>([
    [0, null],
    [39, null],
    [40, items(["sheep", 1])],
    [120, items(["sheep", 1])],
    [121, items(["sheep", 2])],
    [200, items(["sheep", 2])],
    [201, items(["sheep", 3])],
    [300, items(["sheep", 3])],
    // Above the table, one sheep per full 100: still 3 until 400.
    [301, items(["sheep", 3])],
    [399, items(["sheep", 3])],
    [400, items(["sheep", 4])],
    [499, items(["sheep", 4])],
    [500, items(["sheep", 5])],
    [1000, items(["sheep", 10])],
  ])("%i head", (count, expected) => {
    expect(livestockDue(UAT_LIVESTOCK, "sheepGoat", count)).toEqual(expected);
  });
});

describe("livestockDue: cattle (nisab 30, one tabi' per 30, one musinnah per 40)", () => {
  it.each<[number, Due]>([
    [0, null],
    [29, null],
    [30, items(["tabi", 1])],
    [39, items(["tabi", 1])],
    [40, items(["musinnah", 1])],
    [59, items(["musinnah", 1])],
    [60, items(["tabi", 2])],
    [69, items(["tabi", 2])],
    [70, items(["musinnah", 1], ["tabi", 1])],
    [80, items(["musinnah", 2])],
    [90, items(["tabi", 3])],
    [100, items(["musinnah", 1], ["tabi", 2])],
    [110, items(["musinnah", 2], ["tabi", 1])],
  ])("%i head", (count, expected) => {
    expect(livestockDue(UAT_LIVESTOCK, "cattle", count)).toEqual(expected);
  });

  // 120 is 4 tabi' or 3 musinnah; either is valid, but nothing may be left over.
  it("covers a herd that divides both ways (120) exactly", () => {
    const due = livestockDue(UAT_LIVESTOCK, "cattle", 120);
    const covered = due && "items" in due ? due.items.reduce((sum, item) => sum + item.count * (item.kind === "tabi" ? 30 : 40), 0) : 0;
    expect(covered).toBe(120);
  });
});

describe("livestockDue: camels (nisab 5)", () => {
  it.each<[number, Due]>([
    [0, null],
    [4, null],
    [5, items(["sheep", 1])],
    [9, items(["sheep", 1])],
    [10, items(["sheep", 2])],
    [14, items(["sheep", 2])],
    [15, items(["sheep", 3])],
    [19, items(["sheep", 3])],
    [20, items(["sheep", 4])],
    [24, items(["sheep", 4])],
    [25, items(["bint_makhad", 1])],
    [35, items(["bint_makhad", 1])],
    [36, items(["bint_labun", 1])],
    [45, items(["bint_labun", 1])],
    [46, items(["hiqqah", 1])],
    [60, items(["hiqqah", 1])],
    [61, items(["jadhaah", 1])],
    [75, items(["jadhaah", 1])],
    [76, items(["bint_labun", 2])],
    [90, items(["bint_labun", 2])],
    [91, items(["hiqqah", 2])],
    [120, items(["hiqqah", 2])],
    // Above the table: one bint labun per 40 and one hiqqah per 50.
    [121, items(["bint_labun", 3])],
    [129, items(["bint_labun", 3])],
    [130, items(["bint_labun", 2], ["hiqqah", 1])],
    [140, items(["bint_labun", 1], ["hiqqah", 2])],
    [150, items(["hiqqah", 3])],
    [160, items(["bint_labun", 4])],
  ])("%i head", (count, expected) => {
    expect(livestockDue(UAT_LIVESTOCK, "camels", count)).toEqual(expected);
  });
});

describe("livestockDue: unusual input and config", () => {
  it.each(["sheepGoat", "cattle", "camels"] as const)("%s: NaN head is nothing due", (mode) => {
    expect(livestockDue(UAT_LIVESTOCK, mode, Number.NaN)).toBeNull();
  });

  it("treats a null upper bound (as JSON sends it) as open", () => {
    const rows = [{ min: 40, max: null, due: "1 sheep", dueItems: [{ kind: "sheep", count: 1 }] }] as unknown as LivestockRow[];
    expect(livestockDue({ ...UAT_LIVESTOCK, sheepGoats: rows }, "sheepGoat", 5000)).toEqual(items(["sheep", 1]));
  });

  it("returns nothing (and does not hang) when a cattle unit is zero", () => {
    const livestock = { ...UAT_LIVESTOCK, cattle: { minimum: 30, tabiPer: 0, musinnahPer: 40 } };
    expect(livestockDue(livestock, "cattle", 1_000_000)).toBeNull();
  });

  it("drops due items with a zero count", () => {
    const rows: LivestockRow[] = [{ min: 1, due: "", dueItems: [{ kind: "sheep", count: 0 }] }];
    expect(livestockDue({ ...UAT_LIVESTOCK, sheepGoats: rows }, "sheepGoat", 50)).toBeNull();
  });

  it("falls back to the service's wording for a row without items", () => {
    const rows: LivestockRow[] = [{ min: 1, due: "Consult the branch" }];
    expect(livestockDue({ ...UAT_LIVESTOCK, camels: rows }, "camels", 3)).toEqual({ text: "Consult the branch" });
  });

  it.each(["No Zakat", " no zakat ", ""])("reads the wording %j as nothing due", (due) => {
    const rows: LivestockRow[] = [{ min: 1, due }];
    expect(livestockDue({ ...UAT_LIVESTOCK, camels: rows }, "camels", 3)).toBeNull();
  });
});
