"use client";

import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
  RefreshCwIcon,
  ScaleIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { LocalizedLink, useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";
import type { CalculatorConfig, LivestockDue } from "@/lib/zakat/calculator-config";
import {
  INITIAL_STATE,
  KARATS,
  calculateZakat,
  cleanAmount,
  isPriceStale,
  parseAmount,
  type AmountField,
  type CalculatorState,
  type CategoryKey,
  type IrrigationMode,
  type Karat,
  type LivestockMode,
  type MetalLineItem,
  type MetalType,
} from "@/lib/zakat/calculator-math";

import { readCalculatorConfig } from "@/lib/zakat/calculator-read";

type CalculatorText = Dictionary["calculator"];

/**
 * Category order and icons. Labels and the "Why is X due?" rulings live in
 * the calculator dictionary; the rulings are filled from the figures in use,
 * so the explanation can't drift from the sum. The sums themselves are in
 * lib/zakat/calculator-math.ts.
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

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

const FIELD_CLASS =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-base text-navy outline-none transition-colors focus:border-brand sm:text-sm";

/** Official prices are published in Addis Ababa time; show them so, whatever the visitor's clock. */
const PRICE_TIME_ZONE = "Africa/Addis_Ababa";

function createMetalItem(): MetalLineItem {
  return {
    id: `metal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    metal: "gold",
    grams: "",
    karat: 24,
  };
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
 * The time the page was opened, on the client only. The server render (and an
 * ISR copy served minutes later) has none, so a price-age warning never makes
 * the server and browser HTML differ; it appears once the page hydrates.
 */
let openedAt: number | null = null;
const subscribeToNothing = () => () => {};
const clientOpenedAt = () => (openedAt ??= Date.now());
const serverOpenedAt = () => null;

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
    const dateTime = new Intl.DateTimeFormat(intlLocale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: PRICE_TIME_ZONE,
    });
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

/**
 * The Zakat calculator (home page and /zakat/calculator). `initialConfig` is
 * the official config the page already loaded on the server; without it the
 * calculator fetches the config itself after hydration.
 */
export function ZakatCalculator({
  t,
  initialConfig = null,
}: {
  t: CalculatorText;
  initialConfig?: CalculatorConfig | null;
}) {
  const { intlLocale } = useI18n();
  const fmt = useFormatters(intlLocale);
  const baseId = useId();

  const [added, setAdded] = useState<CategoryKey[]>(["cash"]);
  const [form, setForm] = useState<CalculatorState>(INITIAL_STATE);
  const [config, setConfig] = useState<CalculatorConfig | null>(initialConfig);
  const [pricingLoading, setPricingLoading] = useState(initialConfig === null);
  const [pricingError, setPricingError] = useState<RatesError | null>(null);
  const openedAtMs = useSyncExternalStore(subscribeToNothing, clientOpenedAt, serverOpenedAt);
  // Adding or removing a category removes the button that was clicked; focus moves to what replaced it.
  const focusAfterRender = useRef<string | null>(null);
  const mounted = useRef(false);

  const fetchRates = useCallback(() => {
    void loadCalculatorConfig().then((result) => {
      if (!mounted.current) return;
      if ("config" in result) {
        setConfig(result.config);
        setPricingError(null);
      } else {
        setPricingError(result.error);
      }
      setPricingLoading(false);
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!initialConfig) fetchRates();
    return () => {
      mounted.current = false;
    };
  }, [fetchRates, initialConfig]);

  const retryRates = () => {
    setPricingLoading(true);
    setPricingError(null);
    fetchRates();
  };

  useEffect(() => {
    const target = focusAfterRender.current;
    if (!target) return;
    focusAfterRender.current = null;
    document.getElementById(target)?.focus();
  }, [added]);

  const sectionId = (key: CategoryKey) => `${baseId}-section-${key}`;
  const chipId = (key: CategoryKey) => `${baseId}-add-${key}`;

  const result = calculateZakat(form, added, config);
  const { rules, nisabEtb, preciousMetalsValue, hasInputErrors, totalEtbDue } = result;
  const { zakatRate, agriNisabKg, goldNisabGrams, silverNisabGrams } = rules;
  // Fallback figures must never read as the Commission's live rule.
  const usingEstimates = !config && !pricingLoading;
  const pricesStale = config !== null && openedAtMs !== null && isPriceStale(config.pricesAsOf, openedAtMs);
  const pricesAsOf =
    config?.pricesAsOf && !Number.isNaN(Date.parse(config.pricesAsOf)) ? fmt.dateTime(new Date(config.pricesAsOf)) : null;

  const has = (key: CategoryKey) => added.includes(key);

  const addCategory = (key: CategoryKey) => {
    focusAfterRender.current = sectionId(key);
    setAdded((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };
  const removeCategory = (key: CategoryKey) => {
    focusAfterRender.current = chipId(key);
    setAdded((prev) => prev.filter((k) => k !== key));
  };

  // ---- Wording -----------------------------------------------------------

  const money = (value: number) => fill(t.result.amount, { amount: <Num>{fmt.currency(value)}</Num> });
  /** An amount that needs the official Nisab: a dash until the rates load. */
  const moneyOrDash = (value: number | null) => (value === null ? "—" : money(value));
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

  const basisLabel = result.nisabBasis ? t.rates.basis[result.nisabBasis] : null;

  const retryButton = (className: string) => (
    <button
      type="button"
      onClick={retryRates}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${className} ${FOCUS_RING}`}
    >
      <RefreshCwIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {t.rates.retry}
    </button>
  );

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
                {config ? `${t.gold.officialPrices} ` : null}
                {fill(t.gold.nisabRule, {
                  fineMetal: <strong className="text-navy">{t.gold.fineMetal}</strong>,
                  goldGrams: <Num>{fmt.grams(goldNisabGrams)}</Num>,
                  silverGrams: <Num>{fmt.grams(silverNisabGrams)}</Num>,
                })}{" "}
                {basisLabel
                  ? fill(t.gold.basisOfficial, { basis: <strong className="text-navy">{basisLabel}</strong> })
                  : t.gold.basisEstimate}
              </p>
              <p className={`mt-1 ${pricingError ? "text-accent-ink" : ""}`}>
                {pricingLoading
                  ? t.gold.loading
                  : pricingError
                    ? format(t.gold.errorExcluded, { error: ratesErrorText(pricingError) })
                    : [
                        pricesAsOf ? format(t.gold.pricesAsOf, { date: pricesAsOf }) : null,
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
                  goldGross: <Num>{fmt.grams(result.goldGrossGrams)}</Num>,
                  goldFine: <Num>{fmt.grams(result.goldFineGrams)}</Num>,
                  silverGross: <Num>{fmt.grams(result.silverGrossGrams)}</Num>,
                  silverFine: <Num>{fmt.grams(result.silverFineGrams)}</Num>,
                  value: <Num>{preciousMetalsValue === null ? "—" : fmt.currency(preciousMetalsValue)}</Num>,
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
              fill(t.rikazMinerals.rikazHelp, { rate: rateNum(rules.rikazRate) }),
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

  const { shares } = result;
  const breakdownRows: { key: string; label: ReactNode; value: ReactNode; deduction?: boolean }[] = [];
  const wealthRate = rateNum(zakatRate);
  const breakdown = t.result.breakdown;
  if (has("cash"))
    breakdownRows.push({ key: "cash", label: fill(breakdown.cash, { rate: wealthRate }), value: moneyOrDash(shares.cash) });
  if (has("gold"))
    breakdownRows.push({
      key: "gold",
      label: fill(breakdown.gold, { rate: wealthRate }),
      // Not valued without the official prices, so not shown as a zero share.
      value: preciousMetalsValue === null ? "—" : moneyOrDash(shares.gold),
    });
  if (has("business"))
    breakdownRows.push({
      key: "business",
      label: fill(breakdown.business, { rate: wealthRate }),
      value: moneyOrDash(shares.business),
    });
  if (has("propertyStocks"))
    breakdownRows.push({
      key: "propertyStocks",
      label: fill(breakdown.propertyStocks, { rate: wealthRate }),
      value: moneyOrDash(shares.propertyStocks),
    });
  if (has("rikazMinerals"))
    breakdownRows.push({
      key: "rikaz",
      label: fill(breakdown.rikaz, { rate: rateNum(rules.rikazRate) }),
      value: money(result.rikazDue),
    });
  if (has("rikazMinerals"))
    breakdownRows.push({
      key: "minerals",
      label: fill(breakdown.minerals, { rate: wealthRate }),
      value: moneyOrDash(result.mineralsDue),
    });
  if (has("debts"))
    breakdownRows.push({
      key: "liabilities",
      label: breakdown.liabilities,
      value:
        shares.liabilities === null
          ? "—"
          : fill(t.result.deduction, { amount: <Num>{fmt.currency(shares.liabilities)}</Num> }),
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

          {/* The official rates in use, or why there are none. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-white/90">
            <InfoIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {config ? (
              <span>
                {t.rates.snapshot}{" "}
                <span className="font-medium text-white">
                  {fill(t.rates.gold24k, { price: <Num>{fmt.currency(config.goldPricePerGramEtb["24k"] ?? 0)}</Num> })}
                </span>
                {" · "}
                <span className="font-medium text-white">
                  {fill(t.rates.silver, { price: <Num>{fmt.currency(config.silverPricePerGramEtb)}</Num> })}
                </span>
                {" · "}
                {fill(t.rates.nisab, { basis: basisLabel ?? "", amount: <Num>{fmt.currency(config.nisab.valueEtb)}</Num> })}
              </span>
            ) : pricingLoading ? (
              <span>{t.rates.loading}</span>
            ) : (
              <>
                <span>{t.rates.unavailable}</span>
                {retryButton("border-white/40 text-white hover:bg-white/10")}
              </>
            )}
          </div>
          {pricesStale && pricesAsOf ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white">
              <TriangleAlertIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {format(t.rates.stale, { date: pricesAsOf })}
            </p>
          ) : null}
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
                {result.showHawl && (
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
                ) : totalEtbDue === null ? (
                  // Part of the total weighs against the Nisab, which only the official rates give.
                  <p className="font-serif-display mt-2 text-2xl tracking-[-0.5px] text-navy sm:text-3xl rtl:tracking-normal">
                    {pricingLoading ? t.rates.loading : t.result.needsRates}
                  </p>
                ) : (
                  <p className="font-serif-display mt-2 text-3xl break-words tabular-nums tracking-[-1px] text-navy sm:text-4xl md:text-5xl rtl:tracking-normal">
                    <span className="sr-only">{t.result.total}: </span>
                    {money(totalEtbDue)}
                  </p>
                )}
              </div>
              {!hasInputErrors && totalEtbDue === null && !pricingLoading ? (
                <div className="mt-3">{retryButton("border-black/15 bg-white text-navy hover:border-brand hover:text-brand")}</div>
              ) : null}

              {/* In-kind dues reported separately from the monetary total */}
              {!hasInputErrors && result.hasInKind && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.agricultureDue > 0 && (
                    <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
                      {fill(t.result.crops, { amount: <Num>{fmt.currency(result.agricultureDue)}</Num> })}
                    </span>
                  )}
                  {result.livestockOwed && (
                    <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
                      {format(t.result.animals, {
                        animals: animalsText(result.livestockOwed),
                        type: t.livestock.types[form.livestockMode],
                      })}
                    </span>
                  )}
                </div>
              )}
              {!hasInputErrors && has("livestock") && !form.hawlCompleted && (
                <p className="mt-3 text-xs text-accent-ink">{t.result.noHawlLivestock}</p>
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

              {!hasInputErrors && result.hasMonetaryCategory && (
                <div className="mt-4 space-y-2 border-t border-black/10 pt-3 text-xs text-neutral-600">
                  <p className="flex items-center justify-between gap-3">
                    <span>{t.result.netBase}</span>
                    <span className="text-end text-navy">{money(result.adjustedAnnualBase)}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span>{t.result.nisabThreshold}</span>
                    <span className="text-end text-navy">
                      {nisabEtb === null
                        ? t.result.nisabUnknown
                        : fill(t.result.nisabStatus, {
                            amount: <Num>{fmt.currency(nisabEtb)}</Num>,
                            status: result.meetsNisab ? t.result.nisabMet : t.result.nisabBelow,
                          })}
                    </span>
                  </p>
                  {!form.hawlCompleted && <p className="text-accent-ink">{t.result.noHawl}</p>}
                  {form.hawlCompleted && result.meetsNisab === false && (
                    <p className="text-accent-ink">{t.result.belowNisab}</p>
                  )}
                </div>
              )}

              {/* The calculator informs; it doesn't rule on anyone's own case. */}
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
                <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.result.guidance}</span>
              </p>

              {/* Payment itself happens in the EZAC app; /zakat/pay explains how. */}
              {result.readyToPay ? (
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
              {result.somethingDue && usingEstimates && (
                <p className="mt-3 text-center text-xs text-accent-ink">{t.result.payNeedsRates}</p>
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
