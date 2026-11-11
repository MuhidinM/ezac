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

export const ANIMALS = [
  { key: "sheep", label: "Sheep" },
  { key: "goat", label: "Goat" },
  { key: "cattle", label: "Cattle (one head)" },
  { key: "camel", label: "Camel" },
] as const;

export type Animal = (typeof ANIMALS)[number]["key"];

/**
 * The PUT /admin/livestock-prices body (only the animals whose price changed)
 * and a message per animal whose value can't be sent. An empty field keeps
 * its price.
 */
export function livestockUpdate(
  values: Record<Animal, string>,
  current: Partial<Record<Animal, number>>,
): { body: Partial<Record<Animal, number>>; errors: Partial<Record<Animal, string>> } {
  const body: Partial<Record<Animal, number>> = {};
  const errors: Partial<Record<Animal, string>> = {};
  for (const { key } of ANIMALS) {
    const price = parsePrice(values[key]);
    if (price === null) continue;
    if (Number.isNaN(price)) errors[key] = "Enter a price above 0.";
    else if (tooManyDecimals(values[key])) errors[key] = "Use at most 2 decimals.";
    else if (price !== current[key]) body[key] = price;
  }
  return { body, errors };
}
