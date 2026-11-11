"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { DetailList } from "@/components/dashboard/panel";
import { staffRef } from "@/components/zakat/staff-ref";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, isSameApprover } from "@/lib/api/errors";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { isOwnRequest, SAME_APPROVER_TEXT, type ZakatPayment } from "@/lib/zakat/payments";

const API = "/bff/payments-admin/zakat-payments";

type Decision = "approve" | "reject";

/**
 * Step two of a manual "Paid": another admin checks it and approves (the
 * certificate is issued) or rejects it (the payment goes back to where it
 * was). The admin who marked it paid sees that it waits for someone else.
 */
export function ApprovalPanel({
  payment,
  mySub,
  onDecided,
  onStale,
}: {
  payment: ZakatPayment;
  /** The signed-in admin's id; null when unknown. */
  mySub: string | null;
  onDecided: (payment: ZakatPayment, decision: Decision) => void;
  /** The payment changed meanwhile (409): reload it. */
  onStale: () => void;
}) {
  const own = isOwnRequest(payment, mySub);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [text, setText] = useState("");
  const received = payment.amountReceived;
  const differs = received != null && received !== payment.amountEtb;

  async function decide() {
    if (!decision) return;
    try {
      const next = await apiClient<ZakatPayment>(`${API}/${encodeURIComponent(payment.paymentId)}/${decision}`, {
        method: "POST",
        body: JSON.stringify(decision === "approve" ? (text.trim() ? { note: text.trim() } : {}) : { reason: text.trim() }),
      });
      onDecided(next, decision);
    } catch (decideError) {
      if (isSameApprover(decideError)) throw new Error(SAME_APPROVER_TEXT);
      if (decideError instanceof ApiError && decideError.status === 409) {
        onStale();
        throw new Error(`${decideError.message} The payment has been reloaded.`);
      }
      throw decideError;
    }
  }

  function open(next: Decision) {
    setText("");
    setDecision(next);
  }

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-navy">Marked paid: waiting for approval</p>
        <p className="mt-0.5 text-xs text-black/60">
          Check the reference and amount on the bank statement. Approving issues the Zakat certificate; rejecting puts the payment
          back where it was.
        </p>
      </div>
      <DetailList
        columns={2}
        items={[
          { label: "Marked paid by", value: staffRef(payment.requestedBy, payment.requestedByName) },
          { label: "Marked at", value: formatDateTime(payment.requestedAt ?? null) },
          { label: "Bank reference", value: payment.providerReference ? <span className="font-mono">{payment.providerReference}</span> : null },
          {
            label: "Amount received",
            value: received != null ? <span className={differs ? "text-amber-700" : undefined}>{formatEtb(received)}</span> : null,
          },
        ]}
      />
      {differs ? (
        <InlineAlert tone="warning">
          The amount received differs from the payment amount ({formatEtb(payment.amountEtb)}).
        </InlineAlert>
      ) : null}
      {payment.resolutionNote ? (
        <p className="rounded-lg bg-white/70 p-3 text-sm whitespace-pre-line text-black/70">{payment.resolutionNote}</p>
      ) : null}
      {own ? (
        <InlineAlert tone="info" title="Waiting for another admin">
          You marked this payment paid, so another admin must approve or reject it.
        </InlineAlert>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => open("reject")}>
            <X />
            Reject
          </Button>
          <Button onClick={() => open("approve")}>
            <Check />
            Approve
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(value) => !value && setDecision(null)}
        title={decision === "approve" ? "Approve this payment?" : "Reject this payment?"}
        description={
          decision === "approve" ? (
            <>
              {formatEtb(payment.amountEtb)}, bank reference <span className="font-mono">{payment.providerReference ?? "—"}</span>. The
              Zakat certificate is issued and the public certificate check shows it as genuine.
            </>
          ) : (
            <>The payment goes back to where it was before it was marked paid. No certificate is issued.</>
          )
        }
        confirmLabel={decision === "approve" ? "Approve and issue certificate" : "Reject"}
        destructive={decision === "reject"}
        confirmDisabled={decision === "reject" && !text.trim()}
        onConfirm={decide}
      >
        <FormField
          label={decision === "approve" ? "Note" : "Reason"}
          htmlFor="approval-text"
          required={decision === "reject"}
          hint={decision === "approve" ? "Optional, e.g. where you checked it" : "Why it isn't paid, e.g. not on the statement"}
        >
          <Textarea id="approval-text" rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
        </FormField>
      </ConfirmDialog>
    </div>
  );
}
