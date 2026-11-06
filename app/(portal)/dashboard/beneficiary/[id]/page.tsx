"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, CopyCheck, KeyRound, Pencil, RotateCw, XCircle } from "lucide-react";

import { BeneficiaryAssessments } from "@/components/assessment/beneficiary-assessments";
import {
  DuplicateBadge,
  LifecycleBadge,
  PoolStatusBadge,
  WhitelistBadge,
} from "@/components/backoffice/status-badges";
import { BasicDetailsDialog, bankLockFor, type BankLock } from "@/components/beneficiary/basic-details-dialog";
import { BeneficiaryEditForm } from "@/components/beneficiary/beneficiary-edit-form";
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
import { DetailSkeleton, PanelSkeleton } from "@/components/dashboard/skeletons";
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
import type { Assessment, AssessmentListItem, BeneficiaryWhitelist, PoolStatus } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { BeneficiaryDetail } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { isLivePoolStatus } from "@/lib/backoffice/assessment-steps";
import { useNotice } from "@/lib/backoffice/notice";
import { MARITAL_STATUS, PRIMARY_LANGUAGE, SEX, labelFor } from "@/lib/backoffice/options";
import { useBranchScope } from "@/lib/backoffice/use-branch-scope";
import { formatBeneficiaryCategory, formatDateTime } from "@/lib/beneficiary/format";
import { hasPendingPasswordSetup, passwordSetupHref } from "@/lib/registration/session";

type VerificationAction = "verified" | "rejected";

