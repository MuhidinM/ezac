"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { ASNAF, MARITAL_STATUS, PRIMARY_LANGUAGE, SEX } from "@/lib/backoffice/options";
import { normalizePhoneToE164 } from "@/lib/registration/phone";
import {
  getSelectedBranch,
  setRegistrationSession,
  setRegistrationSuccessFlag,
} from "@/lib/registration/session";
import type { CreateBeneficiaryResponse } from "@/lib/registration/types";

type Form = {
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  estimatedAge: string;
  maritalStatus: string;
  religion: string;
  primaryLanguage: string;
  primaryLanguageOther: string;
  kebele: string;
  addressLine: string;
  category: string;
  registrationCode: string;
};

const EMPTY: Form = {
  fullName: "",
  phone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  estimatedAge: "",
  maritalStatus: "",
  religion: "",
  primaryLanguage: "",
  primaryLanguageOther: "",
  kebele: "",
  addressLine: "",
  category: "",
  registrationCode: "",
};

const STEPS = ["Applicant", "Password"];

export function ManualIdentityForm() {
  const router = useRouter();
  const [branch, setBranch] = useState<{ branchId: string; branchName: string } | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const selected = getSelectedBranch();
    if (!selected) {
      router.replace("/dashboard/register");
      return;
    }
    // Branch lives in sessionStorage, so it can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranch(selected);
  }, [router]);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branch) return;
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    const text = (value: string) => value.trim() || undefined;
    const data = {
      fullName: form.fullName.trim(),
      phone: normalizePhoneToE164(form.phone.trim()),
      email: text(form.email),
      gender: text(form.gender),
      dateOfBirth: text(form.dateOfBirth),
      estimatedAge: form.estimatedAge.trim() ? Number(form.estimatedAge) : undefined,
      maritalStatus: text(form.maritalStatus),
      religion: text(form.religion),
      primaryLanguage: text(form.primaryLanguage),
      primaryLanguageOther: form.primaryLanguage === "other" ? text(form.primaryLanguageOther) : undefined,
      kebele: text(form.kebele),
      addressLine: text(form.addressLine),
      beneficiaryType: "individual",
      category: form.category,
      // Staff registration takes the branch's next free code unless a printed
      // code is given.
      registrationCode: form.registrationCode.trim().toUpperCase() || undefined,
      branchId: branch.branchId,
    };

    const body = new FormData();
    body.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));

    try {
      const created = await apiClient<CreateBeneficiaryResponse>("/bff/backoffice/staff/beneficiaries", {
        method: "POST",
        body,
      });
      if (created.passwordSetupToken) {
        setRegistrationSession({
          registrationType: "manual",
          entityId: created.id,
          passwordSetupToken: created.passwordSetupToken,
          phone: data.phone,
        });
        router.push("/dashboard/register/manual/password");
      } else {
        setRegistrationSuccessFlag();
        router.push(`/dashboard/beneficiary/${created.id}`);
      }
    } catch (submitError) {
      setError(errorMessage(submitError, "Registration failed"));
      if (submitError instanceof ApiError) setFieldErrors(fieldErrorMap(submitError.errors));
      setIsSubmitting(false);
    }
  }

  if (!branch) {
    return (
      <RegistrationShell title="Register an individual" description="Checking branch selection…">
        <div className="h-40 animate-pulse rounded-lg bg-black/[0.04]" />
      </RegistrationShell>
    );
  }

  const err = (key: keyof Form) => fieldErrors[key];

  return (
    <RegistrationShell
      title="Register an individual"
      description="Basic details only. The field officer completes the rest during the household assessment."
      branchName={branch.branchName}
      steps={STEPS}
      currentStep={0}
      wide
      error={error}
    >
      <form onSubmit={onSubmit} className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-[#001539]">Registration</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Printed registration code"
              htmlFor="reg-code"
              hint="Optional. Leave empty and the branch's next free code is assigned; it becomes the BIN."
              error={err("registrationCode")}
            >
              <Input
                id="reg-code"
                value={form.registrationCode}
                onChange={(e) => set("registrationCode", e.target.value)}
                placeholder="EZW-XXXX-XXXX"
                className="font-mono uppercase"
              />
            </FormField>
            <FormField label="Asnaf category" htmlFor="reg-category" required error={err("category")}>
              <NativeSelect
                id="reg-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                required
              >
                <option value="">Select</option>
                {ASNAF.filter((option) => option.value !== "other").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-[#001539]">Applicant</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="reg-name" required error={err("fullName")} className="sm:col-span-2">
              <Input id="reg-name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
            </FormField>
            <FormField label="Phone" htmlFor="reg-phone" required hint="Also the login username" error={err("phone")}>
              <Input id="reg-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+2519…" required />
            </FormField>
            <FormField label="Email" htmlFor="reg-email" hint="With an email, a login account is created" error={err("email")}>
              <Input id="reg-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </FormField>
            <FormField label="Sex" htmlFor="reg-sex" error={err("gender")}>
              <NativeSelect id="reg-sex" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                {SEX.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Marital status" htmlFor="reg-marital" error={err("maritalStatus")}>
              <NativeSelect id="reg-marital" value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="">Select</option>
                {MARITAL_STATUS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Date of birth" htmlFor="reg-dob" error={err("dateOfBirth")}>
              <Input id="reg-dob" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </FormField>
            <FormField label="Estimated age" htmlFor="reg-age" hint="When the date of birth is unknown" error={err("estimatedAge")}>
              <Input id="reg-age" type="number" min={0} max={120} value={form.estimatedAge} onChange={(e) => set("estimatedAge", e.target.value)} />
            </FormField>
            <FormField label="Religion" htmlFor="reg-religion" error={err("religion")}>
              <Input id="reg-religion" value={form.religion} onChange={(e) => set("religion", e.target.value)} />
            </FormField>
            <FormField label="Primary language" htmlFor="reg-language" error={err("primaryLanguage")}>
              <NativeSelect id="reg-language" value={form.primaryLanguage} onChange={(e) => set("primaryLanguage", e.target.value)}>
                <option value="">Select</option>
                {PRIMARY_LANGUAGE.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            {form.primaryLanguage === "other" ? (
              <FormField label="Other language" htmlFor="reg-language-other" required error={err("primaryLanguageOther")}>
                <Input id="reg-language-other" value={form.primaryLanguageOther} onChange={(e) => set("primaryLanguageOther", e.target.value)} required />
              </FormField>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-[#001539]">Address</legend>
          <p className="-mt-2 text-xs text-black/50">Region, zone and woreda come from the branch.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kebele" htmlFor="reg-kebele" error={err("kebele")}>
              <Input id="reg-kebele" value={form.kebele} onChange={(e) => set("kebele", e.target.value)} />
            </FormField>
            <FormField label="Address" htmlFor="reg-address" error={err("addressLine")}>
              <Input id="reg-address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            </FormField>
          </div>
        </fieldset>

        {Object.keys(fieldErrors).length > 0 && !error ? (
          <InlineAlert>Check the highlighted fields.</InlineAlert>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3 border-t border-black/[0.06] pt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/register/type")}>
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering…" : "Register beneficiary"}
          </Button>
        </div>
      </form>
    </RegistrationShell>
  );
}
