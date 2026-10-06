/**
 * Official calculator inputs from zakat-engine, GET /api/zakat/v1/calculator/config
 * (public, cached 5 minutes upstream). The site calculates on the client from these.
 */

export type LivestockDueItem = { kind: string; count: number };

export type LivestockRow = {
  min: number;
  max?: number;
  due: string;
  dueItems?: LivestockDueItem[];
  /** Sheep/goats above the table: this many sheep per 100 head. */
  perHundred?: number;
  /** Camels above the table: one bint labun per N and one hiqqah per M. */
  bintLabunPer?: number;
  hiqqahPer?: number;
};

export type CalculatorConfig = {
  configVersion: number;
  pricesAsOf: string;
  priceSource?: string | null;
  usdEtbRate?: number | null;
  /** Keys like "24k", "22k". */
  goldPricePerGramEtb: Record<string, number>;
  silverPricePerGramEtb: number;
  nisab: {
    basis: "gold" | "silver";
    goldGrams: number;
    silverGrams: number;
    valueEtb: number;
    goldValueEtb: number;
    silverValueEtb: number;
  };
  wealth: { rate: number; hawlLunarDays: number };
  crops: { nisabKg: number; rainFedRate: number; irrigatedRate: number };
  livestock: {
    sheepGoats: LivestockRow[];
    cattle: { minimum: number; tabiPer: number; musinnahPer: number };
    camels: LivestockRow[];
  };
  livestockAverageUnitPriceEtb?: Record<string, number>;
};

/** Fixed rules the config doesn't carry (confirmed by the backend). */
export const MIXED_IRRIGATION_RATE = 0.075;
export const RIKAZ_RATE = 0.2;

const KIND_LABELS: Record<string, string> = {
  sheep: "Sheep",
  bint_makhad: "Bint Makhad (1yr female)",
  bint_labun: "Bint Labun (2yr female)",
  hiqqah: "Hiqqah (3yr female)",
  jadhaah: "Jadh'ah (4yr female)",
  tabi: "Tabi' (1yr calf)",
  musinnah: "Musinnah (2yr cow)",
};

function formatItems(items: LivestockDueItem[]) {
  return items.map((item) => `${item.count} ${KIND_LABELS[item.kind] ?? item.kind}`).join(" + ");
}

/** ETB per gram for a metal at a karat; silver and missing karats scale by purity. */
export function pricePerGram(config: CalculatorConfig, metal: "gold" | "silver", karat: number) {
  if (metal === "silver") return config.silverPricePerGramEtb * (karat / 24);
  const direct = config.goldPricePerGramEtb[`${karat}k`];
  if (typeof direct === "number" && direct > 0) return direct;
  return (config.goldPricePerGramEtb["24k"] ?? 0) * (karat / 24);
}

/** Split `count` into units of size a and b, leaving the smallest remainder. */
function bestSplit(count: number, a: number, b: number) {
  let best = { a: 0, b: 0, remainder: count };
  for (let nb = 0; nb <= Math.floor(count / b); nb++) {
    const rest = count - nb * b;
    const na = Math.floor(rest / a);
    const remainder = rest - na * a;
    if (remainder < best.remainder) best = { a: na, b: nb, remainder };
  }
  return best;
}

/** In-kind livestock Zakat from the config tables; "No Zakat" below the minimum. */
export function livestockDue(
  livestock: CalculatorConfig["livestock"],
  mode: "sheepGoat" | "cattle" | "camels",
  count: number,
): string {
  if (mode === "cattle") {
    const { minimum, tabiPer, musinnahPer } = livestock.cattle;
    if (count < minimum) return "No Zakat";
    const split = bestSplit(count, tabiPer, musinnahPer);
    return formatItems(
      [
        { kind: "musinnah", count: split.b },
        { kind: "tabi", count: split.a },
      ].filter((item) => item.count > 0),
    );
  }

  const rows = mode === "sheepGoat" ? livestock.sheepGoats : livestock.camels;
  const row = rows.find((item) => count >= item.min && (item.max === undefined || count <= item.max));
  if (!row) return "No Zakat";
  if (row.dueItems?.length) return formatItems(row.dueItems);
  if (row.perHundred) return formatItems([{ kind: "sheep", count: Math.floor(count / 100) * row.perHundred }]);
  if (row.bintLabunPer && row.hiqqahPer) {
    const split = bestSplit(count, row.bintLabunPer, row.hiqqahPer);
    return formatItems(
      [
        { kind: "bint_labun", count: split.a },
        { kind: "hiqqah", count: split.b },
      ].filter((item) => item.count > 0),
    );
  }
  return row.due;
}
