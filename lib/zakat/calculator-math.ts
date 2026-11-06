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
export type LivestockMode = "sheepGoat" | "cattle" | "camels";
export type IrrigationMode = "natural" | "mixed" | "artificial";

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
  cropsHarvestKg: string;
  irrigationMode: IrrigationMode;
  livestockMode: LivestockMode;
  livestockFreelyGrazing: boolean;
  livestockUsedForWork: boolean;
  sheepGoatCount: string;
  cattleCount: string;
  camelsCount: string;
  rikazValue: string;
  mineralsValue: string;
  shortTermPersonalLiabilities: string;
  upcomingLoanPayments12m: string;
  hawlCompleted: boolean;
};

/** The typed-amount fields (everything in the form that is a string). */
export type AmountField = {
  [K in keyof CalculatorState]: string extends CalculatorState[K] ? K : never;
}[keyof CalculatorState];

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
  cropsHarvestKg: "",
  irrigationMode: "natural",
  livestockMode: "sheepGoat",
  livestockFreelyGrazing: true,
  livestockUsedForWork: false,
  sheepGoatCount: "",
  cattleCount: "",
  camelsCount: "",
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

/** The head-count field for the chosen kind of animal. */
export function livestockCountField(mode: LivestockMode): AmountField {
  return mode === "sheepGoat" ? "sheepGoatCount" : mode === "cattle" ? "cattleCount" : "camelsCount";
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
    mixedRate: FALLBACK_RULES.mixedRate,
    irrigatedRate: config?.crops.irrigatedRate ?? FALLBACK_RULES.irrigatedRate,
    rikazRate: FALLBACK_RULES.rikazRate,
  };
}

export function irrigationRate(mode: IrrigationMode, rules: RuleFigures) {
  switch (mode) {
    case "mixed":
      return rules.mixedRate;
    case "artificial":
      return rules.irrigatedRate;
    case "natural":
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
  /** Ushr in kg of produce (in kind, outside the birr total). */
  agricultureDue: number;
  livestockOwed: LivestockDue;
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
    ...(has("agriculture") ? [form.cropsHarvestKg] : []),
    ...(has("rikazMinerals") ? [form.rikazValue, form.mineralsValue] : []),
    ...(has("debts") ? [form.shortTermPersonalLiabilities, form.upcomingLoanPayments12m] : []),
  ].map((value): [string, boolean] => [value, false]);
  if (has("livestock")) fields.push([form[livestockCountField(form.livestockMode)], true]);
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

  // Agriculture: due on harvest, no Hawl.
  const harvestKg = amount(form.cropsHarvestKg);
  const agricultureDue =
    has("agriculture") && harvestKg >= rules.agriNisabKg ? harvestKg * irrigationRate(form.irrigationMode, rules) : 0;

  // Minerals owe the wealth rate once they reach the Nisab; Rikaz is due at once, with no Nisab.
  const mineralsBase = has("rikazMinerals") ? amount(form.mineralsValue) : 0;
  const mineralsMeetNisab = mineralsBase > 0 ? ofNisab(mineralsBase) : false;
  const mineralsDue = mineralsMeetNisab === null ? null : mineralsMeetNisab ? mineralsBase * zakatRate : 0;
  const rikazDue = has("rikazMinerals") ? amount(form.rikazValue) * rules.rikazRate : 0;

  // Livestock: whole animals only, and a full Hawl like wealth (only crops and Rikaz are exempt).
  const livestockCount = parseAmount(form[livestockCountField(form.livestockMode)], { wholeNumber: true }).value;
  const livestockEligible = form.hawlCompleted && form.livestockFreelyGrazing && !form.livestockUsedForWork;
  const livestockOwed: LivestockDue =
    has("livestock") && livestockEligible
      ? livestockDue(config?.livestock ?? FALLBACK_LIVESTOCK, form.livestockMode, livestockCount)
      : null;

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
  const hasInputErrors = activeFields(form, has).some(
    ([value, wholeNumber]) => parseAmount(value, { wholeNumber }).error !== null,
  );

  const hasInKind = agricultureDue > 0 || livestockOwed !== null;
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
    livestockOwed,
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
