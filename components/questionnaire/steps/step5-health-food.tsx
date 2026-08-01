"use client";

import { Heart } from "lucide-react";

import { NON_ATTENDANCE_REASONS } from "../initial-state";
import { StepWrapper } from "../step-wrapper";
import type { StepProps } from "../types";
import { CheckboxGroup } from "../ui/checkbox-group";
import { RadioGroup } from "../ui/radio-group";

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function Step5HealthFood({ state, setState }: StepProps) {
  const { healthFood } = state;

  function update(field: keyof typeof healthFood, value: string) {
    setState((prev) => ({
      ...prev,
      healthFood: { ...prev.healthFood, [field]: value },
    }));
  }

  function updateReason(value: string, checked: boolean) {
    setState((prev) => ({
      ...prev,
      healthFood: {
        ...prev.healthFood,
        nonAttendanceReasons: {
          ...prev.healthFood.nonAttendanceReasons,
          [value]: checked,
        },
      },
    }));
  }

  const showNonAttendance =
    healthFood.childrenAttendingSchool === "some" ||
    healthFood.childrenAttendingSchool === "none";

  return (
    <StepWrapper
      title="Health, food, and schooling"
      description="Assess food security, health, and education status."
      icon={Heart}
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Food Security</h3>
          <div className="space-y-4">
            <RadioGroup
              name="mealsPerDay"
              label="Meals per day"
              value={healthFood.mealsPerDay}
              onChange={(v) => update("mealsPerDay", v)}
              options={[
                { value: "one", label: "One" },
                { value: "two", label: "Two" },
                { value: "three_or_more", label: "Three or More" },
              ]}
            />
            <RadioGroup
              name="foodShortagePreviousMonth"
              label="Food shortage in previous month"
              value={healthFood.foodShortagePreviousMonth}
              onChange={(v) => update("foodShortagePreviousMonth", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="skippedMealsDueToLack"
              label="Skipped meals due to lack of food"
              value={healthFood.skippedMealsDueToLack}
              onChange={(v) => update("skippedMealsDueToLack", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="receivedFoodAssistance"
              label="Received food assistance"
              value={healthFood.receivedFoodAssistance}
              onChange={(v) => update("receivedFoodAssistance", v)}
              options={yesNoOptions}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Health</h3>
          <div className="space-y-4">
            <RadioGroup
              name="chronicIllnessInHousehold"
              label="Any chronic illness in household"
              value={healthFood.chronicIllnessInHousehold}
              onChange={(v) => update("chronicIllnessInHousehold", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="disabilityInHousehold"
              label="Any disability in household"
              value={healthFood.disabilityInHousehold}
              onChange={(v) => update("disabilityInHousehold", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="medicalExpensesDifficult"
              label="Are medical expenses difficult to afford"
              value={healthFood.medicalExpensesDifficult}
              onChange={(v) => update("medicalExpensesDifficult", v)}
              options={yesNoOptions}
            />
            <RadioGroup
              name="hasHealthInsurance"
              label="Does household have health insurance"
              value={healthFood.hasHealthInsurance}
              onChange={(v) => update("hasHealthInsurance", v)}
              options={yesNoOptions}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Education</h3>
          <RadioGroup
            name="childrenAttendingSchool"
            label="Children attending school"
            value={healthFood.childrenAttendingSchool}
            onChange={(v) => update("childrenAttendingSchool", v)}
            options={[
              { value: "all", label: "All" },
              { value: "some", label: "Some" },
              { value: "none", label: "None" },
            ]}
          />
          {showNonAttendance ? (
            <div className="mt-4">
              <CheckboxGroup
                label="Reason for non-attendance"
                options={NON_ATTENDANCE_REASONS.map((r) => ({
                  value: r,
                  label: r.charAt(0).toUpperCase() + r.slice(1),
                }))}
                values={healthFood.nonAttendanceReasons}
                onChange={updateReason}
              />
            </div>
          ) : null}
        </section>
      </div>
    </StepWrapper>
  );
}
