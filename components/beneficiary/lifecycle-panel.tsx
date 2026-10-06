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
import type {
  LifecycleAction,
  LifecycleHistory,
  LifecycleStatus,
} from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";

const ACTIONS: { value: LifecycleAction; label: string; hint: string }[] = [
  { value: "INACTIVE", label: "Pause (inactive)", hint: "Can't be assessed or pooled until reinstated." },
  { value: "REINSTATED", label: "Reinstate", hint: "Back to where they were before the pause." },
  { value: "GRADUATED", label: "Graduate", hint: "Left the programme self-sufficient. Final." },
  { value: "EXITED", label: "Exit", hint: "Left the programme for another reason. Final." },
];

const FINAL: LifecycleStatus[] = ["GRADUATED", "EXITED"];

function allowedActions(current: LifecycleStatus | null | undefined) {
  if (!current || FINAL.includes(current)) return [];
  if (current === "INACTIVE") return ACTIONS.filter((a) => a.value !== "INACTIVE");
  return ACTIONS.filter((a) => a.value !== "REINSTATED");
}

/** Lifecycle history for staff; ADMIN can pause, reinstate, graduate or exit. */
export function LifecyclePanel({
  beneficiaryId,
  canChange,
  onChanged,
}: {
  beneficiaryId: string;
  canChange: boolean;
  onChanged: (status: LifecycleStatus) => void;
}) {
  const path = `/api/backoffice/beneficiaries/${encodeURIComponent(beneficiaryId)}/lifecycle`;
  const { data, error, mutate } = useResource<LifecycleHistory>(path);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<LifecycleAction | "">("");
  const [reason, setReason] = useState("");

  const options = allowedActions(data?.lifecycleStatus);
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
        <p className="text-sm text-black/45">{error.status === 403 ? "History is visible to HQ staff only." : error.message}</p>
      ) : (
        <div className="space-y-4">
          <LifecycleBadge status={data?.lifecycleStatus} />
          {history.length === 0 ? (
            <p className="flex items-center gap-1.5 text-sm text-black/45">
              <History className="size-3.5" />
              No manual changes yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry, index) => (
                <li key={`${entry.changedAt}-${index}`} className="border-l-2 border-black/10 pl-3">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm text-[#001539]">
                    <LifecycleBadge status={entry.fromStatus as LifecycleStatus | null} />
                    <ArrowRight className="size-3 text-black/35" />
                    <LifecycleBadge status={entry.toStatus as LifecycleStatus} />
                  </p>
                  <p className="mt-1 text-xs text-black/50">
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
        description="A pooled beneficiary must be removed from the pool first, and an open assessment finished or cancelled."
        confirmLabel="Change status"
        destructive={action === "GRADUATED" || action === "EXITED"}
        confirmDisabled={!action || !reason.trim()}
        onConfirm={async () => {
          if (!action) return;
          const result = await apiClient<LifecycleHistory>(path, {
            method: "POST",
            body: JSON.stringify({ status: action, reason: reason.trim() }),
          });
          mutate(result);
          onChanged(result.lifecycleStatus);
          setAction("");
          setReason("");
        }}
      >
        <div className="space-y-4">
          <FormField
            label="New status"
            htmlFor="lifecycle-action"
            required
            hint={ACTIONS.find((item) => item.value === action)?.hint}
          >
            <NativeSelect
              id="lifecycle-action"
              value={action}
              onChange={(event) => setAction(event.target.value as LifecycleAction | "")}
            >
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
