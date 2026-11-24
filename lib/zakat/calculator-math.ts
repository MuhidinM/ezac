import { toAsciiNumber } from "@/lib/i18n/digits";
import {
  MIXED_IRRIGATION_RATE,
  RIKAZ_RATE,
  livestockDue,
  pricePerGram,
  type CalculatorConfig,
  type LivestockDue,
} from "@/lib/zakat/calculator-config";

/**
 * The public Zakat calculator's maths, apart from the page: the visitor's
 * entries plus the official config (or nothing, while it is missing) in, every
 * figure the calculator shows out. Plain module, no React, so it is
 * unit-tested (tests/public/calculator-math.test.ts) and the component
 * (components/landing/zakat-calculator.tsx) only renders.
 */

// ---- What the visitor enters ----------------------------------------------

export type CategoryKey =
  | "cash"
  | "gold"
  | "business"
  | "propertyStocks"
  | "agriculture"
  | "livestock"
  | "rikazMinerals"
  | "debts";

/** Silver keeps karats until product decision #49 (fineness for silver) is made. */
export const KARATS = [24, 22, 21, 20, 18, 16, 14, 10] as const;

export type MetalType = "gold" | "silver";
export type Karat = (typeof KARATS)[number];
export type MetalLineItem = { id: string; metal: MetalType; grams: string; karat: Karat };
/** A herd: animals that share one Nisab table. Sheep and goats count together. */
export type LivestockMode = "sheepGoat" | "cattle" | "camels";
export const HERDS: readonly LivestockMode[] = ["sheepGoat", "cattle", "camels"];
/** How a crop was watered: rain only, partly irrigated, or irrigated. */
export type IrrigationMode = "rain" | "mixed" | "irrigated";
export const CROP_METHODS: readonly IrrigationMode[] = ["rain", "mixed", "irrigated"];
/** Harvests are weighed in kilograms or quintals (100 kg), as Ethiopian markets quote them. */
export type CropUnit = "kg" | "quintal";
export const KG_PER_UNIT: Record<CropUnit, number> = { kg: 1, quintal: 100 };

/** One harvest line: a crop, how much, how it was watered, and its local price per unit (optional). */
export type CropLineItem = {
  id: string;
  /** A key from lib/zakat/crops.ts; "" until the visitor picks one. */
  crop: string;
  amount: string;
  unit: CropUnit;
  method: IrrigationMode;
  /**
   * ETB per `unit` as the visitor typed it. Left out (undefined): the
   * Commission's price for the crop, if it has one; "" means no price.
   */
  price?: string;
};

/**
 * One kind of animal (one herd) the visitor owns. `working` is how many of them
 * are used for work (ploughing, carrying): they owe no Zakat and are left out
 * of the count. `give` is what a sheep/goat owner gives when a sheep is due.
 */
export type Herd = { count: string; freelyGrazing: boolean; working: string; give: "sheep" | "goat" };

/** The calculator form. Amounts stay as typed (strings) so the field shows exactly what was entered. */
export type CalculatorState = {
  cashOnHand: string;
  bankAndMobile: string;
  goodDebtReceivables: string;
  doubtfulDebtCollectedThisYear: string;
  metalItems: MetalLineItem[];
  businessCash: string;
  inventoryValue: string;
  businessReceivables: string;
  businessShortTermPayables: string;
  propertyForResaleValue: string;
  rentalSavings: string;
  stocksTradingValue: string;
  stocksDividendCash: string;
  longTermCompanyZakatableAssets: string;
  cropItems: CropLineItem[];
  /** The herds the visitor has added, in the order added. */
  herdsAdded: LivestockMode[];
  herds: Record<LivestockMode, Herd>;
  /**
   * ETB per animal due, by kind ("sheep", "hiqqah"…), as the visitor typed it.
   * A kind left out uses the Commission's average price (animalUnitPrice).
   */
  animalPrices: Partial<Record<string, string>>;
  rikazValue: string;
  mineralsValue: string;
  shortTermPersonalLiabilities: string;
  upcomingLoanPayments12m: string;
  hawlCompleted: boolean;
};

