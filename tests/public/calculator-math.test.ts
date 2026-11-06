import { describe, expect, it } from "vitest";

import type { CalculatorConfig } from "@/lib/zakat/calculator-config";
import {
  FALLBACK_LIVESTOCK,
  FALLBACK_RULES,
  INITIAL_STATE,
  calculateZakat,
  isPriceStale,
  parseAmount,
  ruleFigures,
  type CalculatorState,
  type CategoryKey,
  type ZakatResult,
} from "@/lib/zakat/calculator-math";
import { livestockDue } from "@/lib/zakat/calculator-config";
import { readCalculatorConfig } from "@/lib/zakat/calculator-read";

import { UAT_CALCULATOR_CONFIG } from "./fixtures/calculator-config";
import golden from "./fixtures/calculator-golden.json";

const config = readCalculatorConfig(UAT_CALCULATOR_CONFIG) as CalculatorConfig;

type GoldenCase = {
  config: "uat" | null;
  added: string[];
  form: Partial<CalculatorState>;
  expected: Omit<ZakatResult, "rules" | "deductibleLiabilities">;
};
const cases = golden.cases as GoldenCase[];

const run = (item: Pick<GoldenCase, "added" | "form" | "config">) =>
  calculateZakat({ ...INITIAL_STATE, ...item.form }, item.added as CategoryKey[], item.config ? config : null);

/** The result without the fields the old code didn't return as such. */
function comparable(result: ZakatResult) {
  const { rules, deductibleLiabilities, ...rest } = result;
  void rules;
  void deductibleLiabilities;
  return rest;
}

describe("calculateZakat matches the calculator it was moved out of", () => {
  it("has a config and recorded cases to check", () => {
    expect(config).not.toBeNull();
    expect(cases.filter((item) => item.config === "uat").length).toBeGreaterThan(50);
  });

  const withConfig = cases.map((item, index) => [index, item] as const).filter(([, item]) => item.config === "uat");
  it.each(withConfig)("official rates, case %i", (_, item) => {
    expect(comparable(run(item))).toEqual(item.expected);
  });

  // Without the official rates the Nisab in birr is unknown (logic-public-1):
  // everything that doesn't weigh against it is unchanged.
  const withoutConfig = cases.map((item, index) => [index, item] as const).filter(([, item]) => item.config === null);
  it.each(withoutConfig)("no official rates, case %i: figures that don't need the Nisab", (_, item) => {
    const result = run(item);
    const { expected } = item;
    expect({
      cashBase: result.cashBase,
      goldGrossGrams: result.goldGrossGrams,
      goldFineGrams: result.goldFineGrams,
      silverGrossGrams: result.silverGrossGrams,
      silverFineGrams: result.silverFineGrams,
      agricultureDue: result.agricultureDue,
      livestockOwed: result.livestockOwed,
      rikazDue: result.rikazDue,
      adjustedAnnualBase: result.adjustedAnnualBase,
      hasInputErrors: result.hasInputErrors,
      hasInKind: result.hasInKind,
      hasMonetaryCategory: result.hasMonetaryCategory,
      showHawl: result.showHawl,
      readyToPay: result.readyToPay,
    }).toEqual({
      cashBase: expected.cashBase,
      goldGrossGrams: expected.goldGrossGrams,
      goldFineGrams: expected.goldFineGrams,
      silverGrossGrams: expected.silverGrossGrams,
      silverFineGrams: expected.silverFineGrams,
      agricultureDue: expected.agricultureDue,
      livestockOwed: expected.livestockOwed,
      rikazDue: expected.rikazDue,
      adjustedAnnualBase: expected.adjustedAnnualBase,
      hasInputErrors: expected.hasInputErrors,
      hasInKind: expected.hasInKind,
      hasMonetaryCategory: expected.hasMonetaryCategory,
      showHawl: expected.showHawl,
      readyToPay: false,
    });
  });

  it("uses the same fixed rule figures when the config is missing", () => {
    expect(ruleFigures(null)).toEqual({
      zakatRate: 0.025,
      goldNisabGrams: 85,
      silverNisabGrams: 595,
      agriNisabKg: 653,
      rainFedRate: 0.1,
      mixedRate: 0.075,
      irrigatedRate: 0.05,
      rikazRate: 0.2,
    });
    expect(ruleFigures(null)).toEqual(FALLBACK_RULES);
  });

  it("takes the official figures from the config", () => {
    expect(ruleFigures(config)).toEqual({ ...FALLBACK_RULES, zakatRate: config.wealth.rate, agriNisabKg: config.crops.nisabKg });
  });
});

