"use client";

import { type FormEvent, useState } from "react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { BranchPicker } from "@/components/field-officers/branch-picker";
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
import type {
  CreateFieldOfficerBody,
  CreateFieldOfficerResponse,
} from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { normalizePhoneToE164 } from "@/lib/registration/phone";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: CreateFieldOfficerResponse) => void;
};

export function CreateOfficerDialog({ open, onOpenChange, onCreated }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setFullName("");
    setPhone("");
    setEmail("");
    setBranchId("");
    setError(null);
    setFieldErrors({});
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const body: CreateFieldOfficerBody = {
      fullName: fullName.trim(),
      phone: normalizePhoneToE164(phone.trim()),
      email: email.trim(),
      branchId,
    };

    try {
      const result = await apiClient<CreateFieldOfficerResponse>(
        "/bff/backoffice/admin/field-officers",
        { method: "POST", body: JSON.stringify(body) },
      );
      reset();
      onCreated(result);
    } catch (submitError) {
      setError(errorMessage(submitError, "Failed to create field officer"));
      if (submitError instanceof ApiError) setFieldErrors(fieldErrorMap(submitError.errors));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">New field officer</DialogTitle>
            <DialogDescription>
              Creates a login for an assessment officer. They sign in with their
              phone number and work in one branch: they only see beneficiaries
              registered there.
            </DialogDescription>
          </DialogHeader>

          {error ? <InlineAlert>{error}</InlineAlert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Full name"
              htmlFor="officer-name"
              required
              error={fieldErrors.fullName}
              className="sm:col-span-2"
            >
              <Input
                id="officer-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </FormField>
            <FormField
              label="Phone (login)"
              htmlFor="officer-phone"
              required
              hint="Ethiopian mobile, e.g. +251911223344"
              error={fieldErrors.phone}
            >
              <Input
                id="officer-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+2519…"
                required
              />
            </FormField>
            <FormField
              label="Email"
              htmlFor="officer-email"
              required
              error={fieldErrors.email}
            >
              <Input
                id="officer-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </FormField>
          </div>

          <BranchPicker value={branchId} onChange={setBranchId} error={fieldErrors.branchId} hint="The one branch this officer works in. You can move them later." />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !branchId}>
              {isSubmitting ? "Creating…" : "Create officer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
