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
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import type { BeneficiaryDetail } from "@/lib/api/types";
import { MARITAL_STATUS, PRIMARY_LANGUAGE, SEX } from "@/lib/backoffice/options";

/** Section B fields; the assessment refuses to submit until they're complete. */
export type BasicDetails = {
  fullName: string;
  phone: string;
  nationalId: string;
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
};

type Source = Partial<Record<keyof BasicDetails, string | number | null | undefined>>;

function fromSource(source: Source): BasicDetails {
  const pick = (key: keyof BasicDetails) =>
    source[key] === null || source[key] === undefined ? "" : String(source[key]);
  return {
    fullName: pick("fullName"),
    phone: pick("phone"),
    nationalId: pick("nationalId"),
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
  };
}

function toBody(details: BasicDetails) {
  const text = (value: string) => (value.trim() ? value.trim() : null);
  return {
    fullName: text(details.fullName),
    phone: text(details.phone),
    nationalId: text(details.nationalId),
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
};

export function BasicDetailsDialog({
  beneficiaryId,
  initial,
  open,
  onOpenChange,
  onSaved,
  externalErrors,
}: Props) {
  const [details, setDetails] = useState<BasicDetails>(() => fromSource(initial));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function set<K extends keyof BasicDetails>(key: K, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  function fieldError(key: keyof BasicDetails) {
    return fieldErrors[key] ?? externalErrors?.[`beneficiary.${key}`];
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setFieldErrors({});
    // PATCH only what changed: fields the source didn't carry must not be
    // cleared just because the form started them empty.
    const next = toBody(details);
    const before = toBody(fromSource(initial));
    const changed = Object.fromEntries(
      Object.entries(next).filter(
        ([key, value]) => value !== before[key as keyof typeof before],
      ),
    );
    if (Object.keys(changed).length === 0) {
      setIsSaving(false);
      onOpenChange(false);
      return;
    }

    try {
      const updated = await apiClient<BeneficiaryDetail>(
        `/api/beneficiaries/${encodeURIComponent(beneficiaryId)}`,
        { method: "PATCH", body: JSON.stringify(changed) },
      );
      onSaved(updated);
      onOpenChange(false);
    } catch (saveError) {
      setError(errorMessage(saveError, "Failed to save basic details"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDetails(fromSource(initial));
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">Edit basic details</DialogTitle>
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
            <FormField label="Phone" htmlFor="bd-phone" error={fieldError("phone")}>
              <Input id="bd-phone" type="tel" value={details.phone} onChange={(e) => set("phone", e.target.value)} />
            </FormField>
            <FormField label="National ID" htmlFor="bd-nid" error={fieldError("nationalId")}>
              <Input id="bd-nid" value={details.nationalId} onChange={(e) => set("nationalId", e.target.value)} />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
