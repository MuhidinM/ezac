"use client";

import { useState } from "react";
import { ArrowRight, History } from "lucide-react";

import { LifecycleBadge } from "@/components/backoffice/status-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { LifecycleHistory, LifecycleStatus } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { allowedLifecycleChoices, lifecycleBlockedReason } from "@/lib/beneficiary/household-actions";
import type { LifecycleMove } from "@/lib/beneficiary/types";

/**
 * Lifecycle history for staff; ADMIN can pause, reinstate, graduate, exit or
 * reopen. Which changes are possible comes from the backend
 * (`GET …/lifecycle/moves`), with its reason when none is.
 */
export function LifecyclePanel({
  beneficiaryId,
  canChange,
  onChanged,
}: {
  beneficiaryId: string;
  canChange: boolean;
  onChanged: (status: LifecycleStatus) => void;
}) {
  const path = `/bff/backoffice/beneficiaries/${encodeURIComponent(beneficiaryId)}/lifecycle`;
  const { data, error, mutate } = useResource<LifecycleHistory>(path);
  const { data: moves, error: movesError, reload: reloadMoves } = useResource<LifecycleMove[]>(
    canChange ? `${path}/moves` : null,
  );
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");

  const options = allowedLifecycleChoices(moves);
  const blocked = lifecycleBlockedReason(moves);
  const chosen = options.find((item) => item.value === action);
  const history = [...(data?.history ?? [])].reverse();

  return (
    <Panel
      title="Lifecycle"
      actions={
        canChange && options.length > 0 ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Change status
          </Button>
        ) : null
      }
    >
      {error ? (
        <p className="text-sm text-black/60">{error.status === 403 ? "History is visible to HQ staff only." : error.message}</p>
      ) : (
        <div className="space-y-4">
          <LifecycleBadge status={data?.lifecycleStatus} />
          {canChange && blocked ? <p className="text-sm text-black/60">{blocked}</p> : null}
          {canChange && movesError ? (
            <p className="text-sm text-black/60">
              We couldn&apos;t check which changes are possible.{" "}
              <button type="button" className="text-brand hover:underline" onClick={reloadMoves}>
                Try again
              </button>
            </p>
          ) : null}
          {history.length === 0 ? (
            <p className="flex items-center gap-1.5 text-sm text-black/60">
              <History className="size-3.5" />
              No manual changes yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry, index) => (
                <li key={`${entry.changedAt}-${index}`} className="border-l-2 border-black/10 pl-3">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm text-navy">
                    <LifecycleBadge status={entry.fromStatus as LifecycleStatus | null} />
                    <ArrowRight className="size-3 text-black/35" />
                    <LifecycleBadge status={entry.toStatus as LifecycleStatus} />
                  </p>
                  <p className="mt-1 text-xs text-black/60">
                    {[entry.changedByName, formatDateTime(entry.changedAt)].filter(Boolean).join(" · ")}
                  </p>
                  {entry.reason ? <p className="mt-0.5 text-sm text-black/65">{entry.reason}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Change lifecycle status"
        description="Only the changes allowed for this household right now are listed."
        confirmLabel="Change status"
        destructive={chosen?.final ?? false}
        confirmDisabled={!action || !reason.trim()}
        onConfirm={async () => {
          if (!action) return;
          const result = await apiClient<LifecycleHistory>(path, {
            method: "POST",
            body: JSON.stringify({ status: action, reason: reason.trim() }),
          });
          mutate(result);
          onChanged(result.lifecycleStatus);
          reloadMoves();
          setAction("");
          setReason("");
        }}
      >
        <div className="space-y-4">
          <FormField label="New status" htmlFor="lifecycle-action" required hint={chosen?.hint}>
            <NativeSelect id="lifecycle-action" value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="">Select</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Reason" htmlFor="lifecycle-reason" required>
            <Textarea id="lifecycle-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </FormField>
        </div>
      </ConfirmDialog>
    </Panel>
  );
}
