"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CredentialsOnceDialog } from "@/components/branches/credentials-once-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { FileUploadField } from "@/components/registration/file-upload-field";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { idempotencyHeader, newIdempotencyKey } from "@/lib/api/idempotency";
import { leaveNotice } from "@/lib/backoffice/notice";
import { ASNAF, MARITAL_STATUS, PRIMARY_LANGUAGE, SEX } from "@/lib/backoffice/options";
import { REGISTRATION_STEPS } from "@/lib/registration/constants";
import { passwordNotShownNotice, registeredNotice } from "@/lib/registration/notices";
import { ageMismatch, formErrors } from "@/lib/registration/form-errors";
import { isValidEthiopianPhone, normalizePhoneToE164 } from "@/lib/registration/phone";
import { getSelectedBranch, type SelectedBranch } from "@/lib/registration/session";
import {
  accountExists,
  type CreateBeneficiaryResponse,
  keepIdempotencyKey,
  registrationConsent,
} from "@/lib/registration/submit";
import { typeScale } from "@/components/backoffice/type-scale";

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

const FIELD_KEYS = Object.keys(EMPTY) as (keyof Form)[];

/** Input id per field, to bring the first problem into view. */
function fieldId(key: keyof Form) {
  const ids: Partial<Record<keyof Form, string>> = {
    fullName: "reg-name",
    phone: "reg-phone",
    email: "reg-email",
    gender: "reg-sex",
    dateOfBirth: "reg-dob",
    estimatedAge: "reg-age",
    maritalStatus: "reg-marital",
    religion: "reg-religion",
    primaryLanguage: "reg-language",
    primaryLanguageOther: "reg-language-other",
    kebele: "reg-kebele",
    addressLine: "reg-address",
    category: "reg-category",
    registrationCode: "reg-code",
  };
  return ids[key];
}

/** The new household's login, shown once after registration. */
type Credentials = {
  id: string;
  login: string;
  initialPassword: string;
  passwordChangeRequired: boolean;
  notice: string;
};

