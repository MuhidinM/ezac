"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { CircleAlert, Clock } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { DetailList } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PoolEntry } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import { ApiError, fieldErrorMap } from "@/lib/api/errors";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  type Disbursement,
  disbursementStatus,
  type Fund,
  type FundAccounts,
  FUNDS,
  fundLabel,
  NAME_CHECK,
  payoutErrorMessage,
  RAIL_LABEL,
} from "@/lib/zakat/disbursements";
import { cn, generateId } from "@/lib/utils";

const API = "/bff/payments-admin/disbursements";

/** Confirm errors after which the payout is gone (cancelled or expired): prepare a new one. */
const PREPARE_AGAIN = new Set(["PAYOUT_EXPIRED", "NOT_POOLED", "FUND_ACCOUNT_NOT_SET"]);

function describeError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return { text: fallback, existingId: null as string | null };
  const existingId = (error.data as { disbursementId?: string } | null)?.disbursementId ?? null;
  return { text: payoutErrorMessage(error.code, error.message), existingId };
}

/** Bank details of a prepared payout, with the name check made prominent. */
export function PayoutReview({ payout }: { payout: Disbursement }) {
  const check = NAME_CHECK[payout.nameCheck];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/[0.08] bg-black/[0.015] p-4">
        <p className="text-xs text-black/50">Amount</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-[#001539] tabular-nums">{formatEtb(payout.amountEtb)}</p>
        <p className="mt-1 text-xs text-black/50">
          {RAIL_LABEL[payout.rail] ?? payout.rail} from the {fundLabel(payout.fund)} fund
          {payout.debitAccountName ? `, ${payout.debitAccountName}` : ""}
          {payout.debitAccount ? ` (${payout.debitAccount})` : ""}
        </p>
      </div>
      <DetailList
        columns={2}
        items={[
          { label: "Bank", value: payout.bankName },
          { label: "Account", value: <span className="font-mono">{payout.creditAccount}</span> },
          { label: "Name on file", value: payout.accountHolderName },
          { label: "Name at the bank", value: payout.verifiedName ?? "Not available" },
        ]}
      />
      <div className="flex items-start gap-2">
        <Badge tone={check.tone}>{check.label}</Badge>
        <span className="text-xs text-black/55">{check.hint}</span>
      </div>
    </div>
  );
}

/**
 * ADMIN pays one pooled household: prepare (account lookup, nothing paid),
 * review the bank details, then confirm within 15 minutes or cancel.
 */
