"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  BANK_CHANGE_REASON_MAX,
  bankDecisionErrorMessage,
  changedAccountFields,
  lockedBecauseLabel,
} from "@/lib/beneficiary/bank-change";
import { formatDateTime } from "@/lib/beneficiary/format";
import type { BankChangeAccount, BankChangeRequest, BankChangeStatus } from "@/lib/beneficiary/types";
import { cn } from "@/lib/utils";

export const BANK_CHANGE_STATUS: Record<BankChangeStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Waiting", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};

type Decision = "approve" | "reject";

const ROWS: { key: keyof BankChangeAccount; label: string; mono?: boolean }[] = [
  { key: "bankName", label: "Bank" },
  { key: "accountNumber", label: "Account number", mono: true },
  { key: "accountHolderName", label: "Account holder" },
];

/** One request: current and requested account side by side, with Approve and Reject while it waits. */
export function BankChangeCard({
  request,
  onDecided,
  onStale,
}: {
  request: BankChangeRequest;
  onDecided: (decision: Decision) => void;
  /** The request was already decided elsewhere: reload the list. */
  onStale: () => void;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const path = `/bff/backoffice/admin/bank-change-requests/${encodeURIComponent(request.id)}`;
  const changed = changedAccountFields(request.current, request.requested);
  const status = BANK_CHANGE_STATUS[request.status];
  const locked = lockedBecauseLabel(request.lockedBecause);

  async function decide() {
    if (!decision) return;
    await apiClient(`${path}/${decision}`, {
      method: "POST",
      ...(decision === "reject" ? { body: JSON.stringify({ reason: reason.trim() }) } : {}),
    }).catch((error: unknown) => {
      if (error instanceof ApiError && error.code === "BANK_CHANGE_NOT_PENDING") onStale();
      // Plain words for the known refusals; ConfirmDialog shows the message.
      const message = bankDecisionErrorMessage(error);
      throw message ? new Error(message) : error;
    });
    onDecided(decision);
    setReason("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status ? <Badge tone={status.tone}>{status.label}</Badge> : <Badge>{request.status}</Badge>}
        {locked ? <span className="text-xs text-black/60">Locked: {locked}</span> : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] bg-black/[0.015] text-left">
              <th className="w-36 px-3 py-2 font-medium text-black/60" />
              <th className="px-3 py-2 font-medium text-black/60">Current</th>
              <th className="px-3 py-2 font-medium text-black/60">Requested</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const differs = changed.has(row.key === "bankName" ? "bankCode" : row.key);
              const current = row.key === "bankName" ? (request.current?.bankName ?? request.current?.bankCode) : request.current?.[row.key];
              const requested =
                row.key === "bankName" ? (request.requested?.bankName ?? request.requested?.bankCode) : request.requested?.[row.key];
              return (
                <tr key={row.key} className="border-b border-black/[0.04] last:border-0">
                  <td className="px-3 py-2 text-black/60">{row.label}</td>
                  <td className={cn("px-3 py-2 text-navy", row.mono && "font-mono")}>{current || "—"}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-navy",
                      row.mono && "font-mono",
                      differs && "bg-amber-50 font-medium text-amber-900",
                    )}
                  >
                    {requested || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {request.reason ? (
        <p className="text-sm text-black/70">
          <span className="text-black/60">Reason: </span>
          {request.reason}
        </p>
      ) : null}

      {request.status !== "PENDING" ? (
        <p className="text-xs text-black/60">
          {status?.label ?? request.status} {formatDateTime(request.decidedAt ?? null)}
          {request.decidedByName ? ` by ${request.decidedByName}` : ""}
          {request.decisionReason ? `: ${request.decisionReason}` : ""}
        </p>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="destructive-outline" onClick={() => setDecision("reject")}>
            <X />
            Reject
          </Button>
          <Button size="sm" onClick={() => setDecision("approve")}>
            <Check />
            Approve
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={decision === "approve"}
        onOpenChange={(open) => setDecision(open ? "approve" : null)}
        title="Approve this bank account change?"
        description="Payments then go to the requested account. Approve only after checking it against the household's documents. The admin who asked for the change can't approve it."
        confirmLabel="Approve change"
        onConfirm={decide}
      />
      <ConfirmDialog
        open={decision === "reject"}
        onOpenChange={(open) => setDecision(open ? "reject" : null)}
        title="Reject this bank account change?"
        description="The account stays as it is. If you asked for this change, rejecting it withdraws the request."
        confirmLabel="Reject change"
        destructive
        confirmDisabled={!reason.trim()}
        onConfirm={decide}
      >
        <FormField label="Reason" htmlFor={`bank-change-reject-${request.id}`} required>
          <Textarea
            id={`bank-change-reject-${request.id}`}
            value={reason}
            maxLength={BANK_CHANGE_REASON_MAX}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </ConfirmDialog>
    </div>
  );
}
