"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CopyCheck, ExternalLink, GitCompareArrows } from "lucide-react";

import { DuplicateBadge } from "@/components/backoffice/status-badges";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  DuplicateCandidate,
  DuplicateResolution,
  DuplicateReview,
} from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { BeneficiaryDetail } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  national_id: "Same national ID",
  phone: "Same phone number",
  name_dob: "Same name and date of birth",
};

type Row = {
  label: string;
  value: (record: DuplicateCandidate) => string | null | undefined;
  /** Match reason that makes this row worth highlighting. */
  reason?: string;
};

const ROWS: Row[] = [
  { label: "Full name", value: (r) => r.fullName, reason: "name_dob" },
  { label: "Date of birth", value: (r) => r.dateOfBirth, reason: "name_dob" },
  { label: "Phone", value: (r) => r.phone, reason: "phone" },
  { label: "National ID", value: (r) => r.nationalId, reason: "national_id" },
  { label: "Woreda", value: (r) => r.woreda },
  { label: "Kebele", value: (r) => r.kebele },
  { label: "Branch", value: (r) => r.branchName },
  { label: "Registered", value: (r) => (r.createdAt ? formatDateTime(r.createdAt) : null) },
];

function normalise(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
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
  const router = useRouter();
  const encodedId = encodeURIComponent(id);

  const { data: beneficiary } = useResource<BeneficiaryDetail>(`/api/beneficiaries/${encodedId}`);
  const { data: review, error, isLoading, reload } = useResource<DuplicateReview>(
    `/api/backoffice/beneficiaries/${encodedId}/duplicate-review`,
  );

  const [resolution, setResolution] = useState<DuplicateResolution | "">("");
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolution) {
      setSubmitError("Choose an outcome.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient(`/api/backoffice/beneficiaries/${encodedId}/duplicate-review`, {
        method: "POST",
        body: JSON.stringify({ resolution, note: note.trim() || undefined }),
      });
      router.push(`/dashboard/beneficiary/${id}`);
    } catch (resolveError) {
      setSubmitError(errorMessage(resolveError, "Failed to resolve duplicate"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const current: DuplicateCandidate | null = beneficiary
    ? {
        id: beneficiary.id,
        fullName: beneficiary.fullName,
        phone: beneficiary.phone,
        nationalId: beneficiary.nationalId,
        dateOfBirth: beneficiary.dateOfBirth,
        woreda: beneficiary.woreda,
        kebele: beneficiary.kebele,
        branchName: beneficiary.branchName,
        createdAt: beneficiary.createdAt,
      }
    : null;

  const reasons = review?.reasons ?? [];
  const candidates = review?.candidates ?? [];
  const isOpen = review?.duplicateStatus === "POTENTIAL";

  return (
    <section className="space-y-6">
      <PageHeader
        back={{ href: `/dashboard/beneficiary/${id}`, label: "Back to profile" }}
        title="Duplicate review"
        meta={<DuplicateBadge status={review?.duplicateStatus} />}
        description="Compare this registration with the records it matched. Confirmed duplicates can't be assessed."
      />

      {error ? (
        <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
          {error.message}
        </InlineAlert>
      ) : null}

      {isLoading && !review ? <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" /> : null}

      {review ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-black/55">Matched on</span>
            {reasons.length === 0 ? (
              <span className="text-sm text-black/40">—</span>
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
                    <th className="w-40 px-5 py-3 font-medium text-black/50">Field</th>
                    <th className="px-4 py-3">
                      <span className="block text-xs font-medium text-[#007050]">This registration</span>
                      <span className="font-semibold text-[#001539]">{current?.fullName ?? "—"}</span>
                    </th>
                    {candidates.map((candidate, index) => (
                      <th key={candidate.id} className="px-4 py-3">
                        <span className="block text-xs font-medium text-black/45">Match {index + 1}</span>
                        <Link
                          href={`/dashboard/beneficiary/${candidate.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-semibold text-[#001539] hover:underline"
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
                      <td className="px-5 py-3 text-black/50">{row.label}</td>
                      <td className="px-4 py-3 text-[#001539]">{(current && row.value(current)) || "—"}</td>
                      {candidates.map((candidate) => {
                        const value = row.value(candidate);
                        const matches =
                          !!row.reason &&
                          reasons.includes(row.reason) &&
                          !!value &&
                          !!current &&
                          normalise(value) === normalise(row.value(current));
                        return (
                          <td
                            key={candidate.id}
                            className={cn(
                              "px-4 py-3 text-[#001539]",
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
                <div role="radiogroup" aria-label="Outcome" className="grid gap-3 md:grid-cols-2">
                  <OutcomeOption
                    selected={resolution === "CONFIRMED_DISTINCT"}
                    onSelect={() => setResolution("CONFIRMED_DISTINCT")}
                    title="Different people"
                    description="Keep both records. This registration can be assessed."
                  />
                  <OutcomeOption
                    selected={resolution === "CONFIRMED_DUPLICATE"}
                    onSelect={() => setResolution("CONFIRMED_DUPLICATE")}
                    title="Same person"
                    description="Mark this registration as a duplicate. It can't be assessed."
                    destructive
                  />
                </div>
                <FormField label="Note" htmlFor="duplicate-note" hint="Recorded with the decision">
                  <Textarea
                    id="duplicate-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="e.g. Same person registered twice at different branches"
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !resolution}>
                    <CopyCheck />
                    {isSubmitting ? "Saving…" : "Save decision"}
                  </Button>
                </div>
              </form>
            </Panel>
          ) : (
            <InlineAlert tone="info">
              This review has already been resolved
              {review.duplicateStatus === "CONFIRMED_DISTINCT" ? " as different people." : "."}
            </InlineAlert>
          )}
        </>
      ) : null}
    </section>
  );
}

function OutcomeOption({
  selected,
  onSelect,
  title,
  description,
  destructive,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "rounded-lg border p-4 text-left transition",
        selected
          ? destructive
            ? "border-rose-500 bg-rose-50/60 ring-1 ring-rose-500"
            : "border-[#007050] bg-[#007050]/[0.05] ring-1 ring-[#007050]"
          : "border-black/10 hover:border-black/20",
      )}
    >
      <span className="block text-sm font-semibold text-[#001539]">{title}</span>
      <span className="mt-0.5 block text-sm text-black/55">{description}</span>
    </button>
  );
}
