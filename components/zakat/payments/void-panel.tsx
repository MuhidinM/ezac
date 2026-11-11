"use client";

import { useState } from "react";
import { Ban } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { formatEtb } from "@/lib/backoffice/format";
import type { ZakatPayment } from "@/lib/zakat/payments";

const API = "/bff/payments-admin/zakat-payments";

/**
 * Withdraw a paid payment, e.g. a test payment from before go-live. Its
 * certificate stops verifying and the amount leaves every total; no money
 * moves. Tucked away and confirmed twice, since it can't be undone.
 */
export function VoidPanel({
  payment,
  onVoided,
  onStale,
}: {
  payment: ZakatPayment;
  onVoided: (payment: ZakatPayment) => void;
  /** The payment changed meanwhile (409): reload it. */
  onStale: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [understood, setUnderstood] = useState(false);

  async function voidPayment() {
    try {
      onVoided(
        await apiClient<ZakatPayment>(`${API}/${encodeURIComponent(payment.paymentId)}/void`, {
          method: "POST",
          body: JSON.stringify({ reason: reason.trim() }),
        }),
      );
    } catch (voidError) {
      if (voidError instanceof ApiError && voidError.status === 409) {
        onStale();
        throw new Error(`${voidError.message} The payment has been reloaded.`);
      }
      throw voidError;
    }
  }

  return (
    <details className="rounded-xl border border-rose-200 p-4">
      <summary className="cursor-pointer text-sm font-medium text-rose-800">Void this payment</summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-black/70">
          Only for a payment that should never have counted, such as a test payment. The certificate
          {payment.certificateId ? (
            <>
              {" "}
              <span className="font-mono">{payment.certificateId}</span>
            </>
          ) : null}{" "}
          stops verifying and {formatEtb(payment.amountEtb)} leaves every total. No money moves: a refund to the donor is separate.
        </p>
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setReason("");
              setUnderstood(false);
              setOpen(true);
            }}
          >
            <Ban />
            Void payment
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Void this payment?"
        description={
          <>
            {formatEtb(payment.amountEtb)} from {payment.payerFullName?.trim() || "the donor"}.
            {payment.certificateId ? (
              <>
                {" "}
                Certificate <span className="font-mono">{payment.certificateId}</span> will show as not valid on the public check.
              </>
            ) : null}{" "}
            The amount leaves every total. No money moves. This can&apos;t be undone.
          </>
        }
        confirmLabel="Void payment"
        destructive
        confirmDisabled={!reason.trim() || !understood}
        onConfirm={voidPayment}
      >
        <div className="space-y-3">
          <FormField label="Reason" htmlFor="void-reason" required hint="Kept with the payment and in the audit log">
            <Textarea id="void-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
          <label className="flex items-start gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>I understand the donor&apos;s certificate stops being valid.</span>
          </label>
        </div>
      </ConfirmDialog>
    </details>
  );
}
