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
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import type { Branch } from "@/lib/api/types";

/** Edit branch details. Region and the officer's phone (their login) are fixed. */
export function EditBranchDialog({
  branch,
  open,
  onOpenChange,
  onSaved,
}: {
  branch: Branch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (branch: Branch) => void;
}) {
  const initial = {
    name: branch.name ?? "",
    zone: branch.zone ?? "",
    woreda: branch.woreda ?? "",
    officerFullName: branch.officerName ?? branch.branchFullName ?? "",
    officerEmail: branch.branchEmail ?? "",
  };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function set(key: keyof typeof initial, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const changed = Object.fromEntries(
      Object.entries(form)
        .map(([key, value]) => [key, value.trim()] as const)
        .filter(([key, value]) => value !== initial[key as keyof typeof initial].trim()),
    );
    if (Object.keys(changed).length === 0) {
      onOpenChange(false);
      return;
    }
    setIsSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const updated = await apiClient<Branch>(
        `/api/backoffice/admin/branches/${encodeURIComponent(branch.id)}`,
        { method: "PATCH", body: JSON.stringify(changed) },
      );
      onSaved(updated);
      onOpenChange(false);
    } catch (saveError) {
      setError(errorMessage(saveError, "Failed to update branch"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setForm(initial);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">Edit branch</DialogTitle>
            <DialogDescription>
              The region ({branch.region ?? "—"}) and the officer&apos;s login phone ({branch.branchPhone ?? "—"}) can&apos;t be changed.
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Branch name" htmlFor="eb-name" error={fieldErrors.name} className="sm:col-span-2">
              <Input id="eb-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </FormField>
            <FormField label="Zone" htmlFor="eb-zone" error={fieldErrors.zone}>
              <Input id="eb-zone" value={form.zone} onChange={(e) => set("zone", e.target.value)} />
            </FormField>
            <FormField label="Woreda" htmlFor="eb-woreda" error={fieldErrors.woreda}>
              <Input id="eb-woreda" value={form.woreda} onChange={(e) => set("woreda", e.target.value)} />
            </FormField>
            <FormField label="Officer full name" htmlFor="eb-officer" error={fieldErrors.officerFullName}>
              <Input id="eb-officer" value={form.officerFullName} onChange={(e) => set("officerFullName", e.target.value)} />
            </FormField>
            <FormField label="Officer email" htmlFor="eb-email" error={fieldErrors.officerEmail}>
              <Input id="eb-email" type="email" value={form.officerEmail} onChange={(e) => set("officerEmail", e.target.value)} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
