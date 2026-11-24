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
  emptyCropItem,
  type LivestockMode,
  type ZakatResult,
} from "@/lib/zakat/calculator-math";
import { livestockDue } from "@/lib/zakat/calculator-config";
import { readCalculatorConfig } from "@/lib/zakat/calculator-read";

import { UAT_CALCULATOR_CONFIG } from "./fixtures/calculator-config";
import golden from "./fixtures/calculator-golden.json";

const config = readCalculatorConfig(UAT_CALCULATOR_CONFIG) as CalculatorConfig;

/**
 * The recorded cases come from the calculator with one harvest and one herd.
 * Their form is turned into today's shape (one crop line, one herd) and the
 * result back into theirs (livestockOwed), so the same sums are checked.
 */
type OldForm = Partial<CalculatorState> & {
  cropsHarvestKg?: string;
  irrigationMode?: "natural" | "mixed" | "artificial";
  livestockMode?: LivestockMode;
  livestockFreelyGrazing?: boolean;
  livestockUsedForWork?: boolean;
  sheepGoatCount?: string;
  cattleCount?: string;
  camelsCount?: string;
};
type GoldenCase = {
  config: "uat" | null;
  added: string[];
  form: OldForm;
  expected: Record<string, unknown>;
};
const cases = golden.cases as GoldenCase[];

const OLD_METHOD = { natural: "rain", mixed: "mixed", artificial: "irrigated" } as const;
const OLD_COUNT = { sheepGoat: "sheepGoatCount", cattle: "cattleCount", camels: "camelsCount" } as const;

function fromOldForm(form: OldForm): CalculatorState {
  const {
    cropsHarvestKg = "",
    irrigationMode = "natural",
    livestockMode = "sheepGoat",
    livestockFreelyGrazing = true,
    livestockUsedForWork = false,
    sheepGoatCount,
    cattleCount,
    camelsCount,
    ...rest
  } = form;
  void sheepGoatCount;
  void cattleCount;
  void camelsCount;
  return {
    ...INITIAL_STATE,
    ...rest,
    cropItems: [{ ...emptyCropItem("c"), crop: "teff", amount: cropsHarvestKg, unit: "kg", method: OLD_METHOD[irrigationMode] }],
    herdsAdded: [livestockMode],
    herds: {
      ...INITIAL_STATE.herds,
      [livestockMode]: {
        count: form[OLD_COUNT[livestockMode]] ?? "",
        freelyGrazing: livestockFreelyGrazing,
        working: livestockUsedForWork ? (form[OLD_COUNT[livestockMode]] ?? "") : "",
        give: "sheep",
      },
    },
  };
}

const run = (item: Pick<GoldenCase, "added" | "form" | "config">) =>
  calculateZakat(fromOldForm(item.form), item.added as CategoryKey[], item.config ? config : null);

/** The result in the recorded shape: one herd's animals as livestockOwed, and only the recorded fields. */
function comparable(result: ZakatResult, expected: Record<string, unknown>) {
  const old: Record<string, unknown> = { ...result, livestockOwed: result.herds[0]?.owed ?? null };
  return Object.fromEntries(Object.keys(expected).map((key) => [key, old[key]]));
}

describe("calculateZakat matches the calculator it was moved out of", () => {
  it("has a config and recorded cases to check", () => {
    expect(config).not.toBeNull();
    expect(cases.filter((item) => item.config === "uat").length).toBeGreaterThan(50);
  });

  const withConfig = cases.map((item, index) => [index, item] as const).filter(([, item]) => item.config === "uat");
  it.each(withConfig)("official rates, case %i", (_, item) => {
    expect(comparable(run(item), item.expected)).toEqual(item.expected);
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
      livestockOwed: result.herds[0]?.owed ?? null,
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
    const result = calculateZakat(
      fromOldForm({ cropsHarvestKg: "1000", irrigationMode: "mixed", livestockMode: "camels", camelsCount: "130" }),
      ["agriculture", "livestock"],
      null,
    );
    expect(result.agricultureDue).toBe(75);
    expect(result.herds[0].owed).toEqual({
      items: [
        { kind: "bint_labun", count: 2 },
        { kind: "hiqqah", count: 1 },
      ],
    });
    // No Commission prices and none typed: the animals can't be valued.
    expect(result.herds[0].valueEtb).toBeNull();
    expect(result.inKindUnpriced).toBe(true);
    expect(result.totalEtbDue).toBe(0);
    expect(result.somethingDue).toBe(true);
    expect(result.readyToPay).toBe(false);
  });
});