/** The typed-amount fields (everything in the form that is a string). */
export type AmountField = {
  [K in keyof CalculatorState]: CalculatorState[K] extends string ? K : never;
}[keyof CalculatorState];

const NEW_HERD: Herd = { count: "", freelyGrazing: true, working: "", give: "sheep" };

export function emptyCropItem(id: string): CropLineItem {
  return { id, crop: "", amount: "", unit: "quintal", method: "rain" };
}

export const INITIAL_STATE: CalculatorState = {
  cashOnHand: "",
  bankAndMobile: "",
  goodDebtReceivables: "",
  doubtfulDebtCollectedThisYear: "",
  metalItems: [{ id: "metal-1", metal: "gold", grams: "", karat: 24 }],
  businessCash: "",
  inventoryValue: "",
  businessReceivables: "",
  businessShortTermPayables: "",
  propertyForResaleValue: "",
  rentalSavings: "",
  stocksTradingValue: "",
  stocksDividendCash: "",
  longTermCompanyZakatableAssets: "",
  cropItems: [emptyCropItem("crop-1")],
  herdsAdded: [],
  herds: { sheepGoat: NEW_HERD, cattle: NEW_HERD, camels: NEW_HERD },
  animalPrices: {},
  rikazValue: "",
  mineralsValue: "",
  shortTermPersonalLiabilities: "",
  upcomingLoanPayments12m: "",
  hawlCompleted: true,
};

// ---- Reading typed amounts -------------------------------------------------

// Anything longer is a typing slip, and would overflow to Infinity in the sums.
const MAX_AMOUNT_DIGITS = 15;
const MAX_HEAD_COUNT_DIGITS = 7;

/** Why a typed amount can't be read; each has a message in calculator.inputErrors. */
export type InputError = "decimalPoints" | "decimalCommas" | "commaGrouping" | "wholeNumber" | "tooLarge" | "notNumber";
export type ParsedAmount = { value: number; error: InputError | null };

/**
 * Reads a typed amount. Commas may group thousands; anything else that isn't a
 * plain number (two decimal points, "1.500.000", a fraction of an animal, a
 * runaway length) gets an inline message instead of a silently wrong total.
 */
export function parseAmount(raw: string, { wholeNumber = false } = {}): ParsedAmount {
  const text = toAsciiNumber(raw).trim();
  if (text === "" || text === ".") return { value: 0, error: null };
  const [whole, fraction, ...rest] = text.split(".");
  if (rest.length > 0) return { value: 0, error: "decimalPoints" };
  if (fraction?.includes(",")) return { value: 0, error: "decimalCommas" };
  // "12,5" is a decimal comma, not 125; only a proper thousands grouping is allowed.
  if (whole.includes(",") && !/^\d{1,3}(,\d{3})+$/.test(whole)) return { value: 0, error: "commaGrouping" };
  // "40.0" head is still 40; "40.5" is not a head count.
  if (wholeNumber && fraction && /[1-9]/.test(fraction)) return { value: 0, error: "wholeNumber" };
  const digits = whole.replace(/,/g, "");
  if (digits.replace(/^0+/, "").length > (wholeNumber ? MAX_HEAD_COUNT_DIGITS : MAX_AMOUNT_DIGITS)) {
    return { value: 0, error: "tooLarge" };
  }
  const value = Number(`${digits || "0"}.${fraction || "0"}`);
  return Number.isFinite(value) ? { value, error: null } : { value: 0, error: "notNumber" };
}

/** The value of a typed amount; malformed input counts as 0 and is flagged separately. */
const amount = (raw: string) => parseAmount(raw).value;

/**
 * Typing keeps digits, points and commas only. Arabic-script digits and
 * separators stay as typed, so the field shows what the visitor entered;
 * parseAmount reads them as ASCII.
 */
