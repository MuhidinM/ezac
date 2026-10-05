"use client";

import {
  ChipGroup,
  FieldSection,
  MoneyField,
  TextField,
} from "@/components/assessment/fields";
import type { StepProps } from "@/components/assessment/step-props";
import type { AssessmentSections } from "@/lib/api/backoffice-types";
import { ASSETS } from "@/lib/backoffice/options";
import { formatEtb } from "@/lib/backoffice/format";

type Income = AssessmentSections["income"];
type Expenditure = AssessmentSections["expenditure"];

const INCOME_FIELDS: { key: Exclude<keyof Income, "otherText">; label: string }[] = [
  { key: "salary", label: "Salary" },
  { key: "selfEmployment", label: "Self-employment" },
  { key: "agriculture", label: "Agriculture" },
  { key: "livestock", label: "Livestock" },
  { key: "smallBusiness", label: "Small business" },
  { key: "casualLabour", label: "Casual labour" },
  { key: "remittances", label: "Remittances" },
  { key: "pension", label: "Pension" },
  { key: "other", label: "Other income" },
];

const EXPENDITURE_FIELDS: { key: Exclude<keyof Expenditure, "otherText">; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "rent", label: "Rent" },
  { key: "utilities", label: "Utilities" },
  { key: "education", label: "Education" },
  { key: "medical", label: "Medical" },
  { key: "transportation", label: "Transportation" },
  { key: "clothing", label: "Clothing" },
  { key: "debtRepayment", label: "Debt repayment" },
  { key: "other", label: "Other spending" },
];

function sum(values: (number | null)[]) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function StepFinance({ draft, patch, errors }: StepProps) {
  const income = draft.income;
  const expenditure = draft.expenditure;

  const totalIncome = sum(INCOME_FIELDS.map((field) => income[field.key]));
  const totalExpenditure = sum(EXPENDITURE_FIELDS.map((field) => expenditure[field.key]));
  const membersIncome = sum(draft.household.members.map((member) => member.monthlyIncome));

  return (
    <div className="space-y-6">
      <FieldSection
        letter="E"
        title="Monthly income"
        description="ETB per month for the whole household. Enter 0 where there is none."
        aside={<TotalChip label="Total income" value={totalIncome} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INCOME_FIELDS.map((field) => (
            <MoneyField
              key={field.key}
              id={`income-${field.key}`}
              label={field.label}
              value={income[field.key]}
              onChange={(value) => patch("income", { [field.key]: value })}
              error={errors[`income.${field.key}`]}
            />
          ))}
          {(income.other ?? 0) > 0 ? (
            <TextField
              id="income-other-text"
              label="Describe other income"
              value={income.otherText}
              onChange={(value) => patch("income", { otherText: value })}
              error={errors["income.otherText"]}
              className="sm:col-span-2 lg:col-span-3"
              required
            />
          ) : null}
        </div>
        <p className="mt-4 text-xs text-black/50">
          Household members&apos; incomes add up to{" "}
          <span className="font-medium text-[#001539] tabular-nums">{formatEtb(membersIncome)}</span>.
          A gap of more than 20% raises a warning at submission.
        </p>
      </FieldSection>

      <FieldSection
        letter="F"
        title="Monthly expenditure"
        description="Typical household spending per month in ETB."
        aside={<TotalChip label="Total expenditure" value={totalExpenditure} />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPENDITURE_FIELDS.map((field) => (
            <MoneyField
              key={field.key}
              id={`expenditure-${field.key}`}
              label={field.label}
              value={expenditure[field.key]}
              onChange={(value) => patch("expenditure", { [field.key]: value })}
              error={errors[`expenditure.${field.key}`]}
            />
          ))}
          {(expenditure.other ?? 0) > 0 ? (
            <TextField
              id="expenditure-other-text"
              label="Describe other spending"
              value={expenditure.otherText}
              onChange={(value) => patch("expenditure", { otherText: value })}
              error={errors["expenditure.otherText"]}
              className="sm:col-span-2 lg:col-span-3"
              required
            />
          ) : null}
        </div>
      </FieldSection>

      <FieldSection letter="G" title="Assets" description="Everything the household owns.">
        <div className="space-y-4">
          <ChipGroup
            id="assets-owned"
            label="Owned assets"
            options={ASSETS}
            value={draft.assets.owned}
            onChange={(owned) =>
              patch("assets", {
                owned,
                otherText: owned.includes("other") ? draft.assets.otherText : null,
              })
            }
            error={errors["assets.owned"]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {draft.assets.owned.includes("other") ? (
              <TextField
                id="assets-other-text"
                label="Other assets"
                value={draft.assets.otherText}
                onChange={(value) => patch("assets", { otherText: value })}
                error={errors["assets.otherText"]}
                required
              />
            ) : null}
            <MoneyField
              id="assets-value"
              label="Estimated total value"
              value={draft.assets.estimatedTotalValue}
              onChange={(value) => patch("assets", { estimatedTotalValue: value })}
              error={errors["assets.estimatedTotalValue"]}
            />
          </div>
        </div>
      </FieldSection>
    </div>
  );
}

function TotalChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-black/[0.03] px-3 py-1.5 text-right">
      <p className="text-[11px] font-medium text-black/50">{label}</p>
      <p className="text-sm font-semibold text-[#001539] tabular-nums">{formatEtb(value)}</p>
    </div>
  );
}
