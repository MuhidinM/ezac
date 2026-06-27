"use client";

import { useEffect, useState } from "react";
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

type CategoryKey =
  | "cash"
  | "gold"
  | "business"
  | "propertyStocks"
  | "agriculture"
  | "livestock"
  | "rikazMinerals"
  | "debts";

type Category = {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  ruling: string;
};

const CATEGORIES: Category[] = [
  {
    key: "cash",
    label: "Cash & Money",
    icon: CoinsIcon,
    ruling:
      "Zakat of 2.5% is due on cash, bank and mobile-money balances, plus reliable debts owed to you — once your total wealth meets Nisab and has been held for a full lunar year (Hawl).",
  },
  {
    key: "gold",
    label: "Gold / Silver",
    icon: GemIcon,
    ruling:
      "Gold and silver owe 2.5% by fine-metal weight (gross grams × karat ÷ 24). Nisab is 85g fine gold or 595g fine silver. Most scholars include jewellery, whether worn or stored.",
  },
  {
    key: "business",
    label: "Business",
    icon: BriefcaseIcon,
    ruling:
      "Trade goods bought to resell — inventory, business cash and receivables (less short-term payables) — owe 2.5%. Fixed assets such as machinery, vehicles and buildings are exempt.",
  },
  {
    key: "propertyStocks",
    label: "Property & Stocks",
    icon: Building2Icon,
    ruling:
      "Your home and rental-property value are exempt — only saved rental income is charged. Trading shares owe 2.5% of market value; long-term shares owe 2.5% of the company's zakatable assets.",
  },
  {
    key: "agriculture",
    label: "Agriculture",
    icon: LeafIcon,
    ruling:
      "Ushr is due on harvest day, with no Hawl: 10% if rain-fed, 7.5% if mixed, 5% if irrigated artificially. Nisab is about 653 kg of produce.",
  },
  {
    key: "livestock",
    label: "Livestock",
    icon: LandmarkIcon,
    ruling:
      "Due only on freely-grazing (Sa'imah), non-working animals kept for milk or breeding, following the prophetic Nisab tables for sheep/goats, cattle and camels.",
  },
  {
    key: "rikazMinerals",
    label: "Rikaz / Minerals",
    icon: FactoryIcon,
    ruling:
      "Rikaz (buried treasure) owes 20% immediately, with no Nisab or Hawl. Mined minerals owe 2.5% once they reach the gold/silver Nisab value.",
  },
  {
    key: "debts",
    label: "Debts & Liabilities",
    icon: ScaleIcon,
    ruling:
      "Deduct short-term debts due within the lunar year, plus the next 12 months of long-term loan payments, from your zakatable wealth before the 2.5% is applied.",
  },
];

const ZAKAT_RATE = 0.025;
const RIKAZ_RATE = 0.2;
const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;
const AGRI_NISAB_KG = 653;
const SILVER_PRICE_PER_GRAM_ETB = 412;
const GOLD_PRICE_PER_GRAM_ETB = 7200;
const KARATS = [24, 22, 21, 20, 18, 16, 14, 10] as const;

type MetalType = "gold" | "silver";
type Karat = (typeof KARATS)[number];
type RatesByKarat = Record<Karat, number>;
type MetalPricing = {
  usdToEtb: number;
  etbPerGram: Record<MetalType, RatesByKarat>;
  fetchedAt: string;
  expiresAt: string;
  sourceStatus: "live" | "cache";
};
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

function parseAmount(value: string) {
  return parseFloat(value.replace(/,/g, "")) || 0;
}

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

function etbPerGramForKarat(
  metal: MetalType,
  karat: Karat,
  pricing: MetalPricing | null,
): number {
  const pure24FallbackConst =
    metal === "gold" ? GOLD_PRICE_PER_GRAM_ETB : SILVER_PRICE_PER_GRAM_ETB;
  if (!pricing) {
    return pure24FallbackConst * (karat / 24);
  }
  const rates = pricing.etbPerGram[metal];
  const direct = rates[karat];
  if (typeof direct === "number" && direct > 0) {
    return direct;
  }
  const pure24 = rates[24];
  if (typeof pure24 === "number" && pure24 > 0) {
    return pure24 * (karat / 24);
  }
  return pure24FallbackConst * (karat / 24);
}