export const cleanAmount = (raw: string) => raw.replace(/[^0-9.,٠-٩۰-۹٫٬،]/g, "");

/** Fine (pure) metal content in grams for jewellery and alloys: gross × (karat / 24). */
export function fineMetalGrams(grossGrams: number, karat: Karat) {
  return grossGrams * (karat / 24);
}

/**
 * Which of the Commission's average animal prices (livestockAverageUnitPriceEtb)
 * values each kind of animal due. The Commission prices one camel and one head
 * of cattle whatever their age or sex, so every camel age shares the camel
 * price until the backend prices them by age and sex.
 */
export const ANIMAL_PRICE_KEY: Record<string, string> = {
  sheep: "sheep",
  goat: "goat",
  tabi: "cattle",
  musinnah: "cattle",
  bint_makhad: "camel",
  bint_labun: "camel",
  hiqqah: "camel",
  jadhaah: "camel",
};

/** The Commission's average ETB price for one animal of this kind, or null when it has none. */
export function officialAnimalPrice(config: CalculatorConfig | null, kind: string): number | null {
  // A price for the very animal due (backend request A2) wins over the species average.
  const exact = config?.livestockPricesEtb?.[kind];
  if (typeof exact === "number" && exact > 0) return exact;
  const key = Object.prototype.hasOwnProperty.call(ANIMAL_PRICE_KEY, kind) ? ANIMAL_PRICE_KEY[kind] : null;
  const price = key ? config?.livestockAverageUnitPriceEtb?.[key] : undefined;
  return typeof price === "number" && price > 0 ? price : null;
}

/** The Commission's average price of a crop in ETB per kg, or null when it has none. */
export function officialCropPrice(config: CalculatorConfig | null, crop: string): number | null {
  const price = crop ? config?.cropPricesEtbPerKg?.[crop] : undefined;
  return typeof price === "number" && price > 0 ? price : null;
}

/** The price used for a harvest line in ETB per kg: the visitor's own, else the Commission's; null when neither. */
export function cropPricePerKg(item: CropLineItem, config: CalculatorConfig | null): number | null {
  if (item.price === undefined) return officialCropPrice(config, item.crop);
  if (item.price.trim() === "") return null;
  const parsed = parseAmount(item.price);
  return parsed.error || parsed.value <= 0 ? null : parsed.value / KG_PER_UNIT[item.unit];
}

/** The price used for one animal of this kind: the visitor's own, else the Commission's; null when neither. */
export function animalUnitPrice(form: CalculatorState, config: CalculatorConfig | null, kind: string) {
  const typed = form.animalPrices[kind];
  // A field the visitor emptied means "no price", not the Commission's: the
  // value shown and the value used must agree.
  if (typed !== undefined) {
    if (typed.trim() === "") return null;
    const parsed = parseAmount(typed);
    return parsed.error || parsed.value <= 0 ? null : parsed.value;
  }
  return officialAnimalPrice(config, kind);
}

// ---- Rules: official, or the fixed fiqh figures while the config is missing ----

/** The figures the calculator applies right now. */
export type RuleFigures = {
  zakatRate: number;
  goldNisabGrams: number;
  silverNisabGrams: number;
  agriNisabKg: number;
  rainFedRate: number;
  mixedRate: number;
  irrigatedRate: number;
  rikazRate: number;
};

/**
 * Used only while the official config is missing. These are the fixed weights
 * and rates of the rules guide, not prices: there is no fallback gold or
 * silver price, so without the official rates nothing is valued in birr from a
 * stale price (see calculateZakat). Mixed irrigation and Rikaz aren't in the
 * config at all: the backend confirmed them as fixed.
 */
export const FALLBACK_RULES: RuleFigures = {
  zakatRate: 0.025,
  goldNisabGrams: 85,
  silverNisabGrams: 595,
  agriNisabKg: 653,
  rainFedRate: 0.1,
  mixedRate: MIXED_IRRIGATION_RATE,
  irrigatedRate: 0.05,
  rikazRate: RIKAZ_RATE,
};

