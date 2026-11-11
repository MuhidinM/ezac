"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CopyCheck, ExternalLink, GitCompareArrows } from "lucide-react";

import { DuplicateBadge } from "@/components/backoffice/status-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useBreadcrumbLabel } from "@/components/dashboard/dashboard-header";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { DetailSkeleton } from "@/components/dashboard/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import type {
  BankAccount,
  DuplicateCandidate,
  DuplicateResolution,
  DuplicateReview,
} from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import type { BeneficiaryDetail } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const OUTCOMES = [
  {
    value: "CONFIRMED_DISTINCT",
    label: "Different people",
    description: "Keep both records. This registration can be assessed.",
  },
  {
    value: "CONFIRMED_DUPLICATE",
    label: "Same person",
    description: "Mark this registration as a duplicate. It can't be assessed.",
    tone: "destructive",
  },
] as const satisfies readonly { value: DuplicateResolution; label: string; description: string; tone?: "destructive" }[];

const REASON_LABELS: Record<string, string> = {
  bank_account: "Same bank account",
  phone: "Same phone number",
  name_dob: "Same name and date of birth",
};

/** A compared record; candidates may carry the bank account once the backend sends it. */
type CompareRecord = DuplicateCandidate & {
  bankAccount?: BankAccount | null;
  bankAccountNumber?: string | null;
};

/** The review plus who resolved it and why, when the backend sends that. */
type Review = DuplicateReview & {
  resolvedAt?: string | null;
  resolvedByName?: string | null;
  resolutionNote?: string | null;
};

type Row = {
  label: string;
  value: (record: CompareRecord) => string | null | undefined;
  /** Match reason that makes this row worth highlighting. */
  reason?: string;
  /** True when the record came without this value at all (not "empty"). */
  notSent?: (record: CompareRecord) => boolean;
  mono?: boolean;
};

const ROWS: Row[] = [
  { label: "Full name", value: (r) => r.fullName, reason: "name_dob" },
  { label: "Date of birth", value: (r) => r.dateOfBirth, reason: "name_dob" },
  { label: "Phone", value: (r) => r.phone, reason: "phone" },
  {
    label: "Bank account",
    value: (r) => r.bankAccount?.accountNumber ?? r.bankAccountNumber,
    reason: "bank_account",
    notSent: (r) => !("bankAccount" in r) && !("bankAccountNumber" in r),
    mono: true,
  },
  { label: "Woreda", value: (r) => r.woreda },
  { label: "Kebele", value: (r) => r.kebele },
  { label: "Branch", value: (r) => r.branchName },
  { label: "Registered", value: (r) => (r.createdAt ? formatDateTime(r.createdAt) : null) },
];

/** Notes shorter than this don't explain a decision. */
const MIN_NOTE = 10;

/** Comparable text; numbers (mono rows) ignore spaces and dashes. */
function normalise(value: string | null | undefined, compact = false) {
  const text = (value ?? "").trim().toLowerCase();
  return compact ? text.replace(/[\s-]/g, "") : text;
}

function resolvedTitle(review: Review) {
  if (review.duplicateStatus === "CONFIRMED_DISTINCT") return "Resolved: different people.";
  if (review.duplicateStatus === "CONFIRMED_DUPLICATE") return "Resolved: the same person. This registration is a duplicate.";
  return "There is no open duplicate review.";
}

export default function DuplicateReviewPage() {
  return (
    <RequireRole audience={["hq"]}>
      <DuplicateReviewView />
    </RequireRole>
  );
}

