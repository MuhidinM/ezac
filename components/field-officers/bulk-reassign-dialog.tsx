"use client";

import { useState } from "react";
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
import type { Assessment, FieldOfficer } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import {
  type ReassignItem,
  groupByBranch,
  officersForBranch,
  runInOrder,
} from "@/lib/backoffice/bulk-reassign";

/** The officer's open work: the same statuses as the "Open assessments" count. */
const OPEN_STATUSES = "DRAFT,RETURNED";
const LIMIT = 100;

function assessmentName(item: ReassignItem) {
  const who = item.beneficiaryName ?? item.fullName ?? `Beneficiary #${item.beneficiaryId}`;
  return item.assessmentNumber ? `${who} (${item.assessmentNumber})` : who;
}

/**
 * Moves every open assessment of one field officer to other officers, one
 * branch at a time: the admin picks an officer of each branch, then the
 * assessments are reassigned one by one (the backend has no bulk call), with
 * progress, stopping at the first failure. Used before deactivating or moving
 * an officer, so their households aren't left with no one.
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
  /** Called after a run (complete or stopped) with a summary for the page. */
  onFinished: (summary: { message: string; complete: boolean }) => void;
}) {
  const query = new URLSearchParams({
    status: OPEN_STATUSES,
    officerId: officer.id,
    page: "1",
    limit: String(LIMIT),
  });
  const assessments = useResource<PaginatedItems<ReassignItem>>(
    open ? `/bff/backoffice/assessments?${query.toString()}` : null,
  );
  const officers = useResource<PaginatedItems<FieldOfficer>>(
    open ? "/bff/backoffice/admin/field-officers?active=true&page=1&limit=100" : null,
  );

  // Target officer per branch id.
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failure, setFailure] = useState<{ item: ReassignItem; error: unknown; done: number } | null>(null);

  // Start fresh each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTargets({});
      setProgress(null);
      setFailure(null);
      // useResource keeps the last list across a close; ask for a fresh one so
      // the run button waits for it (isLoading) instead of acting on old rows.
      assessments.reload();
    }
  }

  const items = assessments.data?.items ?? [];
  const groups = groupByBranch(items);
  const running = progress !== null && failure === null && progress.done < progress.total;
  const loading = (assessments.isLoading && !assessments.data) || (officers.isLoading && !officers.data);
  const allOfficers = officers.data?.items ?? [];
  const ready = groups.length > 0 && groups.every((group) => targets[group.branchId]);
  const more = (assessments.data?.pagination.totalItems ?? 0) - items.length;

  function nameOf(id: string) {
    return allOfficers.find((item) => item.id === id)?.fullName ?? "the new officer";
  }

  async function run() {
    // Branch by branch, in the order shown.
    const work = groups.flatMap((group) => group.items.map((item) => ({ item, to: targets[group.branchId] })));
    setFailure(null);
    setProgress({ done: 0, total: work.length });
    const result = await runInOrder(
      work,
      ({ item, to }) =>
        apiClient<Assessment>(`/bff/backoffice/assessments/${encodeURIComponent(item.id)}/reassign`, {
          method: "POST",
          body: JSON.stringify({ officerId: to }),
        }),
      (done) => setProgress({ done, total: work.length }),
    );

    // The officers this run sent work to (a target picked for a branch whose items already moved got none).
    const names = [...new Set(work.map(({ to }) => to))].map(nameOf).join(" and ");
    if (!result.failed) {
      onFinished({
        complete: true,
        message: `${result.done} open assessment${result.done === 1 ? "" : "s"} of ${officer.fullName} now belong${result.done === 1 ? "s" : ""} to ${names}.`,
      });
      onOpenChange(false);
      return;
    }
    setFailure({ item: result.failed.item.item, error: result.failed.error, done: result.done });
    // List only what is still theirs, so "Try the rest again" doesn't redo the moved ones.
    assessments.reload();
    onFinished({
      complete: false,
      message: `${result.done} of ${work.length} open assessments were reassigned before one failed. The rest still belong to ${officer.fullName}.`,
    });
  }

  function failureText(error: unknown) {
    const message = errorMessage(error, "The reassignment didn't go through.");
    // The backend names the officer by number; use their name.
    return error instanceof ApiError ? message.replace(/field officer \d+/i, "the chosen officer") : message;
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (running ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">Reassign open assessments</DialogTitle>
          <DialogDescription>
            Drafts and returned assessments of {officer.fullName} move to the officer you choose, who carries on from
            where they stopped. Only active officers of the assessment&apos;s branch can take them. Submitted
            assessments waiting for a branch decision stay as they are; reassign one from its own page if needed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p role="status" className="text-sm text-black/55">
            Loading their open assessments…
          </p>
        ) : null}
        <ErrorAlert error={assessments.error} onRetry={assessments.reload} fallback="Their assessments couldn't be loaded." />
        <ErrorAlert error={officers.error} onRetry={officers.reload} fallback="The officer list couldn't be loaded." />

        {!loading && assessments.data && items.length === 0 ? (
          <InlineAlert tone="success">{officer.fullName} has no open assessments.</InlineAlert>
        ) : null}

        {groups.length > 0 && officers.data ? (
          <div className="space-y-4">
            {groups.map((group) => {
              const candidates = officersForBranch(allOfficers, group.branchId, officer.id);
              const id = `bulk-reassign-${group.branchId || "unknown"}`;
              return (
                <FormField
                  key={group.branchId}
                  htmlFor={id}
                  required
                  label={`${group.branchName}: ${group.items.length} assessment${group.items.length === 1 ? "" : "s"}`}
                  hint={
                    candidates.length === 0
                      ? `No other active officer works in ${group.branchName}. Assign or move an officer to it first.`
                      : undefined
                  }
                >
                  <NativeSelect
                    id={id}
                    value={targets[group.branchId] ?? ""}
                    onChange={(event) => setTargets((prev) => ({ ...prev, [group.branchId]: event.target.value }))}
                    disabled={running || candidates.length === 0}
                  >
                    <option value="">{candidates.length === 0 ? "No officer available" : "Select an officer"}</option>
                    {candidates.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.fullName}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
              );
            })}
            {more > 0 ? (
              <p className="text-xs text-black/55">
                The first {items.length} are listed. Run this again afterwards for the other {more}.
              </p>
            ) : null}
          </div>
        ) : null}

        <div aria-live="polite" className="text-sm text-navy">
          {progress && !failure ? `Reassigned ${progress.done} of ${progress.total}…` : null}
        </div>

        {failure ? (
          <InlineAlert title={`Stopped at ${assessmentName(failure.item)}`}>
            {failureText(failure.error)} {failure.done} reassigned before it; the rest are unchanged.{" "}
            <Link href={`/dashboard/assessments/${failure.item.id}`} className="font-medium underline">
              Open that assessment
            </Link>
          </InlineAlert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={running}>
            {failure ? "Close" : "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={() => void run()}
            // While the list reloads (reopened, or after a failure) it still shows the old rows,
            // some of which may already belong to someone else: wait for the fresh one.
            disabled={!ready || items.length === 0 || assessments.isLoading}
            loading={running}
            loadingText={progress ? `Reassigning ${progress.done + 1} of ${progress.total}…` : "Reassigning…"}
          >
            <UserRoundCog />
            {failure ? "Try the rest again" : `Reassign ${items.length || ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
