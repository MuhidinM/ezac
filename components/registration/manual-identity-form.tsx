"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FileUploadField,
  validateFile,
} from "@/components/registration/file-upload-field";
import { BulkImportUpload } from "@/components/registration/bulk-import-upload";
import { PhoneInput } from "@/components/registration/phone-input";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { registerApiFormData } from "@/lib/registration/api";
import {
  BENEFICIARY_CATEGORIES,
  GENDER_OPTIONS,
  MAX_PROFILE_IMAGE_SIZE,
  PROFILE_IMAGE_TYPES,
} from "@/lib/registration/constants";
import {
  isValidEthiopianPhone,
  normalizePhoneToE164,
} from "@/lib/registration/phone";
import {
  getSelectedBranch,
  setRegistrationSession,
} from "@/lib/registration/session";
import type {
  BeneficiaryCategory,
  CreateBeneficiaryPayload,
  CreateBeneficiaryResponse,
  Gender,
} from "@/lib/registration/types";
import { cn } from "@/lib/utils";

const MANUAL_STEPS = ["Identity", "Password"];

export function ManualIdentityForm() {
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grandfatherName, setGrandfatherName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<BeneficiaryCategory | "">("");
  const [notes, setNotes] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
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

  const fileError = validateFile(
    profileFile,
    PROFILE_IMAGE_TYPES,
    MAX_PROFILE_IMAGE_SIZE,
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const branch = getSelectedBranch();
    if (!branch) {
      router.replace("/dashboard/register");
      return;
    }

    if (!gender || !category) {
      setError("Please complete all required fields.");
      return;
    }

    if (!isValidEthiopianPhone(phone)) {
      setError("Please enter a valid Ethiopian phone number.");
      return;
    }

    if (fileError) {
      setError(fileError);
      return;
    }

    const normalizedPhone = normalizePhoneToE164(phone);
    const fullName = [firstName, lastName, grandfatherName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

    const payload: CreateBeneficiaryPayload = {
      fullName,
      phone: normalizedPhone,
      email: email.trim(),
      dateOfBirth: birthdate,
      gender,
      region: region.trim(),
      city: city.trim(),
      addressLine: address.trim(),
      beneficiaryType: "individual",
      category,
      notes: notes.trim(),
      branchId: branch.branchId,
    };

    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
    if (profileFile) {
      formData.append("profilePicture", profileFile);
    }

    setIsSubmitting(true);

    try {
      const data = await registerApiFormData<CreateBeneficiaryResponse>(
        "/api/register/beneficiaries",
        formData,
      );

      if (!data.id || !data.passwordSetupToken) {
        throw new ApiError("Invalid registration response from server", 502);
      }

      setRegistrationSession({
        registrationType: "manual",
        entityId: data.id,
        passwordSetupToken: data.passwordSetupToken,
        phone: normalizedPhone,
      });

      router.push("/dashboard/register/manual/password");
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/login?redirect=/dashboard/register/manual");
        return;
      }

      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to register beneficiary. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!branchId || !branchName) {
    return (
      <RegistrationShell title="Individual identity" description="Checking branch selection...">
        <p className="text-sm text-black/55">Loading...</p>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      title="Individual identity"
      description="Enter the beneficiary's personal details."
      branchName={branchName}
      steps={MANUAL_STEPS}
      currentStep={0}
      error={error}
      footer={
        <div className="flex justify-between gap-3">
          <Button variant="outline" asChild disabled={isSubmitting}>
            <a href="/dashboard/register/type">Back</a>
          </Button>
          <Button type="submit" form="manual-identity-form" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Continue"}
          </Button>
        </div>
      }
    >
      <form id="manual-identity-form" onSubmit={onSubmit} className="space-y-4">
        <BulkImportUpload
          onFileSelect={setBulkImportFile}
          disabled={isSubmitting}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name (father name)</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grandfatherName">Grandfather&apos;s name</Label>
          <Input
            id="grandfatherName"
            value={grandfatherName}
            onChange={(event) => setGrandfatherName(event.target.value)}
            required
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender)}
              required
              disabled={isSubmitting}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                !gender ? "text-muted-foreground/70" : "text-foreground",
              )}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
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
          <Label htmlFor="category">Beneficiary category</Label>
          <select
            id="category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as BeneficiaryCategory)
            }
            required
            disabled={isSubmitting}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              !category ? "text-muted-foreground/70" : "text-foreground",
            )}
          >
            <option value="">Select category</option>
            {BENEFICIARY_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            required
            disabled={isSubmitting}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <FileUploadField
          id="profilePicture"
          label="Profile picture (optional)"
          accept={PROFILE_IMAGE_TYPES.join(",")}
          maxSize={MAX_PROFILE_IMAGE_SIZE}
          allowedTypes={PROFILE_IMAGE_TYPES}
          file={profileFile}
          onChange={setProfileFile}
          error={fileError}
          disabled={isSubmitting}
        />
      </form>
    </RegistrationShell>
  );
}
