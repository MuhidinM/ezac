"use client";

import { ClipboardList } from "lucide-react";

import { StepWrapper } from "../step-wrapper";
import type { StepProps } from "../types";
import { CheckboxGroup } from "../ui/checkbox-group";
import { FormField } from "../ui/form-field";
import { RadioGroup } from "../ui/radio-group";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20";

export function Step1Identification({ state, setState, errors }: StepProps) {
  const { assessment, applicant, asnaf } = state;

  function updateAssessment(field: keyof typeof assessment, value: string) {
    setState((prev) => ({
      ...prev,
      assessment: { ...prev.assessment, [field]: value },
    }));
  }

  function updateApplicant(field: keyof typeof applicant, value: string) {
    setState((prev) => ({
      ...prev,
      applicant: { ...prev.applicant, [field]: value },
    }));
  }

  function updateAsnaf(field: keyof typeof asnaf, value: boolean | string) {
    setState((prev) => ({
      ...prev,
      asnaf: { ...prev.asnaf, [field]: value },
    }));
  }

  const asnafOptions = [
    {
      value: "poor",
      label: "Poor (Faqir)",
      description: "Has almost nothing to meet basic needs",
    },
    {
      value: "needy",
      label: "Needy (Miskin)",
      description: "Has some but not enough",
    },
    {
      value: "debtor",
      label: "Debtor (Gharim)",
      description: "Burdened by debt with no means to repay",
    },
    {
      value: "wayfarer",
      label: "Wayfarer (Ibn Sabil)",
      description: "Traveler in need far from home",
    },
    {
      value: "zakatAdministrator",
      label: "Zakat Administrator (Amil)",
    },
    {
      value: "reconciliationOfHearts",
      label: "Reconciliation of Hearts (Muallaf)",
    },
    {
      value: "fiSabilillah",
      label: "In the Cause of Allah (Fi Sabilillah)",
    },
    {
      value: "other",
      label: "Other",
    },
  ];

  const asnafValues = {
    poor: asnaf.poor,
    needy: asnaf.needy,
    debtor: asnaf.debtor,
    wayfarer: asnaf.wayfarer,
    zakatAdministrator: asnaf.zakatAdministrator,
    reconciliationOfHearts: asnaf.reconciliationOfHearts,
    fiSabilillah: asnaf.fiSabilillah,
    other: asnaf.other,
  };

  return (
    <StepWrapper
      title="Who is being assessed?"
      description="Enter assessment details and applicant information."
      icon={ClipboardList}
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">
            Assessment Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Assessment Number" htmlFor="assessmentNumber">
              <input
                id="assessmentNumber"
                type="text"
                value={assessment.assessmentNumber}
                onChange={(e) => updateAssessment("assessmentNumber", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Beneficiary ID Number / BIN" htmlFor="beneficiaryId">
              <input
                id="beneficiaryId"
                type="text"
                value={assessment.beneficiaryId}
                onChange={(e) => updateAssessment("beneficiaryId", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Region" htmlFor="region">
              <input
                id="region"
                type="text"
                value={assessment.region}
                onChange={(e) => updateAssessment("region", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Zone" htmlFor="zone">
              <input
                id="zone"
                type="text"
                value={assessment.zone}
                onChange={(e) => updateAssessment("zone", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Woreda" htmlFor="woreda">
              <input
                id="woreda"
                type="text"
                value={assessment.woreda}
                onChange={(e) => updateAssessment("woreda", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Kebele" htmlFor="kebele">
              <input
                id="kebele"
                type="text"
                value={assessment.kebele}
                onChange={(e) => updateAssessment("kebele", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Date of Assessment" htmlFor="dateOfAssessment">
              <input
                id="dateOfAssessment"
                type="date"
                value={assessment.dateOfAssessment}
                onChange={(e) => updateAssessment("dateOfAssessment", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Assessment Officer Name" htmlFor="assessmentOfficerName">
              <input
                id="assessmentOfficerName"
                type="text"
                value={assessment.assessmentOfficerName}
                onChange={(e) =>
                  updateAssessment("assessmentOfficerName", e.target.value)
                }
                className={inputClass}
              />
            </FormField>
            <FormField label="Supervisor Name" htmlFor="supervisorName" className="sm:col-span-2">
              <input
                id="supervisorName"
                type="text"
                value={assessment.supervisorName}
                onChange={(e) => updateAssessment("supervisorName", e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">
            Applicant Personal Info
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Full Name"
              htmlFor="fullName"
              required
              error={errors.fullName}
              className="sm:col-span-2"
            >
              <input
                id="fullName"
                type="text"
                value={applicant.fullName}
                onChange={(e) => updateApplicant("fullName", e.target.value)}
                aria-invalid={!!errors.fullName}
                className={inputClass}
              />
            </FormField>
            <div className="sm:col-span-2">
              <RadioGroup
                name="sex"
                label="Sex *"
                value={applicant.sex}
                onChange={(v) => updateApplicant("sex", v)}
                error={errors.sex}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
            </div>
            <FormField label="Age" htmlFor="age" required error={errors.age}>
              <input
                id="age"
                type="number"
                min={0}
                max={150}
                value={applicant.age}
                onChange={(e) => updateApplicant("age", e.target.value)}
                aria-invalid={!!errors.age}
                className={inputClass}
              />
            </FormField>
            <div className="sm:col-span-2">
              <RadioGroup
                name="maritalStatus"
                label="Marital Status *"
                value={applicant.maritalStatus}
                onChange={(v) => updateApplicant("maritalStatus", v)}
                error={errors.maritalStatus}
                options={[
                  { value: "single", label: "Single" },
                  { value: "married", label: "Married" },
                  { value: "widowed", label: "Widowed" },
                  { value: "divorced", label: "Divorced" },
                  { value: "separated", label: "Separated" },
                ]}
              />
            </div>
            <FormField label="Telephone" htmlFor="telephone">
              <input
                id="telephone"
                type="tel"
                value={applicant.telephone}
                onChange={(e) => updateApplicant("telephone", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="National ID" htmlFor="nationalId">
              <input
                id="nationalId"
                type="text"
                value={applicant.nationalId}
                onChange={(e) => updateApplicant("nationalId", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Religion" htmlFor="religion">
              <input
                id="religion"
                type="text"
                value={applicant.religion}
                onChange={(e) => updateApplicant("religion", e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Primary Language" htmlFor="primaryLanguage">
              <input
                id="primaryLanguage"
                type="text"
                value={applicant.primaryLanguage}
                onChange={(e) => updateApplicant("primaryLanguage", e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        </section>

        <section>
          <CheckboxGroup
            label="Zakat Eligibility Category (Asnaf) — tick all that apply"
            options={asnafOptions}
            values={asnafValues}
            onChange={(value, checked) =>
              updateAsnaf(value as keyof typeof asnaf, checked)
            }
            error={errors.asnafOther}
          />
          {asnaf.other ? (
            <FormField
              label="Please specify"
              htmlFor="asnafOtherSpecify"
              error={errors.asnafOther}
              className="mt-4"
            >
              <input
                id="asnafOtherSpecify"
                type="text"
                value={asnaf.otherSpecify}
                onChange={(e) => updateAsnaf("otherSpecify", e.target.value)}
                className={inputClass}
              />
            </FormField>
          ) : null}
        </section>
      </div>
    </StepWrapper>
  );
}
