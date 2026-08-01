"use client";

import { ClipboardCheck } from "lucide-react";

import { DOCUMENTS_VERIFIED } from "../initial-state";
import { StepWrapper } from "../step-wrapper";
import type { StepProps } from "../types";
import { CheckboxGroup } from "../ui/checkbox-group";
import { FormField } from "../ui/form-field";
import { RadioGroup } from "../ui/radio-group";
import { TextArea } from "../ui/text-area";
import { FORM_INPUT_CLASS } from "../form-styles";

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function formatRisk(value: string): string {
  switch (value) {
    case "high":
      return "High Risk";
    case "medium":
      return "Medium Risk";
    case "low":
      return "Low Risk";
    default:
      return "Not assessed";
  }
}

function formatRecommendation(value: string): string {
  switch (value) {
    case "approve":
      return "Approve";
    case "conditional":
      return "Conditional Approval";
    case "defer":
      return "Defer";
    case "reject":
      return "Reject";
    default:
      return "Not assessed";
  }
}

function riskBadgeClass(value: string): string {
  switch (value) {
    case "high":
      return "border-[#c0392b] bg-[#c0392b]/10 text-[#001539]";
    case "medium":
      return "border-[#e18f35] bg-[#e18f35]/15 text-[#001539]";
    case "low":
      return "border-[#007050] bg-[rgba(0,112,80,0.1)] text-[#001539]";
    default:
      return "border-black/10 bg-black/[0.02] text-[#001539]";
  }
}

function recommendationBadgeClass(value: string): string {
  switch (value) {
    case "approve":
      return "border-[#27ae60] bg-[#27ae60]/12 text-[#001539]";
    case "conditional":
      return "border-[#e18f35] bg-[#e18f35]/15 text-[#001539]";
    case "defer":
      return "border-blue-500 bg-blue-500/10 text-[#001539]";
    case "reject":
      return "border-[#c0392b] bg-[#c0392b]/10 text-[#001539]";
    default:
      return "border-black/10 bg-black/[0.02] text-[#001539]";
  }
}

