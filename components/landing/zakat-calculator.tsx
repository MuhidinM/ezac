"use client";

import { useMemo, useState } from "react";
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
  ScaleIcon,
  ShieldCheckIcon,
} from "lucide-react";

type TabKey =
  | "cash"
  | "gold"
  | "business"
  | "propertyStocks"
  | "agriculture"
  | "livestock"
  | "rikazMinerals"
  | "debtsSummary";

type Tab = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const TABS: Tab[] = [
  {
    key: "cash",
    label: "Cash & Money",
    icon: CoinsIcon,
  },
  {
    key: "gold",
    label: "Gold / Silver",
    icon: GemIcon,
  },
  {
    key: "business",
    label: "Business",
    icon: BriefcaseIcon,
  },
  {
    key: "propertyStocks",
    label: "Property & Stocks",
    icon: Building2Icon,
  },
  {
    key: "agriculture",
    label: "Agriculture",
    icon: LeafIcon,
  },
  {
    key: "livestock",
    label: "Livestock",
    icon: LandmarkIcon,
  },
  {
    key: "rikazMinerals",
    label: "Rikaz / Minerals",
    icon: FactoryIcon,
  },
  {
    key: "debtsSummary",
    label: "Debts & Summary",
    icon: ScaleIcon,
  },
];

const ZAKAT_RATE = 0.025;
const RIKAZ_RATE = 0.2;
const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;
const AGRI_NISAB_KG = 653;
const SILVER_PRICE_PER_GRAM_ETB = 412;
const GOLD_PRICE_PER_GRAM_ETB = 7200;

type LivestockMode = "sheepGoat" | "cattle" | "camels";
type IrrigationMode = "natural" | "mixed" | "artificial";

