"use client";

import { type FormEvent, useState } from "react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { apiClient } from "@/lib/api/client";
import type { AssessmentStatus, BankAccount, BeneficiaryWhitelist, PoolStatus } from "@/lib/api/backoffice-types";
import type { BeneficiaryDetail } from "@/lib/api/types";
import { MARITAL_STATUS, PRIMARY_LANGUAGE, SEX, bankOptionsFor, isValidAccountNumber } from "@/lib/backoffice/options";
import { ageMismatch, formErrors } from "@/lib/registration/form-errors";
import { isValidEthiopianPhone, normalizePhoneToE164 } from "@/lib/registration/phone";

/**
 * Section B fields plus the bank account; the assessment refuses to submit
 * until they're complete (422 on `beneficiary.*`).
 */
export type BasicDetails = {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  estimatedAge: string;
  gender: string;
  maritalStatus: string;
  religion: string;
  primaryLanguage: string;
  primaryLanguageOther: string;
  zone: string;
  woreda: string;
  kebele: string;
  addressLine: string;
  bankCode: string;
  bankNameOther: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
};

type BankKey = "bankCode" | "bankNameOther" | "bankAccountNumber" | "bankAccountHolderName";

const FIELD_IDS: Record<keyof BasicDetails, string> = {
  fullName: "bd-name",
  phone: "bd-phone",
  dateOfBirth: "bd-dob",
  estimatedAge: "bd-age",
  gender: "bd-sex",
  maritalStatus: "bd-marital",
  religion: "bd-religion",
  primaryLanguage: "bd-language",
  primaryLanguageOther: "bd-language-other",
  zone: "bd-zone",
  woreda: "bd-woreda",
  kebele: "bd-kebele",
  addressLine: "bd-address",
  bankCode: "bd-bank",
  bankNameOther: "bd-bank-other",
  bankAccountNumber: "bd-account",
  bankAccountHolderName: "bd-holder",
};

const FIELD_KEYS = Object.keys(FIELD_IDS) as (keyof BasicDetails)[];

/**
 * The bank account once the assessment is submitted or the household is
 * awaiting the pool or pooled: "locked" for everyone but ADMIN, "warn" for
 * ADMIN, "unchecked" when the assessments or whitelist could not be read
 * (fail closed).
 */
export type BankLock = "locked" | "warn" | "unchecked" | null;

/** Once the branch has an assessment, or has approved one, the payout account is settled. */
const BANK_LOCKING_ASSESSMENTS: AssessmentStatus[] = ["SUBMITTED", "APPROVED"];
const BANK_LOCKING_POOL: PoolStatus[] = ["AWAITING_POOL", "POOLED"];

/**
 * The BankLock for a household. `assessments` is its assessment history and
 * `whitelist` its whitelist, whose fast-track entry can pool it without an
 * assessment. Either one undefined (still loading, or unreadable) locks the
 * account for everyone but ADMIN.
 */
export function bankLockFor({
  isAdmin,
  assessments,
  poolStatus,
  whitelist,
}: {
  isAdmin: boolean;
  assessments: { status: AssessmentStatus }[] | undefined;
  poolStatus?: PoolStatus | null;
  whitelist: Pick<BeneficiaryWhitelist, "current"> | undefined;
}): BankLock {
  const fastTrackPool = whitelist?.current?.poolStatus;
  const settled =
    (assessments ?? []).some((item) => BANK_LOCKING_ASSESSMENTS.includes(item.status)) ||
    (!!poolStatus && BANK_LOCKING_POOL.includes(poolStatus)) ||
    (!!fastTrackPool && BANK_LOCKING_POOL.includes(fastTrackPool));
  if (isAdmin) return settled ? "warn" : null;
  if (assessments === undefined || whitelist === undefined) return "unchecked";
  return settled ? "locked" : null;
}

/** A beneficiary detail or an assessment applicant: flat fields plus a nested bank account. */
type Source = Partial<Record<Exclude<keyof BasicDetails, BankKey>, string | number | null | undefined>> & {
  bankAccount?: BankAccount | null;
};