function irrigationRate(mode: IrrigationMode) {
  switch (mode) {
    case "natural":
      return 0.1;
    case "mixed":
      return 0.075;
    case "artificial":
      return 0.05;
    default:
      return 0.1;
  }
}

function getLivestockDueString(mode: LivestockMode, count: number): string {
  if (mode === "sheepGoat") {
    if (count < 40) return "No Zakat";
    if (count <= 120) return "1 Sheep";
    if (count <= 200) return "2 Sheep";
    if (count <= 399) return "3 Sheep";
    return `${Math.floor(count / 100)} Sheep`;
  }

  if (mode === "cattle") {
    if (count < 30) return "No Zakat";
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
    const parts = [];
    if (bestM > 0) parts.push(`${bestM} Musinnah (2yr cow)`);
    if (bestT > 0) parts.push(`${bestT} Tabi' (1yr calf)`);
    return parts.join(" + ");
  }

  if (mode === "camels") {
    if (count < 5) return "No Zakat";
    if (count <= 9) return "1 Sheep";
    if (count <= 14) return "2 Sheep";
    if (count <= 19) return "3 Sheep";
    if (count <= 24) return "4 Sheep";
    if (count <= 35) return "1 Bint Makhad (1yr female)";
    if (count <= 45) return "1 Bint Labun (2yr female)";
    if (count <= 60) return "1 Hiqqah (3yr female)";
    if (count <= 75) return "1 Jadh'ah (4yr female)";
    if (count <= 90) return "2 Bint Labun (2yr female)";
    if (count <= 120) return "2 Hiqqah (3yr female)";

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
    const parts = [];
    if (bestF > 0) parts.push(`${bestF} Bint Labun (2yr)`);
    if (bestH > 0) parts.push(`${bestH} Hiqqah (3yr)`);
    return parts.join(" + ");
  }
  return "No Zakat";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatGrams(value: number) {
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(value);
}

function livestockTypeLabel(mode: LivestockMode) {
  switch (mode) {
    case "sheepGoat":
      return "Sheep / Goats";
    case "cattle":
      return "Cattle / Buffaloes";
    case "camels":
      return "Camels";
    default:
      return "Livestock";
  }
}

/** Small (i) affordance that reveals a category's fiqh ruling on hover/tap. */
function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Why is this due?"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors"
        style={{ color: open ? "#007050" : "#9a9a9a" }}
      >
        <InfoIcon className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-30 mb-2 w-60 max-w-[70vw] -translate-x-1/2 rounded-xl p-3 text-left text-[11px] leading-relaxed shadow-lg"
          style={{ backgroundColor: "#001539", color: "rgba(255,255,255,0.92)" }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function ZakatCalculator() {
  const [added, setAdded] = useState<CategoryKey[]>(["cash"]);
  const [form, setForm] = useState<CalculatorState>(INITIAL_STATE);
  const [metalPricing, setMetalPricing] = useState<MetalPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPricing() {
      try {
        setPricingLoading(true);
        setPricingError(null);
        const response = await fetch("/api/metal-pricing", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as unknown;
        if (!response.ok || !json || typeof json !== "object") {
          const err =
            json &&
            typeof json === "object" &&
            "error" in json &&
            typeof (json as { error: unknown }).error === "string"
              ? (json as { error: string }).error
              : `Pricing unavailable (${response.status}).`;
          throw new Error(err);
        }
        const pricing = json as MetalPricing;
        if (
          typeof pricing.usdToEtb !== "number" ||
          !pricing.etbPerGram?.gold ||
          !pricing.etbPerGram?.silver
        ) {
          throw new Error("Invalid pricing response from server.");
        }
        if (isMounted) {
          setMetalPricing(pricing);
        }
      } catch (error) {
        if (isMounted) {
          setPricingError(
            error instanceof Error
              ? error.message
              : "Unable to load live metal market values.",
          );
        }
      } finally {
        if (isMounted) {
          setPricingLoading(false);
        }
      }
    }

    loadPricing();
    return () => {
      isMounted = false;
    };
  }, []);

  const has = (key: CategoryKey) => added.includes(key);

  const addCategory = (key: CategoryKey) =>
    setAdded((prev) => (prev.includes(key) ? prev : [...prev, key]));
  const removeCategory = (key: CategoryKey) =>
    setAdded((prev) => prev.filter((k) => k !== key));

  // Cash base
  const cashBase =
    parseAmount(form.cashOnHand) +
    parseAmount(form.bankAndMobile) +
    parseAmount(form.goodDebtReceivables) +
    parseAmount(form.doubtfulDebtCollectedThisYear);

  // Precious metals (karat affects ETB/g; Nisab uses fine gold/silver grams)
  const goldGrossGrams = form.metalItems
    .filter((item) => item.metal === "gold")
    .reduce((sum, item) => sum + parseAmount(item.grams), 0);
  const silverGrossGrams = form.metalItems
    .filter((item) => item.metal === "silver")
    .reduce((sum, item) => sum + parseAmount(item.grams), 0);
  const goldFineGrams = form.metalItems
    .filter((item) => item.metal === "gold")
    .reduce(
      (sum, item) => sum + fineMetalGrams(parseAmount(item.grams), item.karat),
      0,
    );
  const silverFineGrams = form.metalItems
    .filter((item) => item.metal === "silver")
    .reduce(
      (sum, item) => sum + fineMetalGrams(parseAmount(item.grams), item.karat),
      0,
    );
  const preciousMetalsValue = form.metalItems.reduce((sum, item) => {
    const grams = parseAmount(item.grams);
    const etbPerGram = etbPerGramForKarat(item.metal, item.karat, metalPricing);
    return sum + grams * etbPerGram;
  }, 0);
  const meetsPreciousMetalsNisab =
    goldFineGrams >= GOLD_NISAB_GRAMS || silverFineGrams >= SILVER_NISAB_GRAMS;

  // Business base
  const businessBase =
    parseAmount(form.businessCash) +
    parseAmount(form.inventoryValue) +
    parseAmount(form.businessReceivables) -
    parseAmount(form.businessShortTermPayables) +
    parseAmount(form.propertyForResaleValue);

  // Property & stocks base
  const propertyStocksBase =
    parseAmount(form.rentalSavings) +
    parseAmount(form.stocksTradingValue) +
    parseAmount(form.stocksDividendCash) +
    parseAmount(form.longTermCompanyZakatableAssets);

  // Agriculture (no Hawl required)
  const agricultureHarvestKg = parseAmount(form.cropsHarvestKg);
  const agricultureDue =
    has("agriculture") && agricultureHarvestKg >= AGRI_NISAB_KG
      ? agricultureHarvestKg * irrigationRate(form.irrigationMode)
      : 0;

  // Thresholds & minerals / rikaz
  const silver24kEtb =
    metalPricing?.etbPerGram.silver[24] ?? SILVER_PRICE_PER_GRAM_ETB;
  const gold24kEtb =
    metalPricing?.etbPerGram.gold[24] ?? GOLD_PRICE_PER_GRAM_ETB;
  const nisabETB = SILVER_NISAB_GRAMS * silver24kEtb;
  const mineralsBase = parseAmount(form.mineralsValue);
  const mineralsDue =
    has("rikazMinerals") && mineralsBase >= nisabETB
      ? mineralsBase * ZAKAT_RATE
      : 0;
  const rikazDue = has("rikazMinerals")
    ? parseAmount(form.rikazValue) * RIKAZ_RATE
    : 0;

  // Livestock
  const livestockCount =
    form.livestockMode === "sheepGoat"
      ? parseAmount(form.sheepGoatCount)
      : form.livestockMode === "cattle"
        ? parseAmount(form.cattleCount)
        : parseAmount(form.camelsCount);
  const livestockEligible =
    form.livestockFreelyGrazing && !form.livestockUsedForWork;
  const livestockUnits =
    has("livestock") && livestockEligible
      ? getLivestockDueString(form.livestockMode, livestockCount)
      : "No Zakat";

  // Pooled monetary base — only categories the user has actually added count.
  const includedCash = has("cash") ? cashBase : 0;
  const includedMetals = has("gold") ? preciousMetalsValue : 0;
  const includedBusiness = has("business") ? Math.max(0, businessBase) : 0;
  const includedProperty = has("propertyStocks") ? propertyStocksBase : 0;
  const deductibleLiabilities = has("debts")
    ? parseAmount(form.shortTermPersonalLiabilities) +
      parseAmount(form.upcomingLoanPayments12m)
    : 0;

  const annualZakatableBase =
    includedCash + includedMetals + includedBusiness + includedProperty;
  const adjustedAnnualBase = Math.max(
    0,
    annualZakatableBase - deductibleLiabilities,
  );
  const meetsNisab = adjustedAnnualBase >= nisabETB;
  const wealthDueActive = form.hawlCompleted && meetsNisab;

  // Per-category 2.5% shares (for the transparent breakdown)
  const cashShare = wealthDueActive ? includedCash * ZAKAT_RATE : 0;
  const goldShare = wealthDueActive ? includedMetals * ZAKAT_RATE : 0;
  const businessShare = wealthDueActive ? includedBusiness * ZAKAT_RATE : 0;
  const propertyShare = wealthDueActive ? includedProperty * ZAKAT_RATE : 0;
  const liabilitiesDeduction = wealthDueActive
    ? deductibleLiabilities * ZAKAT_RATE
    : 0;
  const annualDue = wealthDueActive ? adjustedAnnualBase * ZAKAT_RATE : 0;

  // Grand monetary total (in-kind dues are reported separately)
  const totalEtbDue = annualDue + rikazDue + mineralsDue;
  const hasInKind = agricultureDue > 0 || livestockUnits !== "No Zakat";
  const readyToPay = totalEtbDue > 0 || hasInKind;

  const hasMonetaryCategory = ["cash", "gold", "business", "propertyStocks"].some(
    (k) => has(k as CategoryKey),
  );

  const updateAmount =
    (key: keyof CalculatorState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value.replace(/[^0-9.,]/g, ""),
      }));
    };

  const updateMetalItem = (
    id: string,
    key: keyof Omit<MetalLineItem, "id">,
    value: string | MetalType | Karat,
  ) => {
    setForm((prev) => ({
      ...prev,
      metalItems: prev.metalItems.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addMetalItem = () => {
    setForm((prev) => ({
      ...prev,
      metalItems: [...prev.metalItems, createMetalItem()],
    }));
  };

  const removeMetalItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      metalItems:
        prev.metalItems.length > 1
          ? prev.metalItems.filter((item) => item.id !== id)
          : prev.metalItems,
    }));
  };

  const renderAmountInput = (
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    helper?: string,
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs" style={{ color: "#6F6F6F" }}>
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#007050]"
        placeholder="0"
        style={{ color: "#001539" }}
      />
      {helper && (
        <p className="text-[11px]" style={{ color: "#6F6F6F" }}>
          {helper}
        </p>
      )}
    </div>
  );

  const renderPanel = (key: CategoryKey) => {
    switch (key) {
      case "cash":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput(
              "Cash on hand (ETB)",
              form.cashOnHand,
              updateAmount("cashOnHand"),
            )}
            {renderAmountInput(
              "Bank + mobile money (ETB)",
              form.bankAndMobile,
              updateAmount("bankAndMobile"),
            )}
            {renderAmountInput(
              "Reliable debts owed to you (ETB)",
              form.goodDebtReceivables,
              updateAmount("goodDebtReceivables"),
              "Include only debts likely to be repaid.",
            )}
            {renderAmountInput(
              "Previously doubtful debt collected this year (ETB)",
              form.doubtfulDebtCollectedThisYear,
              updateAmount("doubtfulDebtCollectedThisYear"),
            )}
          </div>
        );
      case "gold":
        return (
          <div className="space-y-4">
            <div
              className="rounded-2xl border border-black/10 p-4 text-xs"
              style={{ color: "#6F6F6F" }}
            >
              <p>
                Live rates: GoldAPI (USD per gram by karat) × Cooperative Bank
                of Oromia USD→ETB. Nisab uses{" "}
                <strong style={{ color: "#001539" }}>fine metal</strong> (gross
                grams × karat ÷ 24): gold ≥ {GOLD_NISAB_GRAMS}g fine, silver ≥{" "}
                {SILVER_NISAB_GRAMS}g fine.
              </p>
              <p className="mt-1">
                {pricingLoading
                  ? "Loading live market values..."
                  : pricingError
                    ? `${pricingError} Using purity-adjusted offline estimates until live pricing loads.`
                    : `USD/ETB ${metalPricing?.usdToEtb.toFixed(3)} · Updated ${new Date(metalPricing?.fetchedAt ?? "").toLocaleString()} (${metalPricing?.sourceStatus === "cache" ? "cached" : "live"})`}
              </p>
            </div>
            <div className="space-y-3">
              {form.metalItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="text-xs" style={{ color: "#6F6F6F" }}>
                      Metal #{index + 1}
                    </label>
                    <select
                      value={item.metal}
                      onChange={(e) =>
                        updateMetalItem(
                          item.id,
                          "metal",
                          e.target.value as MetalType,
                        )
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#007050]"
                      style={{ color: "#001539" }}
                    >
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs" style={{ color: "#6F6F6F" }}>
                      Grams
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.grams}
                      onChange={(e) =>
                        updateMetalItem(
                          item.id,
                          "grams",
                          e.target.value.replace(/[^0-9.,]/g, ""),
                        )
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#007050]"
                      placeholder="0"
                      style={{ color: "#001539" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs" style={{ color: "#6F6F6F" }}>
                      Karat
                    </label>
                    <select
                      value={item.karat}
                      onChange={(e) =>
                        updateMetalItem(
                          item.id,
                          "karat",
                          Number(e.target.value) as Karat,
                        )
                      }
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#007050]"
                      style={{ color: "#001539" }}
                    >
                      {KARATS.map((karat) => (
                        <option key={karat} value={karat}>
                          {karat}k
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeMetalItem(item.id)}
                      disabled={form.metalItems.length === 1}
                      className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ color: "#6F6F6F" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={addMetalItem}
                className="rounded-full border border-black/10 px-4 py-2 text-xs transition-colors hover:border-[#007050]"
                style={{ color: "#001539" }}
              >
                Add Metal Item
              </button>
              <p className="text-[11px]" style={{ color: "#6F6F6F" }}>
                Gold {formatGrams(goldGrossGrams)}g (fine{" "}
                {formatGrams(goldFineGrams)}g) · Silver{" "}
                {formatGrams(silverGrossGrams)}g (fine{" "}
                {formatGrams(silverFineGrams)}g) · value ETB{" "}
                {formatCurrency(preciousMetalsValue)} · Nisab{" "}
                {meetsPreciousMetalsNisab ? "met" : "below"}
              </p>
            </div>
          </div>
        );
      case "business":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput(
              "Business cash (ETB)",
              form.businessCash,
              updateAmount("businessCash"),
            )}
            {renderAmountInput(
              "Inventory market value (ETB)",
              form.inventoryValue,
              updateAmount("inventoryValue"),
            )}
            {renderAmountInput(
              "Business receivables (ETB)",
              form.businessReceivables,
              updateAmount("businessReceivables"),
            )}
            {renderAmountInput(
              "Short-term business payables (ETB)",
              form.businessShortTermPayables,
              updateAmount("businessShortTermPayables"),
            )}
            {renderAmountInput(
              "Property bought for resale (ETB)",
              form.propertyForResaleValue,
              updateAmount("propertyForResaleValue"),
              "Included as trading asset when intention is resale.",
            )}
          </div>
        );
      case "propertyStocks":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput(
              "Saved rental income (ETB)",
              form.rentalSavings,
              updateAmount("rentalSavings"),
              "Rental property value is not charged; saved rental cash is.",
            )}
            {renderAmountInput(
              "Trading stocks current value (ETB)",
              form.stocksTradingValue,
              updateAmount("stocksTradingValue"),
            )}
            {renderAmountInput(
              "Dividend cash held (ETB)",
              form.stocksDividendCash,
              updateAmount("stocksDividendCash"),
            )}
            {renderAmountInput(
              "Long-term company zakatable assets (ETB)",
              form.longTermCompanyZakatableAssets,
              updateAmount("longTermCompanyZakatableAssets"),
              "Use when company disclosures provide zakatable asset amount.",
            )}
          </div>
        );
      case "agriculture":
        return (
          <div className="space-y-4">
            {renderAmountInput(
              "Harvest amount (kg)",
              form.cropsHarvestKg,
              updateAmount("cropsHarvestKg"),
              `Nisab starts at ${AGRI_NISAB_KG} kg. Due on harvest — no Hawl needed.`,
            )}
            <div className="space-y-2">
              <p className="text-xs" style={{ color: "#6F6F6F" }}>
                Irrigation method
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "natural", label: "Natural (10%)" },
                  { key: "mixed", label: "Mixed (7.5%)" },
                  { key: "artificial", label: "Artificial (5%)" },
                ].map((item) => {
                  const isActive = item.key === form.irrigationMode;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          irrigationMode: item.key as IrrigationMode,
                        }))
                      }
                      className="rounded-full border px-3 py-1.5 text-xs transition-colors"
                      style={{
                        borderColor: isActive ? "#007050" : "rgba(0,0,0,0.12)",
                        color: isActive ? "#007050" : "#6F6F6F",
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case "livestock":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "sheepGoat", label: "Sheep / Goats" },
                { key: "cattle", label: "Cattle / Buffaloes" },
                { key: "camels", label: "Camels" },
              ].map((item) => {
                const isActive = item.key === form.livestockMode;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        livestockMode: item.key as LivestockMode,
                      }))
                    }
                    className="rounded-full border px-3 py-1.5 text-xs transition-colors"
                    style={{
                      borderColor: isActive ? "#007050" : "rgba(0,0,0,0.12)",
                      color: isActive ? "#007050" : "#6F6F6F",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <label
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs"
                style={{ color: "#6F6F6F" }}
              >
                <input
                  type="checkbox"
                  checked={form.livestockFreelyGrazing}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      livestockFreelyGrazing: e.target.checked,
                    }))
                  }
                />
                Freely grazing most of year
              </label>
              <label
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs"
                style={{ color: "#6F6F6F" }}
              >
                <input
                  type="checkbox"
                  checked={form.livestockUsedForWork}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      livestockUsedForWork: e.target.checked,
                    }))
                  }
                />
                Used as working animals
              </label>
            </div>
            {form.livestockMode === "sheepGoat" &&
              renderAmountInput(
                "Number of sheep/goats",
                form.sheepGoatCount,
                updateAmount("sheepGoatCount"),
              )}
            {form.livestockMode === "cattle" &&
              renderAmountInput(
                "Number of cattle/buffaloes",
                form.cattleCount,
                updateAmount("cattleCount"),
              )}
            {form.livestockMode === "camels" &&
              renderAmountInput(
                "Number of camels",
                form.camelsCount,
                updateAmount("camelsCount"),
              )}
          </div>
        );
      case "rikazMinerals":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput(
              "Rikaz discovered value (ETB)",
              form.rikazValue,
              updateAmount("rikazValue"),
              "Rikaz is due immediately at 20%.",
            )}
            {renderAmountInput(
              "Minerals extracted value (ETB)",
              form.mineralsValue,
              updateAmount("mineralsValue"),
              "Minerals charged at 2.5% when Nisab is met.",
            )}
          </div>
        );
      case "debts":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {renderAmountInput(
              "Short-term personal liabilities (ETB)",
              form.shortTermPersonalLiabilities,
              updateAmount("shortTermPersonalLiabilities"),
            )}
            {renderAmountInput(
              "Next 12 months loan payments (ETB)",
              form.upcomingLoanPayments12m,
              updateAmount("upcomingLoanPayments12m"),
              "Deduct upcoming year only, not full long-term loan.",
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const activeCategories = CATEGORIES.filter((c) => has(c.key));
  const remainingCategories = CATEGORIES.filter((c) => !has(c.key));

  const breakdownRows: { label: string; value: string; deduction?: boolean }[] =
    [];
  if (has("cash"))
    breakdownRows.push({
      label: "Cash & money (2.5%)",
      value: `ETB ${formatCurrency(cashShare)}`,
    });
  if (has("gold"))
    breakdownRows.push({
      label: "Gold & silver (2.5%)",
      value: `ETB ${formatCurrency(goldShare)}`,
    });
  if (has("business"))
    breakdownRows.push({
      label: "Business (2.5%)",
      value: `ETB ${formatCurrency(businessShare)}`,
    });
  if (has("propertyStocks"))
    breakdownRows.push({
      label: "Property & stocks (2.5%)",
      value: `ETB ${formatCurrency(propertyShare)}`,
    });
  if (has("rikazMinerals"))
    breakdownRows.push({
      label: "Rikaz (20%)",
      value: `ETB ${formatCurrency(rikazDue)}`,
    });
  if (has("rikazMinerals"))
    breakdownRows.push({
      label: "Minerals (2.5%)",
      value: `ETB ${formatCurrency(mineralsDue)}`,
    });
  if (has("debts"))
    breakdownRows.push({
      label: "Less liabilities",
      value: `− ETB ${formatCurrency(liabilitiesDeduction)}`,
      deduction: true,
    });

  return (
    <section className="relative z-10 w-full overflow-hidden bg-[#007050]">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand graphic served as a static asset */}
      <img
        src="/bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-28%] z-0 h-[150%] w-auto max-w-none -translate-y-1/2 select-none opacity-60"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-8 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Quick Calculator
          </p>
          <h2
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{
              color: "#FFFFFF",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            Know your{" "}
            <span className="italic" style={{ color: "#e18f35" }}>
              Zakat
            </span>{" "}
            in seconds.
          </h2>
          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            Add only the assets you actually own. We total your Zakat across all
            of them and show a clear, transparent breakdown before you pay.
          </p>

          <div
            className="mt-8 inline-flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <InfoIcon className="h-3.5 w-3.5" />
            <span>
              Market snapshot{" "}
              <span style={{ color: "#FFFFFF", fontWeight: 500 }}>
                Gold 24k {formatCurrency(gold24kEtb)} ETB/g
              </span>
              {" · "}
              <span style={{ color: "#FFFFFF", fontWeight: 500 }}>
                Silver 24k {formatCurrency(silver24kEtb)} ETB/g
              </span>
              {" · "}
              Nisab ETB {formatCurrency(nisabETB)}
            </span>
          </div>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-3xl">
          <div className="rounded-3xl border border-black/5 bg-white p-3 shadow-xl shadow-black/5 sm:p-4">
            {/* Active asset sections */}
            <div className="space-y-3">
              {activeCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    className="rounded-2xl border border-black/10 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ backgroundColor: "rgba(0,112,80,0.1)" }}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: "#007050" }}
                          />
                        </span>
                        <h3
                          className="text-sm font-medium"
                          style={{ color: "#001539" }}
                        >
                          {cat.label}
                        </h3>
                        <InfoTip text={cat.ruling} />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.key)}
                        aria-label={`Remove ${cat.label}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 transition-colors hover:border-[#e18f35] hover:text-[#e18f35]"
                        style={{ color: "#6F6F6F" }}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {renderPanel(cat.key)}
                  </div>
                );
              })}

              {activeCategories.length === 0 && (
                <div
                  className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm"
                  style={{ color: "#6F6F6F" }}
                >
                  Add an asset type below to start calculating your Zakat.
                </div>
              )}
            </div>

            {/* Add-asset chips */}
            {remainingCategories.length > 0 && (
              <div className="mt-4">
                <p
                  className="mb-2 text-[11px] uppercase tracking-[0.16em]"
                  style={{ color: "#6F6F6F" }}
                >
                  Add what you own
                </p>
                <div className="flex flex-wrap gap-2">
                  {remainingCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => addCategory(cat.key)}
                        className="inline-flex items-center gap-2 rounded-full border border-dashed border-black/20 px-3.5 py-2 text-xs transition-colors hover:border-[#007050] hover:text-[#007050]"
                        style={{ color: "#001539" }}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        <Icon className="h-3.5 w-3.5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Consolidated result */}
            <div
              className="mt-4 rounded-2xl p-6"
              style={{ backgroundColor: "#ececec" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p
                  className="text-xs uppercase tracking-[0.16em]"
                  style={{ color: "#6F6F6F" }}
                >
                  Your total Zakat
                </p>
                {hasMonetaryCategory && (
                  <label
                    className="inline-flex cursor-pointer items-center gap-2 text-xs"
                    style={{ color: "#6F6F6F" }}
                  >
                    <input
                      type="checkbox"
                      checked={form.hawlCompleted}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          hawlCompleted: e.target.checked,
                        }))
                      }
                    />
                    Held a full lunar year (Hawl)
                  </label>
                )}
              </div>

              <p
                className="font-serif-display mt-2 text-4xl sm:text-5xl"
                style={{ color: "#001539", letterSpacing: "-1px" }}
              >
                ETB {formatCurrency(totalEtbDue)}
              </p>

              {/* In-kind dues reported separately from the monetary total */}
              {(agricultureDue > 0 || livestockUnits !== "No Zakat") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {agricultureDue > 0 && (
                    <span
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(0,112,80,0.12)",
                        color: "#007050",
                      }}
                    >
                      + {formatCurrency(agricultureDue)} kg crops (Ushr)
                    </span>
                  )}
                  {livestockUnits !== "No Zakat" && (
                    <span
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(0,112,80,0.12)",
                        color: "#007050",
                      }}
                    >
                      + {livestockUnits} ({livestockTypeLabel(form.livestockMode)})
                    </span>
                  )}
                </div>
              )}

              {breakdownRows.length > 0 && (
                <div
                  className="mt-4 space-y-2 text-xs"
                  style={{ color: "#6F6F6F" }}
                >
                  {breakdownRows.map((row) => (
                    <p
                      key={row.label}
                      className="flex items-center justify-between"
                    >
                      <span>{row.label}</span>
                      <span
                        style={{ color: row.deduction ? "#e18f35" : "#001539" }}
                      >
                        {row.value}
                      </span>
                    </p>
                  ))}
                </div>
              )}

              {hasMonetaryCategory && (
                <div
                  className="mt-4 space-y-2 border-t border-black/10 pt-3 text-xs"
                  style={{ color: "#6F6F6F" }}
                >
                  <p className="flex items-center justify-between">
                    <span>Net zakatable base</span>
                    <span style={{ color: "#001539" }}>
                      ETB {formatCurrency(adjustedAnnualBase)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Nisab threshold</span>
                    <span style={{ color: "#001539" }}>
                      ETB {formatCurrency(nisabETB)} ·{" "}
                      {meetsNisab ? "met" : "below"}
                    </span>
                  </p>
                  {!form.hawlCompleted && (
                    <p style={{ color: "#e18f35" }}>
                      Wealth has not completed a full lunar year — no wealth
                      Zakat is due yet.
                    </p>
                  )}
                  {form.hawlCompleted && !meetsNisab && (
                    <p style={{ color: "#e18f35" }}>
                      Your net wealth is below Nisab — no wealth Zakat is due
                      yet.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={!readyToPay}
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm transition-all duration-300 hover:scale-[1.01] disabled:hover:scale-100"
                style={{
                  backgroundColor: readyToPay ? "#007050" : "rgba(0,0,0,0.1)",
                  color: readyToPay ? "#FFFFFF" : "#6F6F6F",
                  cursor: readyToPay ? "pointer" : "not-allowed",
                }}
              >
                Proceed to Pay Zakat
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <div
                className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "#6F6F6F" }}
              >
                <span>Cooperative Bank of Oromia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
