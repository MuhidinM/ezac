"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { CircleAlert, Clock, Users } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { DetailList } from "@/components/dashboard/panel";
import { isTestRail, PaymentModeBanner, usePaymentMode } from "@/components/zakat/payment-mode-banner";
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
import { ApiError, fieldErrorMap } from "@/lib/api/errors";
import { newIdempotencyKey } from "@/lib/api/idempotency";
import { useResource } from "@/lib/api/use-resource";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  bankChangedRecently,
  type Disbursement,
  disbursementStatus,
  type FundAccounts,
  fundLabel,
  nameCheckOf,
  PAYOUT_FUND,
  PAYOUT_MAX_ETB,
  PAYOUT_MIN_ETB,
  payoutErrorCode,
  payoutErrorMessage,
  payoutTimeLeft,
  RAIL_LABEL,
  timeLeftText,
  withStop,
} from "@/lib/zakat/disbursements";
import { cn } from "@/lib/utils";

const API = "/bff/payments-admin/disbursements";

/** The payout already open for the household (DISBURSEMENT_EXISTS sends its id). */
function describeError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return { text: fallback, existingId: null as string | null };
  const existingId = (error.data as { disbursementId?: string } | null)?.disbursementId ?? null;
  return { text: payoutErrorMessage(error.code, error.message, error.data), existingId };
}

/** The known payout error code of a failed call, if any. */
export function payoutCodeOf(error: unknown) {
  return error instanceof ApiError ? payoutErrorCode(error.code, error.message) : null;
}

/**
 * A failed confirm that may still have reached the bank: no answer at all, a
 * timeout or a server error. A 4xx means the backend refused it, so nothing moved.
 */
export function mayHaveReachedBank(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  return error.status === 0 || error.status === 408 || error.status >= 500;
}