/**
 * The livestock tables used while the config is missing, in the config's own
 * shape, so livestockDue() is the one implementation of the rules. Same rows
 * as zakat-engine serves (configVersion 2): "docs/Detailed Zakat Rules
 * Guide.md" section 6, and above its camel rows the Abu Bakr letter it cites.
 */
export const FALLBACK_LIVESTOCK: CalculatorConfig["livestock"] = {
  sheepGoats: [
    { min: 40, max: 120, due: "1 sheep", dueItems: [{ kind: "sheep", count: 1 }] },
    { min: 121, max: 200, due: "2 sheep", dueItems: [{ kind: "sheep", count: 2 }] },
    { min: 201, max: 300, due: "3 sheep", dueItems: [{ kind: "sheep", count: 3 }] },
    { min: 301, due: "1 sheep per 100", perHundred: 1 },
  ],
  cattle: { minimum: 30, tabiPer: 30, musinnahPer: 40 },
  camels: [
    { min: 5, max: 9, due: "1 sheep", dueItems: [{ kind: "sheep", count: 1 }] },
    { min: 10, max: 14, due: "2 sheep", dueItems: [{ kind: "sheep", count: 2 }] },
    { min: 15, max: 19, due: "3 sheep", dueItems: [{ kind: "sheep", count: 3 }] },
    { min: 20, max: 24, due: "4 sheep", dueItems: [{ kind: "sheep", count: 4 }] },
    { min: 25, max: 35, due: "1 bint makhad", dueItems: [{ kind: "bint_makhad", count: 1 }] },
    { min: 36, max: 45, due: "1 bint labun", dueItems: [{ kind: "bint_labun", count: 1 }] },
    { min: 46, max: 60, due: "1 hiqqah", dueItems: [{ kind: "hiqqah", count: 1 }] },
    { min: 61, max: 75, due: "1 jadha'ah", dueItems: [{ kind: "jadhaah", count: 1 }] },
    { min: 76, max: 90, due: "2 bint labun", dueItems: [{ kind: "bint_labun", count: 2 }] },
    { min: 91, max: 120, due: "2 hiqqah", dueItems: [{ kind: "hiqqah", count: 2 }] },
    { min: 121, due: "1 bint labun per 40 and 1 hiqqah per 50", bintLabunPer: 40, hiqqahPer: 50 },
  ],
};

/** The official figures where the config has them, the fixed ones otherwise. */
export function ruleFigures(config: CalculatorConfig | null): RuleFigures {
  return {
    zakatRate: config?.wealth.rate ?? FALLBACK_RULES.zakatRate,
    goldNisabGrams: config?.nisab.goldGrams ?? FALLBACK_RULES.goldNisabGrams,
    silverNisabGrams: config?.nisab.silverGrams ?? FALLBACK_RULES.silverNisabGrams,
    agriNisabKg: config?.crops.nisabKg ?? FALLBACK_RULES.agriNisabKg,
    rainFedRate: config?.crops.rainFedRate ?? FALLBACK_RULES.rainFedRate,
    mixedRate: config?.crops.mixedRate ?? FALLBACK_RULES.mixedRate,
    irrigatedRate: config?.crops.irrigatedRate ?? FALLBACK_RULES.irrigatedRate,
    rikazRate: config?.rikaz?.rate ?? FALLBACK_RULES.rikazRate,
  };
}

export function irrigationRate(mode: IrrigationMode, rules: RuleFigures) {
  switch (mode) {
    case "mixed":
      return rules.mixedRate;
    case "irrigated":
      return rules.irrigatedRate;
    case "rain":
    default:
      return rules.rainFedRate;
  }
}

/**
 * Official prices older than this get a warning. The zakat service fetches
 * them every day at 06:00 Addis Ababa time; the staff price panel uses the
 * same limit (components/zakat/price-status-panel.tsx).
 */
