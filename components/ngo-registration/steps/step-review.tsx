"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { AID_TYPE_LABELS, AID_TYPES, FUNDING_SOURCE_LABELS } from "../initial-state";
import { calculateTotalScore, getAutoDecision, getDecisionLabel } from "../scoring";
import type { EligibilityDecision, NgoRegistrationState } from "../types";

type StepReviewProps = {
  state: NgoRegistrationState;
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
        <ChevronDown className={`h-5 w-5 text-[#5a6e62] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="space-y-1 border-t border-[#1a3d2b]/10 px-4 py-3 text-sm text-[#5a6e62]">
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

export function StepReview({ state, onSubmit, isSubmitting }: StepReviewProps) {
  const totalScore = calculateTotalScore(state.step5.reviewerScores);
  const autoDecision = getAutoDecision(totalScore);
  const decision: EligibilityDecision =
    state.step5.decisionOverride || autoDecision;

  const aidTypesSelected = AID_TYPES.filter((k) => state.step3.aidTypes[k])
    .map((k) => AID_TYPE_LABELS[k])
    .join(", ");

  const fundingSources = state.step4.fundingSources
    .map((s) => FUNDING_SOURCE_LABELS[s.sourceKey as keyof typeof FUNDING_SOURCE_LABELS] ?? s.sourceKey)
    .join(", ");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-2xl font-semibold text-[#1a3d2b] sm:text-3xl">
          Review your application
        </h2>
        <p className="mt-1 text-base text-[#5a6e62]">
          Please review all sections before submitting.
        </p>
      </div>

      <div className="rounded-xl border border-[#c4a040]/40 bg-[#c4a040]/10 px-4 py-3 text-sm text-[#1a3d2b]">
        Please review all information carefully before submitting. You will not be
        able to edit after submission.
      </div>

      <div className="space-y-3">
        <AccordionSection title="1. Organization Identity & Legal Status" defaultOpen>
          <Row label="Organization" value={state.step1.orgName} />
          <Row label="Type" value={state.step1.orgType} />
          <Row label="Registration Number" value={state.step1.registrationNumber} />
          <Row label="Contact" value={state.step1.contactName} />
          <Row label="Region" value={state.step1.region} />
        </AccordionSection>

        <AccordionSection title="2. Geographic Coverage & Beneficiary Reach">
          <Row label="Active beneficiaries" value={state.step2.beneficiaryStats.activeReceiving} />
          <Row label="Regions covered" value={state.step2.regionsCount} />
          <Row label="Woredas covered" value={state.step2.woredasCount} />
          <Row label="Coverage areas" value={`${state.step2.coverageAreas.length} area(s)`} />
          <Row label="Selection method" value={state.step2.selectionMethod} />
        </AccordionSection>

        <AccordionSection title="3. Aid Programs & Services">
          <Row label="Aid types" value={aidTypesSelected} />
          <Row label="Follow-up visits" value={state.step3.monitoring.followUpVisits} />
          <Row label="Written reports" value={state.step3.monitoring.writtenReports} />
        </AccordionSection>

        <AccordionSection title="4. Financial Situation & Funding Gap">
          <Row label="Total budget" value={state.step4.totalBudget} />
          <Row label="Secured budget" value={state.step4.securedBudget} />
          <Row label="Requested amount" value={state.step4.requestedAmount} />
          <Row label="Funding sources" value={fundingSources} />
          <Row label="Bank" value={state.step4.bankName} />
        </AccordionSection>

        <AccordionSection title="5. Shariah Compliance & Assessment">
          <Row label="Applicant" value={state.step5.applicantName} />
          <Row label="Eligibility score" value={`${totalScore}/100`} />
          <Row label="Decision" value={getDecisionLabel(decision)} />
        </AccordionSection>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="min-h-[52px] w-full rounded-xl bg-[#c4a040] px-6 py-3 text-lg font-semibold text-[#1a3d2b] transition hover:bg-[#b89030] disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </button>
    </div>
  );
}