describe("one livestock implementation", () => {
  const modes = Object.keys(golden.livestock) as ("sheepGoat" | "cattle" | "camels")[];
  it.each(modes)("the offline %s table gives what the old offline code gave, 0 to 1000 head", (mode) => {
    const runs = golden.livestock[mode] as [number, number, unknown][];
    for (const [from, to, due] of runs) {
      for (let count = from; count <= to; count++) {
        expect(livestockDue(FALLBACK_LIVESTOCK, mode, count), `${count} head`).toEqual(due);
      }
    }
  });

  it("the offline tables are the official ones zakat-engine serves", () => {
    expect(FALLBACK_LIVESTOCK).toEqual(config.livestock);
  });
});

describe("without the official rates", () => {
  const noConfig = (form: Partial<CalculatorState>, added: CategoryKey[]) =>
    calculateZakat({ ...INITIAL_STATE, ...form }, added, null);

  it("does not judge wealth against a Nisab it doesn't have", () => {
    const result = noConfig({ cashOnHand: "500000" }, ["cash"]);
    expect(result.nisabEtb).toBeNull();
    expect(result.nisabBasis).toBeNull();
    expect(result.meetsNisab).toBeNull();
    expect(result.annualDue).toBeNull();
    expect(result.shares.cash).toBeNull();
    expect(result.totalEtbDue).toBeNull();
    expect(result.somethingDue).toBe(true);
    expect(result.readyToPay).toBe(false);
  });

  it("still knows nothing is due without a full Hawl", () => {
    const result = noConfig({ cashOnHand: "500000", hawlCompleted: false }, ["cash"]);
    expect(result.annualDue).toBe(0);
    expect(result.totalEtbDue).toBe(0);
    expect(result.somethingDue).toBe(false);
  });

  it("still knows an empty form owes nothing", () => {
    const result = noConfig({}, ["cash", "debts"]);
    expect(result.meetsNisab).toBe(false);
    expect(result.totalEtbDue).toBe(0);
    expect(result.somethingDue).toBe(false);
  });

  it("works out Rikaz, which has no Nisab", () => {
    const result = noConfig({ rikazValue: "100000" }, ["rikazMinerals"]);
    expect(result.rikazDue).toBe(20000);
    expect(result.mineralsDue).toBe(0);
    expect(result.totalEtbDue).toBe(20000);
  });

  it("leaves minerals unknown, since they weigh against the Nisab", () => {
    const result = noConfig({ rikazValue: "100000", mineralsValue: "300000" }, ["rikazMinerals"]);
    expect(result.mineralsDue).toBeNull();
    expect(result.totalEtbDue).toBeNull();
  });

  it("leaves gold and silver unvalued", () => {
    const result = noConfig({ metalItems: [{ id: "a", metal: "gold", grams: "100", karat: 24 }] }, ["gold"]);
    expect(result.preciousMetalsValue).toBeNull();
    expect(result.goldFineGrams).toBe(100);
    expect(result.adjustedAnnualBase).toBe(0);
  });

  // 100 g of gold is well above the Nisab; without prices it must not read as "ETB 0, below Nisab".
  it("does not call unvalued gold or silver below the Nisab", () => {
    const result = noConfig({ metalItems: [{ id: "a", metal: "silver", grams: "700", karat: 24 }] }, ["gold"]);
    expect(result.meetsNisab).toBeNull();
    expect(result.shares.gold).toBeNull();
    expect(result.totalEtbDue).toBeNull();
    expect(result.somethingDue).toBe(true);
    expect(result.readyToPay).toBe(false);
  });

  it("still knows an empty gold row owes nothing", () => {
    const result = noConfig({}, ["gold"]);
    expect(result.meetsNisab).toBe(false);
    expect(result.totalEtbDue).toBe(0);
  });

  it("still knows unvalued gold owes nothing without a full Hawl", () => {
    const result = noConfig(
      { metalItems: [{ id: "a", metal: "gold", grams: "100", karat: 24 }], hawlCompleted: false },
      ["gold"],
    );
    expect(result.totalEtbDue).toBe(0);
    expect(result.somethingDue).toBe(false);
  });

  it("works out crops and livestock in kind", () => {
    const result = noConfig(
      { cropsHarvestKg: "1000", irrigationMode: "mixed", livestockMode: "camels", camelsCount: "130" },
      ["agriculture", "livestock"],
    );
    expect(result.agricultureDue).toBe(75);
    expect(result.livestockOwed).toEqual({
      items: [
        { kind: "bint_labun", count: 2 },
        { kind: "hiqqah", count: 1 },
      ],
    });
    expect(result.totalEtbDue).toBe(0);
    expect(result.somethingDue).toBe(true);
    expect(result.readyToPay).toBe(false);
  });
});