export function PayoutDialog({
  entry,
  onClose,
  onFinished,
}: {
  entry: PoolEntry;
  onClose: () => void;
  onFinished: (payout: Disbursement) => void;
}) {
  const [amount, setAmount] = useState("");
  const [fund, setFund] = useState<Fund>("ZAKAT");
  const [note, setNote] = useState("");
  const funds = useResource<FundAccounts>(`${API}/funds`);
  // One idempotency key per payout: made when the dialog opens and re-sent on every retry of the
  // same request. A changed request (amount, fund, note) is a different payout and gets a new key.
  const attempt = useRef<{ body: string; key: string }>({ body: "", key: generateId() });
  const [payout, setPayout] = useState<Disbursement | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<{ text: string; existingId: string | null } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isWorking, setIsWorking] = useState(false);

  const name = entry.fullName ?? `Beneficiary #${entry.beneficiaryId}`;
  const prepared = payout?.status === "AWAITING_CONFIRMATION";
  const finished = payout && !prepared;

  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsWorking(true);
    try {
      const body = {
        ...(entry.source === "WHITELIST" ? { whitelistEntryId: entry.whitelistEntryId } : { assessmentId: entry.assessmentId }),
        amountEtb: Number(amount),
        fund,
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      const signature = JSON.stringify(body);
      if (attempt.current.body && attempt.current.body !== signature) attempt.current.key = generateId();
      attempt.current.body = signature;
      const next = await apiClient<Disbursement>(API, {
        method: "POST",
        body: JSON.stringify({ ...body, idempotencyKey: attempt.current.key }),
      });
      setPayout(next);
    } catch (prepareError) {
      setError(describeError(prepareError, "Couldn't prepare the payout"));
      if (prepareError instanceof ApiError) setFieldErrors(fieldErrorMap(prepareError.errors));
    } finally {
      setIsWorking(false);
    }
  }

  async function act(action: "confirm" | "cancel") {
    if (!payout) return;
    setError(null);
    setIsWorking(true);
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "confirm" && payout.nameCheck === "MISMATCH" ? { acknowledgeNameMismatch: acknowledged } : {}),
      });
      setPayout(next);
      if (action === "cancel") {
        onFinished(next);
        onClose();
      } else {
        onFinished(next);
      }
    } catch (actError) {
      setError(describeError(actError, action === "confirm" ? "Couldn't send the payout" : "Couldn't cancel the payout"));
      // Confirming is safe to retry, so keep the review open, unless the payout no longer exists.
      if (actError instanceof ApiError && actError.code && PREPARE_AGAIN.has(actError.code)) {
        setPayout(null);
        setAcknowledged(false);
        attempt.current = { body: "", key: generateId() };
      }
    } finally {
      setIsWorking(false);
    }
  }

  function close() {
    // A prepared payout that is neither confirmed nor cancelled expires by itself after 15 minutes.
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#001539]">{finished ? "Payout result" : prepared ? "Confirm the payout" : `Pay ${name}`}</DialogTitle>
          <DialogDescription>
            {finished
              ? name
              : prepared
                ? `Check the details, then confirm before ${formatDateTime(payout.expiresAt ?? null)}.`
                : "The account is looked up with the bank first; nothing is paid until you confirm."}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <InlineAlert>
            {error.text}
            {error.existingId ? (
              <>
                {" "}
                <Link href={`/dashboard/disbursements?open=${encodeURIComponent(error.existingId)}`} className="font-medium underline underline-offset-2">
                  Open it
                </Link>
              </>
            ) : null}
          </InlineAlert>
        ) : null}

        {!payout ? (
          <form onSubmit={prepare} className="space-y-4">
            <DetailList
              columns={2}
              items={[
                { label: "Bank", value: entry.bankAccount?.bankName },
                { label: "Account", value: <span className="font-mono">{entry.bankAccount?.accountNumber}</span> },
                { label: "Account holder", value: entry.bankAccount?.accountHolderName },
                { label: "Branch", value: entry.branchName },
              ]}
            />
            <FormField label="Pay from" htmlFor="payout-fund-ZAKAT" required error={fieldErrors.fund}>
              <div role="radiogroup" aria-label="Pay from" className="grid grid-cols-2 gap-2">
                {FUNDS.map((item) => {
                  const account = item.value === "ZAKAT" ? funds.data?.zakat : funds.data?.waqf;
                  const ready = account?.ready ?? false;
                  return (
                    <button
                      key={item.value}
                      id={`payout-fund-${item.value}`}
                      type="button"
                      role="radio"
                      aria-checked={fund === item.value}
                      disabled={!!funds.data && !ready}
                      onClick={() => setFund(item.value)}
                      className={cn(
                        "rounded-lg border bg-white p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                        fund === item.value ? "border-[#007050] ring-1 ring-[#007050]" : "border-black/10 hover:border-black/20",
                      )}
                    >
                      <span className="block text-sm font-semibold text-[#001539]">{item.label} fund</span>
                      <span className="mt-0.5 block font-mono text-xs text-black/55">
                        {funds.data ? (ready ? account?.accountNumber : "No account set") : "…"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FormField>
            {funds.error ? <InlineAlert tone="warning">Couldn&apos;t load the fund accounts: {funds.error.message}</InlineAlert> : null}
            <FormField label="Amount (ETB)" htmlFor="payout-amount" required error={fieldErrors.amountEtb}>
              <Input
                id="payout-amount"
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="tabular-nums"
              />
            </FormField>
            <FormField label="Note" htmlFor="payout-note" hint="e.g. October support" error={fieldErrors.note}>
              <Textarea id="payout-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isWorking || !(Number(amount) > 0) || (funds.data ? !(fund === "ZAKAT" ? funds.data.zakat : funds.data.waqf)?.ready : false)}
              >
                {isWorking ? "Looking up the account…" : "Review payout"}
              </Button>
            </DialogFooter>
          </form>
        ) : prepared ? (
          <div className="space-y-4">
            <PayoutReview payout={payout} />
            {payout.nameCheck === "MISMATCH" ? (
              <label className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-sm text-[#001539]">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 size-4 accent-[#007050]"
                />
                I compared the names and this is the right account.
              </label>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => act("cancel")} disabled={isWorking}>
                Cancel payout
              </Button>
              <Button onClick={() => act("confirm")} disabled={isWorking || (payout.nameCheck === "MISMATCH" && !acknowledged)}>
                {isWorking ? "Sending…" : `Pay ${formatEtb(payout.amountEtb)}`}
              </Button>
            </DialogFooter>
          </div>
        ) : payout ? (
          <div className="space-y-4">
            <PayoutOutcome payout={payout} />
            <DialogFooter>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PayoutOutcome({ payout }: { payout: Disbursement }) {
  const status = disbursementStatus(payout.status);
  if (payout.status === "SUCCEEDED") {
    return (
      <InlineAlert tone="success" title={`${formatEtb(payout.amountEtb)} paid`}>
        Bank reference <span className="font-mono">{payout.providerReference ?? "—"}</span>. The household has left the pool.
        {payout.poolUpdated === false ? " (The pool updates within a minute.)" : ""}
      </InlineAlert>
    );
  }
  if (payout.status === "PROCESSING") {
    return (
      <InlineAlert tone="warning" title="Needs checking">
        The bank gave no clear answer, so the money may or may not have moved. Ask Coop Bank quoting message id{" "}
        <span className="font-mono">{payout.messageId ?? "—"}</span> and settle it on the Payouts page.
      </InlineAlert>
    );
  }
  return (
    <div className="flex items-start gap-2 text-sm text-black/70">
      {payout.status === "FAILED" ? <CircleAlert className="mt-0.5 size-4 text-rose-600" /> : <Clock className="mt-0.5 size-4" />}
      <span>
        <Badge tone={status.tone}>{status.label}</Badge>
        {payout.failureReason ? <span className="mt-1 block">{payout.failureReason}</span> : null}
        {payout.status === "FAILED" ? <span className="mt-1 block text-xs text-black/50">The household stays pooled; you can prepare a new payout.</span> : null}
      </span>
    </div>
  );
}
