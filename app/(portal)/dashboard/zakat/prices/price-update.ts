/**
 * Pure rules for the price forms on Prices & nisab (zakat-engine, 10 and 11
 * November):
 * - POST /admin/prices is a partial update: send only what changed. A karat
 *   not sent keeps its earlier price; with no earlier prices it is worked out
 *   from 24k. A move of more than 15% needs `confirmLargeChange: true`.
 * - PUT /admin/livestock-prices: animals left out keep their price.
 */

export const KARATS = ["24k", "22k", "21k", "18k", "14k"] as const;
export type Karat = (typeof KARATS)[number];
export type PriceField = Karat | "silver" | "usd";
export const PRICE_FIELDS: readonly PriceField[] = [...KARATS, "silver", "usd"];

/** The form's text values, one per field. */
export type PriceInputs = Record<PriceField, string>;

/** The prices in use (the latest snapshot), or null when none is stored yet. */
export type CurrentPrices = {
  goldPricePerGramEtb: Record<string, number>;
  silverPricePerGramEtb: number | null;
  usdEtbRate: number | null;
} | null;

/** A move above this needs `confirmLargeChange: true` (zakat-engine checks the same). */
export const LARGE_CHANGE = 0.15;
/** manualUntil may be at most this many days ahead. */
export const MANUAL_UNTIL_MAX_DAYS = 90;

/** A positive number, null when empty, NaN when not a valid price. */
export function parsePrice(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Number.NaN;
}

/** More decimals than allowed ("1.234" with 2). */
export function tooManyDecimals(value: string, max = 2): boolean {
  const [, decimals = ""] = value.trim().split(".");
  return decimals.length > max;
}

export function currentPrice(current: CurrentPrices, field: PriceField): number | null {
  if (!current) return null;
  if (field === "silver") return current.silverPricePerGramEtb;
  if (field === "usd") return current.usdEtbRate;
  return current.goldPricePerGramEtb[field] ?? null;
}

/** Fields with a valid new value that differs from the price in use. An empty field keeps its price. */
export function changedPriceFields(values: PriceInputs, current: CurrentPrices): PriceField[] {
  return PRICE_FIELDS.filter((field) => {
    const next = parsePrice(values[field]);
    return next !== null && !Number.isNaN(next) && next !== currentPrice(current, field);
  });
}

/** Each karat's price after saving: the new one, else the kept one, else null (worked out from 24k). */
export function goldAfterSave(values: PriceInputs, current: CurrentPrices): Record<Karat, number | null> {
  return Object.fromEntries(
    KARATS.map((karat) => {
      const next = parsePrice(values[karat]);
      return [karat, next !== null && !Number.isNaN(next) ? next : currentPrice(current, karat)];
    }),
  ) as Record<Karat, number | null>;
}

/**
 * Karats that would cost as much as or more than the karat above them after
 * saving, in zakat-engine's words. A kept karat counts too: raising 22k above
 * the old 24k is refused until 24k is sent as well.
 */
export function karatOrderProblems(values: PriceInputs, current: CurrentPrices): Partial<Record<Karat, string>> {
  const gold = goldAfterSave(values, current);
  const problems: Partial<Record<Karat, string>> = {};
  let purer: { karat: Karat; price: number } | null = null;
  for (const karat of KARATS) {
    const price = gold[karat];
    if (price === null) continue;
    if (purer && price >= purer.price) problems[karat] = `Must be lower than ${purer.karat} (${purer.price.toLocaleString("en")}).`;
    purer = { karat, price };
  }
  return problems;
}

export type LargeChange = { field: PriceField; before: number; after: number };

/** Changed fields that move by more than 15% against the price in use. */
export function largeChanges(values: PriceInputs, current: CurrentPrices): LargeChange[] {
  return changedPriceFields(values, current).flatMap((field) => {
    const before = currentPrice(current, field);
    const after = parsePrice(values[field]);
    if (!before || after === null) return [];
    return Math.abs(after - before) / before > LARGE_CHANGE ? [{ field, before, after }] : [];
  });
}

/** The snapshot id the edit started from, as the `version` zakat-engine checks. */
export function snapshotVersion(id: string | number | null | undefined): number | undefined {
  const version = Number(id);
  return id != null && id !== "" && Number.isSafeInteger(version) ? version : undefined;
}

/**
 * The POST /admin/prices body: only the changed karats, silver and USD rate,
 * plus the note, the snapshot `version`, `manualUntil` when set and
 * `confirmLargeChange` when asked for.
 */
export function priceUpdateBody(
  values: PriceInputs,
  current: CurrentPrices,
  options: { note: string; version?: number; manualUntil?: string; confirmLargeChange?: boolean },
): Record<string, unknown> {
  const changed = changedPriceFields(values, current);
  const price = (field: PriceField) => parsePrice(values[field]) as number;
  const gold = Object.fromEntries(KARATS.filter((karat) => changed.includes(karat)).map((karat) => [karat, price(karat)]));
  return {
    ...(Object.keys(gold).length > 0 ? { goldPricePerGramEtb: gold } : {}),
    ...(changed.includes("silver") ? { silverPricePerGramEtb: price("silver") } : {}),
    ...(changed.includes("usd") ? { usdEtbRate: price("usd") } : {}),
    note: options.note.trim(),
    ...(options.version !== undefined ? { version: options.version } : {}),
    ...(options.manualUntil ? { manualUntil: options.manualUntil } : {}),
    ...(options.confirmLargeChange ? { confirmLargeChange: true } : {}),
  };
}