/** The most recently changed APPROVED assessment: the one that carries the household's pool status. */
function latestApproved(items: AssessmentListItem[]) {
  const when = (item: AssessmentListItem) => item.updatedAt ?? item.submittedAt ?? item.createdAt ?? "";
  return items.filter((item) => item.status === "APPROVED").sort((a, b) => when(b).localeCompare(when(a)))[0] ?? null;
}

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const { data: beneficiary, error, isLoading, reload, mutate } = useResource<BeneficiaryDetail>(
    `/bff/beneficiaries/${encodeURIComponent(id)}`,
  );
  // Assessment history: tells whether the bank account is settled, and
  // whether the household is in the user's branches.
  const branch = useBranchScope(beneficiary);
  const assessmentHistory = branch.assessments;
  // The detail GET has no pool status yet. The latest approved assessment
  // carries it, or for a fast-track household pooled without an assessment,
  // its whitelist entry.
  const approved = beneficiary?.poolStatus ? null : latestApproved(assessmentHistory ?? []);
  const { data: approvedAssessment } = useResource<Assessment>(
    approved ? `/bff/backoffice/assessments/${encodeURIComponent(approved.id)}` : null,
  );
  const {
    data: whitelistData,
    error: whitelistError,
    reload: reloadWhitelist,
  } = useResource<BeneficiaryWhitelist>(
    beneficiary && beneficiary.beneficiaryType !== "institution" ? requestPath(beneficiary.id) : null,
  );
  // Undefined until it is read: the bank lock fails closed meanwhile.
  const whitelist = whitelistError ? undefined : whitelistData;
  const fastTrackPool = whitelist?.current?.poolStatus;
  const poolStatus: PoolStatus | null =
    beneficiary?.poolStatus ??
    (isLivePoolStatus(fastTrackPool) ? fastTrackPool : null) ??
    approvedAssessment?.pool?.status ??
    null;
  useBreadcrumbLabel(beneficiary?.fullName);

  const [isEditingInstitution, setIsEditingInstitution] = useState(false);
  const [basicOpen, setBasicOpen] = useState(false);
  const [verificationAction, setVerificationAction] = useState<VerificationAction | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);
  // Left by registration ("Abebe K. is registered…"), shown once on the new profile.
  const [notice] = useNotice(`beneficiary:${id}`);

  useEffect(() => {
    // The setup token from registration lives in this tab's sessionStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPasswordPending(hasPendingPasswordSetup(id));
  }, [id]);

  if (isLoading && !beneficiary) {
    return <DetailSkeleton />;
  }

  if (!beneficiary) {
    return (
      <section className="space-y-6">
        <PageHeader title="Beneficiary" back={{ href: "/dashboard/beneficiary", label: "Beneficiaries" }} />
        {error?.status === 404 ? (
          // Retrying can't make a missing record appear.
          <InlineAlert>
            This beneficiary doesn&apos;t exist. Check the link, or search for the household in the Beneficiaries list.
          </InlineAlert>
        ) : (
          <ErrorAlert error={error} onRetry={reload} fallback="The beneficiary couldn't be loaded." />
        )}
      </section>
    );
  }

  const isInstitution = beneficiary.beneficiaryType === "institution";
  const isAdmin = session?.isAdmin ?? false;
  const canVerify =
    isAdmin &&
    beneficiary.verificationStatus !== "verified" &&
    beneficiary.verificationStatus !== "rejected";

  // Branch scope: only a confirmed answer allows changes (fails closed).
  const outOfScope = branch.scope === "out";
  const scopeChecked = branch.scope !== "checking";
  const canEdit = (session?.isStaff ?? false) && branch.scope === "in";

  // Bank account: settled once the assessment is with the branch or the
  // household is (about to be) pooled. Only ADMIN may change it then.
  const bankLock: BankLock = isInstitution
    ? null
    : bankLockFor({ isAdmin, assessments: assessmentHistory, poolStatus, whitelist });
  const canEditBank = canEdit && (bankLock === null || bankLock === "warn");

  // Merge: the PATCH answers leave out fields such as the lifecycle and BIN,
  // so keep what we had, then reload the full record.
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
        back={{ href: "/dashboard/beneficiary", label: "Beneficiaries" }}
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

      {outOfScope ? (
        <InlineAlert tone="info" title="This household belongs to another branch.">
          You can view it but not change it.
        </InlineAlert>
      ) : null}
      {branch.scope === "unknown" ? (
        <InlineAlert
          tone="warning"
          title="We couldn't check this household's branch."
          action={
            <Button variant="outline" size="sm" onClick={branch.reload}>
              <RotateCw />
              Retry
            </Button>
          }
        >
          You can view it, but changes are off until the check works. {branch.error?.message}
        </InlineAlert>
      ) : null}

      {passwordPending && !outOfScope ? (
        <InlineAlert
          tone="warning"
          title="No login password yet"
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href={passwordSetupHref(beneficiary.id)}>
                <KeyRound />
                Set password
              </Link>
            </Button>
          }
        >
          Registration stopped before the household&apos;s password was set. You can set it here until you
          close this browser tab or sign out.
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
                <InlineAlert tone="warning">
                  No bank account yet. Add it before the assessment is submitted. The household can&apos;t be paid
                  without one.
                </InlineAlert>
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
          ) : !scopeChecked ? (
            <PanelSkeleton rows={2} />
          ) : outOfScope ? (
            <Panel title="Assessments">
              <p className="text-sm text-black/60">Only staff of this household&apos;s branch can see its assessments.</p>
            </Panel>
          ) : (
            <BeneficiaryAssessments beneficiary={beneficiary} />
          )}
        </div>

        <div className="space-y-6">
          {isInstitution ? null : !scopeChecked ? (
            <PanelSkeleton rows={2} columns={1} />
          ) : outOfScope ? (
            <Panel title="Whitelist">
              <p className="text-sm text-black/60">Only staff of this household&apos;s branch can see its whitelist.</p>
            </Panel>
          ) : (
            <WhitelistPanel
              beneficiaryId={beneficiary.id}
              beneficiaryName={beneficiary.fullName}
              household={{ ...beneficiary, poolStatus }}
              onChanged={reloadWhitelist}
            />
          )}
          {!isInstitution && session?.isStaff ? (
            <LifecyclePanel
              beneficiaryId={beneficiary.id}
              canChange={isAdmin && !outOfScope}
              poolStatus={poolStatus}
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
          onSaved={applyUpdate}
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