export const STALE_PRICE_HOURS = 48;

/** True when the official prices are more than STALE_PRICE_HOURS old at `now`; false when the date is unreadable. */
export function isPriceStale(pricesAsOf: string | null | undefined, now: number, maxHours = STALE_PRICE_HOURS) {
  const asOf = pricesAsOf ? Date.parse(pricesAsOf) : Number.NaN;
  return Number.isFinite(asOf) && now - asOf > maxHours * 3_600_000;
}

// ---- The calculation --------------------------------------------------------

/**
 * Everything the calculator shows. Birr amounts are null when they depend on
 * the Nisab in birr and the official config (which sets the Nisab and its
 * basis) is missing: the result then says the official rates are needed
 * instead of judging the Nisab from an out-of-date price or the wrong basis.
 */
export type ZakatResult = {
  rules: RuleFigures;
  /** The Commission's Nisab basis; null without the config. */
  nisabBasis: "gold" | "silver" | null;
  /** The Nisab in birr; null without the config. */
  nisabEtb: number | null;
  cashBase: number;
  goldGrossGrams: number;
  goldFineGrams: number;
  silverGrossGrams: number;
  silverFineGrams: number;
  /** Gold and silver in birr; null without the official prices (left out of the total). */
  preciousMetalsValue: number | null;
  /** Ushr in kg of produce, all crops together. */
  agricultureDue: number;
  /** Each harvest line with a weight: its Ushr in kg and, with a price, in birr. */
  crops: CropResult[];
  /** Each herd the visitor added, with the animals due and their value. */
  herds: HerdResult[];
  /** Crops and animals due, valued in birr where a price is known. */
  inKindValueEtb: number;
  /** Some crop or animal due has no price, so it is missing from inKindValueEtb. */
  inKindUnpriced: boolean;
  /** Everything due if paid all in cash: totalEtbDue plus inKindValueEtb; null like totalEtbDue. */
  grandTotalEtb: number | null;
  rikazDue: number;
  mineralsDue: number | null;
  deductibleLiabilities: number;
  /** Wealth less deductible debts, never below 0. */
  adjustedAnnualBase: number;
  /** null: there is wealth to weigh but no Nisab to weigh it against. */
  meetsNisab: boolean | null;
  /** Each category's share of the wealth Zakat, for the breakdown. */
  shares: {
    cash: number | null;
    gold: number | null;
    business: number | null;
    propertyStocks: number | null;
    liabilities: number | null;
  };
  annualDue: number | null;
  /** The birr total: wealth + Rikaz + minerals. null when part of it needs the official Nisab. */
  totalEtbDue: number | null;
  hasInputErrors: boolean;
  hasInKind: boolean;
  /** Something is (or may be, pending the rates) due and the entries are readable. */
  somethingDue: boolean;
  /** Only a total built on the official rates can be paid from. */
  readyToPay: boolean;
  hasMonetaryCategory: boolean;
  showHawl: boolean;
};

export type CropResult = {
  id: string;
  crop: string;
  kg: number;
  method: IrrigationMode;
  rate: number;
  /** All lines of this crop together reach the crop Nisab. */
  meetsNisab: boolean;
  dueKg: number;
  /** ETB per kg from the visitor's price; null without one. */
  pricePerKg: number | null;
  dueEtb: number | null;
};

export type AnimalDue = { kind: string; count: number; unitPrice: number | null; valueEtb: number | null };

export type HerdResult = {
  herd: LivestockMode;
  /** All the animals of this kind. */
  count: number;
  /** Those used for work, left out (never more than count). */
  working: number;
  /** The animals Zakat is counted on: count less working. */
  zakatable: number;
  /** Grazing freely and held a full Hawl. */
  eligible: boolean;
  owed: LivestockDue;
  /** The animals due, each valued at its price; empty when nothing is due or the service sent only wording. */
  animals: AnimalDue[];
  /** null when any animal due has no price. */
  valueEtb: number | null;
};