/**
 * The form field a server error is about. Paths look like
 * "goldPricePerGramEtb.22k"; a 400 with no `errors[]` still names the karat
 * at the start of its message ("goldPricePerGramEtb.22k must be lower than 24k").
 */
export function priceErrorField(path: string): PriceField | "note" | "manualUntil" | null {
  const karat = /^goldPricePerGramEtb\.(\d+k)\b/.exec(path.trim())?.[1];
  if (karat) return (KARATS as readonly string[]).includes(karat) ? (karat as Karat) : null;
  const name = /^\w+/.exec(path.trim())?.[0];
  if (name === "goldPricePerGramEtb") return "24k";
  if (name === "silverPricePerGramEtb") return "silver";
  if (name === "usdEtbRate") return "usd";
  if (name === "note" || name === "manualUntil") return name;
  return null;
}

/** Whether a refused save asks for `confirmLargeChange: true`. */
export function asksLargeChangeConfirm(error: { message: string; code?: string | null; errors?: { field: string }[] }): boolean {
  return (
    /LARGE_CHANGE/i.test(error.code ?? "") ||
    (error.errors ?? []).some((item) => item.field === "confirmLargeChange") ||
    /confirmLargeChange/i.test(error.message)
  );
}

/** "YYYY-MM-DD" plus whole days. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Problem with a manualUntil date (today to 90 days ahead), or null. Empty is allowed. */
export function manualUntilProblem(value: string, today: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter a date.";
  if (value < today) return "Pick today or a later date.";
  if (value > addDays(today, MANUAL_UNTIL_MAX_DAYS)) return `Pick a date at most ${MANUAL_UNTIL_MAX_DAYS} days ahead.`;
  return null;
}

/**
 * Livestock prices (A2): the species averages, and each animal that can be
 * due. Until an animal due has a price, the calculator uses its species average.
 */
export const ANIMALS = [
  { key: "sheep", label: "Sheep", group: "average" },
  { key: "goat", label: "Goat", group: "average" },
  { key: "cattle", label: "Cattle (one head)", group: "average" },
  { key: "camel", label: "Camel", group: "average" },
  { key: "tabi", label: "Tabi' (1-year-old calf)", group: "cattleDue" },
  { key: "musinnah", label: "Musinnah (2-year-old cow)", group: "cattleDue" },
  { key: "bint_makhad", label: "Bint Makhad (1-year-old female camel)", group: "camelDue" },
  { key: "bint_labun", label: "Bint Labun (2-year-old female camel)", group: "camelDue" },
  { key: "hiqqah", label: "Hiqqah (3-year-old female camel)", group: "camelDue" },
  { key: "jadhaah", label: "Jadh'ah (4-year-old female camel)", group: "camelDue" },
] as const;

export type Animal = (typeof ANIMALS)[number]["key"];

/** zakat-engine's ceiling for one crop price, in ETB per kg (A1). */
export const CROP_PRICE_MAX = 100_000;

export type UnitPriceChange<K extends string> = { key: K; before: number; after: number };

/**
 * The PUT body for a set of unit prices (livestock, crops): only the keys
 * whose price changed, a message per key whose value can't be sent, and the
 * changes above 15% that need `confirmLargeChange: true`. An empty field
 * keeps its price.
 */
export function unitPriceUpdate<K extends string>(
  keys: readonly K[],
  values: Partial<Record<K, string>>,
  current: Partial<Record<K, number>>,
  max?: number,
): { body: Partial<Record<K, number>>; errors: Partial<Record<K, string>>; large: UnitPriceChange<K>[] } {
  const body: Partial<Record<K, number>> = {};
  const errors: Partial<Record<K, string>> = {};
  const large: UnitPriceChange<K>[] = [];
  for (const key of keys) {
    const text = values[key] ?? "";
    const price = parsePrice(text);
    if (price === null) continue;
    if (Number.isNaN(price)) errors[key] = "Enter a price above 0.";
    else if (tooManyDecimals(text)) errors[key] = "Use at most 2 decimals.";
    else if (max !== undefined && price > max) errors[key] = `Enter at most ${max.toLocaleString("en")}.`;
    else if (price !== current[key]) {
      body[key] = price;
      const before = current[key];
      if (before && Math.abs(price - before) / before > LARGE_CHANGE) large.push({ key, before, after: price });
    }
  }
  return { body, errors, large };
}

/** Livestock prices: unitPriceUpdate over the ten animals. */
export function livestockUpdate(values: Partial<Record<Animal, string>>, current: Partial<Record<Animal, number>>) {
  return unitPriceUpdate(
    ANIMALS.map(({ key }) => key),
    values,
    current,
  );
}

/** "Hiqqah is priced below Bint Labun", for each older animal cheaper than a younger one. */
export function ageOrderWarnings(
  orders: readonly (readonly string[])[],
  prices: Record<string, number | undefined>,
  labelOf: Record<string, string>,
): string[] {
  return orders.flatMap((order) =>
    order.flatMap((older, index) =>
      order.slice(0, index).flatMap((younger) => {
        const olderPrice = prices[older];
        const youngerPrice = prices[younger];
        return olderPrice != null && youngerPrice != null && olderPrice < youngerPrice
          ? [`${labelOf[older] ?? older} is priced below ${labelOf[younger] ?? younger}, which is younger.`]
          : [];
      }),
    ),
  );
}