function fromSource(source: Source): BasicDetails {
  const pick = (key: Exclude<keyof BasicDetails, BankKey>) =>
    source[key] === null || source[key] === undefined ? "" : String(source[key]);
  return {
    fullName: pick("fullName"),
    phone: pick("phone"),
    dateOfBirth: pick("dateOfBirth"),
    estimatedAge: pick("estimatedAge"),
    gender: pick("gender"),
    maritalStatus: pick("maritalStatus"),
    religion: pick("religion"),
    primaryLanguage: pick("primaryLanguage"),
    primaryLanguageOther: pick("primaryLanguageOther"),
    zone: pick("zone"),
    woreda: pick("woreda"),
    kebele: pick("kebele"),
    addressLine: pick("addressLine"),
    bankCode: source.bankAccount?.bankCode ?? "",
    // For "other" banks the stored bankName is the free-text name.
    bankNameOther: source.bankAccount?.bankCode === "other" ? (source.bankAccount?.bankName ?? "") : "",
    bankAccountNumber: source.bankAccount?.accountNumber ?? "",
    bankAccountHolderName: source.bankAccount?.accountHolderName ?? "",
  };
}

function toBody(details: BasicDetails) {
  const text = (value: string) => (value.trim() ? value.trim() : null);
  return {
    fullName: text(details.fullName),
    phone: text(details.phone),
    dateOfBirth: text(details.dateOfBirth),
    estimatedAge: details.estimatedAge.trim() ? Number(details.estimatedAge) : null,
    gender: text(details.gender),
    maritalStatus: text(details.maritalStatus),
    religion: text(details.religion),
    primaryLanguage: text(details.primaryLanguage),
    primaryLanguageOther:
      details.primaryLanguage === "other" ? text(details.primaryLanguageOther) : null,
    zone: text(details.zone),
    woreda: text(details.woreda),
    kebele: text(details.kebele),
    addressLine: text(details.addressLine),
    bankCode: text(details.bankCode),
    bankNameOther: details.bankCode === "other" ? text(details.bankNameOther) : null,
    bankAccountNumber: text(details.bankAccountNumber),
    bankAccountHolderName: text(details.bankAccountHolderName),
  };
}

type Props = {
  beneficiaryId: string;
  initial: Source;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: BeneficiaryDetail) => void;
  /** Validation errors from an assessment (`beneficiary.*`), shown inline. */
  externalErrors?: Record<string, string>;
  /** Whether the bank account may still change; see BankLock. */
  bankLock?: BankLock;
};

