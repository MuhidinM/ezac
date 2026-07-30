"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { BranchCreateResponse, CreateBranchBody } from "@/lib/api/types";

type Props = {
  onCreated: (branch: BranchCreateResponse) => void;
  onCancel: () => void;
};

export function CreateBranchForm({ onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [zone, setZone] = useState("");
  const [woreda, setWoreda] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchEmail, setBranchEmail] = useState("");
  const [branchFullName, setBranchFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const body: CreateBranchBody = {
      name: name.trim(),
      region: region.trim(),
      zone: zone.trim(),
      woreda: woreda.trim(),
      branchPhone: branchPhone.trim(),
      branchFullName: branchFullName.trim(),
    };
    if (branchEmail.trim()) body.branchEmail = branchEmail.trim();

    try {
      const created = await apiClient<BranchCreateResponse>(
        "/api/admin/branches",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      onCreated(created);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Failed to create branch",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-black/5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-[#001539]">Create branch</h2>
          <p className="mt-1 text-sm text-black/60">
            Provisions a Keycloak BRANCH user. Login username is the branch
            phone.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create branch"}
          </Button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Branch name" id="name" value={name} onChange={setName} required />
        <Field
          label="Officer full name"
          id="branchFullName"
          value={branchFullName}
          onChange={setBranchFullName}
          required
        />
        <Field
          label="Branch phone (login)"
          id="branchPhone"
          value={branchPhone}
          onChange={setBranchPhone}
          placeholder="+2519..."
          required
        />
        <Field
          label="Branch email"
          id="branchEmail"
          value={branchEmail}
          onChange={setBranchEmail}
          placeholder="optional"
        />
        <Field label="Region" id="region" value={region} onChange={setRegion} required />
        <Field label="Zone" id="zone" value={zone} onChange={setZone} required />
        <Field label="Woreda" id="woreda" value={woreda} onChange={setWoreda} required />
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
