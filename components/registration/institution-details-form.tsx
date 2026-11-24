"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { typeScale } from "@/components/backoffice/type-scale";
import { FormField } from "@/components/dashboard/form-field";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { ApiError } from "@/lib/api/errors";
import { registerApiJson } from "@/lib/registration/api";
import type { CreateCompanyPayload, CreateCompanyResponse } from "@/lib/registration/company";
import { INSTITUTION_SUBTYPES } from "@/lib/registration/constants";
import { formErrors } from "@/lib/registration/form-errors";
import { isValidEthiopianPhone, normalizePhoneToE164 } from "@/lib/registration/phone";
import { getRegistrationSession, updateRegistrationSession } from "@/lib/registration/session";

const INSTITUTION_STEPS = ["Details", "Documents"];

type Form = Record<
  | "institutionSubtype"
  | "legalName"
  | "tradingName"
  | "tradeRegistrationNumber"
  | "taxIdentificationNumber"
  | "vatRegistrationNumber"
  | "phone"
  | "email"
  | "region"
  | "city"
  | "addressLine"
  | "notes",
  string
>;

const EMPTY: Form = {
  institutionSubtype: "",
  legalName: "",
  tradingName: "",
  tradeRegistrationNumber: "",
  taxIdentificationNumber: "",
  vatRegistrationNumber: "",
  phone: "",
  email: "",
  region: "",
  city: "",
  addressLine: "",
  notes: "",
};

const REQUIRED: readonly (keyof Form)[] = [
  "institutionSubtype",
  "legalName",
  "tradingName",
  "tradeRegistrationNumber",
  "taxIdentificationNumber",
  "phone",
  "email",
  "region",
  "city",
  "addressLine",
];
const FIELD_KEYS = [...Object.keys(EMPTY), "authorityToActDocumentRequired"];

