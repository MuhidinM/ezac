"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { UserRoundCog } from "lucide-react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { FieldOfficer } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import {
  type ReassignBody,
  type ReassignFailure,
  activeBranchIds,
  officersForBranches,
  reassignFailures,
  reassignedCount,
} from "@/lib/backoffice/bulk-reassign";

const REASON_MAX = 500;

/**
 * Moves every open assessment of one field officer to another officer in one
 * step. All of them move or none do; when one can't, the dialog lists why.
 * Used before deactivating or moving an officer, so their households aren't
 * left with no one.
 */
export function BulkReassignDialog({
  officer,
  open,
  onOpenChange,
  onFinished,
}: {
  officer: FieldOfficer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful move with a summary for the page. */
  onFinished: (message: string) => void;
}) {
  const officers = useResource<PaginatedItems<FieldOfficer>>(
    open ? "/bff/backoffice/admin/field-officers?active=true&page=1&limit=100" : null,
  );

  const [target, setTarget] = useState("");
  const [includeSubmitted, setIncludeSubmitted] = useState(false);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [failures, setFailures] = useState<ReassignFailure[]>([]);

  // Start fresh each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTarget("");
      setIncludeSubmitted(false);
      setReason("");
      setError(null);
      setFailures([]);
    }
  }

  const branchIds = activeBranchIds(officer);
  const candidates = officersForBranches(officers.data?.items ?? [], branchIds, officer.id);
  const loading = officers.isLoading && !officers.data;
  const openCount = officer.openAssessments ?? 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || !reason.trim()) return;
    setIsSaving(true);
    setError(null);
    setFailures([]);
    const body: ReassignBody = { toFieldOfficerId: target, includeSubmitted, reason: reason.trim() };
    try {
      const answer = await apiClient<unknown>(
        `/bff/backoffice/admin/field-officers/${encodeURIComponent(officer.id)}/reassign-assessments`,
        { method: "POST", body: JSON.stringify(body) },
      );
      const count = reassignedCount(answer);
      const to = candidates.find((item) => item.id === target)?.fullName ?? "the chosen officer";
      onFinished(
        count === null
          ? `The open assessments of ${officer.fullName} now belong to ${to}.`
          : count === 0
            ? `${officer.fullName} had no open assessments to move.`
            : `${count} assessment${count === 1 ? "" : "s"} of ${officer.fullName} now belong${count === 1 ? "s" : ""} to ${to}.`,
      );
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError);
      if (saveError instanceof ApiError && saveError.code === "REASSIGN_FAILED") {
        setFailures(reassignFailures(saveError));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (isSaving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-navy">Reassign open assessments</DialogTitle>
            <DialogDescription>
              {openCount > 0
                ? `The ${openCount} draft and returned assessment${openCount === 1 ? "" : "s"} of ${officer.fullName} move`
                : `Drafts and returned assessments of ${officer.fullName} move`}{" "}
              to the officer you choose, who carries on from where they stopped. All of them move, or none do.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p role="status" className="text-sm text-black/60">
              Loading officers…
            </p>
          ) : null}
          <ErrorAlert error={officers.error} onRetry={officers.reload} fallback="The officer list couldn't be loaded." />

          {officers.data ? (
            <FormField
              label="New officer"
              htmlFor="bulk-reassign-to"
              required
              hint={
                candidates.length === 0
                  ? "No other active officer works in this officer's branch. Assign or move an officer to it first."
                  : "Only active officers of the same branch can take them."
              }
            >
              <NativeSelect
                id="bulk-reassign-to"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                disabled={isSaving || candidates.length === 0}
                required
              >
                <option value="">{candidates.length === 0 ? "No officer available" : "Select an officer"}</option>
                {candidates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : null}

          <label className="flex items-start gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={includeSubmitted}
              onChange={(event) => setIncludeSubmitted(event.target.checked)}
              disabled={isSaving}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>
              Also move submitted assessments
              <span className="block text-xs text-black/60">Those waiting for a branch decision.</span>
            </span>
          </label>

          <FormField label="Reason" htmlFor="bulk-reassign-reason" required hint="Kept in the assessments' history.">
            <Textarea
              id="bulk-reassign-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={REASON_MAX}
              placeholder="e.g. Officer is leaving the branch"
              disabled={isSaving}
              required
            />
          </FormField>

          {failures.length > 0 ? (
            <InlineAlert title="Nothing was moved">
              <p>These assessments can&apos;t go to the chosen officer:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {failures.map((failure, index) => (
                  <li key={`${failure.assessmentId ?? "item"}-${index}`}>
                    {failure.assessmentId ? (
                      <Link href={`/dashboard/assessments/${encodeURIComponent(failure.assessmentId)}`} className="font-medium underline">
                        Assessment {failure.assessmentId}
                      </Link>
                    ) : null}
                    {failure.assessmentId ? ": " : null}
                    {failure.message}
                  </li>
                ))}
              </ul>
            </InlineAlert>
          ) : (
            <ErrorAlert error={error} fallback="The assessments couldn't be reassigned." />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!target || !reason.trim() || candidates.length === 0}
              loading={isSaving}
              loadingText="Reassigning…"
            >
              <UserRoundCog />
              Reassign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
