"use client";

import { Building2 } from "lucide-react";

import { StepWrapper } from "@/components/questionnaire/step-wrapper";
import { CheckboxGroup } from "@/components/questionnaire/ui/checkbox-group";
import { FormField } from "@/components/questionnaire/ui/form-field";
import { RadioGroup } from "@/components/questionnaire/ui/radio-group";
import { TextArea } from "@/components/questionnaire/ui/text-area";

import { DOCUMENT_LABELS, DOCUMENTS_TO_ATTACH } from "../initial-state";
import type { NgoStepProps } from "../types";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[#1a3d2b]/20 bg-white px-4 py-3 text-base text-[#1a3d2b] outline-none transition focus:border-[#1a3d2b] focus:ring-2 focus:ring-[#1a3d2b]/20";

export function Step1Identity({ state, setState, errors }: NgoStepProps) {
  const s = state.step1;

  function update(field: keyof typeof s, value: string | boolean | Record<string, boolean>) {
    setState((prev) => ({
      ...prev,
      step1: { ...prev.step1, [field]: value },
    }));
  }

  return (
    <StepWrapper
      title="Tell us about your organization"
      description="Basic information and legal registration details"
      icon={Building2}
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Organization Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Organization Full Name" htmlFor="orgName" required error={errors.orgName} className="sm:col-span-2">
              <input id="orgName" type="text" value={s.orgName} onChange={(e) => update("orgName", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Common Name / Short Name" htmlFor="shortName">
              <input id="shortName" type="text" value={s.shortName} onChange={(e) => update("shortName", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Tax Identification Number / TIN" htmlFor="tin">
              <input id="tin" type="text" value={s.tin} onChange={(e) => update("tin", e.target.value)} className={inputClass} />
            </FormField>
            <div className="sm:col-span-2">
              <RadioGroup name="orgType" label="Organization Type *" value={s.orgType} onChange={(v) => update("orgType", v)} error={errors.orgType}
                options={[
                  { value: "local_ngo", label: "Local NGO" },
                  { value: "cbo", label: "Community-Based Organization (CBO)" },
                  { value: "islamic_society", label: "Islamic Society / Mosque Committee" },
                  { value: "foundation", label: "Foundation" },
                  { value: "other", label: "Other" },
                ]}
              />
              {s.orgType === "other" ? (
                <FormField label="Please specify" htmlFor="orgTypeOther" error={errors.orgTypeOther} className="mt-3">
                  <input id="orgTypeOther" type="text" value={s.orgTypeOther} onChange={(e) => update("orgTypeOther", e.target.value)} className={inputClass} />
                </FormField>
              ) : null}
            </div>
            <FormField label="Year Established" htmlFor="yearEstablished" required error={errors.yearEstablished}>
              <input id="yearEstablished" type="number" min={1900} max={2100} value={s.yearEstablished} onChange={(e) => update("yearEstablished", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Registration Number" htmlFor="registrationNumber" required error={errors.registrationNumber}>
              <input id="registrationNumber" type="text" value={s.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} className={inputClass} />
            </FormField>
            <div className="sm:col-span-2">
              <RadioGroup name="registeredWith" label="Registered With" value={s.registeredWith} onChange={(v) => update("registeredWith", v)}
                options={[
                  { value: "ministry_of_justice", label: "Ministry of Justice" },
                  { value: "charities_societies", label: "Charities & Societies Agency" },
                  { value: "regional_authority", label: "Regional Authority" },
                  { value: "other", label: "Other" },
                ]}
              />
              {s.registeredWith === "other" ? (
                <FormField label="Please specify" htmlFor="registeredWithOther" className="mt-3">
                  <input id="registeredWithOther" type="text" value={s.registeredWithOther} onChange={(e) => update("registeredWithOther", e.target.value)} className={inputClass} />
                </FormField>
              ) : null}
            </div>
            <FormField label="License Expiry Date" htmlFor="licenseExpiryDate" required error={errors.licenseExpiryDate}>
              <input id="licenseExpiryDate" type="date" value={s.licenseExpiryDate} onChange={(e) => update("licenseExpiryDate", e.target.value)} className={inputClass} />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Primary Contact Person</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name" htmlFor="contactName" required error={errors.contactName}>
              <input id="contactName" type="text" value={s.contactName} onChange={(e) => update("contactName", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Job Title" htmlFor="contactTitle" required error={errors.contactTitle}>
              <input id="contactTitle" type="text" value={s.contactTitle} onChange={(e) => update("contactTitle", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Phone Number" htmlFor="contactPhone" required error={errors.contactPhone}>
              <input id="contactPhone" type="tel" value={s.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Email Address" htmlFor="contactEmail">
              <input id="contactEmail" type="email" value={s.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="National ID Number" htmlFor="contactNationalId" className="sm:col-span-2">
              <input id="contactNationalId" type="text" value={s.contactNationalId} onChange={(e) => update("contactNationalId", e.target.value)} className={inputClass} />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-[#1a3d2b]">Organization Head Office</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Region" htmlFor="region" required error={errors.region}>
              <input id="region" type="text" value={s.region} onChange={(e) => update("region", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Zone" htmlFor="zone">
              <input id="zone" type="text" value={s.zone} onChange={(e) => update("zone", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Woreda" htmlFor="woreda" required error={errors.woreda}>
              <input id="woreda" type="text" value={s.woreda} onChange={(e) => update("woreda", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Kebele" htmlFor="kebele">
              <input id="kebele" type="text" value={s.kebele} onChange={(e) => update("kebele", e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Full Address" htmlFor="fullAddress" className="sm:col-span-2">
              <TextArea id="fullAddress" value={s.fullAddress} onChange={(v) => update("fullAddress", v)} />
            </FormField>
          </div>
        </section>

        <section>
          <CheckboxGroup
            label="Please confirm which documents you will attach:"
            options={DOCUMENTS_TO_ATTACH.map((k) => ({ value: k, label: DOCUMENT_LABELS[k] }))}
            values={s.documentsToAttach}
            onChange={(value, checked) =>
              setState((prev) => ({
                ...prev,
                step1: {
                  ...prev.step1,
                  documentsToAttach: { ...prev.step1.documentsToAttach, [value]: checked },
                },
              }))
            }
          />
        </section>
      </div>
    </StepWrapper>
  );
}
