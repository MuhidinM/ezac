"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CoinsIcon,
  GemIcon,
  InfoIcon,
} from "lucide-react";

type TabKey = "cash" | "gold" | "business";

type Tab = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  nisab: number;
  unit: string;
  placeholder: string;
  helper: string;
};

const TABS: Tab[] = [
  {
    key: "cash",
    label: "Cash",
    icon: CoinsIcon,
    nisab: 245000,
    unit: "ETB",
    placeholder: "Total cash & savings",
    helper: "Bank balance, mobile money, lent funds.",
  },
  {
    key: "gold",
    label: "Gold / Silver",
    icon: GemIcon,
    nisab: 87.48,
    unit: "g",
    placeholder: "Total grams of gold owned",
    helper: "Nisab is 87.48g of gold (Shari'ah standard).",
  },
  {
    key: "business",
    label: "Business",
    icon: BriefcaseIcon,
    nisab: 245000,
    unit: "ETB",
    placeholder: "Inventory + receivables",
    helper: "Stock-in-trade, raw materials, debts owed to you.",
  },
];

const ZAKAT_RATE = 0.025;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function ZakatCalculator() {
  const [activeKey, setActiveKey] = useState<TabKey>("cash");
  const [amount, setAmount] = useState<string>("");
  const tab = TABS.find((t) => t.key === activeKey)!;
  const numeric = parseFloat(amount.replace(/,/g, "")) || 0;
  const meetsNisab = numeric >= tab.nisab;

  const zakatDue = useMemo(() => {
    if (!meetsNisab) return 0;
    if (tab.key === "gold") {
      const valueETB = numeric * 7200;
      return valueETB * ZAKAT_RATE;
    }
    return numeric * ZAKAT_RATE;
  }, [numeric, meetsNisab, tab.key]);

  return (
    <section className="relative z-10 w-full bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-8 py-24 lg:grid-cols-2">
        <div>
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
            className="mt-6 max-w-md text-base leading-relaxed sm:text-lg"
            style={{ color: "#6F6F6F" }}
          >
            Live Nisab pricing pulled from international markets. Calculate with
            mathematical precision, then pay instantly via Telebirr, CBE, or
            international card — no redirects, no friction.
          </p>

          <div
            className="mt-8 inline-flex items-center gap-2 text-xs"
            style={{ color: "#6F6F6F" }}
          >
            <InfoIcon className="h-3.5 w-3.5" />
            <span>
              Nisab updated{" "}
              <span style={{ color: "#000000", fontWeight: 500 }}>
                2 minutes ago
              </span>{" "}
              · 1g gold = ETB 7,200
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
            <div className="flex rounded-2xl bg-black/[0.03] p-1">
              {TABS.map(({ key, label, icon: Icon }) => {
                const active = key === activeKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveKey(key);
                      setAmount("");
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm transition-all duration-300"
                    style={{
                      backgroundColor: active ? "#FFFFFF" : "transparent",
                      color: active ? "#000000" : "#6F6F6F",
                      boxShadow: active
                        ? "0 1px 3px rgba(0,0,0,0.06)"
                        : "none",
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
                className="mb-5 flex items-center justify-between border-b pb-4 text-xs"
                style={{ borderColor: "rgba(0,0,0,0.06)" }}
              >
                <span style={{ color: "#6F6F6F" }}>Nisab threshold</span>
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
                  {formatCurrency(tab.nisab)} {tab.unit}
                </span>
              </div>

              <label className="text-xs" style={{ color: "#6F6F6F" }}>
                {tab.placeholder}
              </label>
              <div
                className="mt-2 flex items-baseline gap-3 border-b pb-3 transition-colors"
                style={{ borderColor: "#000000" }}
              >
                <span
                  className="font-serif-display text-3xl"
                  style={{ color: "#6F6F6F" }}
                >
                  {tab.unit}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                  }
                  placeholder="0"
                  className="flex-1 bg-transparent font-serif-display text-4xl outline-none placeholder-black/20"
                  style={{ color: "#000000" }}
                  aria-label={tab.placeholder}
                />
              </div>

              <p className="mt-2 text-xs" style={{ color: "#6F6F6F" }}>
                {tab.helper}
              </p>

              <div
                className="mt-6 flex items-end justify-between rounded-2xl p-5"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.15em]"
                    style={{ color: "#6F6F6F" }}
                  >
                    Zakat Due (2.5%)
                  </p>
                  <p
                    className="font-serif-display mt-1 text-3xl"
                    style={{
                      color: "#000000",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    ETB {formatCurrency(zakatDue)}
                  </p>
                </div>
                {!meetsNisab && numeric > 0 && (
                  <p
                    className="max-w-[140px] text-right text-xs"
                    style={{ color: "#6F6F6F" }}
                  >
                    Below Nisab — no Zakat owed this year.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!meetsNisab}
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm transition-all duration-300 hover:scale-[1.01] disabled:hover:scale-100"
                style={{
                  backgroundColor: meetsNisab ? "#000000" : "rgba(0,0,0,0.1)",
                  color: meetsNisab ? "#FFFFFF" : "#6F6F6F",
                  cursor: meetsNisab ? "pointer" : "not-allowed",
                }}
              >
                Pay Now
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
