"use client";

import { Fragment, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  Building2Icon,
  BriefcaseIcon,
  CoinsIcon,
  FactoryIcon,
  GemIcon,
  InfoIcon,
  LandmarkIcon,
  LeafIcon,
  PlusIcon,
  ScaleIcon,
  XIcon,
} from "lucide-react";

import { LocalizedLink, useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";
import {
  MIXED_IRRIGATION_RATE,
  RIKAZ_RATE as OFFICIAL_RIKAZ_RATE,
  livestockDue,
  pricePerGram,
  type CalculatorConfig,
  type LivestockDue,
  type LivestockDueItem,
} from "@/lib/zakat/calculator-config";

import { readCalculatorConfig } from "./read-calculator-config";

type CalculatorText = Dictionary["calculator"];

type CategoryKey =
  | "cash"
  | "gold"
  | "business"
  | "propertyStocks"
  | "agriculture"
  | "livestock"
  | "rikazMinerals"
  | "debts";

/** The figures the calculator applies right now: from the live config, or the offline fallbacks below. */
type RuleFigures = {
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
 * Category order and icons. Labels and the "Why is X due?" rulings live in
 * the calculator dictionary; the rulings are filled from the figures in use,
 * so the explanation can't drift from the sum.
 */
const CATEGORIES: { key: CategoryKey; icon: LucideIcon }[] = [
  { key: "cash", icon: CoinsIcon },
  { key: "gold", icon: GemIcon },
  { key: "business", icon: BriefcaseIcon },
  { key: "propertyStocks", icon: Building2Icon },
  { key: "agriculture", icon: LeafIcon },
  { key: "livestock", icon: LandmarkIcon },
  { key: "rikazMinerals", icon: FactoryIcon },
  { key: "debts", icon: ScaleIcon },
];

// Offline fallbacks only; the official values come from the zakat service.
// Mixed irrigation and Rikaz aren't in the config: the backend confirmed them as fixed.
const ZAKAT_RATE = 0.025;
const RIKAZ_RATE = OFFICIAL_RIKAZ_RATE;
const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;
const AGRI_NISAB_KG = 653;
const RAIN_FED_RATE = 0.1;
const IRRIGATED_RATE = 0.05;
const SILVER_PRICE_PER_GRAM_ETB = 412;
const GOLD_PRICE_PER_GRAM_ETB = 7200;
const KARATS = [24, 22, 21, 20, 18, 16, 14, 10] as const;

// Anything longer is a typing slip, and would overflow to Infinity in the sums.
const MAX_AMOUNT_DIGITS = 15;
const MAX_HEAD_COUNT_DIGITS = 7;

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

const FIELD_CLASS =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-base text-navy outline-none transition-colors focus:border-brand sm:text-sm";

type MetalType = "gold" | "silver";
type Karat = (typeof KARATS)[number];
type MetalLineItem = {
  id: string;
  metal: MetalType;
  grams: string;
  karat: Karat;
};

type LivestockMode = "sheepGoat" | "cattle" | "camels";
type IrrigationMode = "natural" | "mixed" | "artificial";

type CalculatorState = {
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
type AmountField = {
  [K in keyof CalculatorState]: string extends CalculatorState[K] ? K : never;
}[keyof CalculatorState];

const INITIAL_STATE: CalculatorState = {
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

type InputError = keyof CalculatorText["inputErrors"];
type ParsedAmount = { value: number; error: InputError | null };

/**
 * Reads a typed amount. Commas may group thousands; anything else that isn't a
 * plain number (two decimal points, "1.500.000", a fraction of an animal, a
 * runaway length) gets an inline message instead of a silently wrong total.
 */
function parseAmount(raw: string, { wholeNumber = false } = {}): ParsedAmount {
  const text = raw.trim();
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

/** Typing keeps digits, points and commas only, as before localization. */
const cleanAmount = (raw: string) => raw.replace(/[^0-9.,]/g, "");

function createMetalItem(): MetalLineItem {
  return {
    id: `metal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    metal: "gold",
    grams: "",
    karat: 24,
  };
}

/** Fine (pure) metal content in grams for jewelry/alloys: gross × (karat / 24). */
function fineMetalGrams(grossGrams: number, karat: Karat) {
  return grossGrams * (karat / 24);
}

function etbPerGramForKarat(metal: MetalType, karat: Karat, config: CalculatorConfig | null): number {
  if (config) return pricePerGram(config, metal, karat);
  const pure24 = metal === "gold" ? GOLD_PRICE_PER_GRAM_ETB : SILVER_PRICE_PER_GRAM_ETB;
  return pure24 * (karat / 24);
}

function irrigationRate(mode: IrrigationMode, rules: RuleFigures) {
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

const sheep = (count: number): LivestockDueItem[] => [{ kind: "sheep", count }];

/** Animals due, in the order listed, leaving out kinds with none due; null when nothing is due. */
function dueOf(items: LivestockDueItem[]): LivestockDue {
  const due = items.filter((item) => item.count > 0);
  return due.length > 0 ? { items: due } : null;
}

/** Offline livestock tables, used only while the official config is unavailable. */
function fallbackLivestockDue(mode: LivestockMode, count: number): LivestockDue {
  if (mode === "sheepGoat") {
    if (count < 40) return null;
    if (count <= 120) return dueOf(sheep(1));
    if (count <= 200) return dueOf(sheep(2));
    if (count <= 399) return dueOf(sheep(3));
    return dueOf(sheep(Math.floor(count / 100)));
  }

  if (mode === "cattle") {
    if (count < 30) return null;
    let bestT = 0,
      bestM = 0,
      minRem = count;
    for (let m = 0; m <= Math.floor(count / 40); m++) {
      const remAfterM = count - m * 40;
      const t = Math.floor(remAfterM / 30);
      const rem = remAfterM - t * 30;
      if (rem < minRem) {
        minRem = rem;
        bestM = m;
        bestT = t;
      }
    }
    return dueOf([
      { kind: "musinnah", count: bestM },
      { kind: "tabi", count: bestT },
    ]);
  }

  if (mode === "camels") {
    if (count < 5) return null;
    if (count <= 9) return dueOf(sheep(1));
    if (count <= 14) return dueOf(sheep(2));
    if (count <= 19) return dueOf(sheep(3));
    if (count <= 24) return dueOf(sheep(4));
    if (count <= 35) return dueOf([{ kind: "bint_makhad", count: 1 }]);
    if (count <= 45) return dueOf([{ kind: "bint_labun", count: 1 }]);
    if (count <= 60) return dueOf([{ kind: "hiqqah", count: 1 }]);
    if (count <= 75) return dueOf([{ kind: "jadhaah", count: 1 }]);
    if (count <= 90) return dueOf([{ kind: "bint_labun", count: 2 }]);
    if (count <= 120) return dueOf([{ kind: "hiqqah", count: 2 }]);

    let bestF = 0,
      bestH = 0,
      minRem = count;
    for (let h = 0; h <= Math.floor(count / 50); h++) {
      const remAfterH = count - h * 50;
      const f = Math.floor(remAfterH / 40); // Bint Labun
      const rem = remAfterH - f * 40;
      if (rem < minRem) {
        minRem = rem;
        bestH = h;
        bestF = f;
      }
    }
    return dueOf([
      { kind: "bint_labun", count: bestF },
      { kind: "hiqqah", count: bestH },
    ]);
  }
  return null;
}

type RatesError = { reason: "status"; status: number } | { reason: "incomplete" | "generic" };

/** The official rates, or why they could not be used. */
async function loadCalculatorConfig(): Promise<{ config: CalculatorConfig } | { error: RatesError }> {
  try {
    const response = await fetch("/bff/zakat/calculator-config");
    const json = (await response.json().catch(() => null)) as { success?: boolean; data?: unknown } | null;
    if (!response.ok || !json?.success) return { error: { reason: "status", status: response.status } };
    // A partial config would crash the page on render; treat it like no config.
    const checked = readCalculatorConfig(json.data);
    return checked ? { config: checked } : { error: { reason: "incomplete" } };
  } catch {
    return { error: { reason: "generic" } };
  }
}

/**
 * Fills {name} placeholders with text or elements, so numbers can be wrapped
 * and words emphasised without HTML in the dictionary.
 */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/\{(\w+)\}/).map((part, index) => {
    if (index % 2 === 0) return part;
    return Object.prototype.hasOwnProperty.call(values, part) ? (
      <Fragment key={index}>{values[part]}</Fragment>
    ) : (
      `{${part}}`
    );
  });
}

/** A number or amount that stays left-to-right inside Arabic text. */
function Num({ children }: { children: string }) {
  return <bdi dir="ltr">{children}</bdi>;
}

function useFormatters(intlLocale: string) {
  return useMemo(() => {
    const whole = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 });
    const grams = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 3, minimumFractionDigits: 0 });
    const kg = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 });
    const percent = new Intl.NumberFormat(intlLocale, { style: "percent", maximumFractionDigits: 2 });
    const twoDecimals = new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dateTime = new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium", timeStyle: "short" });
    return {
      /** ETB amounts and in-kind kilograms, rounded to whole units. */
      currency: (value: number) => whole.format(value),
      count: (value: number) => whole.format(value),
      grams: (value: number) => grams.format(value),
      kg: (value: number) => kg.format(value),
      pct: (rate: number) => percent.format(rate),
      rate: (value: number) => twoDecimals.format(value),
      dateTime: (value: Date) => dateTime.format(value),
    };
  }, [intlLocale]);
}

/** Small (i) affordance that reveals a category's fiqh ruling on hover, tap or keyboard focus. */
function InfoTip({ text, buttonLabel }: { text: ReactNode; buttonLabel: string }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={buttonLabel}
        aria-expanded={open}
        aria-describedby={tipId}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-brand ${FOCUS_RING}`}
      >
        <InfoIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 max-w-[70vw] -translate-x-1/2 rounded-xl bg-navy p-3 text-start text-xs leading-relaxed text-white/90 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${open ? "opacity-100" : "opacity-0"}`}
      >
        {text}
      </span>
    </span>
  );
}

export function ZakatCalculator({ t }: { t: CalculatorText }) {
  const { intlLocale } = useI18n();
  const fmt = useFormatters(intlLocale);
  const baseId = useId();

  const [added, setAdded] = useState<CategoryKey[]>(["cash"]);
  const [form, setForm] = useState<CalculatorState>(INITIAL_STATE);
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<RatesError | null>(null);
  // Adding or removing a category removes the button that was clicked; focus moves to what replaced it.
  const focusAfterRender = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void loadCalculatorConfig().then((result) => {
      if (!isMounted) return;
      if ("config" in result) setConfig(result.config);
      else setPricingError(result.error);
      setPricingLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const target = focusAfterRender.current;
    if (!target) return;
    focusAfterRender.current = null;
    document.getElementById(target)?.focus();
  }, [added]);

  const sectionId = (key: CategoryKey) => `${baseId}-section-${key}`;
  const chipId = (key: CategoryKey) => `${baseId}-add-${key}`;

  const rules: RuleFigures = {
    zakatRate: config?.wealth.rate ?? ZAKAT_RATE,
    goldNisabGrams: config?.nisab.goldGrams ?? GOLD_NISAB_GRAMS,
    silverNisabGrams: config?.nisab.silverGrams ?? SILVER_NISAB_GRAMS,
    agriNisabKg: config?.crops.nisabKg ?? AGRI_NISAB_KG,
    rainFedRate: config?.crops.rainFedRate ?? RAIN_FED_RATE,
    mixedRate: MIXED_IRRIGATION_RATE,
    irrigatedRate: config?.crops.irrigatedRate ?? IRRIGATED_RATE,
    rikazRate: RIKAZ_RATE,
  };
  const { zakatRate, agriNisabKg, goldNisabGrams, silverNisabGrams } = rules;
  const nisabBasis = config?.nisab.basis ?? "silver";
  // Fallback figures must never read as the Commission's live rule.
  const usingEstimates = !config && !pricingLoading;

  const has = (key: CategoryKey) => added.includes(key);

  const addCategory = (key: CategoryKey) => {
    focusAfterRender.current = sectionId(key);
    setAdded((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };
  const removeCategory = (key: CategoryKey) => {
    focusAfterRender.current = chipId(key);
    setAdded((prev) => prev.filter((k) => k !== key));
  };

  // Cash base
  const cashBase =
    amount(form.cashOnHand) +
    amount(form.bankAndMobile) +
    amount(form.goodDebtReceivables) +
    amount(form.doubtfulDebtCollectedThisYear);

  // Precious metals (karat affects ETB/g; Nisab uses fine gold/silver grams)
  const goldGrossGrams = form.metalItems
    .filter((item) => item.metal === "gold")
    .reduce((sum, item) => sum + amount(item.grams), 0);
  const silverGrossGrams = form.metalItems
    .filter((item) => item.metal === "silver")
    .reduce((sum, item) => sum + amount(item.grams), 0);
  const goldFineGrams = form.metalItems
    .filter((item) => item.metal === "gold")
    .reduce((sum, item) => sum + fineMetalGrams(amount(item.grams), item.karat), 0);
  const silverFineGrams = form.metalItems
    .filter((item) => item.metal === "silver")
    .reduce((sum, item) => sum + fineMetalGrams(amount(item.grams), item.karat), 0);
  const preciousMetalsValue = form.metalItems.reduce((sum, item) => {
    const grams = amount(item.grams);
    const etbPerGram = etbPerGramForKarat(item.metal, item.karat, config);
    return sum + grams * etbPerGram;
  }, 0);
  // Business base
  const businessBase =
    amount(form.businessCash) +
    amount(form.inventoryValue) +
    amount(form.businessReceivables) -
    amount(form.businessShortTermPayables) +
    amount(form.propertyForResaleValue);

  // Property & stocks base
  const propertyStocksBase =
    amount(form.rentalSavings) +
    amount(form.stocksTradingValue) +
    amount(form.stocksDividendCash) +
    amount(form.longTermCompanyZakatableAssets);

  // Agriculture (no Hawl required)
  const agricultureHarvestKg = amount(form.cropsHarvestKg);
  const agricultureDue =
    has("agriculture") && agricultureHarvestKg >= agriNisabKg
      ? agricultureHarvestKg * irrigationRate(form.irrigationMode, rules)
      : 0;

  // Thresholds & minerals / rikaz
  const silver24kEtb = config?.silverPricePerGramEtb ?? SILVER_PRICE_PER_GRAM_ETB;
  const gold24kEtb = config?.goldPricePerGramEtb["24k"] ?? GOLD_PRICE_PER_GRAM_ETB;
  // The commission sets the basis (gold today); offline we fall back to silver.
  const nisabETB = config?.nisab.valueEtb ?? SILVER_NISAB_GRAMS * silver24kEtb;
  const mineralsBase = amount(form.mineralsValue);
  const mineralsDue = has("rikazMinerals") && mineralsBase >= nisabETB ? mineralsBase * zakatRate : 0;
  const rikazDue = has("rikazMinerals") ? amount(form.rikazValue) * RIKAZ_RATE : 0;

  // Livestock: head counts are whole animals (a fraction would fall between table rows)
  const livestockCountField: AmountField =
    form.livestockMode === "sheepGoat"
      ? "sheepGoatCount"
      : form.livestockMode === "cattle"
        ? "cattleCount"
        : "camelsCount";
  const livestockCount = parseAmount(form[livestockCountField], { wholeNumber: true }).value;
  const livestockEligible = form.livestockFreelyGrazing && !form.livestockUsedForWork;
  const livestockOwed: LivestockDue =
    has("livestock") && livestockEligible
      ? config
        ? livestockDue(config.livestock, form.livestockMode, livestockCount)
        : fallbackLivestockDue(form.livestockMode, livestockCount)
      : null;

  // Pooled monetary base — only categories the user has actually added count.
  const includedCash = has("cash") ? cashBase : 0;
  const includedMetals = has("gold") ? preciousMetalsValue : 0;
  const includedBusiness = has("business") ? Math.max(0, businessBase) : 0;
  const includedProperty = has("propertyStocks") ? propertyStocksBase : 0;
  const deductibleLiabilities = has("debts")
    ? amount(form.shortTermPersonalLiabilities) + amount(form.upcomingLoanPayments12m)
    : 0;

  const annualZakatableBase = includedCash + includedMetals + includedBusiness + includedProperty;
  const adjustedAnnualBase = Math.max(0, annualZakatableBase - deductibleLiabilities);
  const meetsNisab = adjustedAnnualBase >= nisabETB;
  const wealthDueActive = form.hawlCompleted && meetsNisab;

  // Per-category 2.5% shares (for the transparent breakdown)
  const cashShare = wealthDueActive ? includedCash * zakatRate : 0;
  const goldShare = wealthDueActive ? includedMetals * zakatRate : 0;
  const businessShare = wealthDueActive ? includedBusiness * zakatRate : 0;
  const propertyShare = wealthDueActive ? includedProperty * zakatRate : 0;
  const liabilitiesDeduction = wealthDueActive ? deductibleLiabilities * zakatRate : 0;
  const annualDue = wealthDueActive ? adjustedAnnualBase * zakatRate : 0;

  // Any malformed amount in a category the user has added blocks the total,
  // so nobody pays from a figure built on a misread number.
  const activeFieldValues: [string, boolean][] = [
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
  if (has("livestock")) activeFieldValues.push([form[livestockCountField], true]);
  const hasInputErrors = activeFieldValues.some(
    ([value, wholeNumber]) => parseAmount(value, { wholeNumber }).error !== null,
  );

  // Grand monetary total (in-kind dues are reported separately)
  const totalEtbDue = annualDue + rikazDue + mineralsDue;
  const hasInKind = agricultureDue > 0 || livestockOwed !== null;
  const readyToPay = !hasInputErrors && (totalEtbDue > 0 || hasInKind);

  const hasMonetaryCategory = (["cash", "gold", "business", "propertyStocks"] as const).some((k) => has(k));

  // ---- Wording -----------------------------------------------------------

  const money = (value: number) => fill(t.result.amount, { amount: <Num>{fmt.currency(value)}</Num> });
  const rateNum = (rate: number) => <Num>{fmt.pct(rate)}</Num>;
  const kindLabels: Record<string, string> = t.livestock.kinds;
  const animalsText = (owed: LivestockDue) =>
    !owed
      ? ""
      : "text" in owed
        ? owed.text
        : owed.items
            .map((item) =>
              format(t.livestock.dueItem, {
                count: fmt.count(item.count),
                kind: Object.prototype.hasOwnProperty.call(kindLabels, item.kind) ? kindLabels[item.kind] : item.kind,
              }),
            )
            .join(t.livestock.dueSeparator);

  const rulingValues: Record<string, ReactNode> = {
    rate: rateNum(zakatRate),
    goldGrams: <Num>{fmt.grams(goldNisabGrams)}</Num>,
    silverGrams: <Num>{fmt.grams(silverNisabGrams)}</Num>,
    rainFedRate: rateNum(rules.rainFedRate),
    mixedRate: rateNum(rules.mixedRate),
    irrigatedRate: rateNum(rules.irrigatedRate),
    nisabKg: <Num>{fmt.kg(agriNisabKg)}</Num>,
    rikazRate: rateNum(rules.rikazRate),
  };

  const ratesErrorText = (error: RatesError) =>
    error.reason === "status"
      ? format(t.rates.errorStatus, { status: error.status })
      : error.reason === "incomplete"
        ? t.rates.errorIncomplete
        : t.rates.errorGeneric;

  const basisLabel = t.rates.basis[nisabBasis];

  // ---- Form handlers -----------------------------------------------------

  const updateAmount = (key: AmountField) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = cleanAmount(e.target.value);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateMetalItem = (
    id: string,
    key: keyof Omit<MetalLineItem, "id">,
    value: string | MetalType | Karat,
  ) => {
    setForm((prev) => ({
      ...prev,
      metalItems: prev.metalItems.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const addMetalItem = () => {
    setForm((prev) => ({ ...prev, metalItems: [...prev.metalItems, createMetalItem()] }));
  };

  const removeMetalItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      metalItems: prev.metalItems.length > 1 ? prev.metalItems.filter((item) => item.id !== id) : prev.metalItems,
    }));
  };

  const renderAmountInput = (
    field: AmountField,
    label: string,
    helper?: ReactNode,
    { wholeNumber = false }: { wholeNumber?: boolean } = {},
  ) => {
    const inputId = `${baseId}-${field}`;
    const value = form[field];
    const { error } = parseAmount(value, { wholeNumber });
    const describedBy = [error ? `${inputId}-error` : null, helper ? `${inputId}-help` : null]
      .filter(Boolean)
      .join(" ");
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-xs text-neutral-500">
          {label}
        </label>
        <input
          id={inputId}
          type="text"
          inputMode={wholeNumber ? "numeric" : "decimal"}
          maxLength={32}
          value={value}
          onChange={updateAmount(field)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${FIELD_CLASS} ${error ? "border-accent-ink" : "border-black/10"} ${FOCUS_RING}`}
          placeholder="0"
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-accent-ink">
            {t.inputErrors[error]}
          </p>
        )}
        {helper && (
          <p id={`${inputId}-help`} className="text-xs text-neutral-500">
            {helper}
          </p>
        )}
      </div>
    );
  };

  /** A row of mutually exclusive options; aria-pressed marks the chosen one. */
  const renderChoiceChips = <K extends string>(
    options: { key: K; label: ReactNode }[],
    selected: K,
    onSelect: (key: K) => void,
  ) =>
    options.map((item) => {
      const isActive = item.key === selected;
      return (
        <button
          key={item.key}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(item.key)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${FOCUS_RING} ${
            isActive ? "border-brand bg-brand/10 font-medium text-brand" : "border-black/[0.12] text-neutral-500 hover:text-brand"
          }`}
        >
          {item.label}
        </button>
      );
    });

  const renderPanel = (key: CategoryKey) => {
    switch (key) {
      case "cash":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput("cashOnHand", t.cash.cashOnHand)}
            {renderAmountInput("bankAndMobile", t.cash.bankAndMobile)}
            {renderAmountInput("goodDebtReceivables", t.cash.goodDebtReceivables, t.cash.goodDebtReceivablesHelp)}
            {renderAmountInput("doubtfulDebtCollectedThisYear", t.cash.doubtfulDebtCollected)}
          </div>
        );
      case "gold":
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/10 p-4 text-xs text-neutral-500">
              <p>
                {config ? t.gold.officialPrices : t.gold.estimatedPrices}{" "}
                {fill(t.gold.nisabRule, {
                  fineMetal: <strong className="text-navy">{t.gold.fineMetal}</strong>,
                  goldGrams: <Num>{fmt.grams(goldNisabGrams)}</Num>,
                  silverGrams: <Num>{fmt.grams(silverNisabGrams)}</Num>,
                })}{" "}
                {fill(config ? t.gold.basisOfficial : t.gold.basisEstimate, {
                  basis: <strong className="text-navy">{basisLabel}</strong>,
                })}
              </p>
              <p className="mt-1">
                {pricingLoading
                  ? t.gold.loading
                  : pricingError
                    ? format(t.gold.errorFallback, { error: ratesErrorText(pricingError) })
                    : [
                        config?.pricesAsOf && !Number.isNaN(Date.parse(config.pricesAsOf))
                          ? format(t.gold.pricesAsOf, { date: fmt.dateTime(new Date(config.pricesAsOf)) })
                          : null,
                        config?.priceSource,
                        config?.usdEtbRate ? format(t.gold.usdEtb, { rate: fmt.rate(config.usdEtbRate) }) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
              </p>
            </div>
            <div className="space-y-3">
              {form.metalItems.map((item, index) => {
                const gramsError = parseAmount(item.grams).error;
                const number = fmt.count(index + 1);
                return (
                  <div key={item.id} className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-1.5">
                      <label htmlFor={`${baseId}-metal-${item.id}`} className="text-xs text-neutral-500">
                        {format(t.gold.metalLabel, { number })}
                      </label>
                      <select
                        id={`${baseId}-metal-${item.id}`}
                        value={item.metal}
                        onChange={(e) => updateMetalItem(item.id, "metal", e.target.value as MetalType)}
                        className={`${FIELD_CLASS} border-black/10 ${FOCUS_RING}`}
                      >
                        <option value="gold">{t.gold.metals.gold}</option>
                        <option value="silver">{t.gold.metals.silver}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`${baseId}-grams-${item.id}`} className="text-xs text-neutral-500">
                        {t.gold.grams}
                      </label>
                      <input
                        id={`${baseId}-grams-${item.id}`}
                        type="text"
                        inputMode="decimal"
                        maxLength={32}
                        value={item.grams}
                        onChange={(e) => updateMetalItem(item.id, "grams", cleanAmount(e.target.value))}
                        aria-invalid={gramsError ? true : undefined}
                        aria-describedby={gramsError ? `${baseId}-grams-${item.id}-error` : undefined}
                        className={`${FIELD_CLASS} ${gramsError ? "border-accent-ink" : "border-black/10"} ${FOCUS_RING}`}
                        placeholder="0"
                      />
                      {gramsError && (
                        <p id={`${baseId}-grams-${item.id}-error`} className="text-xs text-accent-ink">
                          {t.inputErrors[gramsError]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`${baseId}-karat-${item.id}`} className="text-xs text-neutral-500">
                        {t.gold.karat}
                      </label>
                      <select
                        id={`${baseId}-karat-${item.id}`}
                        value={item.karat}
                        onChange={(e) => updateMetalItem(item.id, "karat", Number(e.target.value) as Karat)}
                        className={`${FIELD_CLASS} border-black/10 ${FOCUS_RING}`}
                      >
                        {KARATS.map((karat) => (
                          <option key={karat} value={karat}>
                            {format(t.gold.karatOption, { karat })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeMetalItem(item.id)}
                        disabled={form.metalItems.length === 1}
                        aria-label={format(t.gold.removeLabel, { number })}
                        className={`w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:border-accent-ink hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-black/10 disabled:hover:text-neutral-500 ${FOCUS_RING}`}
                      >
                        {t.gold.remove}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={addMetalItem}
                className={`rounded-full border border-black/10 px-4 py-2 text-xs text-navy transition-colors hover:border-brand ${FOCUS_RING}`}
              >
                {t.gold.addItem}
              </button>
              <p className="text-xs text-neutral-500">
                {fill(t.gold.summary, {
                  goldGross: <Num>{fmt.grams(goldGrossGrams)}</Num>,
                  goldFine: <Num>{fmt.grams(goldFineGrams)}</Num>,
                  silverGross: <Num>{fmt.grams(silverGrossGrams)}</Num>,
                  silverFine: <Num>{fmt.grams(silverFineGrams)}</Num>,
                  value: <Num>{fmt.currency(preciousMetalsValue)}</Num>,
                })}
              </p>
            </div>
          </div>
        );
      case "business":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput("businessCash", t.business.businessCash)}
            {renderAmountInput("inventoryValue", t.business.inventoryValue)}
            {renderAmountInput("businessReceivables", t.business.receivables)}
            {renderAmountInput("businessShortTermPayables", t.business.payables)}
            {renderAmountInput("propertyForResaleValue", t.business.propertyForResale, t.business.propertyForResaleHelp)}
          </div>
        );
      case "propertyStocks":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput("rentalSavings", t.propertyStocks.rentalSavings, t.propertyStocks.rentalSavingsHelp)}
            {renderAmountInput("stocksTradingValue", t.propertyStocks.stocksTrading)}
            {renderAmountInput("stocksDividendCash", t.propertyStocks.dividendCash)}
            {renderAmountInput(
              "longTermCompanyZakatableAssets",
              t.propertyStocks.longTermAssets,
              t.propertyStocks.longTermAssetsHelp,
            )}
          </div>
        );
      case "agriculture": {
        const irrigationLabelId = `${baseId}-irrigation`;
        return (
          <div className="space-y-4">
            {renderAmountInput(
              "cropsHarvestKg",
              t.agriculture.harvest,
              fill(t.agriculture.harvestHelp, { nisabKg: <Num>{fmt.kg(agriNisabKg)}</Num> }),
            )}
            <div className="space-y-2">
              <p id={irrigationLabelId} className="text-xs text-neutral-500">
                {t.agriculture.irrigation}
              </p>
              <div role="group" aria-labelledby={irrigationLabelId} className="flex flex-wrap gap-2">
                {renderChoiceChips<IrrigationMode>(
                  [
                    { key: "natural", label: fill(t.agriculture.natural, { rate: rateNum(rules.rainFedRate) }) },
                    { key: "mixed", label: fill(t.agriculture.mixed, { rate: rateNum(rules.mixedRate) }) },
                    {
                      key: "artificial",
                      label: fill(t.agriculture.artificial, { rate: rateNum(rules.irrigatedRate) }),
                    },
                  ],
                  form.irrigationMode,
                  (irrigationMode) => setForm((prev) => ({ ...prev, irrigationMode })),
                )}
              </div>
            </div>
          </div>
        );
      }
      case "livestock":
        return (
          <div className="space-y-4">
            <div role="group" aria-label={t.livestock.typeGroup} className="flex flex-wrap gap-2">
              {renderChoiceChips<LivestockMode>(
                [
                  { key: "sheepGoat", label: t.livestock.types.sheepGoat },
                  { key: "cattle", label: t.livestock.types.cattle },
                  { key: "camels", label: t.livestock.types.camels },
                ],
                form.livestockMode,
                (livestockMode) => setForm((prev) => ({ ...prev, livestockMode })),
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={form.livestockFreelyGrazing}
                  onChange={(e) => setForm((prev) => ({ ...prev, livestockFreelyGrazing: e.target.checked }))}
                />
                {t.livestock.freelyGrazing}
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={form.livestockUsedForWork}
                  onChange={(e) => setForm((prev) => ({ ...prev, livestockUsedForWork: e.target.checked }))}
                />
                {t.livestock.usedForWork}
              </label>
            </div>
            {form.livestockMode === "sheepGoat" &&
              renderAmountInput("sheepGoatCount", t.livestock.sheepGoatCount, undefined, { wholeNumber: true })}
            {form.livestockMode === "cattle" &&
              renderAmountInput("cattleCount", t.livestock.cattleCount, undefined, { wholeNumber: true })}
            {form.livestockMode === "camels" &&
              renderAmountInput("camelsCount", t.livestock.camelsCount, undefined, { wholeNumber: true })}
          </div>
        );
      case "rikazMinerals":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput(
              "rikazValue",
              t.rikazMinerals.rikaz,
              fill(t.rikazMinerals.rikazHelp, { rate: rateNum(RIKAZ_RATE) }),
            )}
            {renderAmountInput(
              "mineralsValue",
              t.rikazMinerals.minerals,
              fill(t.rikazMinerals.mineralsHelp, { rate: rateNum(zakatRate) }),
            )}
          </div>
        );
      case "debts":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput("shortTermPersonalLiabilities", t.debts.shortTerm)}
            {renderAmountInput("upcomingLoanPayments12m", t.debts.loanPayments, t.debts.loanPaymentsHelp)}
          </div>
        );
      default:
        return null;
    }
  };

  const activeCategories = CATEGORIES.filter((c) => has(c.key));
  const remainingCategories = CATEGORIES.filter((c) => !has(c.key));

  const breakdownRows: { key: string; label: ReactNode; value: ReactNode; deduction?: boolean }[] = [];
  const wealthRate = rateNum(zakatRate);
  const breakdown = t.result.breakdown;
  if (has("cash"))
    breakdownRows.push({ key: "cash", label: fill(breakdown.cash, { rate: wealthRate }), value: money(cashShare) });
  if (has("gold"))
    breakdownRows.push({ key: "gold", label: fill(breakdown.gold, { rate: wealthRate }), value: money(goldShare) });
  if (has("business"))
    breakdownRows.push({
      key: "business",
      label: fill(breakdown.business, { rate: wealthRate }),
      value: money(businessShare),
    });
  if (has("propertyStocks"))
    breakdownRows.push({
      key: "propertyStocks",
      label: fill(breakdown.propertyStocks, { rate: wealthRate }),
      value: money(propertyShare),
    });
  if (has("rikazMinerals"))
    breakdownRows.push({
      key: "rikaz",
      label: fill(breakdown.rikaz, { rate: rateNum(RIKAZ_RATE) }),
      value: money(rikazDue),
    });
  if (has("rikazMinerals"))
    breakdownRows.push({
      key: "minerals",
      label: fill(breakdown.minerals, { rate: wealthRate }),
      value: money(mineralsDue),
    });
  if (has("debts"))
    breakdownRows.push({
      key: "liabilities",
      label: breakdown.liabilities,
      value: fill(t.result.deduction, { amount: <Num>{fmt.currency(liabilitiesDeduction)}</Num> }),
      deduction: true,
    });

  const addHeadingId = `${baseId}-add-heading`;

  return (
    <section className="relative z-10 w-full overflow-hidden bg-brand">
      {/* Decorative brand graphic: a CSS background, so it has no image alt to miss. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute end-[-28%] top-1/2 z-0 aspect-[1200/1038] h-[150%] -translate-y-1/2 select-none bg-[url(/images/bg.webp)] bg-contain bg-no-repeat opacity-60"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-white/90 rtl:tracking-normal">{t.intro.eyebrow}</p>
          <h2 className="font-serif-display mt-3 text-4xl leading-none tracking-[-1.8px] text-white sm:text-5xl md:text-6xl rtl:tracking-normal">
            {fill(t.intro.title, {
              accent: <span className="italic rtl:not-italic">{t.intro.titleAccent}</span>,
            })}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">{t.intro.body}</p>

          <div className="mt-8 inline-flex items-center gap-2 text-xs text-white/90">
            <InfoIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {config ? (
              <span>
                {t.rates.snapshot}{" "}
                <span className="font-medium text-white">
                  {fill(t.rates.gold24k, { price: <Num>{fmt.currency(gold24kEtb)}</Num> })}
                </span>
                {" · "}
                <span className="font-medium text-white">
                  {fill(t.rates.silver, { price: <Num>{fmt.currency(silver24kEtb)}</Num> })}
                </span>
                {" · "}
                {fill(t.rates.nisab, { basis: basisLabel, amount: <Num>{fmt.currency(nisabETB)}</Num> })}
              </span>
            ) : pricingLoading ? (
              <span>{t.rates.loading}</span>
            ) : (
              <span>{t.rates.unavailable}</span>
            )}
          </div>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-3xl">
          <div className="rounded-3xl border border-black/5 bg-white p-3 shadow-xl shadow-black/5 sm:p-4">
            {/* Active asset sections */}
            <div className="space-y-3">
              {activeCategories.map((cat) => {
                const Icon = cat.icon;
                const { label, ruling } = t.categories[cat.key];
                const removeLabel = format(t.actions.remove, { label });
                return (
                  <div key={cat.key} className="rounded-2xl border border-black/10 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
                          <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
                        </span>
                        <h3
                          id={sectionId(cat.key)}
                          tabIndex={-1}
                          className="rounded-sm text-sm font-medium text-navy outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          {label}
                        </h3>
                        <InfoTip
                          buttonLabel={format(t.actions.whyDue, { label })}
                          text={
                            <>
                              {fill(ruling, rulingValues)}
                              {usingEstimates ? ` ${t.rates.estimateNote}` : null}
                            </>
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.key)}
                        aria-label={removeLabel}
                        title={removeLabel}
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 text-neutral-500 transition-colors hover:border-accent-ink hover:text-accent-ink ${FOCUS_RING}`}
                      >
                        <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    {renderPanel(cat.key)}
                  </div>
                );
              })}

              {activeCategories.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-neutral-500">
                  {t.actions.empty}
                </div>
              )}
            </div>

            {/* Add-asset chips */}
            {remainingCategories.length > 0 && (
              <div className="mt-4">
                <p
                  id={addHeadingId}
                  className="mb-2 text-xs uppercase tracking-[0.16em] text-neutral-500 rtl:tracking-normal"
                >
                  {t.actions.addHeading}
                </p>
                <div role="group" aria-labelledby={addHeadingId} className="flex flex-wrap gap-2">
                  {remainingCategories.map((cat) => {
                    const Icon = cat.icon;
                    const { label } = t.categories[cat.key];
                    return (
                      <button
                        key={cat.key}
                        id={chipId(cat.key)}
                        type="button"
                        onClick={() => addCategory(cat.key)}
                        aria-label={format(t.actions.add, { label })}
                        className={`inline-flex items-center gap-2 rounded-full border border-dashed border-black/20 px-3.5 py-2 text-xs text-navy transition-colors hover:border-brand hover:text-brand ${FOCUS_RING}`}
                      >
                        <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Consolidated result */}
            <div className="mt-4 rounded-2xl bg-neutral-100 p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-600 rtl:tracking-normal">
                  {t.result.total}
                </p>
                {hasMonetaryCategory && (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      className="accent-brand"
                      checked={form.hawlCompleted}
                      onChange={(e) => setForm((prev) => ({ ...prev, hawlCompleted: e.target.checked }))}
                    />
                    {t.result.hawl}
                  </label>
                )}
              </div>

              {/* Announces the new total (or the reason there is none) as amounts change. */}
              <div aria-live="polite" aria-atomic="true">
                {hasInputErrors ? (
                  <p className="font-serif-display mt-2 text-2xl tracking-[-0.5px] text-accent-ink sm:text-3xl rtl:tracking-normal">
                    {t.result.checkAmounts}
                  </p>
                ) : (
                  <p className="font-serif-display mt-2 text-3xl break-words tabular-nums tracking-[-1px] text-navy sm:text-4xl md:text-5xl rtl:tracking-normal">
                    <span className="sr-only">{t.result.total}: </span>
                    {money(totalEtbDue)}
                  </p>
                )}
              </div>

              {/* In-kind dues reported separately from the monetary total */}
              {!hasInputErrors && hasInKind && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {agricultureDue > 0 && (
                    <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
                      {fill(t.result.crops, { amount: <Num>{fmt.currency(agricultureDue)}</Num> })}
                    </span>
                  )}
                  {livestockOwed && (
                    <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
                      {format(t.result.animals, {
                        animals: animalsText(livestockOwed),
                        type: t.livestock.types[form.livestockMode],
                      })}
                    </span>
                  )}
                </div>
              )}

              {!hasInputErrors && breakdownRows.length > 0 && (
                <div className="mt-4 space-y-2 text-xs text-neutral-600">
                  {breakdownRows.map((row) => (
                    <p key={row.key} className="flex items-center justify-between gap-3">
                      <span>{row.label}</span>
                      <span className={`text-end ${row.deduction ? "text-accent-ink" : "text-navy"}`}>{row.value}</span>
                    </p>
                  ))}
                </div>
              )}

              {!hasInputErrors && hasMonetaryCategory && (
                <div className="mt-4 space-y-2 border-t border-black/10 pt-3 text-xs text-neutral-600">
                  <p className="flex items-center justify-between gap-3">
                    <span>{t.result.netBase}</span>
                    <span className="text-end text-navy">{money(adjustedAnnualBase)}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span>{t.result.nisabThreshold}</span>
                    <span className="text-end text-navy">
                      {fill(t.result.nisabStatus, {
                        amount: <Num>{fmt.currency(nisabETB)}</Num>,
                        status: meetsNisab ? t.result.nisabMet : t.result.nisabBelow,
                      })}
                    </span>
                  </p>
                  {!form.hawlCompleted && <p className="text-accent-ink">{t.result.noHawl}</p>}
                  {form.hawlCompleted && !meetsNisab && <p className="text-accent-ink">{t.result.belowNisab}</p>}
                </div>
              )}

              {/* Payment itself happens in the EZAC app; /zakat/pay explains how. */}
              {readyToPay ? (
                <LocalizedLink
                  href="/zakat/pay"
                  title={t.result.payTitle}
                  className={`group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm text-white transition-all duration-300 hover:scale-[1.01] ${FOCUS_RING}`}
                >
                  {t.result.pay}
                  <ArrowRightIcon
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </LocalizedLink>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-black/10 py-4 text-sm text-neutral-500"
                >
                  {t.result.pay}
                  <ArrowRightIcon className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                </button>
              )}
              <p className="mt-3 text-center text-xs text-neutral-600">{t.result.payNote}</p>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-600 rtl:tracking-normal">
                <span>{t.result.bank}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