export function Step7Assessment({ state, setState, errors }: StepProps) {
  const oa = state.officerAssessment;

  function update(field: keyof typeof oa, value: string) {
    setState((prev) => ({
      ...prev,
      officerAssessment: { ...prev.officerAssessment, [field]: value },
    }));
  }

  function updateDocument(value: string, checked: boolean) {
    setState((prev) => ({
      ...prev,
      officerAssessment: {
        ...prev.officerAssessment,
        documentsVerified: {
          ...prev.officerAssessment.documentsVerified,
          [value]: checked,
        },
      },
    }));
  }

  return (
    <StepWrapper
      title="Officer's assessment"
      description="Complete field observations and assessment recommendation."
      icon={ClipboardCheck}
    >
      <p className="mb-6 rounded-xl border border-[rgba(225,143,53,0.35)] bg-[rgba(225,143,53,0.1)] px-4 py-3 text-sm text-[#001539]">
        This section is completed by the Assessment Officer only.
      </p>

      <div className="space-y-8">
        <section>
          <h3 className="form-section-title mb-4">
            Section O — Field Observations
          </h3>
          <div className="space-y-4">
            <FormField label="Housing condition" htmlFor="housingCondition">
              <TextArea
                id="housingCondition"
                value={oa.housingCondition}
                onChange={(v) => update("housingCondition", v)}
              />
            </FormField>
            <FormField label="Household cleanliness" htmlFor="householdCleanliness">
              <TextArea
                id="householdCleanliness"
                value={oa.householdCleanliness}
                onChange={(v) => update("householdCleanliness", v)}
              />
            </FormField>
            <FormField label="Visible assets" htmlFor="visibleAssets">
              <TextArea
                id="visibleAssets"
                value={oa.visibleAssets}
                onChange={(v) => update("visibleAssets", v)}
              />
            </FormField>
            <FormField label="General observations" htmlFor="generalObservations">
              <TextArea
                id="generalObservations"
                value={oa.generalObservations}
                onChange={(v) => update("generalObservations", v)}
              />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="form-section-title mb-4">
            Section P — Verification Checklist
          </h3>
          <CheckboxGroup
            label="Documents verified (tick all that apply)"
            options={DOCUMENTS_VERIFIED.map((d) => ({
              value: d,
              label: d
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (s) => s.toUpperCase())
                .trim(),
            }))}
            values={oa.documentsVerified}
            onChange={updateDocument}
            columns={2}
          />
          <div className="mt-4 space-y-4">
            <RadioGroup
              name="communityVerificationConducted"
              label="Community verification conducted"
              value={oa.communityVerificationConducted}
              onChange={(v) => update("communityVerificationConducted", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="homeVisitCompleted"
              label="Home visit completed"
              value={oa.homeVisitCompleted}
              onChange={(v) => update("homeVisitCompleted", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="gpsRecorded"
              label="GPS recorded (if applicable)"
              value={oa.gpsRecorded}
              onChange={(v) => update("gpsRecorded", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="photographsTaken"
              label="Photographs taken (with consent)"
              value={oa.photographsTaken}
              onChange={(v) => update("photographsTaken", v)}
              options={yesNoOptions}
            />
          </div>
        </section>

        <section>
          <h3 className="form-section-title mb-4">
            Section Q — Assessment Recommendation
          </h3>
          <p className="mb-4 text-sm text-black/60">
            The following assessment is automatically generated from all household
            data entered in Steps 1–6.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className={`rounded-xl border-2 px-4 py-4 text-center ${riskBadgeClass(oa.recommendedRiskCategory)}`}
            >
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                Recommended Risk Category
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatRisk(oa.recommendedRiskCategory)}
              </p>
            </div>
            <div
              className={`rounded-xl border-2 px-4 py-4 text-center ${recommendationBadgeClass(oa.recommendation)}`}
            >
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                Recommendation
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatRecommendation(oa.recommendation)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-black/10 bg-[rgba(0,112,80,0.06)] px-4 py-4">
            <p className="text-sm text-black/60">Composite Poverty Score</p>
            <p className="mt-1 text-3xl font-semibold text-[#001539]">
              {oa.compositePovertyScore || "0"} / 270
            </p>
          </div>

          <FormField
            label="Reason for decision"
            htmlFor="reasonForDecision"
            required
            error={errors.reasonForDecision}
            className="mt-4"
          >
            <TextArea
              id="reasonForDecision"
              value={oa.reasonForDecision}
              onChange={(v) => update("reasonForDecision", v)}
            />
          </FormField>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Assessment Officer Name"
              htmlFor="officerName"
              required
              error={errors.officerName}
            >
              <input
                id="officerName"
                type="text"
                value={oa.officerName}
                onChange={(e) => update("officerName", e.target.value)}
                className={FORM_INPUT_CLASS}
              />
            </FormField>
            <FormField
              label="Officer Date"
              htmlFor="officerDate"
              required
              error={errors.officerDate}
            >
              <input
                id="officerDate"
                type="date"
                value={oa.officerDate}
                onChange={(e) => update("officerDate", e.target.value)}
                className={FORM_INPUT_CLASS}
              />
            </FormField>
            <FormField label="Supervisor Name" htmlFor="supervisorName">
              <input
                id="supervisorName"
                type="text"
                value={oa.supervisorName}
                onChange={(e) => update("supervisorName", e.target.value)}
                className={FORM_INPUT_CLASS}
              />
            </FormField>
            <FormField label="Supervisor Date" htmlFor="supervisorDate">
              <input
                id="supervisorDate"
                type="date"
                value={oa.supervisorDate}
                onChange={(e) => update("supervisorDate", e.target.value)}
                className={FORM_INPUT_CLASS}
              />
            </FormField>
          </div>
        </section>
      </div>
    </StepWrapper>
  );
}
