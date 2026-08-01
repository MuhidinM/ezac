"use client";

import { BarChart3 } from "lucide-react";

import {
  ASSET_ITEMS,
  ASSET_LABELS,
  EXPENDITURE_ITEMS,
  EXPENDITURE_LABELS,
  INCOME_LABELS,
  INCOME_SOURCES,
} from "../initial-state";
import { StepWrapper } from "../step-wrapper";
import type { StepProps } from "../types";
import { formatDisplayCurrency, sumCurrency } from "../utils";
import { CheckboxGroup } from "../ui/checkbox-group";
import { CurrencyInput } from "../ui/currency-input";
import { FormField } from "../ui/form-field";

export function Step3Finance({ state, setState }: StepProps) {
  const { finance } = state;

  const totalIncome = sumCurrency(finance.income);
  const totalExpenditure = sumCurrency(finance.expenditure);
  const surplus = totalIncome - totalExpenditure;

  function updateIncome(key: string, value: string) {
    setState((prev) => ({
      ...prev,
      finance: {
        ...prev.finance,
        income: { ...prev.finance.income, [key]: value },
      },
    }));
  }

  function updateExpenditure(key: string, value: string) {
    setState((prev) => ({
      ...prev,
      finance: {
        ...prev.finance,
        expenditure: { ...prev.finance.expenditure, [key]: value },
      },
    }));
  }

  function updateAsset(key: string, checked: boolean) {
    setState((prev) => ({
      ...prev,
      finance: {
        ...prev.finance,
        assets: { ...prev.finance.assets, [key]: checked },
      },
    }));
  }

  const assetOptions = ASSET_ITEMS.map((key) => ({
    value: key,
    label: ASSET_LABELS[key],
  }));

  return (
    <StepWrapper
      title="Financial situation"
      description="Record monthly income, expenditure, and household assets."
      icon={BarChart3}
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#001539]">
            Section E — Monthly Household Income
          </h3>
          <div className="space-y-3">
            {INCOME_SOURCES.map((key) => (
              <FormField key={key} label={INCOME_LABELS[key]} htmlFor={`income-${key}`}>
                <CurrencyInput
                  id={`income-${key}`}
                  value={finance.income[key] ?? ""}
                  onChange={(v) => updateIncome(key, v)}
                />
              </FormField>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[#007050] px-4 py-4 text-white">
            <p className="text-sm opacity-80">Total Monthly Income</p>
            <p className="text-2xl font-semibold">
              ETB {formatDisplayCurrency(totalIncome)}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#001539]">
            Section F — Monthly Household Expenditure
          </h3>
          <div className="space-y-3">
            {EXPENDITURE_ITEMS.map((key) => (
              <FormField
                key={key}
                label={EXPENDITURE_LABELS[key]}
                htmlFor={`expenditure-${key}`}
              >
                <CurrencyInput
                  id={`expenditure-${key}`}
                  value={finance.expenditure[key] ?? ""}
                  onChange={(v) => updateExpenditure(key, v)}
                />
              </FormField>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[#007050] px-4 py-4 text-white">
            <p className="text-sm opacity-80">Total Monthly Expenditure</p>
            <p className="text-2xl font-semibold">
              ETB {formatDisplayCurrency(totalExpenditure)}
            </p>
          </div>
        </section>

        <div
          className={`rounded-xl px-4 py-4 ${
            surplus < 0 ? "bg-[#c0392b]/10" : "bg-[#007050]/10"
          }`}
        >
          <p className="text-sm text-black/55">Monthly Surplus / Deficit</p>
          <p
            className={`text-2xl font-semibold ${
              surplus < 0 ? "text-[#c0392b]" : "text-[#001539]"
            }`}
          >
            ETB {formatDisplayCurrency(surplus)}
          </p>
        </div>

        <section>
          <CheckboxGroup
            label="Section G — Tick all items the household owns"
            options={assetOptions}
            values={finance.assets}
            onChange={updateAsset}
            columns={2}
          />
          {finance.assets.other ? (
            <FormField label="Other assets (specify)" htmlFor="assetsOther" className="mt-4">
              <input
                id="assetsOther"
                type="text"
                value={finance.assetsOther}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    finance: { ...prev.finance, assetsOther: e.target.value },
                  }))
                }
                className="form-input w-full"
              />
            </FormField>
          ) : null}
          <FormField
            label="Estimated Total Asset Value"
            htmlFor="estimatedTotalAssetValue"
            className="mt-4"
          >
            <CurrencyInput
              id="estimatedTotalAssetValue"
              value={finance.estimatedTotalAssetValue}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  finance: { ...prev.finance, estimatedTotalAssetValue: v },
                }))
              }
            />
          </FormField>
        </section>
      </div>
    </StepWrapper>
  );
}