type CalculatorState = {
  cashOnHand: string;
  bankAndMobile: string;
  goodDebtReceivables: string;
  doubtfulDebtCollectedThisYear: string;
  bullionGoldGrams: string;
  jewelryGoldGrams: string;
  silverGrams: string;
  includeJewelry: boolean;
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
  bullionGoldGrams: "",
  jewelryGoldGrams: "",
  silverGrams: "",
  includeJewelry: true,
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

export function ZakatCalculator() {
  const [activeKey, setActiveKey] = useState<TabKey>("cash");
  const [form, setForm] = useState<CalculatorState>(INITIAL_STATE);

  // Cash Tab Base
  const cashBase =
    parseAmount(form.cashOnHand) +
    parseAmount(form.bankAndMobile) +
    parseAmount(form.goodDebtReceivables) +
    parseAmount(form.doubtfulDebtCollectedThisYear);

  // Precious Metals Base
  const preciousMetalsValue =
    (parseAmount(form.bullionGoldGrams) +
      (form.includeJewelry ? parseAmount(form.jewelryGoldGrams) : 0)) *
      GOLD_PRICE_PER_GRAM_ETB +
    parseAmount(form.silverGrams) * SILVER_PRICE_PER_GRAM_ETB;

  // Business Base
  const businessBase =
    parseAmount(form.businessCash) +
    parseAmount(form.inventoryValue) +
    parseAmount(form.businessReceivables) -
    parseAmount(form.businessShortTermPayables) +
    parseAmount(form.propertyForResaleValue);

  // Property & Stocks Base
  const propertyStocksBase =
    parseAmount(form.rentalSavings) +
    parseAmount(form.stocksTradingValue) +
    parseAmount(form.stocksDividendCash) +
    parseAmount(form.longTermCompanyZakatableAssets);

  // Agriculture Base (No Hawl required)
  const agricultureHarvestKg = parseAmount(form.cropsHarvestKg);
  const agricultureDue =
    agricultureHarvestKg >= AGRI_NISAB_KG
      ? agricultureHarvestKg * irrigationRate(form.irrigationMode)
      : 0;

  // Thresholds & Minerals/Rikaz
  const nisabETB = SILVER_NISAB_GRAMS * SILVER_PRICE_PER_GRAM_ETB;
  const mineralsBase = parseAmount(form.mineralsValue);
  const mineralsDue = mineralsBase >= nisabETB ? mineralsBase * ZAKAT_RATE : 0;
  const rikazDue = parseAmount(form.rikazValue) * RIKAZ_RATE; // No Nisab

  // Livestock Base
  const livestockCount =
    form.livestockMode === "sheepGoat"
      ? parseAmount(form.sheepGoatCount)
      : form.livestockMode === "cattle"
        ? parseAmount(form.cattleCount)
        : parseAmount(form.camelsCount);
  const livestockEligible =
    form.livestockFreelyGrazing && !form.livestockUsedForWork;
  const livestockUnits = livestockEligible
    ? getLivestockDueString(form.livestockMode, livestockCount)
    : "No Zakat";

  // Annual Totals for Monetary Zakat
  const deductibleLiabilities =
    parseAmount(form.shortTermPersonalLiabilities) +
    parseAmount(form.upcomingLoanPayments12m);

  const annualZakatableBase =
    cashBase +
    preciousMetalsValue +
    Math.max(0, businessBase) +
    propertyStocksBase;
  const adjustedAnnualBase = Math.max(
    0,
    annualZakatableBase - deductibleLiabilities,
  );
  const meetsNisab = adjustedAnnualBase >= nisabETB;

  // Specific Tab Due Variables
  const cashDue =
    form.hawlCompleted && meetsNisab
      ? Math.max(0, cashBase - deductibleLiabilities) * ZAKAT_RATE
      : 0;
  const goldDue =
    form.hawlCompleted && meetsNisab ? preciousMetalsValue * ZAKAT_RATE : 0;
  const businessDue =
    form.hawlCompleted && meetsNisab
      ? Math.max(0, businessBase) * ZAKAT_RATE
      : 0;
  const propertyStocksDue =
    form.hawlCompleted && meetsNisab ? propertyStocksBase * ZAKAT_RATE : 0;

  const annualDue =
    form.hawlCompleted && meetsNisab ? adjustedAnnualBase * ZAKAT_RATE : 0;
  const zakatDue = useMemo(() => {
    if (!form.hawlCompleted || !meetsNisab) return rikazDue + mineralsDue;
    return annualDue + rikazDue + mineralsDue;
  }, [annualDue, form.hawlCompleted, meetsNisab, mineralsDue, rikazDue]);

  // Dynamic Button UI variables specifically scoped to current active tab
  const isMonetaryTab = [
    "cash",
    "gold",
    "business",
    "propertyStocks",
    "rikazMinerals",
    "debtsSummary",
  ].includes(activeKey);
  let tabReadyToPay = false;
  let btnText = "Pay Now";

  if (activeKey === "cash") {
    tabReadyToPay = cashDue > 0;
    btnText = `Pay Cash Zakat`;
  } else if (activeKey === "gold") {
    tabReadyToPay = goldDue > 0;
    btnText = `Pay Gold / Silver Zakat`;
  } else if (activeKey === "business") {
    tabReadyToPay = businessDue > 0;
    btnText = `Pay Business Zakat`;
  } else if (activeKey === "propertyStocks") {
    tabReadyToPay = propertyStocksDue > 0;
    btnText = `Pay Property / Stocks Zakat`;
  } else if (activeKey === "agriculture") {
    tabReadyToPay = agricultureDue > 0;
    btnText = `Distribute Crops`;
  } else if (activeKey === "livestock") {
    tabReadyToPay =
      livestockEligible && livestockCount > 0 && livestockUnits !== "No Zakat";
    btnText = `Distribute Livestock`;
  } else if (activeKey === "rikazMinerals") {
    tabReadyToPay = rikazDue + mineralsDue > 0;
    btnText = `Pay Rikaz / Minerals Zakat`;
  } else if (activeKey === "debtsSummary") {
    tabReadyToPay = zakatDue > 0;
    btnText = `Pay Total Annual Zakat`;
  }

  const tab = TABS.find((t) => t.key === activeKey)!;

  const updateAmount =
    (key: keyof CalculatorState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value.replace(/[^0-9.,]/g, ""),
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
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-black/40"
        placeholder="0"
        style={{ color: "#000000" }}
      />
      {helper && (
        <p className="text-[11px]" style={{ color: "#6F6F6F" }}>
          {helper}
        </p>
      )}
    </div>
  );

  const renderActivePanel = () => {
    switch (activeKey) {
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
            <div className="grid gap-4 md:grid-cols-2">
              {renderAmountInput(
                "Gold bullion owned (grams)",
                form.bullionGoldGrams,
                updateAmount("bullionGoldGrams"),
                "Nisab reference: 85g gold.",
              )}
              {renderAmountInput(
                "Gold jewelry (grams)",
                form.jewelryGoldGrams,
                updateAmount("jewelryGoldGrams"),
                "Included by default (safer view).",
              )}
              {renderAmountInput(
                "Silver owned (grams)",
                form.silverGrams,
                updateAmount("silverGrams"),
                "Nisab reference: 595g silver.",
              )}
            </div>
            <label
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs"
              style={{ color: "#6F6F6F" }}
            >
              <input
                type="checkbox"
                checked={form.includeJewelry}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    includeJewelry: e.target.checked,
                  }))
                }
              />
              Include jewelry in calculation (safer default).
            </label>
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
              `Nisab starts at ${AGRI_NISAB_KG} kg.`,
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
                        borderColor: isActive ? "#000000" : "rgba(0,0,0,0.12)",
                        color: isActive ? "#000000" : "#6F6F6F",
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
                      borderColor: isActive ? "#000000" : "rgba(0,0,0,0.12)",
                      color: isActive ? "#000000" : "#6F6F6F",
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
      case "debtsSummary":
        return (
          <div className="space-y-4">
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
            <label
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-xs"
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
              One lunar year (Hawl) completed above Nisab.
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  const renderResultCard = () => {
    if (activeKey === "cash") {
      return (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: "#6F6F6F" }}
          >
            Cash & Money Result
          </p>
          <p
            className="font-serif-display mt-1 text-3xl"
            style={{ color: "#000000", letterSpacing: "-0.5px" }}
          >
            ETB {formatCurrency(cashDue)}
          </p>
          <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
            <p className="flex items-center justify-between">
              <span>Cash base</span>
              <span style={{ color: "#000000" }}>
                ETB {formatCurrency(cashBase)}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Nisab status</span>
              <span style={{ color: "#000000" }}>
                {meetsNisab ? "Met" : "Below Nisab"}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Hawl status</span>
              <span style={{ color: "#000000" }}>
                {form.hawlCompleted ? "Completed" : "Not completed"}
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (activeKey === "gold") {
      const countedGoldGrams =
        parseAmount(form.bullionGoldGrams) +
        (form.includeJewelry ? parseAmount(form.jewelryGoldGrams) : 0);
      return (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: "#6F6F6F" }}
          >
            Gold / Silver Result
          </p>
          <p
            className="font-serif-display mt-1 text-3xl"
            style={{ color: "#000000", letterSpacing: "-0.5px" }}
          >
            ETB {formatCurrency(goldDue)}
          </p>
          <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
            <p className="flex items-center justify-between">
              <span>Counted gold (g)</span>
              <span style={{ color: "#000000" }}>
                {formatCurrency(countedGoldGrams)}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Silver (g)</span>
              <span style={{ color: "#000000" }}>
                {formatCurrency(parseAmount(form.silverGrams))}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Jewelry mode</span>
              <span style={{ color: "#000000" }}>
                {form.includeJewelry ? "Included" : "Excluded"}
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (activeKey === "business") {
      return (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: "#6F6F6F" }}
          >
            Business Result
          </p>
          <p
            className="font-serif-display mt-1 text-3xl"
            style={{ color: "#000000", letterSpacing: "-0.5px" }}
          >
            ETB {formatCurrency(businessDue)}
          </p>
          <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
            <p className="flex items-center justify-between">
              <span>Business base</span>
              <span style={{ color: "#000000" }}>
                ETB {formatCurrency(Math.max(0, businessBase))}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Formula</span>
              <span style={{ color: "#000000" }}>
                Cash + Inventory + Receivables - Short-term payables
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (activeKey === "propertyStocks") {
      return (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: "#6F6F6F" }}
          >
            Property & Stocks Result
          </p>
          <p
            className="font-serif-display mt-1 text-3xl"
            style={{ color: "#000000", letterSpacing: "-0.5px" }}
          >
            ETB {formatCurrency(propertyStocksDue)}
          </p>
          <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
            <p className="flex items-center justify-between">
              <span>Tab base</span>
              <span style={{ color: "#000000" }}>
                ETB {formatCurrency(propertyStocksBase)}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Note</span>
              <span style={{ color: "#000000" }}>
                Rental property value itself is exempt
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (activeKey === "agriculture") {
      return (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: "#6F6F6F" }}
          >
            Agriculture Result (At Harvest)
          </p>
          <p
            className="font-serif-display mt-1 text-3xl"
            style={{ color: "#000000", letterSpacing: "-0.5px" }}
          >
            {formatCurrency(agricultureDue)} kg due
          </p>
          <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
            <p className="flex items-center justify-between">
              <span>Harvest entered</span>
              <span style={{ color: "#000000" }}>
                {formatCurrency(agricultureHarvestKg)} kg
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Rate applied</span>
              <span style={{ color: "#000000" }}>
                {irrigationRate(form.irrigationMode) * 100}%
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Hawl Status</span>
              <span style={{ color: "#000000" }}>
                Not required (Due on harvest)
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (activeKey === "livestock") {
      return (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: "#6F6F6F" }}
          >
            Livestock Result (Annual)
          </p>
          <p
            className="font-serif-display mt-1 text-3xl"
            style={{ color: "#000000", letterSpacing: "-0.5px" }}
          >
            {livestockUnits}
          </p>
          <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
            <p className="flex items-center justify-between">
              <span>Type</span>
              <span style={{ color: "#000000" }}>
                {livestockTypeLabel(form.livestockMode)}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Count entered</span>
              <span style={{ color: "#000000" }}>
                {formatCurrency(livestockCount)}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Eligible conditions</span>
              <span style={{ color: "#000000" }}>
                {livestockEligible
                  ? "Freely grazing + non-working"
                  : "Conditions not met"}
              </span>
            </p>
          </div>
        </div>
      );
    }

    if (activeKey === "rikazMinerals") {
      return (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.15em]"
            style={{ color: "#6F6F6F" }}
          >
            Rikaz / Minerals Result
          </p>
          <p
            className="font-serif-display mt-1 text-3xl"
            style={{ color: "#000000", letterSpacing: "-0.5px" }}
          >
            ETB {formatCurrency(rikazDue + mineralsDue)}
          </p>
          <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
            <p className="flex items-center justify-between">
              <span>Rikaz due now (20%)</span>
              <span style={{ color: "#000000" }}>
                ETB {formatCurrency(rikazDue)}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Minerals due (2.5%)</span>
              <span style={{ color: "#000000" }}>
                ETB {formatCurrency(mineralsDue)}
              </span>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="mt-6 rounded-2xl p-5"
        style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
      >
        <p
          className="text-xs uppercase tracking-[0.15em]"
          style={{ color: "#6F6F6F" }}
        >
          Debts & Annual Summary
        </p>
        <p
          className="font-serif-display mt-1 text-3xl"
          style={{ color: "#000000", letterSpacing: "-0.5px" }}
        >
          ETB {formatCurrency(zakatDue)}
        </p>
        <div className="mt-3 space-y-2 text-xs" style={{ color: "#6F6F6F" }}>
          <p className="flex items-center justify-between">
            <span>Annual base</span>
            <span style={{ color: "#000000" }}>
              ETB {formatCurrency(annualZakatableBase)}
            </span>
          </p>
          <p className="flex items-center justify-between">
            <span>Deducted liabilities</span>
            <span style={{ color: "#000000" }}>
              ETB {formatCurrency(deductibleLiabilities)}
            </span>
          </p>
          <p className="flex items-center justify-between">
            <span>Total pooled due (2.5%)</span>
            <span style={{ color: "#000000" }}>
              ETB {formatCurrency(annualDue)}
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="relative z-10 w-full bg-white">
      <div className="mx-auto max-w-7xl px-8 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#6F6F6F" }}
          >
            Quick Calculator
          </p>
          <h2
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{
              color: "#000000",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            Know your{" "}
            <span className="italic" style={{ color: "#6F6F6F" }}>
              Zakat
            </span>{" "}
            in seconds.
          </h2>
          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: "#6F6F6F" }}
          >
            Complete your annual Zakat across money, business, agriculture,
            livestock, and modern assets in one place. Each tab follows the
            detailed fiqh rules and shows a transparent breakdown before you
            pay.
          </p>

          <div
            className="mt-8 inline-flex items-center gap-2 text-xs"
            style={{ color: "#6F6F6F" }}
          >
            <InfoIcon className="h-3.5 w-3.5" />
            <span>
              Live Nisab snapshot{" "}
              <span style={{ color: "#000000", fontWeight: 500 }}>
                ETB {formatCurrency(nisabETB)}
              </span>
              {" · "}
              Silver {SILVER_PRICE_PER_GRAM_ETB} ETB/g
            </span>
          </div>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-5xl">
          <div className="rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/3 p-1 md:grid-cols-4">
              {TABS.map(({ key, label, icon: Icon }) => {
                const active = key === activeKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveKey(key);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs transition-all duration-300 sm:text-sm"
                    style={{
                      backgroundColor: active ? "#FFFFFF" : "transparent",
                      color: active ? "#000000" : "#6F6F6F",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 pt-7">
              <div
                className="mb-5 grid gap-3 border-b pb-4 text-xs sm:grid-cols-3"
                style={{ borderColor: "rgba(0,0,0,0.06)" }}
              >
                <span style={{ color: "#6F6F6F" }}>
                  Nisab threshold{" "}
                  <span style={{ color: "#000000", fontWeight: 500 }}>
                    ETB {formatCurrency(nisabETB)}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: meetsNisab
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(0,0,0,0.04)",
                    color: meetsNisab ? "#0A7C5A" : "#000000",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: meetsNisab ? "#10B981" : "#6F6F6F",
                    }}
                  />
                  {meetsNisab ? "Nisab met" : "Below Nisab"}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: form.hawlCompleted
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(0,0,0,0.04)",
                    color: form.hawlCompleted ? "#0A7C5A" : "#6F6F6F",
                  }}
                >
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  {form.hawlCompleted ? "Hawl completed" : "Hawl not completed"}
                </span>
              </div>

              <p
                className="mb-4 text-xs uppercase tracking-[0.16em]"
                style={{ color: "#6F6F6F" }}
              >
                {tab.label}
              </p>
              {renderActivePanel()}

              {activeKey === "cash" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong> Zakat is
                    an absolute obligation (Fard) on wealth meeting the Nisab
                    threshold and held for a full lunar year (Hawl). The
                    calculation rate is 2.5% (or 1/40th) of the total amount.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Reason:</strong> The word
                    &quot;Zakat&quot; means purification. It purifies wealth
                    from greed and ensures social justice. The cash Nisab is
                    pegged to Silver ({SILVER_NISAB_GRAMS}g) rather than gold
                    because it is currently much lower, which brings more people
                    into the paying bracket to benefit the poor.
                  </p>
                </div>
              )}
              {activeKey === "gold" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong> Zakat is
                    2.5% on gold and silver if the combined monetary value meets
                    the Nisab and Hawl. The majority of scholars mandate Zakat
                    on gold/silver jewelry whether worn or kept in a safe.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Hadith:</strong> Prophet
                    Muhammad (ﷺ) said: &quot;No Zakat is due on gold until it
                    reaches twenty dinars [approx. 85g]... And there is no Zakat
                    on silver until it reaches two hundred dirhams [approx.
                    595g]...&quot; (Sunan Abu Dawud).
                  </p>
                </div>
              )}
              {activeKey === "business" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong> Trading
                    assets (Urood al-Tijarah) bought with the explicit intention
                    to resell owe 2.5%. Fixed assets (machinery, vehicles,
                    buildings) are exempt.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Hadith:</strong> Samurah
                    bin Jundub (RA) reported: &quot;The Messenger of Allah (ﷺ)
                    used to command us to pay Zakat from what we prepared for
                    sale.&quot; (Sunan Abu Dawud).
                  </p>
                </div>
              )}
              {activeKey === "propertyStocks" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong> No Zakat
                    is due on the personal home you live in or the total value
                    of rental properties. Zakat is only due on the{" "}
                    <span className="italic">saved rental income</span>.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Stocks:</strong> Trading
                    shares owe 2.5% on their market value. Long-term shares held
                    for dividends owe 2.5% on the company&apos;s zakatable
                    assets. This is analogized from traditional fiqh based on
                    the Quranic injunction to pay from &quot;what you have
                    earned&quot; (Quran 2:267).
                  </p>
                </div>
              )}
              {activeKey === "agriculture" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong>{" "}
                    Agricultural Zakat (Ushr) is due{" "}
                    <span className="italic">
                      immediately on the day of harvest
                    </span>
                    . No lunar year (Hawl) is required.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Reason & Hadith:</strong>{" "}
                    The rate changes based on the farmer&apos;s hardship. The
                    Prophet (ﷺ) said: &quot;On that which is irrigated by the
                    heavens (rain), rivers, and springs, a tenth (10%) is due;
                    and on that irrigated by well water (artificial means), half
                    a tenth (5%) is due.&quot; (Sahih Al-Bukhari). The minimum
                    threshold (Nisab) is 5 Wasqs (approx. 653 kg).
                  </p>
                </div>
              )}
              {activeKey === "livestock" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong> Zakat is
                    obligatory on livestock kept for milk or breeding, provided
                    they are <span className="italic">Sa&apos;imah</span>{" "}
                    (freely grazing on public land for more than half the year)
                    and are NOT used as working animals.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Reason:</strong> The
                    intricate minimum thresholds (Nisab) and required animal
                    outputs are specifically dictated by the written
                    instructions given by Abu Bakr (RA) to Anas bin Malik, which
                    detail the explicit commands of the Prophet (ﷺ). (Sahih
                    Al-Bukhari 1454).
                  </p>
                </div>
              )}
              {activeKey === "rikazMinerals" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong> Rikaz
                    (buried treasure from pre-Islamic times) owes a 20% (Khums)
                    tax immediately upon discovery without Nisab or Hawl. Mined
                    minerals owe 2.5% once they reach the Nisab equivalent of
                    gold/silver.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Hadith:</strong> Abu
                    Huraira reported that the Prophet (ﷺ) said: &quot;In buried
                    treasure (Rikaz), a fifth (20%) is due.&quot; (Sahih
                    Al-Bukhari & Muslim).
                  </p>
                </div>
              )}
              {activeKey === "debtsSummary" && (
                <div
                  className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4 text-xs leading-relaxed"
                  style={{ color: "#6F6F6F" }}
                >
                  <p>
                    <strong style={{ color: "#000" }}>Ruling:</strong> You may
                    deduct immediate, short-term debts (due within the lunar
                    year) from your zakatable wealth. Long-term debts (like
                    30-year mortgages or student loans) should NOT be fully
                    deducted, only the next 12 months&apos; scheduled payments.
                  </p>
                  <p>
                    <strong style={{ color: "#000" }}>Reason:</strong> Deducting
                    full long-term debt would often put a person perpetually
                    below Nisab, meaning they never pay Zakat. Zakat is a trust
                    to the poor and must be balanced with personal liability.
                  </p>
                </div>
              )}

              {renderResultCard()}

              <button
                type="button"
                disabled={!tabReadyToPay}
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm transition-all duration-300 hover:scale-[1.01] disabled:hover:scale-100"
                style={{
                  backgroundColor: tabReadyToPay
                    ? "#000000"
                    : "rgba(0,0,0,0.1)",
                  color: tabReadyToPay ? "#FFFFFF" : "#6F6F6F",
                  cursor: tabReadyToPay ? "pointer" : "not-allowed",
                }}
              >
                {btnText}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              {isMonetaryTab && (
                <div
                  className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: "#6F6F6F" }}
                >
                  <span>Telebirr</span>
                  <span style={{ color: "#D4D4D4" }}>·</span>
                  <span>CBE Birr</span>
                  <span style={{ color: "#D4D4D4" }}>·</span>
                  <span>Visa / Mastercard</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
