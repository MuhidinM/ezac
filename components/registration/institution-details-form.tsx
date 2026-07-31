"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BulkImportUpload } from "@/components/registration/bulk-import-upload";
import { PhoneInput } from "@/components/registration/phone-input";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { registerApiJson } from "@/lib/registration/api";
import { INSTITUTION_SUBTYPES } from "@/lib/registration/constants";
import {
  isValidEthiopianPhone,
  normalizePhoneToE164,
} from "@/lib/registration/phone";
import {
  getSelectedBranch,
  setRegistrationSession,
} from "@/lib/registration/session";
import type {
  CreateCompanyPayload,
  CreateCompanyResponse,
  InstitutionSubtype,
} from "@/lib/registration/types";
import { cn } from "@/lib/utils";

const INSTITUTION_STEPS = ["Details", "Password", "Documents"];

export function InstitutionDetailsForm() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [institutionSubtype, setInstitutionSubtype] = useState<
    InstitutionSubtype | ""
  >("");
  const [legalName, setLegalName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [tradeRegistrationNumber, setTradeRegistrationNumber] = useState("");
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState("");
  const [vatRegistrationNumber, setVatRegistrationNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [authorityToActDocumentRequired, setAuthorityToActDocumentRequired] =
    useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }
    setBranchId(branch.branchId);
    setBranchName(branch.branchName);
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }

    if (!institutionSubtype) {
      setError("Please select an institution type.");
      return;
    }

    if (!isValidEthiopianPhone(phone)) {
      setError("Please enter a valid Ethiopian phone number.");
      return;
    }

    const normalizedPhone = normalizePhoneToE164(phone);

    const payload: CreateCompanyPayload = {
      legalName: legalName.trim(),
      tradingName: tradingName.trim(),
      tradeRegistrationNumber: tradeRegistrationNumber.trim(),
      taxIdentificationNumber: taxIdentificationNumber.trim(),
      vatRegistrationNumber: vatRegistrationNumber.trim(),
      phone: normalizedPhone,
      email: email.trim(),
      region: region.trim(),
      city: city.trim(),
      addressLine: address.trim(),
      institutionSubtype,
      authorityToActDocumentRequired,
      notes: notes.trim(),
      branchId: branch.branchId,
    };

    setIsSubmitting(true);

    try {
      const data = await registerApiJson<CreateCompanyResponse>(
        "/api/register/companies",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      if (!data.id || !data.passwordSetupToken) {
        throw new ApiError("Invalid registration response from server", 502);
      }

      setRegistrationSession({
        registrationType: "institution",
        entityId: data.id,
        passwordSetupToken: data.passwordSetupToken,
        companyDocumentUploadToken: data.companyDocumentUploadToken,
        phone: normalizedPhone,
        kycDocuments: data.institutionRecommendedKycDocuments ?? [],
        kycComplete: data.institutionRequiredKycComplete ?? false,
      });

      router.push("/dashboard/register/institution/password");
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login?redirect=/dashboard/register/institution");
        return;
      }

      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to register institution. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!branchId || !branchName) {
    return (
      <RegistrationShell
        title="Institution details"
        description="Checking branch selection..."
      >
        <p className="text-sm text-black/55">Loading...</p>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      title="Institution details"
      description="Enter the organization's registration information."
      branchName={branchName}
      steps={INSTITUTION_STEPS}
      currentStep={0}
      error={error}
      footer={
        <div className="flex justify-between gap-3">
          <Button variant="outline" asChild disabled={isSubmitting}>
            <a href="/dashboard/register/type">Back</a>
          </Button>
          <Button
            type="submit"
            form="institution-details-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Continue"}
          </Button>
        </div>
      }
    >
      <form
        id="institution-details-form"
        onSubmit={onSubmit}
        className="space-y-4"
      >
        <BulkImportUpload
          onFileSelect={setBulkImportFile}
          disabled={isSubmitting}
        />
        <div className="space-y-2">
          <Label htmlFor="institutionSubtype">Institution type</Label>
          <select
            id="institutionSubtype"
            value={institutionSubtype}
            onChange={(event) =>
              setInstitutionSubtype(event.target.value as InstitutionSubtype)
            }
            required
            disabled={isSubmitting}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              !institutionSubtype
                ? "text-muted-foreground/70"
                : "text-foreground",
            )}
          >
            <option value="">Select type</option>
            {INSTITUTION_SUBTYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="legalName">Legal name</Label>
          <Input
            id="legalName"
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tradingName">Trading name</Label>
          <Input
            id="tradingName"
            value={tradingName}
            onChange={(event) => setTradingName(event.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tradeRegistrationNumber">
              Trade registration number
            </Label>
            <Input
              id="tradeRegistrationNumber"
              value={tradeRegistrationNumber}
              onChange={(event) =>
                setTradeRegistrationNumber(event.target.value)
              }
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxIdentificationNumber">TIN</Label>
            <Input
              id="taxIdentificationNumber"
              value={taxIdentificationNumber}
              onChange={(event) =>
                setTaxIdentificationNumber(event.target.value)
              }
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vatRegistrationNumber">
            VAT registration number (optional)
          </Label>
          <Input
            id="vatRegistrationNumber"
            value={vatRegistrationNumber}
            onChange={(event) => setVatRegistrationNumber(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <PhoneInput
          value={phone}
          onChange={setPhone}
          disabled={isSubmitting}
        />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSubmitting}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            checked={authorityToActDocumentRequired}
            onChange={(event) =>
              setAuthorityToActDocumentRequired(event.target.checked)
            }
            disabled={isSubmitting}
            className="h-4 w-4 rounded border border-input"
          />
          Authority to act document required
        </label>
      </form>
    </RegistrationShell>
  );
}
