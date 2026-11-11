"use client";

import { type FormEvent, useState } from "react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceCards, type ChoiceOption } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, fieldErrorMap } from "@/lib/api/errors";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  amountReceivedProblem,
  isQr,
  type QrCloseBlock,
  resolveErrorText,
  type ZakatPayment,
} from "@/lib/zakat/payments";

const API = "/bff/payments-admin/zakat-payments";

type Outcome = "SUCCEEDED" | "FAILED";

/** Why "Not paid" is greyed out on an open QR payment, in words. */
function notPaidBlockText(block: QrCloseBlock) {
  return block.reason === "still-checking"
    ? `Not before ${formatDateTime(new Date(block.until).toISOString())}: until then the donor can still pay or the server is still checking.`
    : "Click Check now first, so EthQR is asked once more.";
}

/**
 * Settle a payment by hand. "Not paid" closes it at once; "Paid" is step one
 * of two: the payment waits for another admin to approve it, and only then is
 * the certificate issued.
 */
export function ResolveForm({
  payment,
  notPaidBlock,
  onResolved,
}: {
  payment: ZakatPayment;
  /** Set while an open QR payment can't be closed as not paid yet. */
  notPaidBlock: QrCloseBlock | null;
  onResolved: (payment: ZakatPayment) => void;
}) {
  const qr = isQr(payment);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reference, setReference] = useState("");
  const [received, setReceived] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const paid = outcome === "SUCCEEDED";
  const donor = payment.payerFullName?.trim() || "the donor";
  const receivedAmount = Number(received.trim());
  const amountDiffers = paid && received.trim() !== "" && Number.isFinite(receivedAmount) && receivedAmount !== payment.amountEtb;
  const outcomes: readonly ChoiceOption<Outcome>[] = qr
    ? [
        { value: "SUCCEEDED", label: "Paid", description: "Another admin approves it; then the certificate is issued" },
        {
          value: "FAILED",
          label: "Not paid",
          description: notPaidBlock ? notPaidBlockText(notPaidBlock) : "Close the payment as unpaid",
          disabled: notPaidBlock !== null,
          tone: "destructive",
        },
      ]
    : [
        { value: "SUCCEEDED", label: "Money moved", description: "Another admin approves it; then the certificate is issued" },
        { value: "FAILED", label: "No debit", description: "Mark failed", tone: "destructive" },
      ];
  // A "Not paid" picked before the block applied (e.g. the sheet reloaded) doesn't count.
  const chosen = outcome === "FAILED" && notPaidBlock ? null : outcome;

  // There's no undo, so the form only opens a confirm step that restates the outcome.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const receivedProblem = paid ? amountReceivedProblem(received) : null;
    setFieldErrors(receivedProblem ? { amountReceived: receivedProblem } : {});
    if (receivedProblem) return;
    setConfirming(true);
  }

  async function resolve() {
    try {
      const next = await apiClient<ZakatPayment>(`${API}/${encodeURIComponent(payment.paymentId)}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          status: chosen,
          ...(paid ? { providerReference: reference.trim(), amountReceived: receivedAmount } : {}),
          note: note.trim(),
        }),
      });
      onResolved(next);
    } catch (resolveError) {
      // Shown on the form, next to the fields, once the confirm step closes.
      setError(resolveErrorText(resolveError));
      if (resolveError instanceof ApiError) setFieldErrors(fieldErrorMap(resolveError.errors));
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <div>
          <p className="text-sm font-semibold text-navy">{qr ? "Confirm this QR payment" : "Settle this payment"}</p>
          <p className="mt-0.5 text-xs text-black/60">
            {qr ? (
              <>
                Only if automatic confirmation failed: find the bank&apos;s transaction of {formatEtb(payment.amountEtb)} around{" "}
                {formatDateTime(payment.createdAt)} in the EthQR list below, then record its reference.
              </>
            ) : (
              <>
                Ask Coop Bank quoting bank request number <span className="font-mono">{payment.messageId ?? "—"}</span>, then record their answer.
              </>
            )}
          </p>
        </div>
        {payment.failureReason ? <InlineAlert tone="warning">{payment.failureReason}</InlineAlert> : null}
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <FormField label="Outcome" required>
          {(control) => <ChoiceCards id={control.id} value={outcome} onValueChange={setOutcome} options={outcomes} required />}
        </FormField>
        {paid ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Bank reference" htmlFor="resolve-ref" required error={fieldErrors.providerReference}>
              <Input id="resolve-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="FT…" required className="font-mono" />
            </FormField>
            <FormField
              label="Amount received (ETB)"
              htmlFor="resolve-received"
              required
              hint={`As on the bank statement. The payment is for ${formatEtb(payment.amountEtb)}.`}
              error={fieldErrors.amountReceived}
            >
              <Input
                id="resolve-received"
                type="number"
                inputMode="decimal"
                min={0.01}
                step="0.01"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                required
                className="tabular-nums"
              />
            </FormField>
          </div>
        ) : null}
        {amountDiffers ? (
          <InlineAlert tone="warning">
            The amount received differs from the payment amount ({formatEtb(payment.amountEtb)}). Say why in the note.
          </InlineAlert>
        ) : null}
        <FormField
          label="Note"
          htmlFor="resolve-note"
          required
          hint={qr ? "How you matched it, e.g. time and amount" : "Who at Coop Bank confirmed, and when"}
          error={fieldErrors.note}
        >
          <Textarea id="resolve-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} required />
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" disabled={confirming || !chosen || !note.trim() || (paid && (!reference.trim() || !received.trim()))}>
            {qr ? "Record" : "Settle payment"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={paid ? "Mark this payment as paid?" : "Mark this payment as not paid?"}
        description={
          paid ? (
            <>
              {formatEtb(payment.amountEtb)} from {donor}, bank reference <span className="font-mono">{reference.trim()}</span>, received{" "}
              {Number.isFinite(receivedAmount) ? formatEtb(receivedAmount) : "—"}. Another admin must approve it before the Zakat
              certificate is issued. Only do this if the bank confirmed the money arrived.
            </>
          ) : (
            <>
              {formatEtb(payment.amountEtb)} from {donor}. The payment is closed as unpaid and no certificate is
              issued. Only do this if the bank confirmed no money arrived. This can&apos;t be undone.
            </>
          )
        }
        confirmLabel={paid ? "Mark as paid" : "Mark as not paid"}
        destructive={!paid}
        onConfirm={resolve}
      />
    </>
  );
}