describe("with the official rates", () => {
  it("is due from the Nisab up, on wealth less debts", () => {
    const at = calculateZakat({ ...INITIAL_STATE, cashOnHand: "1813285.45" }, ["cash"], config);
    expect(at.meetsNisab).toBe(true);
    expect(at.totalEtbDue).toBeCloseTo(45332.14, 2);
    expect(at.readyToPay).toBe(true);

    const below = calculateZakat(
      { ...INITIAL_STATE, cashOnHand: "2,500,000", shortTermPersonalLiabilities: "700,000" },
      ["cash", "debts"],
      config,
    );
    expect(below.adjustedAnnualBase).toBe(1_800_000);
    expect(below.meetsNisab).toBe(false);
    expect(below.totalEtbDue).toBe(0);
  });

  it("blocks the total on an unreadable amount in an added category only", () => {
    expect(calculateZakat({ ...INITIAL_STATE, cashOnHand: "12,5" }, ["cash"], config).hasInputErrors).toBe(true);
    expect(calculateZakat({ ...INITIAL_STATE, cashOnHand: "12,5" }, ["business"], config).hasInputErrors).toBe(false);
  });
});

describe("parseAmount", () => {
  it.each([
    ["", 0, null],
    ["1,500,000", 1_500_000, null],
    ["٢٥٠٠٫٥", 2500.5, null],
    ["1.2.3", 0, "decimalPoints"],
    ["1.2,3", 0, "decimalCommas"],
    ["12,5", 0, "commaGrouping"],
    ["1234567890123456", 0, "tooLarge"],
  ] as const)("%j", (raw, value, error) => {
    expect(parseAmount(raw)).toEqual({ value, error });
  });

  it("wants whole animals", () => {
    expect(parseAmount("40.0", { wholeNumber: true })).toEqual({ value: 40, error: null });
    expect(parseAmount("40.5", { wholeNumber: true })).toEqual({ value: 0, error: "wholeNumber" });
    expect(parseAmount("12345678", { wholeNumber: true })).toEqual({ value: 0, error: "tooLarge" });
  });
});

describe("isPriceStale", () => {
  const asOf = "2026-11-06T03:00:01Z";
  const at = (iso: string) => Date.parse(iso);

  it("is fresh up to 48 hours", () => {
    expect(isPriceStale(asOf, at("2026-11-06T09:00:00Z"))).toBe(false);
    expect(isPriceStale(asOf, at("2026-11-08T03:00:01Z"))).toBe(false);
  });

  it("is stale after 48 hours", () => {
    expect(isPriceStale(asOf, at("2026-11-08T03:00:02Z"))).toBe(true);
  });

  it("is never stale when the date is missing or unreadable", () => {
    expect(isPriceStale("", at("2030-01-01T00:00:00Z"))).toBe(false);
    expect(isPriceStale(null, at("2030-01-01T00:00:00Z"))).toBe(false);
    expect(isPriceStale("yesterday", at("2030-01-01T00:00:00Z"))).toBe(false);
  });
});
