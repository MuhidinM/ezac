"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRightLeft, CheckCircle2, CopyCheck, Pencil, XCircle } from "lucide-react";

import { BeneficiaryAssessments } from "@/components/assessment/beneficiary-assessments";
import {
  DuplicateBadge,
  LifecycleBadge,
  PoolStatusBadge,
  ScoreMeter,
  WhitelistBadge,
} from "@/components/backoffice/status-badges";
import { BasicDetailsDialog, bankLockFor, type BankLock } from "@/components/beneficiary/basic-details-dialog";
import { BeneficiaryEditForm } from "@/components/beneficiary/beneficiary-edit-form";
import { HouseholdLoginPanel } from "@/components/beneficiary/household-login-panel";
import { LifecyclePanel } from "@/components/beneficiary/lifecycle-panel";
import { WhitelistPanel } from "@/components/whitelist/whitelist-panel";
import { KycDocumentsCard } from "@/components/beneficiary/kyc-documents-card";
import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
import { useBreadcrumbLabel } from "@/components/dashboard/dashboard-header";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { DetailSkeleton } from "@/components/dashboard/skeletons";
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
import { requestPath } from "@/components/whitelist/whitelist-form-dialog";
import type { AssessmentListItem, BeneficiaryWhitelist } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { BeneficiaryDetail, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { useNotice } from "@/lib/backoffice/notice";
import { MARITAL_STATUS, PRIMARY_LANGUAGE, SEX, labelFor } from "@/lib/backoffice/options";
import { formatBeneficiaryCategory, formatDateTime } from "@/lib/beneficiary/format";
import type { HouseholdDetail } from "@/lib/beneficiary/types";

type VerificationAction = "verified" | "rejected";

const CONSENT_CONTEXT: Record<string, string> = {
  REGISTRATION: "At registration",
  ASSESSMENT: "At the assessment",
};

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const { data: beneficiary, error, isLoading, reload, mutate } = useResource<HouseholdDetail>(
    `/bff/beneficiaries/${encodeURIComponent(id)}`,
  );
  const isInstitution = beneficiary?.beneficiaryType === "institution";
  const isStaff = session?.isStaff ?? false;
  // The assessment history settles the bank account (see bankLockFor).
  const { data: historyData, error: historyError } = useResource<
    AssessmentListItem[] | PaginatedItems<AssessmentListItem>
  >(
    beneficiary && !isInstitution && isStaff
      ? `/bff/backoffice/beneficiaries/${encodeURIComponent(beneficiary.id)}/assessments`
      : null,
  );
  const assessmentHistory = historyError
    ? undefined
    : Array.isArray(historyData)
      ? historyData
      : historyData?.items;
  const { data: whitelistData, error: whitelistError, reload: reloadWhitelist } = useResource<BeneficiaryWhitelist>(
    beneficiary && !isInstitution ? requestPath(beneficiary.id) : null,
  );
  // Undefined until it is read: the bank lock fails closed meanwhile.
  const whitelist = whitelistError ? undefined : whitelistData;
  const poolStatus = beneficiary?.poolStatus ?? null;
  useBreadcrumbLabel(beneficiary?.fullName);

  const [isEditingInstitution, setIsEditingInstitution] = useState(false);
  const [basicOpen, setBasicOpen] = useState(false);
  const [verificationAction, setVerificationAction] = useState<VerificationAction | null>(null);
  // Left by registration ("Abebe K. is registered…"), shown once on the new profile.
  const [notice] = useNotice(`beneficiary:${id}`);

  const isBranch = session?.isBranch ?? false;
  const back = isBranch
    ? { href: "/dashboard/assessments", label: "Assessments" }
    : { href: "/dashboard/beneficiary", label: "Beneficiaries" };

  if (isLoading && !beneficiary) {
    return <DetailSkeleton />;
  }

  if (!beneficiary) {
    return (
      <section className="space-y-6">
        <PageHeader title="Beneficiary" back={back} />
        {error?.status === 404 ? (
          // Retrying can't make a missing record appear.
          <InlineAlert>
            This beneficiary doesn&apos;t exist. Check the link, or search for the household in the Beneficiaries list.
          </InlineAlert>
        ) : error?.status === 403 ? (
          // OUTSIDE_SCOPE and ROLE_NOT_ALLOWED: the backend says why; retrying won't change it.
          <InlineAlert title="You can't open this household.">{error.message}</InlineAlert>
        ) : (
          <ErrorAlert error={error} onRetry={reload} fallback="The beneficiary couldn't be loaded." />
        )}
      </section>
    );
  }

  const isAdmin = session?.isAdmin ?? false;
  const canVerify =
    isAdmin &&
    beneficiary.verificationStatus !== "verified" &&
    beneficiary.verificationStatus !== "rejected";
  // ADMIN and FIELD_OFFICER edit; BRANCH reads (PATCH is 403 ROLE_NOT_ALLOWED for it).
  const canEdit = isStaff;
  const canManageLogin = (isAdmin || isBranch) && !isInstitution;

  // Bank account: settled once the assessment is with the branch or the
  // household is (about to be) pooled. A field officer can't change it then;
  // an ADMIN's change of a locked account waits for a second ADMIN.
  const bankLock: BankLock = isInstitution
    ? null
    : bankLockFor({ isAdmin, assessments: assessmentHistory, poolStatus, whitelist });
  const canEditBank = canEdit && (bankLock === null || bankLock === "warn") && !beneficiary.pendingBankChange;
  const consent = beneficiary.consent;

  // Merge: keep what we had, take the saved record (with its new version),
  // then reload the full record.
  function applyUpdate(updated: BeneficiaryDetail) {
    if (beneficiary) mutate({ ...beneficiary, ...updated });
    reload();
  }

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
          onReload={() => {
            reload();
            setIsEditingInstitution(false);
          }}
          onSaved={(updated) => {
            applyUpdate(updated);
            setIsEditingInstitution(false);
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        back={back}
        documentTitle={beneficiary.fullName ?? "Unnamed beneficiary"}
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
            <PoolStatusBadge status={poolStatus} />
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
                <Button variant="destructive-outline" onClick={() => setVerificationAction("rejected")}>
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

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      {isBranch ? (
        <InlineAlert tone="info">
          You can view this household. Its details are changed by head office and field officers.
        </InlineAlert>
      ) : null}

      {beneficiary.duplicateStatus === "POTENTIAL" ? (
        <InlineAlert
          tone="warning"
          title="Possible duplicate registration"
          action={
            canEdit ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/beneficiary/${beneficiary.id}/duplicates`}>
                  <CopyCheck />
                  Review
                </Link>
              </Button>
            ) : null
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
              description={
                canEdit && bankLock === "locked"
                  ? "Where payments are sent. Locked once the assessment is submitted or the household is in the pool. Only an administrator can change it."
                  : "Where payments are sent. Needed to submit an assessment and to pay the household."
              }
              actions={
                canEditBank ? (
                  <Button size="sm" variant="ghost" onClick={() => setBasicOpen(true)}>
                    <Pencil />
                    Edit
                  </Button>
                ) : null
              }
            >
              <div className="space-y-4">
                {beneficiary.pendingBankChange ? (
                  <InlineAlert
                    tone="warning"
                    title="A change to this account is waiting for approval"
                    action={
                      isAdmin ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/dashboard/bank-changes">
                            <ArrowRightLeft />
                            Open request
                          </Link>
                        </Button>
                      ) : null
                    }
                  >
                    Another administrator must approve or reject it. Payments go to the account below until then,
                    and the household can&apos;t be paid while the request waits.
                  </InlineAlert>
                ) : null}
                {beneficiary.bankAccount?.accountNumber ? (
                  <DetailList
                    items={[
                      { label: "Bank", value: beneficiary.bankAccount.bankName ?? beneficiary.bankAccount.bankCode },
                      {
                        label: "Account number",
                        value: <span className="font-mono">{beneficiary.bankAccount.accountNumber}</span>,
                      },
                      { label: "Account holder", value: beneficiary.bankAccount.accountHolderName },
                      ...(beneficiary.bankAccountChangedAt
                        ? [
                            {
                              label: "Last changed",
                              value: [
                                formatDateTime(beneficiary.bankAccountChangedAt),
                                beneficiary.bankAccountChangedByName
                                  ? `by ${beneficiary.bankAccountChangedByName}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" "),
                            },
                          ]
                        : []),
                    ]}
                  />
                ) : (
                  <InlineAlert tone="warning">
                    No bank account yet. Add it before the assessment is submitted. The household can&apos;t be paid
                    without one.
                  </InlineAlert>
                )}
              </div>
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
          {isInstitution ? null : (
            <WhitelistPanel
              beneficiaryId={beneficiary.id}
              beneficiaryName={beneficiary.fullName}
              household={{ ...beneficiary, poolStatus }}
              onChanged={reloadWhitelist}
            />
          )}
          {canManageLogin ? <HouseholdLoginPanel household={beneficiary} onChanged={applyUpdate} /> : null}
          {!isInstitution && isStaff ? (
            <LifecyclePanel
              beneficiaryId={beneficiary.id}
              canChange={isAdmin}
              onChanged={(lifecycleStatus) => {
                mutate({ ...beneficiary, lifecycleStatus });
                reload();
              }}
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
                ...(beneficiary.score != null
                  ? [
                      {
                        label: "Latest score",
                        value: (
                          <ScoreMeter score={beneficiary.score} max={beneficiary.maxScore} risk={beneficiary.riskCategory} />
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>
          {consent ? (
            <Panel title="Consent">
              <DetailList
                columns={2}
                items={[
                  {
                    label: "Data processing",
                    value:
                      consent.dataProcessingConsent == null
                        ? null
                        : consent.dataProcessingConsent
                          ? "Agreed"
                          : "Refused",
                  },
                  { label: "Notice version", value: consent.noticeVersion },
                  {
                    label: "Recorded",
                    value: consent.context ? (CONSENT_CONTEXT[consent.context] ?? consent.context) : null,
                  },
                  { label: "When", value: consent.consentedAt ? formatDateTime(consent.consentedAt) : null },
                  { label: "By", value: consent.recordedByName },
                ]}
              />
            </Panel>
          ) : null}
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

      {!isInstitution && canEdit ? (
        <BasicDetailsDialog
          beneficiaryId={beneficiary.id}
          initial={beneficiary}
          open={basicOpen}
          onOpenChange={setBasicOpen}
          onSaved={applyUpdate}
          onReload={reload}
          bankLock={bankLock}
        />
      ) : null}

      <VerificationDialog
        beneficiary={beneficiary}
        action={verificationAction}
        onClose={() => setVerificationAction(null)}
        onSaved={applyUpdate}
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
            <DialogTitle className="text-navy">
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
            <Button
              type="submit"
              variant={action === "rejected" ? "destructive" : "default"}
              loading={isSubmitting}
              loadingText="Saving…"
            >
              {action === "rejected" ? "Reject" : "Verify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
