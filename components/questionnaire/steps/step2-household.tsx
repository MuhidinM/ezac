"use client";

import { ChevronDown, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { createMember } from "../initial-state";
import { StepWrapper } from "../step-wrapper";
import type { HouseholdMember, StepProps } from "../types";
import { FormField } from "../ui/form-field";
import { RadioGroup } from "../ui/radio-group";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20";

function MemberCard({
  member,
  index,
  canRemove,
  errors,
  onUpdate,
  onRemove,
}: {
  member: HouseholdMember;
  index: number;
  canRemove: boolean;
  errors: Record<string, string>;
  onUpdate: (field: keyof HouseholdMember, value: string) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="rounded-xl border border-[#1a3d2b]/15 bg-[#f7f3ec]/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-4 py-3 text-left md:hidden"
      >
        <span className="font-medium text-[#1a3d2b]">
          Member {index + 1}
          {member.name ? `: ${member.name}` : ""}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-[#5a6e62] transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`space-y-3 p-4 ${expanded ? "block" : "hidden md:block"}`}>
        <div className="hidden items-center justify-between md:flex">
          <span className="font-medium text-[#1a3d2b]">Member {index + 1}</span>
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 text-sm text-[#c0392b]"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Name"
            htmlFor={`member-${index}-name`}
            required
            error={errors[`member_${index}_name`]}
          >
            <input
              id={`member-${index}-name`}
              type="text"
              value={member.name}
              onChange={(e) => onUpdate("name", e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Sex" error={errors[`member_${index}_sex`]}>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((s) => (
                <label
                  key={s}
                  className={`flex min-h-[48px] flex-1 cursor-pointer items-center justify-center rounded-xl border text-base capitalize ${
                    member.sex === s
                      ? "border-[#1a3d2b] bg-[#1a3d2b]/5"
                      : "border-[#1a3d2b]/15"
                  }`}
                >
                  <input
                    type="radio"
                    name={`member-${index}-sex`}
                    checked={member.sex === s}
                    onChange={() => onUpdate("sex", s)}
                    className="sr-only"
                  />
                  {s === "male" ? "M" : "F"}
                </label>
              ))}
            </div>
          </FormField>
          <FormField
            label="Age"
            htmlFor={`member-${index}-age`}
            required
            error={errors[`member_${index}_age`]}
          >
            <input
              id={`member-${index}-age`}
              type="number"
              value={member.age}
              onChange={(e) => onUpdate("age", e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Relationship" htmlFor={`member-${index}-relationship`}>
            <input
              id={`member-${index}-relationship`}
              type="text"
              value={member.relationship}
              onChange={(e) => onUpdate("relationship", e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Occupation" htmlFor={`member-${index}-occupation`}>
            <input
              id={`member-${index}-occupation`}
              type="text"
              value={member.occupation}
              onChange={(e) => onUpdate("occupation", e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Monthly Income (ETB)" htmlFor={`member-${index}-income`}>
            <input
              id={`member-${index}-income`}
              type="text"
              inputMode="numeric"
              value={member.monthlyIncome}
              onChange={(e) => onUpdate("monthlyIncome", e.target.value)}
              className={inputClass}
            />
          </FormField>
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-sm text-[#c0392b] md:hidden"
          >
            <Trash2 className="h-4 w-4" /> Remove member
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Step2Household({ state, setState, errors }: StepProps) {
  const { household } = state;
  const totalMembers = household.members.length;

  function updateMember(index: number, field: keyof HouseholdMember, value: string) {
    setState((prev) => {
      const members = [...prev.household.members];
      members[index] = { ...members[index], [field]: value };
      return { ...prev, household: { ...prev.household, members } };
    });
  }

  function addMember() {
    if (household.members.length >= 8) return;
    setState((prev) => ({
      ...prev,
      household: {
        ...prev.household,
        members: [...prev.household.members, createMember()],
      },
    }));
  }

  function removeMember(index: number) {
    if (index === 0) return;
    setState((prev) => ({
      ...prev,
      household: {
        ...prev.household,
        members: prev.household.members.filter((_, i) => i !== index),
      },
    }));
  }

  function updateSummary(field: keyof typeof household, value: string) {
    setState((prev) => ({
      ...prev,
      household: { ...prev.household, [field]: value },
    }));
  }

  return (
    <StepWrapper
      title="Who lives in this household?"
      description="Add household members and summary information."
      icon={Users}
    >
      <div className="space-y-6">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1a3d2b]/10 text-[#5a6e62]">
                <th className="pb-2 pr-2">Name</th>
                <th className="pb-2 pr-2">Sex</th>
                <th className="pb-2 pr-2">Age</th>
                <th className="pb-2 pr-2">Relationship</th>
                <th className="pb-2 pr-2">Occupation</th>
                <th className="pb-2 pr-2">Income (ETB)</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {household.members.map((member, index) => (
                <tr key={member.id} className="border-b border-[#1a3d2b]/5">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(index, "name", e.target.value)}
                      className="min-h-[40px] w-full rounded-lg border border-[#1a3d2b]/20 px-2 text-base"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={member.sex}
                      onChange={(e) =>
                        updateMember(index, "sex", e.target.value as "male" | "female" | "")
                      }
                      className="min-h-[40px] w-full rounded-lg border border-[#1a3d2b]/20 px-2 text-base"
                    >
                      <option value="">—</option>
                      <option value="male">M</option>
                      <option value="female">F</option>
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={member.age}
                      onChange={(e) => updateMember(index, "age", e.target.value)}
                      className="min-h-[40px] w-20 rounded-lg border border-[#1a3d2b]/20 px-2 text-base"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={member.relationship}
                      onChange={(e) => updateMember(index, "relationship", e.target.value)}
                      className="min-h-[40px] w-full rounded-lg border border-[#1a3d2b]/20 px-2 text-base"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={member.occupation}
                      onChange={(e) => updateMember(index, "occupation", e.target.value)}
                      className="min-h-[40px] w-full rounded-lg border border-[#1a3d2b]/20 px-2 text-base"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={member.monthlyIncome}
                      onChange={(e) => updateMember(index, "monthlyIncome", e.target.value)}
                      className="min-h-[40px] w-24 rounded-lg border border-[#1a3d2b]/20 px-2 text-base"
                    />
                  </td>
                  <td className="py-2">
                    {index > 0 ? (
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="text-[#c0392b]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {household.members.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              index={index}
              canRemove={index > 0}
              errors={errors}
              onUpdate={(field, value) => updateMember(index, field, value)}
              onRemove={() => removeMember(index)}
            />
          ))}
        </div>

        {household.members.length < 8 ? (
          <button
            type="button"
            onClick={addMember}
            className="flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-dashed border-[#1a3d2b]/30 px-4 py-2 text-base font-medium text-[#1a3d2b] transition hover:border-[#1a3d2b]/50 hover:bg-[#1a3d2b]/5"
          >
            <Plus className="h-5 w-5" /> Add Member
          </button>
        ) : null}

        <section className="space-y-4 border-t border-[#1a3d2b]/10 pt-6">
          <h3 className="text-lg font-semibold text-[#1a3d2b]">Household Summary</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Total Household Members">
              <input
                type="number"
                value={totalMembers}
                readOnly
                className={`${inputClass} bg-[#1a3d2b]/5`}
              />
            </FormField>
            <FormField label="Children under 18" htmlFor="childrenUnder18">
              <input
                id="childrenUnder18"
                type="number"
                min={0}
                value={household.childrenUnder18}
                onChange={(e) => updateSummary("childrenUnder18", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Older persons 60+" htmlFor="olderPersons60Plus">
              <input
                id="olderPersons60Plus"
                type="number"
                min={0}
                value={household.olderPersons60Plus}
                onChange={(e) => updateSummary("olderPersons60Plus", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Persons with disabilities" htmlFor="personsWithDisabilities">
              <input
                id="personsWithDisabilities"
                type="number"
                min={0}
                value={household.personsWithDisabilities}
                onChange={(e) =>
                  updateSummary("personsWithDisabilities", e.target.value)
                }
                className={inputClass}
              />
            </FormField>
            <FormField label="Chronically ill members" htmlFor="chronicallyIllMembers">
              <input
                id="chronicallyIllMembers"
                type="number"
                min={0}
                value={household.chronicallyIllMembers}
                onChange={(e) => updateSummary("chronicallyIllMembers", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField
              label="Pregnant or lactating women"
              htmlFor="pregnantOrLactatingWomen"
            >
              <input
                id="pregnantOrLactatingWomen"
                type="number"
                min={0}
                value={household.pregnantOrLactatingWomen}
                onChange={(e) =>
                  updateSummary("pregnantOrLactatingWomen", e.target.value)
                }
                className={inputClass}
              />
            </FormField>
          </div>
          <RadioGroup
            name="femaleHeadedHousehold"
            label="Female-headed household *"
            value={household.femaleHeadedHousehold}
            onChange={(v) => updateSummary("femaleHeadedHousehold", v)}
            error={errors.femaleHeadedHousehold}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </section>
      </div>
    </StepWrapper>
  );
}