export function BasicDetailsDialog({
  beneficiaryId,
  initial,
  open,
  onOpenChange,
  onSaved,
  externalErrors,
  bankLock = null,
}: Props) {
  const bankReadOnly = bankLock === "locked" || bankLock === "unchecked";
  const [details, setDetails] = useState<BasicDetails>(() => fromSource(initial));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  // The phone is the household's sign-in: a change needs a second Save after the warning.
  const [phoneWarned, setPhoneWarned] = useState(false);
  const storedPhone = initial.phone == null ? "" : String(initial.phone).trim();
  const showPhoneWarning = phoneWarned && !!storedPhone && details.phone.trim() !== storedPhone;

  // Start from the stored record every time the dialog opens. Parents open it
  // by setting `open`, which never calls onOpenChange, and the component stays
  // mounted while closed: without this, a cancelled edit (a bank account
  // number, say) reappeared on the next open and was saved with it.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDetails(fromSource(initial));
      setError(null);
      setFieldErrors({});
      setPhoneWarned(false);
    }
  }

  function set<K extends keyof BasicDetails>(key: K, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  function fieldError(key: keyof BasicDetails) {
    return fieldErrors[key] ?? externalErrors?.[`beneficiary.${key}`];
  }

  function showFieldErrors(fields: Record<string, string>) {
    setFieldErrors(fields);
    const first = FIELD_KEYS.find((key) => fields[key]);
    // Long dialog: bring the first problem into view.
    if (first) setTimeout(() => document.getElementById(FIELD_IDS[first])?.focus(), 0);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    // PATCH only what changed: fields the source didn't carry must not be
    // cleared just because the form started them empty.
    const next = toBody(details);
    const before = toBody(fromSource(initial));
    const changed: Record<string, unknown> = Object.fromEntries(
      Object.entries(next).filter(
        ([key, value]) => value !== before[key as keyof typeof before],
      ),
    );
    if (bankReadOnly) {
      for (const key of ["bankCode", "bankNameOther", "bankAccountNumber", "bankAccountHolderName"]) {
        delete changed[key];
      }
    }
    if (Object.keys(changed).length === 0) {
      onOpenChange(false);
      return;
    }
    // Checked here, all at once, so each problem shows on its field.
    const problems: Record<string, string> = {};
    // The phone is the household's sign-in: refuse anything that isn't an
    // Ethiopian mobile number rather than send it.
    if (typeof changed.phone === "string" && !isValidEthiopianPhone(changed.phone)) {
      problems.phone = "Enter an Ethiopian mobile number, for example 0911 234 567.";
    }
    // Same rule as the backend: 6–30 digits once spaces and dashes are gone.
    if (typeof changed.bankAccountNumber === "string" && !isValidAccountNumber(changed.bankAccountNumber)) {
      problems.bankAccountNumber = "Enter 6 to 30 digits. Spaces and dashes are fine.";
    }
    if ("dateOfBirth" in changed || "estimatedAge" in changed) {
      const mismatch = ageMismatch(details.dateOfBirth, details.estimatedAge);
      if (mismatch) problems.estimatedAge = mismatch;
    }
    if (Object.keys(problems).length > 0) {
      setError("Check the highlighted fields.");
      showFieldErrors(problems);
      return;
    }
    // A local number (09…) is sent as +251…, the form the backend accepts.
    if (typeof changed.phone === "string") changed.phone = normalizePhoneToE164(changed.phone);
    // Changing an existing phone changes how the household signs in: warn first.
    const phoneChanged = "phone" in changed && !!before.phone && changed.phone !== before.phone;
    if (phoneChanged && !phoneWarned) {
      setPhoneWarned(true);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await apiClient<BeneficiaryDetail>(
        `/bff/beneficiaries/${encodeURIComponent(beneficiaryId)}`,
        { method: "PATCH", body: JSON.stringify(changed) },
      );
      onSaved(updated);
      onOpenChange(false);
    } catch (saveError) {
      const { message, fields } = formErrors(saveError, "Couldn't save the details. Try again.", FIELD_KEYS);
      setError(message);
      showFieldErrors(fields);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-navy">Edit basic details</DialogTitle>
            <DialogDescription>
              Applicant information (section B). Region comes from the
              registration branch and can&apos;t be changed here.
            </DialogDescription>
          </DialogHeader>

          {error ? <InlineAlert>{error}</InlineAlert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="bd-name" error={fieldError("fullName")} className="sm:col-span-2">
              <Input id="bd-name" value={details.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </FormField>
            <FormField
              label="Phone"
              htmlFor="bd-phone"
              hint="The household signs in with this number"
              error={fieldError("phone")}
            >
              <Input id="bd-phone" type="tel" value={details.phone} onChange={(e) => set("phone", e.target.value)} />
            </FormField>
            <FormField label="Sex" htmlFor="bd-sex" error={fieldError("gender")}>
              <NativeSelect id="bd-sex" value={details.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                {SEX.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Marital status" htmlFor="bd-marital" error={fieldError("maritalStatus")}>
              <NativeSelect id="bd-marital" value={details.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="">Select</option>
                {MARITAL_STATUS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Date of birth" htmlFor="bd-dob" error={fieldError("dateOfBirth")}>
              <Input id="bd-dob" type="date" value={details.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </FormField>
            <FormField
              label="Estimated age"
              htmlFor="bd-age"
              hint="Only when the date of birth is unknown"
              error={fieldError("estimatedAge")}
            >
              <Input
                id="bd-age"
                type="number"
                min={0}
                max={120}
                inputMode="numeric"
                value={details.estimatedAge}
                onChange={(e) => set("estimatedAge", e.target.value)}
              />
            </FormField>
            <FormField label="Religion" htmlFor="bd-religion" error={fieldError("religion")}>
              <Input id="bd-religion" value={details.religion} onChange={(e) => set("religion", e.target.value)} />
            </FormField>
            <FormField label="Primary language" htmlFor="bd-language" error={fieldError("primaryLanguage")}>
              <NativeSelect id="bd-language" value={details.primaryLanguage} onChange={(e) => set("primaryLanguage", e.target.value)}>
                <option value="">Select</option>
                {PRIMARY_LANGUAGE.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            {details.primaryLanguage === "other" ? (
              <FormField
                label="Other language"
                htmlFor="bd-language-other"
                required
                error={fieldError("primaryLanguageOther")}
                className="sm:col-span-2"
              >
                <Input
                  id="bd-language-other"
                  value={details.primaryLanguageOther}
                  onChange={(e) => set("primaryLanguageOther", e.target.value)}
                />
              </FormField>
            ) : null}
            <FormField label="Zone" htmlFor="bd-zone" error={fieldError("zone")}>
              <Input id="bd-zone" value={details.zone} onChange={(e) => set("zone", e.target.value)} />
            </FormField>
            <FormField label="Woreda" htmlFor="bd-woreda" error={fieldError("woreda")}>
              <Input id="bd-woreda" value={details.woreda} onChange={(e) => set("woreda", e.target.value)} />
            </FormField>
            <FormField label="Kebele" htmlFor="bd-kebele" error={fieldError("kebele")}>
              <Input id="bd-kebele" value={details.kebele} onChange={(e) => set("kebele", e.target.value)} />
            </FormField>
            <FormField label="Address" htmlFor="bd-address" error={fieldError("addressLine")}>
              <Input id="bd-address" value={details.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
            </FormField>
          </div>

          <fieldset className="space-y-4 rounded-lg bg-black/[0.02] p-4">
            <legend className="sr-only">Bank account</legend>
            <div>
              <p className="text-sm font-semibold text-navy">Bank account</p>
              <p className="text-xs text-black/60">
                Payments go to this account. It is needed to submit the assessment.
              </p>
            </div>
            {bankLock === "locked" ? (
              <InlineAlert tone="info">
                This household has an assessment that is submitted or approved, or it is in the pool, so the bank
                account is locked. Ask an administrator if it needs to change.
              </InlineAlert>
            ) : bankLock === "unchecked" ? (
              <InlineAlert tone="info">
                We couldn&apos;t check this household&apos;s assessments and whitelist, so the bank account
                can&apos;t be changed right now. Reload the page and try again.
              </InlineAlert>
            ) : bankLock === "warn" ? (
              <InlineAlert tone="warning" title="This household's assessment is submitted or approved, or it is in the pool">
                Payments will go to the new account straight away, and the old one is not kept. Check the new
                details against the household&apos;s documents before you save.
              </InlineAlert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Bank" htmlFor="bd-bank" error={fieldError("bankCode")}>
                <NativeSelect
                  id="bd-bank"
                  value={details.bankCode}
                  onChange={(e) => set("bankCode", e.target.value)}
                  disabled={bankReadOnly}
                >
                  <option value="">Select</option>
                  {bankOptionsFor(details.bankCode).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </NativeSelect>
              </FormField>
              {details.bankCode === "other" ? (
                <FormField label="Bank name" htmlFor="bd-bank-other" required error={fieldError("bankNameOther")}>
                  <Input
                    id="bd-bank-other"
                    value={details.bankNameOther}
                    onChange={(e) => set("bankNameOther", e.target.value)}
                    disabled={bankReadOnly}
                  />
                </FormField>
              ) : null}
              <FormField
                label="Account number"
                htmlFor="bd-account"
                hint="6–30 digits; spaces and dashes are removed"
                error={fieldError("bankAccountNumber")}
              >
                <Input
                  id="bd-account"
                  inputMode="numeric"
                  value={details.bankAccountNumber}
                  onChange={(e) => set("bankAccountNumber", e.target.value)}
                  className="font-mono"
                  disabled={bankReadOnly}
                />
              </FormField>
              <FormField label="Account holder name" htmlFor="bd-holder" error={fieldError("bankAccountHolderName")}>
                <Input
                  id="bd-holder"
                  value={details.bankAccountHolderName}
                  onChange={(e) => set("bankAccountHolderName", e.target.value)}
                  disabled={bankReadOnly}
                />
              </FormField>
            </div>
          </fieldset>

          {showPhoneWarning ? (
            <InlineAlert tone="warning" title="The phone number is also the household's sign-in">
              Only change it if the household has a new number, and tell them before you save. Select Save with
              the new phone to confirm.
            </InlineAlert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : showPhoneWarning ? "Save with the new phone" : "Save details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