/** Reads one payout again; null when that fails too. */
export async function readPayout(id: string) {
  try {
    return await apiClient<Disbursement>(`${API}/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

/** How far the browser clock is ahead of the server's, in ms; null until read. */
let clockOffset: number | null = null;
let clockSync: Promise<void> | null = null;

/**
 * Reads the server's time once per page load from the Date header of an
 * uncached answer, until a payout brings its own `serverTime`.
 */
function syncClock() {
  clockSync ??= (async () => {
    const sent = Date.now();
    const response = await fetch("/bff/health", { cache: "no-store" });
    const received = Date.now();
    const serverTime = Date.parse(response.headers.get("Date") ?? "");
    if (!Number.isFinite(serverTime)) throw new Error("No Date header");
    // The header was stamped somewhere during the round trip: take the middle.
    if (clockOffset === null) clockOffset = (sent + received) / 2 - serverTime;
  })().catch(() => {
    // Try again on the next mount; until then nothing is treated as expired here.
    clockSync = null;
  });
  return clockSync;
}

/** Sets the clock from a payout's `serverTime` (the server's clock when it answered). */
function noteServerTime(serverTime: string | null | undefined) {
  const at = Date.parse(serverTime ?? "");
  if (Number.isFinite(at)) clockOffset = Date.now() - at;
}

/**
 * The server's current time (the browser clock corrected by the server's),
 * updated every `intervalMs`; null until the server's time is known. Pass a
 * payout's `serverTime` to set the clock from it: a browser clock or time zone
 * set wrong must not change the time left to confirm.
 */
export function useServerNow(intervalMs: number, serverTime?: string | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!cancelled && clockOffset !== null) setNow(Date.now() - clockOffset);
    };
    if (serverTime) {
      noteServerTime(serverTime);
      tick();
    } else {
      void syncClock().then(tick);
    }
    const timer = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [intervalMs, serverTime]);
  return now;
}

/** A prepared payout whose 24 hours are up (by the server's clock) can't be confirmed any more. */
export function isExpired(payout: Pick<Disbursement, "status" | "expiresAt">, now: number | null) {
  const left = payoutTimeLeft(payout, now);
  return left !== null && left <= 0;
}

/** "Confirm by 12 Nov, 09:30 (23 h 10 min left)" for a prepared payout. */
export function confirmByText(payout: Pick<Disbursement, "status" | "expiresAt">, now: number | null) {
  const left = payoutTimeLeft(payout, now);
  const by = formatDateTime(payout.expiresAt ?? null);
  const remaining = left !== null ? timeLeftText(left) : null;
  return remaining ? `${by} (${remaining.toLowerCase()})` : by;
}

/** Shown when a call failed but a re-read shows the payout has moved on. */
export const CHECKED_AGAIN = "The request didn't finish, so we checked the payout again. This is where it stands now.";

/** The error text after a confirm that may have reached the bank, before the status is checked again. */
export function unsureConfirmText(message: string, stillPrepared: boolean) {
  return `${withStop(message)} ${stillPrepared ? "It still shows as Prepared." : "We couldn't check whether it went through."} Check its status before you confirm again.`;
}

/** The registered name of the household a payout is for. */
export function registeredNameOf(payout: Pick<Disbursement, "registeredName" | "beneficiaryName">, fallback?: string | null) {
  return payout.registeredName?.trim() || payout.beneficiaryName?.trim() || fallback?.trim() || null;
}

/**
 * The tickbox and reason the confirming admin gives when the name check isn't
 * MATCH. Both are sent as `{acknowledged: true, reason}` and kept on the payout.
 */
export function NameCheckAcknowledgement({
  payout,
  checked,
  onCheckedChange,
  reason,
  onReasonChange,
  error,
}: {
  payout: Pick<Disbursement, "nameCheck">;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  error?: string;
}) {
  const mismatch = payout.nameCheck === "MISMATCH";
  return (
    <div className={cn("space-y-3 rounded-lg border p-3", mismatch ? "border-rose-200 bg-rose-50/60" : "border-amber-200 bg-amber-50/60")}>
      <label className="flex items-start gap-2 text-sm text-navy">
        <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} className="mt-0.5 size-4 accent-brand" />
        {payout.nameCheck === "NOT_CHECKED"
          ? "The bank gave no name. I checked the account with the household and it is the right account."
          : "I compared the bank's name with the registered name and this is the right account."}
      </label>
      <FormField label="Reason" htmlFor="payout-name-reason" required hint="Why the account is right, e.g. the bank leaves out the grandfather's name" error={error}>
        <Textarea id="payout-name-reason" rows={2} maxLength={500} value={reason} onChange={(e) => onReasonChange(e.target.value)} />
      </FormField>
    </div>
  );
}

/**
 * Warnings about the household's account that the confirming admin should
 * see: a recent bank change, an account another household also uses.
 */
export function AccountWarnings({ payout, now }: { payout: Disbursement; now: number | null }) {
  const recent = now !== null && bankChangedRecently(payout.bankAccountChangedAt, now);
  if (!recent && !payout.sharedAccount) return null;
  return (
    <InlineAlert tone="warning" title="Check the account before paying">
      <ul className="list-disc space-y-0.5 pl-4">
        {recent ? (
          <li>
            The bank account changed on {formatDateTime(payout.bankAccountChangedAt ?? null)}
            {payout.bankAccountChangedByName ? ` by ${payout.bankAccountChangedByName}` : ""}.
          </li>
        ) : null}
        {payout.sharedAccount ? <li>Another household has the same account number.</li> : null}
      </ul>
    </InlineAlert>
  );
}

/**
 * Bank details of a payout, with the name check made prominent: the
 * household's registered name next to the name the bank gave.
 */
export function PayoutReview({ payout, registeredName }: { payout: Disbursement; registeredName: string | null }) {
  const check = nameCheckOf(payout);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/[0.08] bg-black/[0.015] p-4">
        <p className="text-xs text-black/60">Amount</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-navy tabular-nums">{formatEtb(payout.amountEtb)}</p>
        <p className="mt-1 text-xs text-black/60">
          {RAIL_LABEL[payout.rail] ?? payout.rail} from the {fundLabel(payout.fund)} fund
          {payout.debitAccountName ? `, ${payout.debitAccountName}` : ""}
          {payout.debitAccount ? ` (${payout.debitAccount})` : ""}
        </p>
      </div>
      <DetailList
        columns={2}
        items={[
          { label: "Registered name", value: registeredName },
          { label: "Name at the bank", value: payout.verifiedName ?? "The bank gave no name" },
          { label: "Account", value: <span className="font-mono">{payout.creditAccount}</span> },
          { label: "Bank", value: payout.bankName },
          ...(payout.rail === "IPS"
            ? [
                {
                  label: "Receiving bank code",
                  value: payout.destinationBankCode ? <span className="font-mono">{payout.destinationBankCode}</span> : null,
                },
              ]
            : []),
        ]}
      />
      <div className="flex items-start gap-2">
        <Badge tone={check.tone}>{check.label}</Badge>
        <span className="text-xs text-black/60">{check.hint}</span>
      </div>
      {payout.nameCheckAcknowledged ? (
        <p className="rounded-lg bg-black/[0.03] p-3 text-sm text-black/70">
          Names compared by the admin who confirmed{payout.nameCheckReason ? `: ${payout.nameCheckReason}` : "."}
        </p>
      ) : null}
    </div>
  );
}

/**
 * ADMIN prepares a payout for one pooled household: the account is looked up
 * with the bank, nothing is paid. Another ADMIN confirms it on the Payouts
 * page within 24 hours (the one who prepared it can't: 403 SAME_APPROVER).
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
  const [note, setNote] = useState("");
  const funds = useResource<FundAccounts>(`${API}/funds`);
  // One idempotency key per payout, in the body: made when the dialog opens and re-sent on every
  // retry of the same request. A changed request (amount, note) is a different payout and gets a new key.
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const [payout, setPayout] = useState<Disbursement | null>(null);
  const [error, setError] = useState<{ text: string; existingId: string | null } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<"prepare" | "cancel" | null>(null);
  const now = useServerNow(30_000, payout?.serverTime);
  const mode = usePaymentMode();

  const isWorking = working !== null;
  const name = entry.fullName ?? `Beneficiary #${entry.beneficiaryId}`;
  const registeredName = payout ? registeredNameOf(payout, entry.fullName) : (entry.fullName ?? null);
  const prepared = payout?.status === "AWAITING_CONFIRMATION";
  const expired = payout ? isExpired(payout, now) : false;
  const zakat = funds.data?.zakat;
  const fundReady = zakat?.ready ?? false;

  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setWorking("prepare");
    try {
      const body = {
        ...(entry.source === "WHITELIST" ? { whitelistEntryId: entry.whitelistEntryId } : { assessmentId: entry.assessmentId }),
        amountEtb: Number(amount),
        fund: PAYOUT_FUND,
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      const signature = JSON.stringify(body);
      if (!attempt.current || attempt.current.body !== signature) attempt.current = { body: signature, key: newIdempotencyKey() };
      const next = await apiClient<Disbursement>(API, {
        method: "POST",
        body: JSON.stringify({ ...body, idempotencyKey: attempt.current.key }),
      });
      attempt.current = null;
      setPayout(next);
      onFinished(next);
    } catch (prepareError) {
      const described = describeError(prepareError, "Couldn't prepare the payout");
      const fields = prepareError instanceof ApiError ? fieldErrorMap(prepareError.errors) : {};
      if (payoutCodeOf(prepareError) === "AMOUNT_OUT_OF_RANGE") {
        // Said once, under the amount.
        fields.amountEtb = described.text;
      } else {
        setError(described);
      }
      setFieldErrors(fields);
    } finally {
      setWorking(null);
    }
  }

  async function cancel() {
    if (!payout) return;
    setError(null);
    setWorking("cancel");
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setPayout(next);
      onFinished(next);
      onClose();
    } catch (cancelError) {
      // Whatever went wrong, show the payout as it is now.
      const latest = await readPayout(payout.disbursementId);
      if (latest) {
        setPayout(latest);
        onFinished(latest);
      }
      setError(describeError(cancelError, "Couldn't cancel the payout."));
    } finally {
      setWorking(null);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isWorking && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-navy">{payout ? `Payout for ${name}` : `Pay ${name}`}</DialogTitle>
          <DialogDescription>
            {payout
              ? prepared && !expired
                ? `Prepared, not paid. Another admin must confirm it by ${confirmByText(payout, now)}.`
                : name
              : "The account is looked up with the bank first. Nothing is paid until another admin confirms it."}
          </DialogDescription>
        </DialogHeader>

        <PaymentModeBanner mode={mode} rails={["bank"]} />
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
                {
                  label: "Paid from",
                  value: (
                    <>
                      {fundLabel(PAYOUT_FUND)} fund
                      {zakat?.accountNumber ? <span className="ml-1 font-mono text-xs text-black/60">{zakat.accountNumber}</span> : null}
                    </>
                  ),
                },
              ]}
            />
            <p className="text-xs text-black/60">Households are paid from the Zakat fund only.</p>
            {funds.error ? <InlineAlert tone="warning">Couldn&apos;t load the fund accounts: {funds.error.message}</InlineAlert> : null}
            {funds.data && !fundReady ? (
              <InlineAlert tone="warning">
                {zakat?.accountNumber
                  ? "Coop Bank hasn't confirmed the Zakat fund account, so no payout can be prepared. "
                  : "The Zakat fund has no account, so no payout can be prepared. "}
                <Link href="/dashboard/disbursements" className="font-medium underline underline-offset-2">
                  Set it on the Payouts page
                </Link>
                .
              </InlineAlert>
            ) : null}
            <FormField
              label="Amount (ETB)"
              htmlFor="payout-amount"
              required
              hint={`${formatEtb(PAYOUT_MIN_ETB)} to ${formatEtb(PAYOUT_MAX_ETB)} per payout`}
              error={fieldErrors.amountEtb}
            >
              <Input
                id="payout-amount"
                type="number"
                min={PAYOUT_MIN_ETB}
                max={PAYOUT_MAX_ETB}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="tabular-nums"
              />
            </FormField>
            <FormField label="Note" htmlFor="payout-note" hint="e.g. November support" error={fieldErrors.note}>
              <Textarea id="payout-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isWorking}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={working === "prepare"}
                loadingText="Looking up the account…"
                disabled={!(Number(amount) > 0) || (funds.data ? !fundReady : false)}
              >
                Prepare payout
              </Button>
            </DialogFooter>
          </form>
        ) : prepared ? (
          <div className="space-y-4">
            <InlineAlert tone="info" title="Waiting for another admin to confirm">
              Nothing has been paid. Another admin confirms it on the Payouts page; you can&apos;t confirm a payout you prepared.
            </InlineAlert>
            <AccountWarnings payout={payout} now={now} />
            <PayoutReview payout={payout} registeredName={registeredName} />
            <DialogFooter>
              <Button
                type="button"
                variant="destructive-outline"
                onClick={cancel}
                disabled={isWorking && working !== "cancel"}
                loading={working === "cancel"}
                loadingText="Cancelling…"
              >
                Cancel payout
              </Button>
              <Button onClick={onClose} disabled={isWorking}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <PayoutOutcome payout={payout} test={isTestRail(mode, "bank")} />
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Where a payout ended up, after it left "Prepared". */
function PayoutOutcome({ payout, test }: { payout: Disbursement; test: boolean }) {
  const status = disbursementStatus(payout.status);
  if (payout.status === "SUCCEEDED") {
    return (
      <InlineAlert
        tone={test ? "warning" : "success"}
        title={test ? `${formatEtb(payout.amountEtb)} paid in test mode` : `${formatEtb(payout.amountEtb)} paid`}
      >
        {test ? "The bank connection is a sandbox, so no money moved. " : ""}
        Bank reference <span className="font-mono">{payout.providerReference ?? "—"}</span>. The household has left the pool.
        {payout.poolUpdated === false ? " (The pool updates within a minute.)" : ""}
      </InlineAlert>
    );
  }
  if (payout.status === "PROCESSING") {
    return (
      <InlineAlert tone="warning" title="Needs checking">
        The bank gave no clear answer, so the money may or may not have moved. Ask Coop Bank quoting bank request number{" "}
        <span className="font-mono">{payout.messageId ?? "—"}</span>. Another admin settles it on the Payouts page.
      </InlineAlert>
    );
  }
  return (
    <div className="flex items-start gap-2 text-sm text-black/70">
      {payout.status === "FAILED" ? <CircleAlert className="mt-0.5 size-4 text-rose-600" /> : <Clock className="mt-0.5 size-4" />}
      <span>
        <Badge tone={status.tone}>{status.label}</Badge>
        {payout.failureReason ? <span className="mt-1 block">{payout.failureReason}</span> : null}
        {payout.status === "FAILED" ? <span className="mt-1 block text-xs text-black/60">The household stays pooled; you can prepare a new payout.</span> : null}
      </span>
    </div>
  );
}

/** "Waiting for another admin" next to a step the signed-in admin started. */
export function WaitingForAnotherAdmin({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-sm text-navy">
      <Users className="mt-0.5 size-4 shrink-0 text-sky-700" />
      <span>{children}</span>
    </p>
  );
}
