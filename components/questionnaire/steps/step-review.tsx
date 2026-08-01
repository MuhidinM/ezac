"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  ASSET_LABELS,
  VULNERABILITY_LABELS,
} from "../initial-state";
import type { QuestionnaireState } from "../types";
import { formatDisplayCurrency, sumCurrency } from "../utils";

type StepReviewProps = {
  state: QuestionnaireState;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[#1a3d2b]/10 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium text-[#1a3d2b]">{title}</span>
        <ChevronDown
          className={`h-5 w-5 text-[#5a6e62] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-[#1a3d2b]/10 px-4 py-3 text-sm text-[#5a6e62]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-medium text-[#1a3d2b]">{label}:</span> {value}
    </p>
  );
}

function checkedLabels(
  record: Record<string, boolean>,
  labels?: Record<string, string>,
): string {
  return Object.entries(record)
    .filter(([, v]) => v)
    .map(([k]) => labels?.[k] ?? k)
    .join(", ");
}

export function StepReview({ state, onSubmit, isSubmitting }: StepReviewProps) {
  const totalIncome = sumCurrency(state.finance.income);
  const totalExpenditure = sumCurrency(state.finance.expenditure);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-2xl font-semibold text-[#1a3d2b] sm:text-3xl">
          Review your answers
        </h2>
        <p className="mt-1 text-base text-[#5a6e62]">
          Please review all sections before submitting the assessment.
        </p>
      </div>

      <div className="space-y-3">
        <AccordionSection title="1. Assessment & Applicant" defaultOpen>
          <div className="space-y-1">
            <Row label="Assessment Number" value={state.assessment.assessmentNumber} />
            <Row label="Beneficiary ID / BIN" value={state.assessment.beneficiaryId} />
            <Row label="Region" value={state.assessment.region} />
            <Row label="Full Name" value={state.applicant.fullName} />
            <Row label="Sex" value={state.applicant.sex} />
            <Row label="Age" value={state.applicant.age} />
            <Row label="Marital Status" value={state.applicant.maritalStatus} />
            <Row
              label="Asnaf Categories"
              value={checkedLabels({
                poor: state.asnaf.poor,
                needy: state.asnaf.needy,
                debtor: state.asnaf.debtor,
                wayfarer: state.asnaf.wayfarer,
                zakatAdministrator: state.asnaf.zakatAdministrator,
                reconciliationOfHearts: state.asnaf.reconciliationOfHearts,
                fiSabilillah: state.asnaf.fiSabilillah,
                other: state.asnaf.other,
              })}
            />
          </div>
        </AccordionSection>

        <AccordionSection title="2. Household Composition">
          <p className="font-medium text-[#1a3d2b]">
            {state.household.members.length} member(s)
          </p>
          {state.household.members.map((m, i) => (
            <p key={m.id}>
              {i + 1}. {m.name || "Unnamed"} — {m.sex}, age {m.age || "—"}
            </p>
          ))}
          <Row
            label="Female-headed"
            value={state.household.femaleHeadedHousehold}
          />
        </AccordionSection>

        <AccordionSection title="3. Income, Expenditure & Assets">
          <Row
            label="Total Monthly Income"
            value={`ETB ${formatDisplayCurrency(totalIncome)}`}
          />
          <Row
            label="Total Monthly Expenditure"
            value={`ETB ${formatDisplayCurrency(totalExpenditure)}`}
          />
          <Row
            label="Surplus/Deficit"
            value={`ETB ${formatDisplayCurrency(totalIncome - totalExpenditure)}`}
          />
          <Row
            label="Assets owned"
            value={checkedLabels(state.finance.assets, ASSET_LABELS)}
          />
        </AccordionSection>

        <AccordionSection title="4. Housing & Living Conditions">
          <Row label="Housing Type" value={state.housing.housingType} />
          <Row label="Water Source" value={state.housing.waterSource} />
          <Row label="Electricity" value={state.housing.electricity} />
          <Row label="Rooms" value={state.housing.numberOfRooms} />
        </AccordionSection>

        <AccordionSection title="5. Food Security, Health & Education">
          <Row label="Meals per day" value={state.healthFood.mealsPerDay} />
          <Row
            label="Food shortage (prev. month)"
            value={state.healthFood.foodShortagePreviousMonth}
          />
          <Row
            label="Children in school"
            value={state.healthFood.childrenAttendingSchool}
          />
        </AccordionSection>

        <AccordionSection title="6. Debt, Vulnerability & Support">
          <Row
            label="Outstanding debt"
            value={state.debtVulnerability.outstandingDebtAmount}
          />
          <Row
            label="Vulnerability flags"
            value={checkedLabels(
              state.debtVulnerability.vulnerabilityFlags,
              VULNERABILITY_LABELS,
            )}
          />
        </AccordionSection>

        <AccordionSection title="7. Officer Assessment">
          <Row
            label="Risk Category"
            value={state.officerAssessment.recommendedRiskCategory}
          />
          <Row
            label="Recommendation"
            value={state.officerAssessment.recommendation}
          />
          <Row
            label="Poverty Score"
            value={state.officerAssessment.compositePovertyScore}
          />
          <Row
            label="Reason"
            value={state.officerAssessment.reasonForDecision}
          />
        </AccordionSection>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="min-h-[52px] w-full rounded-xl bg-[#c4a040] px-6 py-3 text-lg font-semibold text-[#1a3d2b] transition hover:bg-[#b89030] disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Assessment"}
      </button>
    </div>
  );
}