function DuplicateReviewView() {
  const { id } = useParams<{ id: string }>();
  const encodedId = encodeURIComponent(id);

  const {
    data: beneficiary,
    error: beneficiaryError,
    reload: reloadBeneficiary,
  } = useResource<BeneficiaryDetail>(`/bff/beneficiaries/${encodedId}`);
  const { data: review, error, isLoading, reload } = useResource<Review>(
    `/bff/backoffice/beneficiaries/${encodedId}/duplicate-review`,
  );
  // The middle crumb names the household instead of reading "Details".
  useBreadcrumbLabel(beneficiary?.fullName, `/dashboard/beneficiary/${id}`);

  const [resolution, setResolution] = useState<DuplicateResolution | "">("");
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState<DuplicateResolution | null>(null);

  // Check the form, then ask for confirmation: the decision is final.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolution) {
      setSubmitError("Choose an outcome.");
      return;
    }
    if (note.trim().length < MIN_NOTE) {
      setSubmitError("Add a note that says how you checked.");
      return;
    }
    setSubmitError(null);
    setConfirmOpen(true);
  }

  /** Throws to keep the confirmation open with the error. */
  async function resolve() {
    if (!resolution) return;
    await apiClient(`/bff/backoffice/beneficiaries/${encodedId}/duplicate-review`, {
      method: "POST",
      body: JSON.stringify({ resolution, note: note.trim() }),
    });
    setSaved(resolution);
    setResolution("");
    setNote("");
    reload();
  }

  const current: CompareRecord | null = beneficiary
    ? {
        id: beneficiary.id,
        fullName: beneficiary.fullName,
        phone: beneficiary.phone,
        dateOfBirth: beneficiary.dateOfBirth,
        woreda: beneficiary.woreda,
        kebele: beneficiary.kebele,
        branchName: beneficiary.branchName,
        createdAt: beneficiary.createdAt,
        bankAccount: beneficiary.bankAccount ?? null,
      }
    : null;

  const reasons = review?.reasons ?? [];
  const candidates: CompareRecord[] = review?.candidates ?? [];
  const isOpen = review?.duplicateStatus === "POTENTIAL" && !saved;
  const sharesBank = reasons.includes("bank_account");

  return (
    <section className="space-y-6">
      <PageHeader
        back={{ href: `/dashboard/beneficiary/${id}`, label: "Back to profile" }}
        title="Duplicate review"
        documentTitle={beneficiary?.fullName ? `Duplicate review · ${beneficiary.fullName}` : undefined}
        meta={<DuplicateBadge status={review?.duplicateStatus} />}
        description="Compare this registration with the records it matched. Confirmed duplicates can't be assessed."
      />

      <ErrorAlert error={error} onRetry={reload} />

      {!beneficiary ? <ErrorAlert error={beneficiaryError} onRetry={reloadBeneficiary} /> : null}

      {isLoading && !review ? <DetailSkeleton header={false} side={false} /> : null}

      {saved ? (
        <InlineAlert
          tone="success"
          title="Decision saved."
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/beneficiary/${id}`}>Back to profile</Link>
            </Button>
          }
        >
          {saved === "CONFIRMED_DUPLICATE"
            ? "This registration is marked as a duplicate and can't be assessed. To close it, an administrator can set its status to Exit on the profile."
            : "Both records stay. This registration can now be assessed."}
        </InlineAlert>
      ) : null}

      {review ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-black/60">Matched on</span>
            {reasons.length === 0 ? (
              <span className="text-sm text-black/60">—</span>
            ) : (
              reasons.map((reason) => (
                <Badge key={reason} tone="warning">
                  {REASON_LABELS[reason] ?? reason}
                </Badge>
              ))
            )}
          </div>

          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <GitCompareArrows className="size-4 text-black/45" />
                Side-by-side comparison
              </span>
            }
            description="Highlighted cells are the values that triggered the match."
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-black/[0.015] text-left">
                    <th className="w-40 px-5 py-3 font-medium text-black/60">Field</th>
                    <th className="px-4 py-3">
                      <span className="block text-xs font-medium text-brand">This registration</span>
                      <span className="font-semibold text-navy">{current?.fullName ?? "—"}</span>
                    </th>
                    {candidates.map((candidate, index) => (
                      <th key={candidate.id} className="px-4 py-3">
                        <span className="block text-xs font-medium text-black/60">Match {index + 1}</span>
                        <Link
                          href={`/dashboard/beneficiary/${candidate.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-semibold text-navy hover:underline"
                        >
                          {candidate.fullName ?? "Unnamed"}
                          <ExternalLink className="size-3 text-black/35" />
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-black/[0.04] last:border-0">
                      <td className="px-5 py-3 text-black/60">{row.label}</td>
                      <td className={cn("px-4 py-3 text-navy", row.mono && "font-mono")}>
                        {(current && row.value(current)) || "—"}
                      </td>
                      {candidates.map((candidate) => {
                        if (row.notSent?.(candidate)) {
                          return (
                            <td key={candidate.id} className="px-4 py-3 text-black/60">
                              Not shown here
                            </td>
                          );
                        }
                        const value = row.value(candidate);
                        const matches =
                          !!row.reason &&
                          reasons.includes(row.reason) &&
                          !!value &&
                          !!current &&
                          normalise(value, row.mono) === normalise(row.value(current), row.mono);
                        return (
                          <td
                            key={candidate.id}
                            className={cn(
                              "px-4 py-3 text-navy",
                              row.mono && "font-mono",
                              matches && "bg-amber-50 font-medium text-amber-900",
                            )}
                          >
                            {value || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {isOpen ? (
            <Panel title="Resolve">
              <form onSubmit={onSubmit} className="space-y-4">
                {submitError ? <InlineAlert>{submitError}</InlineAlert> : null}
                {/* Not `required`: Radix then adds hidden native radios with no name, and a
                    browser that follows the spec (Firefox) treats the unchosen one as missing and
                    blocks the form. onSubmit checks for an outcome instead. */}
                <ChoiceCards
                  aria-label="Outcome"
                  value={resolution || null}
                  onValueChange={setResolution}
                  options={OUTCOMES}
                />
                <FormField
                  label="Note"
                  htmlFor="duplicate-note"
                  required
                  hint="Say how you checked. It is recorded with the decision."
                >
                  <Textarea
                    id="duplicate-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="e.g. Same person registered twice at different branches"
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!resolution}>
                    <CopyCheck />
                    Save decision
                  </Button>
                </div>
              </form>
            </Panel>
          ) : saved ? null : (
            <InlineAlert tone="info" title={resolvedTitle(review)}>
              {review.resolvedAt || review.resolvedByName ? (
                <p>
                  Decided{" "}
                  {[
                    review.resolvedByName ? `by ${review.resolvedByName}` : null,
                    review.resolvedAt ? formatDateTime(review.resolvedAt) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {review.resolutionNote ? <p className="mt-1">Note: {review.resolutionNote}</p> : null}
            </InlineAlert>
          )}

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={resolution === "CONFIRMED_DUPLICATE" ? "Mark as the same person?" : "Keep both records?"}
            description={
              resolution === "CONFIRMED_DUPLICATE"
                ? "This registration will be marked as a duplicate and can't be assessed. This can't be undone in the portal."
                : `This registration can then be assessed.${
                    sharesBank ? " Both households will be paid into the same bank account." : ""
                  } This can't be undone in the portal.`
            }
            confirmLabel={resolution === "CONFIRMED_DUPLICATE" ? "Mark as duplicate" : "Keep both"}
            destructive={resolution === "CONFIRMED_DUPLICATE"}
            onConfirm={resolve}
          />
        </>
      ) : null}
    </section>
  );
}