/**
 * Crop Nisab is weighed per crop: lines of the same crop (teff, part rain-fed
 * and part irrigated) add up; different crops don't. This is the majority
 * view; the Shari'ah board should confirm it, since the config has a single
 * crop Nisab and says nothing on combining.
 */
export const CROP_NISAB_PER_CROP = true;

const MONETARY_CATEGORIES = ["cash", "gold", "business", "propertyStocks"] as const;

/** Every typed field of the categories the visitor has added, with whether it is a head count. */
function activeFields(form: CalculatorState, has: (key: CategoryKey) => boolean): [string, boolean][] {
  const fields: [string, boolean][] = [
    ...(has("cash")
      ? [form.cashOnHand, form.bankAndMobile, form.goodDebtReceivables, form.doubtfulDebtCollectedThisYear]
      : []),
    ...(has("gold") ? form.metalItems.map((item) => item.grams) : []),
    ...(has("business")
      ? [
          form.businessCash,
          form.inventoryValue,
          form.businessReceivables,
          form.businessShortTermPayables,
          form.propertyForResaleValue,
        ]
      : []),
    ...(has("propertyStocks")
      ? [form.rentalSavings, form.stocksTradingValue, form.stocksDividendCash, form.longTermCompanyZakatableAssets]
      : []),
    ...(has("agriculture") ? form.cropItems.flatMap((item) => [item.amount, item.price ?? ""]) : []),    ...(has("rikazMinerals") ? [form.rikazValue, form.mineralsValue] : []),
    ...(has("debts") ? [form.shortTermPersonalLiabilities, form.upcomingLoanPayments12m] : []),
  ].map((value): [string, boolean] => [value, false]);
  if (has("livestock")) {
    for (const herd of form.herdsAdded) fields.push([form.herds[herd].count, true], [form.herds[herd].working, true]);
  }
  return fields;
}

/**
 * The Zakat on what the visitor entered, counting only the categories in
 * `added`. `config` is the official calculator config, or null while it is
 * loading or unavailable.
 */
