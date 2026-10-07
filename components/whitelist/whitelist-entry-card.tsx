"use client";

import { useState } from "react";
import { Ban, Check, FileText, X } from "lucide-react";

import { PoolStatusBadge, WhitelistBadge } from "@/components/backoffice/status-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { WhitelistEntry, WhitelistStatus } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { formatBytes } from "@/lib/backoffice/format";
import { WHITELIST_REASONS, labelFor } from "@/lib/backoffice/options";
import { formatDateTime } from "@/lib/beneficiary/format";

export const WHITELIST_STATUS: Record<WhitelistStatus, { label: string; tone: BadgeTone }> = {
  PENDING_APPROVAL: { label: "Pending approval", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  REJECTED: { label: "Rejected", tone: "neutral" },
  REVOKED: { label: "Revoked", tone: "neutral" },
};

/** Upstream evidence URL → our authenticated proxy. */
export function evidenceUrl(contentUrl: string | null | undefined, entryId: string, evidenceId: string) {
  const path = contentUrl?.replace(/^.*\/api\/beneficiaries\/v1\//, "") ?? `whitelist-entries/${entryId}/evidence/${evidenceId}/content`;
  return `/api/backoffice/${path}`;
}

type Decision = "approve" | "reject" | "revoke";

const DECISION_COPY: Record<Decision, { title: string; description: string; confirm: string; field: "comment" | "reason"; required: boolean; destructive?: boolean }> = {
  approve: {
    title: "Approve whitelist request",
    description: "The badge is added. A fast-track household appears in the disbursement pool queue straight away.",
    confirm: "Approve",
    field: "comment",
    required: false,
  },
  reject: {
    title: "Reject whitelist request",
    description: "The request is closed. Field officers or the branch can request again later.",
    confirm: "Reject",
    field: "reason",
    required: true,
    destructive: true,
  },
  revoke: {
    title: "Revoke whitelist",
    description:
      "The badge is removed. A fast-track household still waiting for the pool leaves the queue; one already pooled stays pooled (remove it from the pool separately).",
    confirm: "Revoke",
    field: "reason",
    required: true,
    destructive: true,
  },
};

/** One whitelist entry with its evidence; ADMIN gets approve / reject / revoke. */
export function WhitelistEntryCard({
  entry,
  canDecide,
  onChanged,
  compact,
}: {
  entry: WhitelistEntry;
  canDecide: boolean;
  onChanged: (entry: WhitelistEntry) => void;
  compact?: boolean;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [text, setText] = useState("");
  const status = WHITELIST_STATUS[entry.status] ?? { label: entry.status, tone: "neutral" as const };
  const copy = decision ? DECISION_COPY[decision] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <WhitelistBadge effect={entry.effect} />
        <Badge tone={status.tone}>{status.label}</Badge>
        <PoolStatusBadge status={entry.poolStatus} />
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-xs text-black/45">Reason</dt>
          <dd className="font-medium text-[#001539]">{labelFor(WHITELIST_REASONS, entry.reasonCode)}</dd>
        </div>
        {entry.justification ? (
          <div>
            <dt className="text-xs text-black/45">Justification</dt>
            <dd className="whitespace-pre-line text-black/70">{entry.justification}</dd>
          </div>
        ) : null}
        {entry.communityVerificationNote ? (
          <div>
            <dt className="text-xs text-black/45">Community verification</dt>
            <dd className="whitespace-pre-line text-black/70">{entry.communityVerificationNote}</dd>
          </div>
        ) : null}
        {!compact ? (
          <div className="text-xs text-black/50">
            Requested {formatDateTime(entry.requestedAt ?? null)}
            {entry.requestedByName ? ` by ${entry.requestedByName}` : ""}
            {entry.decidedAt ? ` · decided ${formatDateTime(entry.decidedAt)}${entry.decidedByName ? ` by ${entry.decidedByName}` : ""}` : ""}
          </div>
        ) : null}
        {entry.decisionComment ? <p className="text-xs text-black/60">Decision note: {entry.decisionComment}</p> : null}
        {entry.revocationReason ? <p className="text-xs text-black/60">Revoked: {entry.revocationReason}</p> : null}
      </dl>

      {(entry.evidence ?? []).length > 0 ? (
        <ul className="space-y-1.5">
          {entry.evidence!.map((file) => (
            <li key={file.id}>
              <a
                href={evidenceUrl(file.contentUrl, entry.id, file.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#007050] hover:underline"
              >
                <FileText className="size-3.5" />
                {file.fileName ?? "Evidence"}
                {file.sizeBytes ? <span className="text-xs text-black/40">{formatBytes(file.sizeBytes)}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {canDecide && (entry.status === "PENDING_APPROVAL" || entry.status === "ACTIVE") ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {entry.status === "PENDING_APPROVAL" ? (
            <>
              <Button size="sm" onClick={() => setDecision("approve")}>
                <Check />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDecision("reject")}>
                <X />
                Reject
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="text-rose-700 hover:text-rose-800" onClick={() => setDecision("revoke")}>
              <Ban />
              Revoke
            </Button>
          )}
        </div>
      ) : null}

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDecision(null);
            setText("");
          }
        }}
        title={copy?.title ?? ""}
        description={copy?.description}
        confirmLabel={copy?.confirm ?? "Confirm"}
        destructive={copy?.destructive}
        confirmDisabled={!!copy?.required && !text.trim()}
        onConfirm={async () => {
          if (!decision || !copy) return;
          const updated = await apiClient<WhitelistEntry>(
            `/api/backoffice/admin/whitelist/${encodeURIComponent(entry.id)}/${decision}`,
            { method: "POST", body: JSON.stringify(text.trim() ? { [copy.field]: text.trim() } : {}) },
          );
          setText("");
          onChanged(updated);
        }}
      >
        <FormField
          label={copy?.field === "comment" ? "Comment" : "Reason"}
          htmlFor="whitelist-decision"
          required={copy?.required}
          hint={copy?.required ? undefined : "Optional"}
        >
          <Textarea id="whitelist-decision" value={text} onChange={(event) => setText(event.target.value)} />
        </FormField>
      </ConfirmDialog>
    </div>
  );
}