describe("crops and livestock together, valued in birr", () => {
  const herd = (count: string, more: Partial<CalculatorState["herds"]["camels"]> = {}) => ({
    count,
    freelyGrazing: true,
    working: "",
    give: "sheep" as const,
    ...more,
  });

  it("counts every herd the visitor owns, each on its own table", () => {
    const result = calculateZakat(
      {
        ...INITIAL_STATE,
        herdsAdded: ["sheepGoat", "camels", "cattle"],
        herds: { sheepGoat: herd("150"), camels: herd("50"), cattle: herd("29") },
      },
      ["livestock"],
      config,
    );
    const [sheep, camels, cattle] = result.herds;
    expect(sheep.animals).toEqual([{ kind: "sheep", count: 2, unitPrice: 9000, valueEtb: 18000 }]);
    // Every camel age takes the Commission's one camel price for now.
    expect(camels.animals).toEqual([{ kind: "hiqqah", count: 1, unitPrice: 180000, valueEtb: 180000 }]);
    expect(cattle.owed).toBeNull();
    expect(result.inKindValueEtb).toBe(198000);
    expect(result.inKindUnpriced).toBe(false);
    expect(result.grandTotalEtb).toBe(198000);
  });

  it("uses the visitor's own animal price over the Commission's", () => {
    const result = calculateZakat(
      { ...INITIAL_STATE, herdsAdded: ["sheepGoat"], herds: { ...INITIAL_STATE.herds, sheepGoat: herd("50") }, animalPrices: { sheep: "7,500" } },
      ["livestock"],
      config,
    );
    expect(result.herds[0].valueEtb).toBe(7500);
    expect(result.grandTotalEtb).toBe(7500);
  });

  it("flags a malformed animal price only while that animal is due", () => {
    const base = { ...INITIAL_STATE, herdsAdded: ["sheepGoat"] as LivestockMode[], animalPrices: { sheep: "1.2.3" } };
    const due = { ...base, herds: { ...INITIAL_STATE.herds, sheepGoat: herd("50") } };
    expect(calculateZakat(due, ["livestock"], config).hasInputErrors).toBe(true);
    expect(calculateZakat(base, ["livestock"], config).hasInputErrors).toBe(false);
  });

  it("leaves working animals out of the count", () => {
    // 32 cattle, 3 plough oxen: 29 left, under the 30 minimum.
    const form = { ...INITIAL_STATE, herdsAdded: ["cattle"] as LivestockMode[], herds: { ...INITIAL_STATE.herds, cattle: herd("32", { working: "3" }) } };
    const [cattle] = calculateZakat(form, ["livestock"], config).herds;
    expect(cattle).toMatchObject({ count: 32, working: 3, zakatable: 29, owed: null });
  });

  it("prices a goat when a goat owner gives a goat", () => {
    const form = { ...INITIAL_STATE, herdsAdded: ["sheepGoat"] as LivestockMode[], herds: { ...INITIAL_STATE.herds, sheepGoat: herd("45", { give: "goat" }) } };
    expect(calculateZakat(form, ["livestock"], config).herds[0].animals).toEqual([
      { kind: "goat", count: 1, unitPrice: 7000, valueEtb: 7000 },
    ]);
  });

  it("nothing is due on working animals or without a Hawl", () => {
    const working = { ...INITIAL_STATE, herdsAdded: ["camels"] as LivestockMode[], herds: { ...INITIAL_STATE.herds, camels: herd("50", { working: "50" }) } };
    expect(calculateZakat(working, ["livestock"], config).herds[0].owed).toBeNull();
    const noHawl = { ...working, herds: { ...INITIAL_STATE.herds, camels: herd("50") }, hawlCompleted: false };
    expect(calculateZakat(noHawl, ["livestock"], config).herds[0].owed).toBeNull();
  });

  it("weighs each crop against the Nisab, adding lines of the same crop", () => {
    const result = calculateZakat(
      {
        ...INITIAL_STATE,
        cropItems: [
          { ...emptyCropItem("a"), crop: "teff", amount: "4", unit: "quintal", method: "rain", price: "12000" },
          { ...emptyCropItem("b"), crop: "teff", amount: "300", unit: "kg", method: "irrigated", price: "120" },
          { ...emptyCropItem("c"), crop: "maize", amount: "600", unit: "kg", method: "mixed" },
        ],
      },
      ["agriculture"],
      config,
    );
    const [rain, irrigated, maize] = result.crops;
    // Teff: 400 + 300 = 700 kg, over the 653 kg Nisab, each line at its own rate.
    expect(rain).toMatchObject({ kg: 400, dueKg: 40, pricePerKg: 120, dueEtb: 4800 });
    expect(irrigated).toMatchObject({ kg: 300, dueKg: 15, dueEtb: 1800 });
    // Maize alone is below the Nisab.
    expect(maize).toMatchObject({ kg: 600, meetsNisab: false, dueKg: 0, dueEtb: null });
    expect(result.agricultureDue).toBe(55);
    expect(result.inKindValueEtb).toBe(6600);
    // Maize owes nothing, so its missing price doesn't matter.
    expect(result.inKindUnpriced).toBe(false);
  });

  it("leaves an unpriced crop out of the cash total and says so", () => {
    const result = calculateZakat(
      { ...INITIAL_STATE, cashOnHand: "2000000", cropItems: [{ ...emptyCropItem("a"), crop: "wheat", amount: "1000", unit: "kg" }] },
      ["cash", "agriculture"],
      config,
    );
    expect(result.agricultureDue).toBe(100);
    expect(result.inKindUnpriced).toBe(true);
    expect(result.grandTotalEtb).toBe(result.totalEtbDue);
    expect(result.readyToPay).toBe(true);
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

describe("optional config fields the backend may add (final request A1-A3, A7, A9)", () => {
  const withExtras = readCalculatorConfig({
    ...UAT_CALCULATOR_CONFIG,
    crops: { ...UAT_CALCULATOR_CONFIG.crops, mixedRate: 0.08 },
    rikaz: { rate: 0.25 },
    livestockPricesEtb: { hiqqah: 200000, sheep: 8000 },
    cropPrices: { asOf: "2026-11-24T03:00:00Z", etbPerKg: { teff: 120 } },
    priceMaxAgeHours: 72,
  }) as CalculatorConfig;

  it("reads them, and today's config still reads without them", () => {
    expect(withExtras.crops.mixedRate).toBe(0.08);
    expect(withExtras.rikaz).toEqual({ rate: 0.25 });
    expect(withExtras.cropPricesEtbPerKg).toEqual({ teff: 120 });
    expect(withExtras.priceMaxAgeHours).toBe(72);
    expect(config.crops.mixedRate).toBeUndefined();
    expect(config.rikaz).toBeUndefined();
  });

  it("ignores a bad optional rate instead of rejecting the config", () => {
    const bad = readCalculatorConfig({ ...UAT_CALCULATOR_CONFIG, crops: { ...UAT_CALCULATOR_CONFIG.crops, mixedRate: 7.5 } });
    expect(bad).not.toBeNull();
    expect(bad?.crops.mixedRate).toBeUndefined();
  });

  it("treats rules without prices as no config", () => {
    expect(readCalculatorConfig({ ...UAT_CALCULATOR_CONFIG, pricesPublished: false })).toBeNull();
    expect(readCalculatorConfig({ ...UAT_CALCULATOR_CONFIG, pricesPublished: true })).not.toBeNull();
  });

  it("uses the served rates", () => {
    expect(ruleFigures(withExtras)).toMatchObject({ mixedRate: 0.08, rikazRate: 0.25 });
  });

  it("prices the animal due before the species average", () => {
    const form = {
      ...INITIAL_STATE,
      herdsAdded: ["camels"] as LivestockMode[],
      herds: { ...INITIAL_STATE.herds, camels: { count: "50", freelyGrazing: true, working: "", give: "sheep" as const } },
    };
    expect(calculateZakat(form, ["livestock"], withExtras).herds[0].animals).toEqual([
      { kind: "hiqqah", count: 1, unitPrice: 200000, valueEtb: 200000 },
    ]);
  });

  it("values a crop at the Commission's price until the visitor types one", () => {
    const line = { ...emptyCropItem("a"), crop: "teff", amount: "10" };
    const official = calculateZakat({ ...INITIAL_STATE, cropItems: [line] }, ["agriculture"], withExtras).crops[0];
    expect(official).toMatchObject({ dueKg: 100, pricePerKg: 120, dueEtb: 12000 });
    const typed = calculateZakat({ ...INITIAL_STATE, cropItems: [{ ...line, price: "10000" }] }, ["agriculture"], withExtras).crops[0];
    expect(typed).toMatchObject({ pricePerKg: 100, dueEtb: 10000 });
    const cleared = calculateZakat({ ...INITIAL_STATE, cropItems: [{ ...line, price: "" }] }, ["agriculture"], withExtras).crops[0];
    expect(cleared.dueEtb).toBeNull();
  });
});