/** Problems the officer can fix before sending, by field. */
export function institutionProblems(form: Form): Partial<Record<keyof Form, string>> {
  const problems: Partial<Record<keyof Form, string>> = {};
  for (const key of REQUIRED) if (!form[key].trim()) problems[key] = "Required.";
  if (form.phone.trim() && !isValidEthiopianPhone(form.phone)) {
    problems.phone = "Enter an Ethiopian number, for example 0911 234 567.";
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.email = "Enter an email address.";
  return problems;
}

/**
 * Step 1 of institution registration: the organisation's details, sent to
 * POST /companies. The answer's upload token and KYC document list carry
 * on to the documents step.
 */
export function InstitutionDetailsForm() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [authorityToAct, setAuthorityToAct] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const session = getRegistrationSession();
    if (!session?.branchId || session.registrationType !== "institution") {
      router.replace("/dashboard/register");
      return;
    }
    // A company already created in this session goes straight on to its documents.
    if (session.entityId && session.companyDocumentUploadToken) {
      router.replace("/dashboard/register/institution/documents");
      return;
    }
    // Registration state lives in sessionStorage, readable only after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranchName(session.branchName);
  }, [router]);

  const set = (key: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const problems = institutionProblems(form);
    setFieldErrors(problems as Record<string, string>);
    if (Object.keys(problems).length > 0) {
      setError("Check the highlighted fields.");
      return;
    }

    const payload: CreateCompanyPayload = {
      legalName: form.legalName.trim(),
      tradingName: form.tradingName.trim(),
      tradeRegistrationNumber: form.tradeRegistrationNumber.trim(),
      taxIdentificationNumber: form.taxIdentificationNumber.trim(),
      vatRegistrationNumber: form.vatRegistrationNumber.trim() || undefined,
      phone: normalizePhoneToE164(form.phone),
      email: form.email.trim(),
      region: form.region,
      city: form.city.trim(),
      addressLine: form.addressLine.trim(),
      institutionSubtype: form.institutionSubtype as CreateCompanyPayload["institutionSubtype"],
      authorityToActDocumentRequired: authorityToAct,
      notes: form.notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const created = await registerApiJson<CreateCompanyResponse>("/bff/register/companies", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!created?.id || !created.companyDocumentUploadToken) {
        throw new ApiError("The institution was saved, but the answer had no upload link. Find it under Institutions.", 502);
      }
      updateRegistrationSession({
        entityId: created.id,
        companyDocumentUploadToken: created.companyDocumentUploadToken,
        kycDocuments: created.institutionRecommendedKycDocuments ?? [],
        kycComplete: created.institutionRequiredKycComplete ?? false,
      });
      router.push("/dashboard/register/institution/documents");
    } catch (submitError) {
      const { message, fields } = formErrors(submitError, "Registration didn't go through. Try again.", FIELD_KEYS);
      setFieldErrors(fields);
      setError(message);
      setIsSubmitting(false);
    }
  }

  if (!branchName) {
    return (
      <RegistrationShell title="Register an institution" description="Checking branch selection…">
        <div className="h-40 animate-pulse rounded-lg bg-black/[0.04]" />
      </RegistrationShell>
    );
  }

  const text = (key: keyof Form, label: string, props: { hint?: string; type?: string; wide?: boolean } = {}) => (
    <FormField
      label={label}
      htmlFor={`inst-${key}`}
      required={REQUIRED.includes(key)}
      hint={props.hint}
      error={fieldErrors[key] || undefined}
      className={props.wide ? "sm:col-span-2" : undefined}
    >
      <Input
        id={`inst-${key}`}
        type={props.type ?? "text"}
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
        aria-invalid={fieldErrors[key] ? true : undefined}
      />
    </FormField>
  );

  return (
    <RegistrationShell
      title="Register an institution"
      description="The organisation's registration details. Its documents are uploaded next."
      branchName={branchName}
      steps={INSTITUTION_STEPS}
      currentStep={0}
      wide
      error={error}
    >
      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        <fieldset className="space-y-4">
          <legend className={typeScale.panelTitle}>Organisation</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Type"
              htmlFor="inst-institutionSubtype"
              required
              error={fieldErrors.institutionSubtype || undefined}
            >
              <NativeSelect
                id="inst-institutionSubtype"
                value={form.institutionSubtype}
                onChange={(event) => set("institutionSubtype", event.target.value)}
                aria-invalid={fieldErrors.institutionSubtype ? true : undefined}
              >
                <option value="">Choose…</option>
                {INSTITUTION_SUBTYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <div className="hidden sm:block" />
            {text("legalName", "Legal name")}
            {text("tradingName", "Trading name", { hint: "The name people know it by" })}
            {text("tradeRegistrationNumber", "Trade registration number")}
            {text("taxIdentificationNumber", "Tax identification number (TIN)")}
            {text("vatRegistrationNumber", "VAT registration number", { hint: "Optional" })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className={typeScale.panelTitle}>Contact and address</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {text("phone", "Phone", { type: "tel" })}
            {text("email", "Email", { type: "email" })}
            <FormField label="Region" htmlFor="inst-region" required error={fieldErrors.region || undefined}>
              <NativeSelect
                id="inst-region"
                value={form.region}
                onChange={(event) => set("region", event.target.value)}
                aria-invalid={fieldErrors.region ? true : undefined}
              >
                <option value="">Choose…</option>
                {ETHIOPIAN_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            {text("city", "City or town")}
            {text("addressLine", "Address", { wide: true, hint: "Sub-city, woreda, street or building" })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className={typeScale.panelTitle}>Other</legend>
          <label htmlFor="inst-authority" className="flex items-start gap-3 text-sm text-navy">
            <input
              id="inst-authority"
              type="checkbox"
              checked={authorityToAct}
              onChange={(event) => setAuthorityToAct(event.target.checked)}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>
              The person registering acts for the organisation
              <span className="block text-xs text-black/60">Adds a letter of authority to the documents asked for.</span>
            </span>
          </label>
          <FormField label="Notes" htmlFor="inst-notes" hint="Optional" error={fieldErrors.notes || undefined}>
            <Textarea id="inst-notes" value={form.notes} onChange={(event) => set("notes", event.target.value)} />
          </FormField>
        </fieldset>

        <div className="flex flex-wrap justify-between gap-2 border-t border-black/[0.06] pt-5">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/register/type">Back</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save and add documents"}
          </Button>
        </div>
      </form>
    </RegistrationShell>
  );
}
