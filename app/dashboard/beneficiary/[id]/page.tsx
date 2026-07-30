"use client";

import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BeneficiaryEditForm } from "@/components/beneficiary/beneficiary-edit-form";
import { KycDocumentsCard } from "@/components/beneficiary/kyc-documents-card";
import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
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
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { BeneficiaryDetail, SessionInfo } from "@/lib/api/types";
import {
  formatAddress,
  formatBeneficiaryCategory,
  formatDateTime,
} from "@/lib/beneficiary/format";

type VerificationAction = "verified" | "rejected";

export default function BeneficiaryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const beneficiaryId = params.id;

  const [beneficiary, setBeneficiary] = useState<BeneficiaryDetail | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationAction, setVerificationAction] =
    useState<VerificationAction>("verified");
  const [verificationReason, setVerificationReason] = useState("");
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [detail, currentSession] = await Promise.all([
        apiClient<BeneficiaryDetail>(`/api/beneficiaries/${beneficiaryId}`),
        apiClient<SessionInfo>("/api/auth/session").catch(() => null),
      ]);

      setBeneficiary(detail);
      setSession(currentSession);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace(`/login?redirect=/dashboard/beneficiary/${beneficiaryId}`);
        return;
      }

      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load beneficiary details",
      );
    } finally {
      setIsLoading(false);
    }
  }, [beneficiaryId, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openVerificationDialog(action: VerificationAction) {
    setVerificationAction(action);
    setVerificationReason("");
    setVerificationError(null);
    setVerificationOpen(true);
  }

  async function onVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!beneficiary) return;

    if (verificationAction === "rejected" && !verificationReason.trim()) {
      setVerificationError("A reason is required when rejecting a beneficiary.");
      return;
    }

    setIsSubmittingVerification(true);
    setVerificationError(null);

    try {
      const updated = await apiClient<BeneficiaryDetail>(
        `/api/beneficiaries/${beneficiary.id}/verification`,
        {
          method: "PATCH",
          body: JSON.stringify({
            verificationStatus: verificationAction,
            reason: verificationReason.trim() || undefined,
          }),
        },
      );

      setBeneficiary(updated);
      setVerificationOpen(false);
    } catch (submitError) {
      setVerificationError(
        submitError instanceof ApiError
          ? submitError.message
          : "Verification update failed",
      );
    } finally {
      setIsSubmittingVerification(false);
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-black/60">Loading beneficiary details...</p>
      </section>
    );
  }

  if (error || !beneficiary) {
    return (
      <section className="space-y-4">
        <Link
          href="/dashboard/beneficiary"
          className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-[#001539]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Beneficiary not found"}
        </p>
      </section>
    );
  }

  const canVerify =
    session?.isAdmin &&
    beneficiary.verificationStatus !== "verified" &&
    beneficiary.verificationStatus !== "rejected";

  const canEdit =
    session?.isAdmin ||
    session?.roles.includes("FIELD_OFFICER") ||
    (session != null && session.roles.length === 0);

  if (isEditing) {
    return (
      <section className="space-y-5">
        <Link
          href="/dashboard/beneficiary"
          className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-[#001539]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
        <BeneficiaryEditForm
          beneficiary={beneficiary}
          onCancel={() => setIsEditing(false)}
          onSaved={(updated) => {
            setBeneficiary(updated);
            setIsEditing(false);
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/beneficiary"
            className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-[#001539]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {beneficiary.hasProfilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element -- authenticated BFF image stream
              <img
                src={`/api/beneficiaries/${beneficiary.id}/profile-picture`}
                alt=""
                className="h-16 w-16 rounded-full border border-black/10 object-cover"
              />
            ) : null}
            <div>
              <h1 className="font-serif-display text-4xl tracking-tight text-[#001539]">
                {beneficiary.fullName ?? "Unnamed beneficiary"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <VerificationStatusBadge status={beneficiary.verificationStatus} />
                <span className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs capitalize text-black/70">
                  {beneficiary.beneficiaryType}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : null}
          {canVerify ? (
            <>
              <Button
                variant="outline"
                onClick={() => openVerificationDialog("rejected")}
              >
                Reject
              </Button>
              <Button onClick={() => openVerificationDialog("verified")}>
                Approve
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Contact">
          <DetailRow label="Phone" value={beneficiary.phone} />
          <DetailRow label="Email" value={beneficiary.email} />
          <DetailRow label="Address" value={formatAddress(beneficiary)} />
          <DetailRow label="Nationality" value={beneficiary.nationality} />
        </DetailCard>

        <DetailCard title="Identity">
          <DetailRow label="National ID" value={beneficiary.nationalId} />
          <DetailRow label="Date of birth" value={beneficiary.dateOfBirth} />
          <DetailRow label="Gender" value={beneficiary.gender} />
          <DetailRow
            label="Category"
            value={formatBeneficiaryCategory(beneficiary.beneficiaryCategory)}
          />
        </DetailCard>

        {beneficiary.beneficiaryType === "institution" ? (
          <DetailCard title="Institution">
            <DetailRow label="Trading name" value={beneficiary.tradingName} />
            <DetailRow
              label="Trade registration"
              value={beneficiary.tradeRegistrationNumber}
            />
            <DetailRow label="TIN" value={beneficiary.taxIdentificationNumber} />
            <DetailRow label="VAT" value={beneficiary.vatRegistrationNumber} />
            <DetailRow
              label="Subtype"
              value={beneficiary.institutionSubtype}
            />
            <DetailRow
              label="Required KYC complete"
              value={
                beneficiary.institutionRequiredKycComplete == null
                  ? "—"
                  : beneficiary.institutionRequiredKycComplete
                    ? "Yes"
                    : "No"
              }
            />
          </DetailCard>
        ) : null}

        <DetailCard title="Review">
          <DetailRow
            label="Verification reason"
            value={beneficiary.verificationReason}
          />
          <DetailRow label="Notes" value={beneficiary.notes} />
          <DetailRow label="Created" value={formatDateTime(beneficiary.createdAt)} />
          <DetailRow label="Updated" value={formatDateTime(beneficiary.updatedAt)} />
          {beneficiary.verificationLink ? (
            <DetailRow label="Fayda link" value={beneficiary.verificationLink} />
          ) : null}
        </DetailCard>

        {beneficiary.beneficiaryType === "institution" ? (
          <KycDocumentsCard beneficiaryId={beneficiary.id} />
        ) : null}
      </div>

      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationAction === "verified" ? "Approve beneficiary" : "Reject beneficiary"}
            </DialogTitle>
            <DialogDescription>
              {verificationAction === "verified"
                ? "Confirm that this beneficiary has passed review."
                : "Provide a reason that will be stored with the rejection."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onVerificationSubmit} className="space-y-4">
            {verificationError ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {verificationError}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="verification-reason">
                Reason{verificationAction === "rejected" ? " (required)" : ""}
              </Label>
              <Input
                id="verification-reason"
                value={verificationReason}
                onChange={(event) => setVerificationReason(event.target.value)}
                placeholder={
                  verificationAction === "verified"
                    ? "Optional approval note"
                    : "Explain why this beneficiary was rejected"
                }
                required={verificationAction === "rejected"}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVerificationOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingVerification}>
                {isSubmittingVerification ? "Saving..." : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-black/5">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-black/45">
        {title}
      </h2>
      <dl className="mt-4 space-y-3">{children}</dl>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <dt className="text-sm text-black/50">{label}</dt>
      <dd className="text-sm text-[#001539]">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