export function calculateZakat(
  form: CalculatorState,
  added: readonly CategoryKey[],
  config: CalculatorConfig | null,
): ZakatResult {
  const has = (key: CategoryKey) => added.includes(key);
  const rules = ruleFigures(config);
  const { zakatRate } = rules;
  const nisabEtb = config?.nisab.valueEtb ?? null;
  const ofNisab = (value: number) => (nisabEtb === null ? null : value >= nisabEtb);

  // Cash
  const cashBase =
    amount(form.cashOnHand) +
    amount(form.bankAndMobile) +
    amount(form.goodDebtReceivables) +
    amount(form.doubtfulDebtCollectedThisYear);

  // Precious metals: the karat sets the price per gram; the Nisab weighs fine grams.
  const gold = form.metalItems.filter((item) => item.metal === "gold");
  const silver = form.metalItems.filter((item) => item.metal === "silver");
  const goldGrossGrams = gold.reduce((sum, item) => sum + amount(item.grams), 0);
  const silverGrossGrams = silver.reduce((sum, item) => sum + amount(item.grams), 0);
  const goldFineGrams = gold.reduce((sum, item) => sum + fineMetalGrams(amount(item.grams), item.karat), 0);
  const silverFineGrams = silver.reduce((sum, item) => sum + fineMetalGrams(amount(item.grams), item.karat), 0);
  // Not valued until the official prices load: the metals are then left out of the total.
  const preciousMetalsValue = config
    ? form.metalItems.reduce((sum, item) => sum + amount(item.grams) * pricePerGram(config, item.metal, item.karat), 0)
    : null;

  // Business: trade goods, cash and receivables less short-term payables.
  const businessBase =
    amount(form.businessCash) +
    amount(form.inventoryValue) +
    amount(form.businessReceivables) -
    amount(form.businessShortTermPayables) +
    amount(form.propertyForResaleValue);

  // Property and stocks
  const propertyStocksBase =
    amount(form.rentalSavings) +
    amount(form.stocksTradingValue) +
    amount(form.stocksDividendCash) +
    amount(form.longTermCompanyZakatableAssets);

  // Agriculture: due on harvest, no Hawl. Each line at its own watering rate.
  const cropLines = has("agriculture") ? form.cropItems : [];
  const kgOf = (item: CropLineItem) => amount(item.amount) * KG_PER_UNIT[item.unit];
  const nisabKey = (item: CropLineItem) => (CROP_NISAB_PER_CROP ? item.crop : "");
  const kgByCrop = new Map<string, number>();
  for (const item of cropLines) kgByCrop.set(nisabKey(item), (kgByCrop.get(nisabKey(item)) ?? 0) + kgOf(item));
  const crops: CropResult[] = cropLines
    .filter((item) => kgOf(item) > 0)
    .map((item) => {
      const kg = kgOf(item);
      const rate = irrigationRate(item.method, rules);
      const meets = (kgByCrop.get(nisabKey(item)) ?? 0) >= rules.agriNisabKg;
      const dueKg = meets ? kg * rate : 0;
      const pricePerKg = cropPricePerKg(item, config);
      return {
        id: item.id,
        crop: item.crop,
        kg,
        method: item.method,
        rate,
        meetsNisab: meets,
        dueKg,
        pricePerKg,
        dueEtb: pricePerKg === null ? null : dueKg * pricePerKg,
      };
    });
  const agricultureDue = crops.reduce((sum, line) => sum + line.dueKg, 0);

  // Minerals owe the wealth rate once they reach the Nisab; Rikaz is due at once, with no Nisab.
  const mineralsBase = has("rikazMinerals") ? amount(form.mineralsValue) : 0;
  const mineralsMeetNisab = mineralsBase > 0 ? ofNisab(mineralsBase) : false;
  const mineralsDue = mineralsMeetNisab === null ? null : mineralsMeetNisab ? mineralsBase * zakatRate : 0;
  const rikazDue = has("rikazMinerals") ? amount(form.rikazValue) * rules.rikazRate : 0;

  // Livestock: whole animals only, and a full Hawl like wealth (only crops and Rikaz are exempt).
  // Each herd has its own Nisab table; sheep and goats are one herd.
  const herds: HerdResult[] = (has("livestock") ? form.herdsAdded : []).map((herd) => {
    const entry = form.herds[herd];
    const count = parseAmount(entry.count, { wholeNumber: true }).value;
    const working = Math.min(count, parseAmount(entry.working, { wholeNumber: true }).value);
    const zakatable = count - working;
    const eligible = form.hawlCompleted && entry.freelyGrazing;
    const owed = eligible ? livestockDue(config?.livestock ?? FALLBACK_LIVESTOCK, herd, zakatable) : null;
    // A sheep/goat owner may give a goat where the table says a sheep.
    const kindOf = (kind: string) => (herd === "sheepGoat" && entry.give === "goat" && kind === "sheep" ? "goat" : kind);
    const animals: AnimalDue[] =
      owed && "items" in owed
        ? owed.items.map((item) => {
            const kind = kindOf(item.kind);
            const unitPrice = animalUnitPrice(form, config, kind);
            return { kind, count: item.count, unitPrice, valueEtb: unitPrice === null ? null : unitPrice * item.count };
          })
        : [];
    // Wording-only dues ("text") can't be priced.
    const unpriced = (owed !== null && !("items" in owed)) || animals.some((item) => item.valueEtb === null);
    const valueEtb = unpriced ? null : animals.reduce((sum, item) => sum + (item.valueEtb ?? 0), 0);
    return { herd, count, working, zakatable, eligible, owed, animals, valueEtb };
  });

  // Pooled wealth: only the categories the visitor has added count.
  const includedCash = has("cash") ? cashBase : 0;
  const includedMetals = has("gold") ? (preciousMetalsValue ?? 0) : 0;
  const includedBusiness = has("business") ? Math.max(0, businessBase) : 0;
  const includedProperty = has("propertyStocks") ? propertyStocksBase : 0;
  const deductibleLiabilities = has("debts")
    ? amount(form.shortTermPersonalLiabilities) + amount(form.upcomingLoanPayments12m)
    : 0;

  const annualZakatableBase = includedCash + includedMetals + includedBusiness + includedProperty;
  const adjustedAnnualBase = Math.max(0, annualZakatableBase - deductibleLiabilities);
  // Gold or silver entered but not valued (no official prices) is wealth of unknown worth, not none.
  const unvaluedMetals = has("gold") && preciousMetalsValue === null && goldGrossGrams + silverGrossGrams > 0;
  // Nothing to weigh is simply below the Nisab, with or without the rates.
  const meetsNisab = adjustedAnnualBase > 0 || unvaluedMetals ? ofNisab(adjustedAnnualBase) : false;
  // Without a full Hawl nothing is due, whatever the Nisab; otherwise unknown until the Nisab is.
  const wealthDue = !form.hawlCompleted ? false : meetsNisab;
  const share = (value: number) => (wealthDue === null ? null : wealthDue ? value * zakatRate : 0);

  const annualDue = share(adjustedAnnualBase);
  const totalEtbDue = annualDue === null || mineralsDue === null ? null : annualDue + rikazDue + mineralsDue;

  // Any malformed amount in an added category blocks the total, so nobody pays
  // from a figure built on a misread number.
  // Animal prices count only for the animals shown as due right now.
  const shownPrices = herds.flatMap((herd) => herd.animals.map((item) => form.animalPrices[item.kind] ?? ""));
  const hasInputErrors =
    activeFields(form, has).some(([value, wholeNumber]) => parseAmount(value, { wholeNumber }).error !== null) ||
    shownPrices.some((value) => parseAmount(value).error !== null);

  const dueCrops = crops.filter((line) => line.dueKg > 0);
  const dueHerds = herds.filter((herd) => herd.owed !== null);
  const hasInKind = dueCrops.length > 0 || dueHerds.length > 0;
  const inKindValueEtb =
    dueCrops.reduce((sum, line) => sum + (line.dueEtb ?? 0), 0) +
    dueHerds.flatMap((herd) => herd.animals).reduce((sum, item) => sum + (item.valueEtb ?? 0), 0);
  const inKindUnpriced = dueCrops.some((line) => line.dueEtb === null) || dueHerds.some((herd) => herd.valueEtb === null);
  const somethingDue = !hasInputErrors && (totalEtbDue === null || totalEtbDue > 0 || hasInKind);
  const hasMonetaryCategory = MONETARY_CATEGORIES.some((key) => has(key));

  return {
    rules,
    nisabBasis: config?.nisab.basis ?? null,
    nisabEtb,
    cashBase,
    goldGrossGrams,
    goldFineGrams,
    silverGrossGrams,
    silverFineGrams,
    preciousMetalsValue,
    agricultureDue,
    crops,
    herds,
    inKindValueEtb,
    inKindUnpriced,
    grandTotalEtb: totalEtbDue === null ? null : totalEtbDue + inKindValueEtb,
    rikazDue,
    mineralsDue,
    deductibleLiabilities,
    adjustedAnnualBase,
    meetsNisab,
    shares: {
      cash: share(includedCash),
      gold: share(includedMetals),
      business: share(includedBusiness),
      propertyStocks: share(includedProperty),
      liabilities: share(deductibleLiabilities),
    },
    annualDue,
    totalEtbDue,
    hasInputErrors,
    hasInKind,
    somethingDue,
    // A total built on fallback figures is a rough guide, not something to pay from.
    readyToPay: somethingDue && config !== null && totalEtbDue !== null,
    hasMonetaryCategory,
    showHawl: hasMonetaryCategory || has("livestock"),
  };
}
