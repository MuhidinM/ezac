"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type {
  BeneficiaryDetail,
  BeneficiaryUpdateBody,
} from "@/lib/api/types";

type Props = {
  beneficiary: BeneficiaryDetail;
  onSaved: (updated: BeneficiaryDetail) => void;
  onCancel: () => void;
};

export function BeneficiaryEditForm({
  beneficiary,
  onSaved,
  onCancel,
}: Props) {
  const [fullName, setFullName] = useState(beneficiary.fullName ?? "");
  const [phone, setPhone] = useState(beneficiary.phone ?? "");
  const [email, setEmail] = useState(beneficiary.email ?? "");
  const [nationalId, setNationalId] = useState(beneficiary.nationalId ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(beneficiary.dateOfBirth ?? "");
  const [gender, setGender] = useState(beneficiary.gender ?? "");
  const [region, setRegion] = useState(beneficiary.region ?? "");
  const [city, setCity] = useState(beneficiary.city ?? "");
  const [addressLine, setAddressLine] = useState(beneficiary.addressLine ?? "");
  const [nationality, setNationality] = useState(beneficiary.nationality ?? "");
  const [beneficiaryCategory, setBeneficiaryCategory] = useState(
    beneficiary.beneficiaryCategory ?? "",
  );
  const [notes, setNotes] = useState(beneficiary.notes ?? "");
  const [tradingName, setTradingName] = useState(beneficiary.tradingName ?? "");
  const [tradeRegistrationNumber, setTradeRegistrationNumber] = useState(
    beneficiary.tradeRegistrationNumber ?? "",
  );
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState(
    beneficiary.taxIdentificationNumber ?? "",
  );
  const [vatRegistrationNumber, setVatRegistrationNumber] = useState(
    beneficiary.vatRegistrationNumber ?? "",
  );
  const [institutionSubtype, setInstitutionSubtype] = useState(
    beneficiary.institutionSubtype ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const body: BeneficiaryUpdateBody = {
      fullName: fullName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      nationalId: nationalId.trim() || null,
      dateOfBirth: dateOfBirth.trim() || null,
      gender: gender.trim() || null,
      region: region.trim() || null,
      city: city.trim() || null,
      addressLine: addressLine.trim() || null,
      nationality: nationality.trim() || null,
      beneficiaryCategory: beneficiaryCategory.trim() || null,
      notes: notes.trim() || null,
    };

    if (beneficiary.beneficiaryType === "institution") {
      body.tradingName = tradingName.trim() || null;
      body.tradeRegistrationNumber = tradeRegistrationNumber.trim() || null;
      body.taxIdentificationNumber = taxIdentificationNumber.trim() || null;
      body.vatRegistrationNumber = vatRegistrationNumber.trim() || null;
      body.institutionSubtype = institutionSubtype.trim() || null;
    }

    try {
      const updated = await apiClient<BeneficiaryDetail>(
        `/api/beneficiaries/${beneficiary.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
      onSaved(updated);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Failed to save beneficiary",
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
          <h2 className="text-lg font-medium text-[#001539]">Edit beneficiary</h2>
          <p className="mt-1 text-sm text-black/60">
            Update contact, identity, and notes. Verification status is changed
            separately.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
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
        <Field label="Full name" id="fullName" value={fullName} onChange={setFullName} />
        <Field label="Phone" id="phone" value={phone} onChange={setPhone} />
        <Field label="Email" id="email" value={email} onChange={setEmail} />
        <Field
          label="National ID"
          id="nationalId"
          value={nationalId}
          onChange={setNationalId}
        />
        <Field
          label="Date of birth"
          id="dateOfBirth"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          placeholder="YYYY-MM-DD"
        />
        <Field label="Gender" id="gender" value={gender} onChange={setGender} />
        <Field label="Region" id="region" value={region} onChange={setRegion} />
        <Field label="City" id="city" value={city} onChange={setCity} />
        <Field
          label="Address"
          id="addressLine"
          value={addressLine}
          onChange={setAddressLine}
        />
        <Field
          label="Nationality"
          id="nationality"
          value={nationality}
          onChange={setNationality}
        />
        <Field
          label="Category"
          id="beneficiaryCategory"
          value={beneficiaryCategory}
          onChange={setBeneficiaryCategory}
          placeholder="e.g. poor, needy, debtor"
        />
      </div>

      {beneficiary.beneficiaryType === "institution" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Trading name"
            id="tradingName"
            value={tradingName}
            onChange={setTradingName}
          />
          <Field
            label="Trade registration"
            id="tradeRegistrationNumber"
            value={tradeRegistrationNumber}
            onChange={setTradeRegistrationNumber}
          />
          <Field
            label="TIN"
            id="taxIdentificationNumber"
            value={taxIdentificationNumber}
            onChange={setTaxIdentificationNumber}
          />
          <Field
            label="VAT"
            id="vatRegistrationNumber"
            value={vatRegistrationNumber}
            onChange={setVatRegistrationNumber}
          />
          <Field
            label="Institution subtype"
            id="institutionSubtype"
            value={institutionSubtype}
            onChange={setInstitutionSubtype}
            placeholder="company, ngo, government..."
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
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
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
