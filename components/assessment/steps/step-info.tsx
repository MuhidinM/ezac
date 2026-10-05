"use client";

import { ChipGroup, FieldSection, TextField } from "@/components/assessment/fields";
import type { StepProps } from "@/components/assessment/step-props";
import { DetailList } from "@/components/dashboard/panel";
import { ASNAF } from "@/lib/backoffice/options";

export function StepInfo({ draft, patch, errors, assessment }: StepProps) {
  const info = assessment.assessmentInfo;

  return (
    <div className="space-y-6">
      <FieldSection letter="A" title="Assessment information">
        <div className="space-y-5">
          <div className="max-w-xs">
            <TextField
              id="assessment-date"
              type="date"
              label="Assessment date"
              hint="Defaults to the day the assessment was started"
              value={draft.assessmentInfo.assessmentDate}
              onChange={(value) => patch("assessmentInfo", { assessmentDate: value })}
              error={errors["assessmentInfo.assessmentDate"]}
              required
            />
          </div>
          <DetailList
            columns={4}
            items={[
              { label: "Region", value: info?.region },
              { label: "Zone", value: info?.zone },
              { label: "Woreda", value: info?.woreda },
              { label: "Kebele", value: info?.kebele },
              { label: "Branch", value: info?.branchName },
              { label: "Assessment officer", value: info?.officerName },
              { label: "Supervisor", value: info?.supervisorName },
            ]}
          />
        </div>
      </FieldSection>

      <FieldSection
        letter="C"
        title="Asnaf eligibility"
        description="Pre-filled from registration. Select every category that applies."
      >
        <div className="space-y-4">
          <ChipGroup
            id="asnaf"
            label="Categories"
            options={ASNAF}
            value={draft.asnaf.categories}
            onChange={(categories) =>
              patch("asnaf", {
                categories,
                otherText: categories.includes("other") ? draft.asnaf.otherText : null,
              })
            }
            error={errors["asnaf.categories"]}
            required
          />
          {draft.asnaf.categories.includes("other") ? (
            <div className="max-w-md">
              <TextField
                id="asnaf-other"
                label="Other category"
                value={draft.asnaf.otherText}
                onChange={(value) => patch("asnaf", { otherText: value })}
                error={errors["asnaf.otherText"]}
                required
              />
            </div>
          ) : null}
        </div>
      </FieldSection>
    </div>
  );
}