export function ManualIdentityForm() {
  const router = useRouter();
  const [branch, setBranch] = useState<SelectedBranch | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // The household that already has this phone or email (409 ACCOUNT_EXISTS).
  const [existing, setExisting] = useState<{ field: string; beneficiaryId: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  // One Idempotency-Key per registration attempt, reused when a retry follows
  // a lost answer so the household is never registered twice.
  const attemptKey = useRef<string | null>(null);

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

  function showFieldErrors(fields: Record<string, string>) {
    setFieldErrors(fields);
    const first = FIELD_KEYS.find((key) => fields[key]);
    const id = first ? fieldId(first) : undefined;
    if (id) setTimeout(() => document.getElementById(id)?.focus(), 0);
  }

  // The branch had no free codes when it was picked: only a printed code works.
  const needsPrintedCode = branch?.codesAvailable === 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branch) return;
    setError(null);
    setFieldErrors({});
    setExisting(null);
    setConsentError(null);

    // The phone is the household's sign-in: refuse anything that isn't an
    // Ethiopian mobile number rather than send a made-up one.
    if (!isValidEthiopianPhone(form.phone.trim())) {
      showFieldErrors({ phone: "Enter an Ethiopian mobile number, for example 0911 234 567." });
      return;
    }
    const mismatch = ageMismatch(form.dateOfBirth, form.estimatedAge);
    if (mismatch) {
      showFieldErrors({ estimatedAge: mismatch });
      return;
    }
    if (needsPrintedCode && !form.registrationCode.trim()) {
      showFieldErrors({
        registrationCode: "This branch has no codes left. Enter the printed code from the household's card.",
      });
      return;
    }
    if (photoError) {
      document.getElementById("reg-photo")?.focus();
      return;
    }
    if (!consent) {
      setConsentError("Read the notice to the household and tick the box once they agree.");
      setTimeout(() => document.getElementById("reg-consent")?.focus(), 0);
      return;
    }
    setIsSubmitting(true);

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
      consent: registrationConsent(),
    };

    const body = new FormData();
    body.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (photo) body.append("profilePicture", photo);

    attemptKey.current ??= newIdempotencyKey();
    try {
      const created = await apiClient<CreateBeneficiaryResponse>("/bff/backoffice/staff/beneficiaries", {
        method: "POST",
        body,
        headers: idempotencyHeader(attemptKey.current),
      });
      attemptKey.current = null;
      if (created.initialPassword) {
        setCredentials({
          id: created.id,
          login: created.username?.trim() || data.phone,
          initialPassword: created.initialPassword,
          passwordChangeRequired: created.passwordChangeRequired ?? true,
          notice: registeredNotice(data.fullName, created.bin),
        });
        return;
      }
      // A replay of an attempt whose answer was lost: the password was in
      // that first answer only. Said on the new profile, with the next step.
      leaveNotice(`beneficiary:${created.id}`, passwordNotShownNotice(data.fullName, created.bin));
      router.push(`/dashboard/beneficiary/${encodeURIComponent(created.id)}`);
    } catch (submitError) {
      if (!keepIdempotencyKey(submitError)) attemptKey.current = null;
      const taken = accountExists(submitError);
      if (taken) {
        const field = (FIELD_KEYS as string[]).includes(taken.field) ? taken.field : "phone";
        setExisting({ field, beneficiaryId: taken.beneficiaryId });
        showFieldErrors({ [field]: errorMessage(submitError, "Another household already uses this.") });
        setIsSubmitting(false);
        return;
      }
      const { message, fields } = formErrors(submitError, "Registration didn't go through. Try again.", FIELD_KEYS);
      const onForm = FIELD_KEYS.some((key) => fields[key]);
      // Field problems are listed by the button; anything else (a branch
      // outside the officer's scope, say) goes on top, in the server's words.
      setError(onForm ? null : message);
      showFieldErrors(fields);
      setIsSubmitting(false);
    }
  }

  function closeCredentials() {
    if (!credentials) return;
    // Said on the new profile, where the next step (the assessment) starts.
    leaveNotice(`beneficiary:${credentials.id}`, credentials.notice);
    router.push(`/dashboard/beneficiary/${encodeURIComponent(credentials.id)}`);
  }

  if (!branch) {
    return (
      <RegistrationShell title="Register an individual" description="Checking branch selection…">
        <div className="h-40 animate-pulse rounded-lg bg-black/[0.04]" />
      </RegistrationShell>
    );
  }

  const err = (key: keyof Form) => {
    const message = fieldErrors[key];
    if (!message || existing?.field !== key || !existing.beneficiaryId) return message;
    return (
      <>
        {message}{" "}
        <Link
          href={`/dashboard/beneficiary/${encodeURIComponent(existing.beneficiaryId)}`}
          className="font-medium underline underline-offset-2"
        >
          Open that household
        </Link>
      </>
    );
  };

  return (
    <RegistrationShell
      title="Register an individual"
      description="Basic details only. The field officer completes the rest during the household assessment."
      branchName={branch.branchName}
      steps={REGISTRATION_STEPS}
      currentStep={credentials ? 2 : 1}
      wide
      error={error}
    >
      <form onSubmit={onSubmit} className="space-y-8">
        {needsPrintedCode ? (
          <InlineAlert tone="warning" title="This branch has no registration codes left">
            Enter the printed code from the household&apos;s card. Without one, ask an administrator to generate
            more codes before you register.
          </InlineAlert>
        ) : null}
        <fieldset className="space-y-4">
          <legend className={typeScale.panelTitle}>Registration</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Printed registration code"
              htmlFor="reg-code"
              required={needsPrintedCode}
              hint={
                needsPrintedCode
                  ? "Required: this branch has no free codes left. The code becomes the BIN."
                  : "Optional. Leave empty and the branch's next free code is assigned; it becomes the BIN."
              }
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
          <legend className={typeScale.panelTitle}>Applicant</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="reg-name" required error={err("fullName")} className="sm:col-span-2">
              <Input id="reg-name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
            </FormField>
            <FormField label="Phone" htmlFor="reg-phone" required hint="The household signs in with this number" error={err("phone")}>
              <Input id="reg-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+2519…" required />
            </FormField>
            <FormField label="Email" htmlFor="reg-email" hint="Optional" error={err("email")}>
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
          <legend className={typeScale.panelTitle}>Address</legend>
          <p className="-mt-2 text-xs text-black/60">Region, zone and woreda come from the branch.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kebele" htmlFor="reg-kebele" error={err("kebele")}>
              <Input id="reg-kebele" value={form.kebele} onChange={(e) => set("kebele", e.target.value)} />
            </FormField>
            <FormField label="Address" htmlFor="reg-address" error={err("addressLine")}>
              <Input id="reg-address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className={typeScale.panelTitle}>Photo</legend>
          <FileUploadField
            id="reg-photo"
            label="Profile picture"
            kind="profilePicture"
            file={photo}
            error={photoError}
            disabled={isSubmitting}
            onChange={(file, problem) => {
              setPhoto(file);
              setPhotoError(problem);
            }}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className={typeScale.panelTitle}>Consent</legend>
          <p className="text-sm text-black/70">
            Read this to the household: EZAC keeps these details to assess the household for zakat support and to
            pay it. Only the staff and services that need them can see them. The household can ask the branch to
            see or correct them.
          </p>
          <FormField label="Household consent" htmlFor="reg-consent" required error={consentError}>
            {(control) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 px-4 py-3">
                <input
                  id={control.id}
                  aria-describedby={control["aria-describedby"]}
                  aria-invalid={control["aria-invalid"]}
                  aria-required={control["aria-required"]}
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setConsentError(null);
                  }}
                  className="mt-0.5 size-4 accent-brand"
                />
                <span className="text-sm text-navy">The household agreed to EZAC processing their data.</span>
              </label>
            )}
          </FormField>
        </fieldset>

        {Object.keys(fieldErrors).length > 0 && !error ? (
          <InlineAlert>Check the highlighted fields.</InlineAlert>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3 border-t border-black/[0.06] pt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/register")}>
            Change branch
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering…" : "Register beneficiary"}
          </Button>
        </div>
      </form>
      {credentials ? (
        <CredentialsOnceDialog
          title="Household login"
          recipient="household"
          login={credentials.login}
          initialPassword={credentials.initialPassword}
          passwordChangeRequired={credentials.passwordChangeRequired}
          onClose={closeCredentials}
        />
      ) : null}
    </RegistrationShell>
  );
}
