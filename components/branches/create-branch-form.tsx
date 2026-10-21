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
import type { BranchCreateResponse, CreateBranchBody } from "@/lib/api/types";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { normalizePhoneToE164 } from "@/lib/registration/phone";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (branch: BranchCreateResponse) => void;
};

const EMPTY = {
  name: "",
  region: "",
  zone: "",
  woreda: "",
  branchPhone: "",
  branchEmail: "",
  branchFullName: "",
};

export function CreateBranchDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const body: CreateBranchBody = {
      name: form.name.trim(),
      region: form.region.trim(),
      zone: form.zone.trim(),
      woreda: form.woreda.trim(),
      branchPhone: normalizePhoneToE164(form.branchPhone.trim()),
      branchFullName: form.branchFullName.trim(),
    };
    if (form.branchEmail.trim()) body.branchEmail = form.branchEmail.trim();

    try {
      const created = await apiClient<BranchCreateResponse>("/bff/admin/branches", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setForm(EMPTY);
      onCreated(created);
    } catch (submitError) {
      setError(errorMessage(submitError, "Failed to create branch"));
      if (submitError instanceof ApiError) setFieldErrors(fieldErrorMap(submitError.errors));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">New branch</DialogTitle>
            <DialogDescription>
              Creates the branch and a branch-officer login. The officer signs in with the branch phone.
            </DialogDescription>
          </DialogHeader>

          {error ? <InlineAlert>{error}</InlineAlert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Branch name" htmlFor="b-name" required error={fieldErrors.name} className="sm:col-span-2">
              <Input id="b-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </FormField>
            <FormField label="Region" htmlFor="b-region" required error={fieldErrors.region}>
              <NativeSelect id="b-region" value={form.region} onChange={(e) => set("region", e.target.value)} required>
                <option value="">Select</option>
                {ETHIOPIAN_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Zone" htmlFor="b-zone" required error={fieldErrors.zone}>
              <Input id="b-zone" value={form.zone} onChange={(e) => set("zone", e.target.value)} required />
            </FormField>
            <FormField label="Woreda" htmlFor="b-woreda" required error={fieldErrors.woreda}>
              <Input id="b-woreda" value={form.woreda} onChange={(e) => set("woreda", e.target.value)} required />
            </FormField>
          </div>

          <div className="space-y-3 rounded-lg bg-black/[0.02] p-4">
            <p className="text-sm font-semibold text-[#001539]">Branch officer</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" htmlFor="b-officer" required error={fieldErrors.branchFullName} className="sm:col-span-2">
                <Input id="b-officer" value={form.branchFullName} onChange={(e) => set("branchFullName", e.target.value)} required />
              </FormField>
              <FormField label="Phone (login)" htmlFor="b-phone" required error={fieldErrors.branchPhone}>
                <Input id="b-phone" type="tel" value={form.branchPhone} onChange={(e) => set("branchPhone", e.target.value)} placeholder="+2519…" required />
              </FormField>
              <FormField label="Email" htmlFor="b-email" error={fieldErrors.branchEmail}>
                <Input id="b-email" type="email" value={form.branchEmail} onChange={(e) => set("branchEmail", e.target.value)} />
              </FormField>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
