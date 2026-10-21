"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, CopyCheck, Pencil, XCircle } from "lucide-react";

import { BeneficiaryAssessments } from "@/components/assessment/beneficiary-assessments";
import {
  DuplicateBadge,
  LifecycleBadge,
  PoolStatusBadge,
  WhitelistBadge,
} from "@/components/backoffice/status-badges";
import { BasicDetailsDialog } from "@/components/beneficiary/basic-details-dialog";
import { BeneficiaryEditForm } from "@/components/beneficiary/beneficiary-edit-form";
import { LifecyclePanel } from "@/components/beneficiary/lifecycle-panel";
import { WhitelistPanel } from "@/components/whitelist/whitelist-panel";
import { KycDocumentsCard } from "@/components/beneficiary/kyc-documents-card";
import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { BeneficiaryDetail } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { MARITAL_STATUS, PRIMARY_LANGUAGE, SEX, labelFor } from "@/lib/backoffice/options";
import { formatBeneficiaryCategory, formatDateTime } from "@/lib/beneficiary/format";

type VerificationAction = "verified" | "rejected";

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const { data: beneficiary, error, isLoading, reload, mutate } = useResource<BeneficiaryDetail>(
    `/bff/beneficiaries/${encodeURIComponent(id)}`,
  );

  const [isEditingInstitution, setIsEditingInstitution] = useState(false);
  const [basicOpen, setBasicOpen] = useState(false);
  const [verificationAction, setVerificationAction] = useState<VerificationAction | null>(null);

  if (isLoading && !beneficiary) {
    return <div className="h-72 animate-pulse rounded-xl bg-black/[0.04]" />;
  }

  if (!beneficiary) {
    return (
      <section className="space-y-6">
        <PageHeader title="Beneficiary" back={{ href: "/dashboard/beneficiary", label: "Beneficiaries" }} />
        <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {error?.message ?? "Beneficiary not found"}
        </InlineAlert>
      </section>
    );
  }

  const isInstitution = beneficiary.beneficiaryType === "institution";
  const canVerify =
    session?.isAdmin &&
    beneficiary.verificationStatus !== "verified" &&
    beneficiary.verificationStatus !== "rejected";
  const canEdit = session?.isStaff ?? false;

  if (isEditingInstitution) {
    return (
      <section className="space-y-6">
        <PageHeader
          title={`Edit ${beneficiary.fullName ?? "beneficiary"}`}
          back={{ href: `/dashboard/beneficiary/${beneficiary.id}`, label: "Back to profile" }}
        />
        <BeneficiaryEditForm
          beneficiary={beneficiary}
          onCancel={() => setIsEditingInstitution(false)}
          onSaved={(updated) => {
            mutate(updated);
            setIsEditingInstitution(false);
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard/beneficiary", label: "Beneficiaries" }}
        title={
          <span className="flex items-center gap-3">
            {beneficiary.hasProfilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element -- authenticated BFF image stream
              <img
                src={`/bff/beneficiaries/${beneficiary.id}/profile-picture`}
                alt=""
                className="size-10 rounded-full border border-black/10 object-cover"
              />
            ) : null}
            {beneficiary.fullName ?? "Unnamed beneficiary"}
          </span>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <VerificationStatusBadge status={beneficiary.verificationStatus} />
            <LifecycleBadge status={beneficiary.lifecycleStatus} />
            <PoolStatusBadge status={beneficiary.poolStatus} />
            <WhitelistBadge effect={beneficiary.whitelistEffect} />
            <DuplicateBadge status={beneficiary.duplicateStatus} />
            <Badge tone="neutral" className="capitalize">
              {beneficiary.beneficiaryType}
            </Badge>
          </div>
        }
        actions={
          <>
            {canEdit ? (
              <Button
                variant="outline"
                onClick={() => (isInstitution ? setIsEditingInstitution(true) : setBasicOpen(true))}
              >
                <Pencil />
                {isInstitution ? "Edit" : "Edit basic details"}
              </Button>
            ) : null}
            {canVerify ? (
              <>
                <Button variant="outline" onClick={() => setVerificationAction("rejected")}>
                  <XCircle />
                  Reject
                </Button>
                <Button onClick={() => setVerificationAction("verified")}>
                  <CheckCircle2 />
                  Verify
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {beneficiary.duplicateStatus === "POTENTIAL" ? (
        <InlineAlert
          tone="warning"
          title="Possible duplicate registration"
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/beneficiary/${beneficiary.id}/duplicates`}>
                <CopyCheck />
                Review
              </Link>
            </Button>
          }
        >
          This record matches another beneficiary. Resolve it before starting an assessment.
        </InlineAlert>
      ) : null}
      {beneficiary.duplicateStatus === "CONFIRMED_DUPLICATE" ? (
        <InlineAlert tone="error" title="Confirmed duplicate">
          This registration was confirmed as a duplicate and can&apos;t be assessed.
        </InlineAlert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Applicant">
            <DetailList
              items={[
                { label: "Phone", value: beneficiary.phone },
                { label: "Email", value: beneficiary.email },
                {
                  label: "Date of birth",
                  value:
                    beneficiary.dateOfBirth ??
                    (beneficiary.estimatedAge != null ? `About ${beneficiary.estimatedAge} years` : null),
                },
                { label: "Sex", value: beneficiary.gender ? labelFor(SEX, beneficiary.gender) : null },
                {
                  label: "Marital status",
                  value: beneficiary.maritalStatus ? labelFor(MARITAL_STATUS, beneficiary.maritalStatus) : null,
                },
                { label: "Religion", value: beneficiary.religion },
                {
                  label: "Primary language",
                  value:
                    beneficiary.primaryLanguage === "other"
                      ? beneficiary.primaryLanguageOther
                      : beneficiary.primaryLanguage
                        ? labelFor(PRIMARY_LANGUAGE, beneficiary.primaryLanguage)
                        : null,
                },
                { label: "Category", value: formatBeneficiaryCategory(beneficiary.beneficiaryCategory) },
              ]}
            />
          </Panel>

          {!isInstitution ? (
            <Panel
              title="Bank account"
              description="Where disbursements are paid. Required before an assessment can be submitted."
              actions={
                canEdit ? (
                  <Button size="sm" variant="ghost" onClick={() => setBasicOpen(true)}>
                    <Pencil />
                    Edit
                  </Button>
                ) : null
              }
            >
              {beneficiary.bankAccount?.accountNumber ? (
                <DetailList
                  items={[
                    { label: "Bank", value: beneficiary.bankAccount.bankName ?? beneficiary.bankAccount.bankCode },
                    {
                      label: "Account number",
                      value: <span className="font-mono">{beneficiary.bankAccount.accountNumber}</span>,
                    },
                    { label: "Account holder", value: beneficiary.bankAccount.accountHolderName },
                  ]}
                />
              ) : (
                <InlineAlert tone="warning">No bank account yet. Add it before submitting an assessment.</InlineAlert>
              )}
            </Panel>
          ) : null}

          <Panel title="Location">
            <DetailList
              items={[
                { label: "Region", value: beneficiary.region },
                { label: "Zone", value: beneficiary.zone },
                { label: "Woreda", value: beneficiary.woreda },
                { label: "Kebele", value: beneficiary.kebele },
                { label: "Address", value: beneficiary.addressLine },
                { label: "City", value: beneficiary.city },
              ]}
            />
          </Panel>

          {isInstitution ? (
            <Panel title="Institution">
              <DetailList
                items={[
                  { label: "Trading name", value: beneficiary.tradingName },
                  { label: "Trade registration", value: beneficiary.tradeRegistrationNumber },
                  { label: "TIN", value: beneficiary.taxIdentificationNumber },
                  { label: "VAT", value: beneficiary.vatRegistrationNumber },
                  { label: "Subtype", value: beneficiary.institutionSubtype },
                  {
                    label: "Required KYC complete",
                    value:
                      beneficiary.institutionRequiredKycComplete == null
                        ? null
                        : beneficiary.institutionRequiredKycComplete
                          ? "Yes"
                          : "No",
                  },
                ]}
              />
            </Panel>
          ) : null}

          {isInstitution ? (
            <KycDocumentsCard beneficiaryId={beneficiary.id} />
          ) : (
            <BeneficiaryAssessments beneficiary={beneficiary} />
          )}
        </div>

        <div className="space-y-6">
          {!isInstitution ? <WhitelistPanel beneficiaryId={beneficiary.id} beneficiaryName={beneficiary.fullName} /> : null}
          {!isInstitution && session?.isStaff ? (
            <LifecyclePanel
              beneficiaryId={beneficiary.id}
              canChange={session?.isAdmin ?? false}
              onChanged={(lifecycleStatus) => mutate({ ...beneficiary, lifecycleStatus })}
            />
          ) : null}
          <Panel title="Registration">
            <DetailList
              columns={2}
              items={[
                { label: "BIN", value: beneficiary.bin ?? beneficiary.registrationCode },
                { label: "Branch", value: beneficiary.branchName },
                { label: "Registered", value: formatDateTime(beneficiary.createdAt) },
                { label: "Updated", value: formatDateTime(beneficiary.updatedAt) },
              ]}
            />
          </Panel>
          <Panel title="Review notes">
            <DetailList
              columns={2}
              items={[
                { label: "Verification reason", value: beneficiary.verificationReason },
                { label: "Notes", value: beneficiary.notes },
                ...(beneficiary.verificationLink
                  ? [{ label: "Fayda link", value: beneficiary.verificationLink }]
                  : []),
              ]}
            />
          </Panel>
        </div>
      </div>

      {!isInstitution ? (
        <BasicDetailsDialog
          beneficiaryId={beneficiary.id}
          initial={beneficiary}
          open={basicOpen}
          onOpenChange={setBasicOpen}
          onSaved={mutate}
        />
      ) : null}

      <VerificationDialog
        beneficiary={beneficiary}
        action={verificationAction}
        onClose={() => setVerificationAction(null)}
        onSaved={mutate}
      />
    </section>
  );
}

function VerificationDialog({
  beneficiary,
  action,
  onClose,
  onSaved,
}: {
  beneficiary: BeneficiaryDetail;
  action: VerificationAction | null;
  onClose: () => void;
  onSaved: (updated: BeneficiaryDetail) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action === "rejected" && !reason.trim()) {
      setError("A reason is required when rejecting a beneficiary.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await apiClient<BeneficiaryDetail>(
        `/bff/beneficiaries/${beneficiary.id}/verification`,
        {
          method: "PATCH",
          body: JSON.stringify({ verificationStatus: action, reason: reason.trim() || undefined }),
        },
      );
      onSaved(updated);
      setReason("");
      onClose();
    } catch (submitError) {
      setError(errorMessage(submitError, "Verification update failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={action !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">
              {action === "verified" ? "Verify beneficiary" : "Reject beneficiary"}
            </DialogTitle>
            <DialogDescription>
              {action === "verified"
                ? "Confirm this beneficiary's identity has been checked."
                : "The reason is stored with the rejection."}
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <FormField label="Reason" htmlFor="verification-reason" required={action === "rejected"}>
            <Textarea
              id="verification-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={action === "verified" ? "Optional note" : "Why is this beneficiary rejected?"}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
