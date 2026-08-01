"use client";

import { ClipboardCheck } from "lucide-react";

import { DOCUMENTS_VERIFIED } from "../initial-state";
import { StepWrapper } from "../step-wrapper";
import type { StepProps } from "../types";
import { CheckboxGroup } from "../ui/checkbox-group";
import { FormField } from "../ui/form-field";
import { RadioGroup } from "../ui/radio-group";
import { TextArea } from "../ui/text-area";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20";

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

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
      <p className="mb-6 rounded-xl border border-[#c4a040]/30 bg-[#c4a040]/10 px-4 py-3 text-sm text-[#1a3d2b]">
        This section is completed by the Assessment Officer only.
      </p>

      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">
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
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">
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
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">
            Section Q — Assessment Recommendation
          </h3>
          <RadioGroup
            name="recommendedRiskCategory"
            label="Recommended Risk Category *"
            value={oa.recommendedRiskCategory}
            onChange={(v) => update("recommendedRiskCategory", v)}
            error={errors.recommendedRiskCategory}
            variant="button"
            buttonColors={{
              high: "border-red-600 bg-red-600 text-white",
              medium: "border-yellow-500 bg-yellow-500 text-[#1a3d2b]",
              low: "border-green-600 bg-green-600 text-white",
            }}
            options={[
              { value: "high", label: "High Risk" },
              { value: "medium", label: "Medium Risk" },
              { value: "low", label: "Low Risk" },
            ]}
          />

          <FormField
            label="Composite Poverty Score (/ 270)"
            htmlFor="compositePovertyScore"
            className="mt-4"
          >
            <input
              id="compositePovertyScore"
              type="number"
              min={0}
              max={270}
              value={oa.compositePovertyScore}
              onChange={(e) => update("compositePovertyScore", e.target.value)}
              className={inputClass}
            />
          </FormField>

          <div className="mt-4">
            <RadioGroup
              name="recommendation"
              label="Recommendation *"
              value={oa.recommendation}
              onChange={(v) => update("recommendation", v)}
              error={errors.recommendation}
              variant="button"
              options={[
                { value: "approve", label: "Approve" },
                { value: "conditional", label: "Conditional Approval" },
                { value: "defer", label: "Defer" },
                { value: "reject", label: "Reject" },
              ]}
            />
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
                className={inputClass}
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
                className={inputClass}
              />
            </FormField>
            <FormField label="Supervisor Name" htmlFor="supervisorName">
              <input
                id="supervisorName"
                type="text"
                value={oa.supervisorName}
                onChange={(e) => update("supervisorName", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Supervisor Date" htmlFor="supervisorDate">
              <input
                id="supervisorDate"
                type="date"
                value={oa.supervisorDate}
                onChange={(e) => update("supervisorDate", e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        </section>
      </div>
    </StepWrapper>
  );
}
