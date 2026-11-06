import type { CalculatorConfig, LivestockRow } from "@/lib/zakat/calculator-config";

/**
 * The calculator config reaches the site from zakat-engine without a schema
 * check. A partial config (contract drift, a half-saved rules version) would
 * otherwise crash the page on the first nested read, loop forever on a zero
 * livestock divisor, or value gold at ETB 0. This checks every field the
 * public pages read and returns a clean copy, or null so the caller falls back
 * to its "rates unavailable" state.
 *
 * Plain module (no "use client") so server pages and the client calculator
 * can both use it.
 */

type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isPositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const isNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const isRate = (value: unknown): value is number => isPositive(value) && value <= 1;

function readRow(value: unknown): LivestockRow | null {
  if (!isObj(value) || !isNonNegative(value.min) || typeof value.due !== "string") return null;
  const row: LivestockRow = { min: value.min, due: value.due };
  // JSON sends "no upper bound" as null; the checked row leaves max out instead.
  if (value.max != null) {
    if (!isNonNegative(value.max)) return null;
    row.max = value.max;
  }
  if (value.dueItems != null) {
    if (!Array.isArray(value.dueItems)) return null;
    const items = value.dueItems.map((item: unknown) =>
      isObj(item) && typeof item.kind === "string" && isNonNegative(item.count)
        ? { kind: item.kind, count: item.count }
        : null,
    );
    if (items.some((item) => item === null)) return null;
    row.dueItems = items as NonNullable<(typeof items)[number]>[];
  }
  for (const key of ["perHundred", "bintLabunPer", "hiqqahPer"] as const) {
    if (value[key] == null) continue;
    const divisor = value[key];
    if (!isPositive(divisor)) return null;
    row[key] = divisor;
  }
  return row;
}

function readRows(value: unknown): LivestockRow[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rows = value.map(readRow);
  return rows.every((row): row is LivestockRow => row !== null) ? rows : null;
}

function positiveEntries(value: unknown): Record<string, number> {
  if (!isObj(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => isPositive(entry[1])));
}

/** A checked copy of the calculator config, or null when anything the site relies on is missing or out of range. */
export function readCalculatorConfig(data: unknown): CalculatorConfig | null {
  if (!isObj(data)) return null;
  const { nisab, wealth, crops, livestock } = data;

  if (!isObj(nisab) || (nisab.basis !== "gold" && nisab.basis !== "silver")) return null;
  const { goldGrams, silverGrams, valueEtb } = nisab;
  if (!isPositive(goldGrams) || !isPositive(silverGrams) || !isPositive(valueEtb)) return null;

  if (!isObj(wealth) || !isRate(wealth.rate)) return null;
  if (!isObj(crops) || !isPositive(crops.nisabKg) || !isRate(crops.rainFedRate) || !isRate(crops.irrigatedRate)) {
    return null;
  }

  // Without a 24k price, pricePerGram() would value every gold item at ETB 0.
  const goldPrices = positiveEntries(data.goldPricePerGramEtb);
  const gold24k = goldPrices["24k"];
  const silverPrice = data.silverPricePerGramEtb;
  if (!isPositive(gold24k) || !isPositive(silverPrice)) return null;

  if (!isObj(livestock) || !isObj(livestock.cattle)) return null;
  const { minimum, tabiPer, musinnahPer } = livestock.cattle;
  // Zero divisors would make the cattle split loop forever.
  if (!isPositive(minimum) || !isPositive(tabiPer) || !isPositive(musinnahPer)) return null;
  const sheepGoats = readRows(livestock.sheepGoats);
  const camels = readRows(livestock.camels);
  if (!sheepGoats || !camels) return null;

  const unitPrices = positiveEntries(data.livestockAverageUnitPriceEtb);

  return {
    configVersion: isNonNegative(data.configVersion) ? data.configVersion : 0,
    pricesAsOf: typeof data.pricesAsOf === "string" ? data.pricesAsOf : "",
    priceSource: typeof data.priceSource === "string" && data.priceSource ? data.priceSource : null,
    usdEtbRate: isPositive(data.usdEtbRate) ? data.usdEtbRate : null,
    goldPricePerGramEtb: goldPrices,
    silverPricePerGramEtb: silverPrice,
    nisab: {
      basis: nisab.basis,
      goldGrams,
      silverGrams,
      valueEtb,
      // Display-only values; derive them from the same prices when they're missing.
      goldValueEtb: isPositive(nisab.goldValueEtb) ? nisab.goldValueEtb : goldGrams * gold24k,
      silverValueEtb: isPositive(nisab.silverValueEtb) ? nisab.silverValueEtb : silverGrams * silverPrice,
    },
    wealth: {
      rate: wealth.rate,
      // Not used by the public pages; 0 means the service didn't send it.
      // Display only. 0 means the service didn't send it; never print it as a day count.
      hawlLunarDays: isPositive(wealth.hawlLunarDays) ? wealth.hawlLunarDays : 0,
    },
    crops: { nisabKg: crops.nisabKg, rainFedRate: crops.rainFedRate, irrigatedRate: crops.irrigatedRate },
    livestock: { sheepGoats, cattle: { minimum, tabiPer, musinnahPer }, camels },
    livestockAverageUnitPriceEtb: Object.keys(unitPrices).length > 0 ? unitPrices : undefined,
  };
}
