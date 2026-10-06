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
import type { FieldOfficer } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";

/** Edit name and email; the phone is the login and can't change. */
export function EditOfficerDialog({
  officer,
  open,
  onOpenChange,
  onSaved,
}: {
  officer: FieldOfficer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (officer: FieldOfficer) => void;
}) {
  const [fullName, setFullName] = useState(officer.fullName);
  const [email, setEmail] = useState(officer.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body: { fullName?: string; email?: string } = {};
    if (fullName.trim() !== officer.fullName) body.fullName = fullName.trim();
    if (email.trim() !== (officer.email ?? "")) body.email = email.trim();
    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }
    setIsSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const updated = await apiClient<FieldOfficer>(
        `/api/backoffice/admin/field-officers/${encodeURIComponent(officer.id)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      onSaved({ ...officer, ...updated });
      onOpenChange(false);
    } catch (saveError) {
      setError(errorMessage(saveError, "Failed to update officer"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setFullName(officer.fullName);
          setEmail(officer.email ?? "");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">Edit field officer</DialogTitle>
            <DialogDescription>
              The phone number ({officer.phone ?? "—"}) is the login and can&apos;t be changed.
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <FormField label="Full name" htmlFor="eo-name" required error={fieldErrors.fullName}>
            <Input id="eo-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <FormField label="Email" htmlFor="eo-email" error={fieldErrors.email}>
            <Input id="eo-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
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
