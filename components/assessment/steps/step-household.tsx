"use client";

import { Plus, Trash2 } from "lucide-react";

import {
  FieldSection,
  MoneyField,
  NumberField,
  SelectField,
  TextField,
  YesNoField,
} from "@/components/assessment/fields";
import { HouseholdSummaryGrid } from "@/components/assessment/household-summary";
import type { StepProps } from "@/components/assessment/step-props";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HouseholdMember } from "@/lib/api/backoffice-types";
import { emptyMember } from "@/lib/backoffice/assessment-steps";
import { RELATIONSHIP, SEX } from "@/lib/backoffice/options";

function showPregnancy(member: HouseholdMember) {
  return member.sex === "female" && member.age !== null && member.age >= 12 && member.age <= 55;
}

function showSchool(member: HouseholdMember) {
  return member.age !== null && member.age >= 5 && member.age <= 18;
}

export function StepHousehold({ draft, patch, errors, summary }: StepProps) {
  const members = draft.household.members;

  function updateMember(index: number, value: Partial<HouseholdMember>) {
    const next = members.map((member, i) => {
      if (i !== index) return member;
      const merged = { ...member, ...value };
      // Drop answers whose question is hidden for this age/sex.
      if (!showPregnancy(merged)) merged.pregnantOrLactating = false;
      if (!showSchool(merged)) merged.attendsSchool = null;
      return merged;
    });
    patch("household", { members: next });
  }

  function removeMember(index: number) {
    patch("household", { members: members.filter((_, i) => i !== index) });
  }

  const error = (index: number, key: keyof HouseholdMember) =>
    errors[`household.members[${index}].${key}`];

  return (
    <div className="space-y-6">
      <FieldSection
        letter="D"
        title="Household members"
        description="Row 1 is the applicant. Add everyone who lives and eats together."
        aside={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => patch("household", { members: [...members, emptyMember()] })}
          >
            <Plus />
            Add member
          </Button>
        }
      >
        {errors["household.members"] ? (
          <p className="mb-3 text-sm text-rose-700">{errors["household.members"]}</p>
        ) : null}
        <ol className="space-y-4">
          {members.map((member, index) => {
            const isSelf = member.relationship === "self";
            return (
              <li
                key={index}
                className="rounded-lg border border-black/[0.08] bg-black/[0.015] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#001539]">
                    <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs ring-1 ring-black/10 tabular-nums">
                      {index + 1}
                    </span>
                    {member.name?.trim() || "New member"}
                    {isSelf ? <Badge tone="brand">Applicant</Badge> : null}
                  </p>
                  {!isSelf ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove member ${index + 1}`}
                      onClick={() => removeMember(index)}
                    >
                      <Trash2 className="text-black/45" />
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <TextField
                    id={`m${index}-name`}
                    label="Name"
                    value={member.name}
                    onChange={(value) => updateMember(index, { name: value })}
                    error={error(index, "name")}
                    className="sm:col-span-2"
                    required
                  />
                  <SelectField
                    id={`m${index}-rel`}
                    label="Relationship"
                    options={isSelf ? RELATIONSHIP : RELATIONSHIP.filter((o) => o.value !== "self")}
                    value={member.relationship}
                    onChange={(value) => updateMember(index, { relationship: value })}
                    disabled={isSelf}
                    error={error(index, "relationship")}
                    required
                  />
                  <SelectField
                    id={`m${index}-sex`}
                    label="Sex"
                    options={SEX}
                    value={member.sex}
                    onChange={(value) =>
                      updateMember(index, { sex: value as HouseholdMember["sex"] })
                    }
                    error={error(index, "sex")}
                    required
                  />
                  <NumberField
                    id={`m${index}-age`}
                    label="Age"
                    min={0}
                    max={120}
                    step={1}
                    value={member.age}
                    onChange={(value) => updateMember(index, { age: value })}
                    error={error(index, "age")}
                    required
                  />
                  <TextField
                    id={`m${index}-occupation`}
                    label="Occupation"
                    value={member.occupation}
                    onChange={(value) => updateMember(index, { occupation: value })}
                    error={error(index, "occupation")}
                  />
                  <MoneyField
                    id={`m${index}-income`}
                    label="Monthly income"
                    value={member.monthlyIncome}
                    onChange={(value) => updateMember(index, { monthlyIncome: value })}
                    error={error(index, "monthlyIncome")}
                    className="sm:col-span-2"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/[0.06] pt-3">
                  <Check
                    label="Has a disability"
                    checked={!!member.hasDisability}
                    onChange={(checked) => updateMember(index, { hasDisability: checked })}
                  />
                  <Check
                    label="Chronically ill"
                    checked={!!member.chronicallyIll}
                    onChange={(checked) => updateMember(index, { chronicallyIll: checked })}
                  />
                  {showPregnancy(member) ? (
                    <Check
                      label="Pregnant or lactating"
                      checked={!!member.pregnantOrLactating}
                      onChange={(checked) => updateMember(index, { pregnantOrLactating: checked })}
                    />
                  ) : null}
                  {showSchool(member) ? (
                    <Check
                      label="Attends school"
                      checked={!!member.attendsSchool}
                      onChange={(checked) => updateMember(index, { attendsSchool: checked })}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </FieldSection>

      <FieldSection title="Household summary" description="Calculated by the system from the members above.">
        <div className="space-y-5">
          <HouseholdSummaryGrid summary={summary} />
          <YesNoField
            id="female-headed"
            label="Female-headed household"
            autoLabel="Auto"
            hint="Auto: a female applicant without a male spouse. Only override if the officer finds otherwise."
            value={draft.household.femaleHeadedHousehold}
            onChange={(value) => patch("household", { femaleHeadedHousehold: value })}
            error={errors["household.femaleHeadedHousehold"]}
          />
        </div>
      </FieldSection>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#001539]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-black/20 accent-[#007050]"
      />
      {label}
    </label>
  );
}
