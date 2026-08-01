"use client";

import { Heart } from "lucide-react";

import { StepWrapper } from "@/components/questionnaire/step-wrapper";
import { CheckboxGroup } from "@/components/questionnaire/ui/checkbox-group";
import { CurrencyInput } from "@/components/questionnaire/ui/currency-input";
import { FormField } from "@/components/questionnaire/ui/form-field";
import { RadioGroup } from "@/components/questionnaire/ui/radio-group";

import {
  AID_TYPE_LABELS,
  AID_TYPES,
  DISTRIBUTION_LABELS,
  DISTRIBUTION_METHODS,
  emptyProgram,
} from "../initial-state";
import type { AidTypeKey, NgoStepProps } from "../types";

const inputClass =
  "form-input";

const yesNo = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function Step3Programs({ state, setState, errors }: NgoStepProps) {
  const s = state.step3;

  function toggleAidType(key: AidTypeKey, checked: boolean) {
    setState((prev) => {
      const programs = { ...prev.step3.programs };
      if (checked && !programs[key]) programs[key] = emptyProgram();
      if (!checked) delete programs[key];
      return {
        ...prev,
        step3: {
          ...prev.step3,
          aidTypes: { ...prev.step3.aidTypes, [key]: checked },
          programs,
        },
      };
    });
  }

  function updateProgram(key: AidTypeKey, field: string, value: string) {
    setState((prev) => ({
      ...prev,
      step3: {
        ...prev.step3,
        programs: {
          ...prev.step3.programs,
          [key]: { ...prev.step3.programs[key]!, [field]: value },
        },
      },
    }));
  }

  function updateMonitoring(field: keyof typeof s.monitoring, value: string) {
    setState((prev) => ({
      ...prev,
      step3: {
        ...prev.step3,
        monitoring: { ...prev.step3.monitoring, [field]: value as "yes" | "no" | "" },
      },
    }));
  }

  const selectedAidTypes = AID_TYPES.filter((k) => s.aidTypes[k]);

  return (
    <StepWrapper
      title="What kind of support do you provide?"
      description="Describe the programs your organization runs"
      icon={Heart}
    >
      <div className="space-y-8">
        <section>
          <CheckboxGroup
            label="Types of Aid Provided — tick all that apply *"
            options={AID_TYPES.map((k) => ({ value: k, label: AID_TYPE_LABELS[k] }))}
            values={s.aidTypes}
            onChange={(value, checked) => toggleAidType(value as AidTypeKey, checked)}
            columns={2}
            error={errors.aidTypes}
          />
          {s.aidTypes.other ? (
            <FormField label="Other aid type" htmlFor="aidTypeOther" error={errors.aidTypeOther} className="mt-3">
              <input id="aidTypeOther" type="text" value={s.aidTypeOther} onChange={(e) => setState((prev) => ({ ...prev, step3: { ...prev.step3, aidTypeOther: e.target.value } }))} className={inputClass} />
            </FormField>
          ) : null}
        </section>

        {selectedAidTypes.length > 0 ? (
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-[#001539]">Program Details</h3>
            {selectedAidTypes.map((key) => {
              const program = s.programs[key] ?? emptyProgram();
              return (
                <div key={key} className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                  <h4 className="mb-3 font-medium text-[#001539]">{AID_TYPE_LABELS[key]}</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Program name">
                      <input type="text" value={program.name} onChange={(e) => updateProgram(key, "name", e.target.value)} className={inputClass} />
                    </FormField>
                    <FormField label="Beneficiaries reached">
                      <input type="number" min={0} value={program.beneficiariesReached} onChange={(e) => updateProgram(key, "beneficiariesReached", e.target.value)} className={inputClass} />
                    </FormField>
                    <div className="sm:col-span-2">
                      <RadioGroup name={`freq-${key}`} label="Frequency" value={program.frequency} onChange={(v) => updateProgram(key, "frequency", v)}
                        options={[
                          { value: "one_time", label: "One-time" },
                          { value: "monthly", label: "Monthly" },
                          { value: "quarterly", label: "Quarterly" },
                          { value: "annually", label: "Annually" },
                        ]}
                      />
                    </div>
                    <FormField label="Average value per beneficiary per cycle" className="sm:col-span-2">
                      <CurrencyInput formatOnBlur value={program.avgValuePerBeneficiary} onChange={(v) => updateProgram(key, "avgValuePerBeneficiary", v)} />
                    </FormField>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        <section>
          <CheckboxGroup
            label="Aid Distribution Method — select all used"
            options={DISTRIBUTION_METHODS.map((k) => ({ value: k, label: DISTRIBUTION_LABELS[k] }))}
            values={s.distributionMethods}
            onChange={(value, checked) =>
              setState((prev) => ({
                ...prev,
                step3: {
                  ...prev.step3,
                  distributionMethods: { ...prev.step3.distributionMethods, [value]: checked },
                },
              }))
            }
            columns={2}
          />
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#001539]">Monitoring & Accountability</h3>
          <div className="space-y-4">
            <RadioGroup name="followUpVisits" label="Does your organization conduct follow-up visits after aid distribution?" value={s.monitoring.followUpVisits} onChange={(v) => updateMonitoring("followUpVisits", v)} options={yesNo} />
            <RadioGroup name="beneficiaryFeedback" label="Do you collect feedback from beneficiaries?" value={s.monitoring.beneficiaryFeedback} onChange={(v) => updateMonitoring("beneficiaryFeedback", v)} options={yesNo} />
            <RadioGroup name="complaintsMechanism" label="Do you have a complaints mechanism?" value={s.monitoring.complaintsMechanism} onChange={(v) => updateMonitoring("complaintsMechanism", v)} options={yesNo} />
            <RadioGroup name="writtenReports" label="Do you produce written reports on aid impact?" value={s.monitoring.writtenReports} onChange={(v) => updateMonitoring("writtenReports", v)} options={yesNo} />
          </div>
        </section>
      </div>
    </StepWrapper>
  );
}
