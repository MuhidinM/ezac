"use client";

import { ChipGroup, FieldSection, SelectField, YesNoField } from "@/components/assessment/fields";
import { summaryCount } from "@/components/assessment/household-summary";
import type { StepProps } from "@/components/assessment/step-props";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { hasSchoolAgeChildren } from "@/lib/backoffice/assessment-steps";
import {
  MEALS_PER_DAY,
  NON_ATTENDANCE_REASONS,
  SCHOOL_ATTENDANCE,
} from "@/lib/backoffice/options";

export function StepWellbeing({ draft, patch, errors, summary }: StepProps) {
  const food = draft.foodSecurity;
  const health = draft.health;
  const education = draft.education;
  const showEducation = hasSchoolAgeChildren(draft.household.members);
  const needsReasons =
    education.childrenSchoolAttendance === "some" || education.childrenSchoolAttendance === "none";

  const illFromMembers = summaryCount(summary, "chronicallyIllCount") > 0;
  const disabilityFromMembers = summaryCount(summary, "disabledCount") > 0;

  return (
    <div className="space-y-6">
      <FieldSection letter="I" title="Food security">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="meals"
            label="Meals per day"
            options={MEALS_PER_DAY}
            value={food.mealsPerDay}
            onChange={(value) => patch("foodSecurity", { mealsPerDay: value })}
            error={errors["foodSecurity.mealsPerDay"]}
            required
          />
          <YesNoField
            id="shortage"
            label="Food shortage in the last month"
            value={food.foodShortageLastMonth}
            onChange={(value) => patch("foodSecurity", { foodShortageLastMonth: value })}
            error={errors["foodSecurity.foodShortageLastMonth"]}
            required
          />
          <YesNoField
            id="skipped"
            label="Skipped meals"
            value={food.skippedMeals}
            onChange={(value) => patch("foodSecurity", { skippedMeals: value })}
            error={errors["foodSecurity.skippedMeals"]}
            required
          />
          <YesNoField
            id="assistance"
            label="Received food assistance"
            value={food.receivedFoodAssistance}
            onChange={(value) => patch("foodSecurity", { receivedFoodAssistance: value })}
            error={errors["foodSecurity.receivedFoodAssistance"]}
            required
          />
        </div>
      </FieldSection>

      <FieldSection letter="J" title="Health">
        <div className="grid gap-5 sm:grid-cols-2">
          <YesNoField
            id="chronic"
            label="Chronic illness in the household"
            autoLabel={`Auto (${illFromMembers ? "Yes" : "No"})`}
            hint="Auto follows the household members marked chronically ill."
            value={health.chronicIllness}
            onChange={(value) => patch("health", { chronicIllness: value })}
            error={errors["health.chronicIllness"]}
          />
          <YesNoField
            id="disability"
            label="Disability in the household"
            autoLabel={`Auto (${disabilityFromMembers ? "Yes" : "No"})`}
            hint="Auto follows the household members marked with a disability."
            value={health.disability}
            onChange={(value) => patch("health", { disability: value })}
            error={errors["health.disability"]}
          />
          <YesNoField
            id="medical-unaffordable"
            label="Can't afford medical expenses"
            value={health.medicalExpensesUnaffordable}
            onChange={(value) => patch("health", { medicalExpensesUnaffordable: value })}
            error={errors["health.medicalExpensesUnaffordable"]}
            required
          />
          <YesNoField
            id="insurance"
            label="Has health insurance"
            value={health.hasHealthInsurance}
            onChange={(value) => patch("health", { hasHealthInsurance: value })}
            error={errors["health.hasHealthInsurance"]}
            required
          />
        </div>
      </FieldSection>

      <FieldSection letter="K" title="Education">
        {showEducation ? (
          <div className="space-y-5">
            <div className="max-w-sm">
              <SelectField
                id="attendance"
                label="School attendance of children aged 7–18"
                options={SCHOOL_ATTENDANCE.filter((option) => option.value !== "not_applicable")}
                value={education.childrenSchoolAttendance}
                onChange={(value) =>
                  patch("education", {
                    childrenSchoolAttendance: value,
                    nonAttendanceReasons:
                      value === "some" || value === "none" ? education.nonAttendanceReasons : [],
                  })
                }
                error={errors["education.childrenSchoolAttendance"]}
                required
              />
            </div>
            {needsReasons ? (
              <ChipGroup
                id="non-attendance"
                label="Reasons for not attending"
                options={NON_ATTENDANCE_REASONS}
                value={education.nonAttendanceReasons}
                onChange={(value) => patch("education", { nonAttendanceReasons: value })}
                error={errors["education.nonAttendanceReasons"]}
                required
              />
            ) : null}
          </div>
        ) : (
          <InlineAlert tone="info">
            No children aged 7–18 in the household, so this section is recorded as not applicable.
          </InlineAlert>
        )}
      </FieldSection>
    </div>
  );
}
