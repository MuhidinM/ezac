"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
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
  payoutErrorCode,
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
  return { text: payoutErrorMessage(error.code, error.message, error.data), existingId };
}

/** Ends a message with a full stop so another sentence can follow it. */
function withStop(text: string) {
  return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
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

/** The current time, updated every `intervalMs`; null until mounted. */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [intervalMs]);
  return now;
}

/** A prepared payout whose 15 minutes are up can't be paid any more. */
export function isExpired(payout: Pick<Disbursement, "status" | "expiresAt">, now: number | null) {
  if (payout.status !== "AWAITING_CONFIRMATION" || !payout.expiresAt || now === null) return false;
  const at = Date.parse(payout.expiresAt);
  return Number.isFinite(at) && at <= now;
}

/** Shown when a call failed but a re-read shows the payout has moved on. */
export const CHECKED_AGAIN = "The request didn't finish, so we checked the payout again. This is where it stands now.";

/** The error text after a confirm that may have reached the bank, before the status is checked again. */
export function unsureConfirmText(message: string, stillPrepared: boolean) {
  return `${withStop(message)} ${stillPrepared ? "It still shows as Prepared." : "We couldn't check whether it went through."} Check its status before you pay again.`;
}

/** A missing name check, or a value this screen doesn't know yet, counts as "Not checked". */
const UNKNOWN_NAME_CHECK: (typeof NAME_CHECK)["NOT_CHECKED"] = {
  label: "Not checked",
  tone: "warning",
  hint: "The bank didn't confirm the account holder's name.",
};

export function nameCheckOf(payout: Pick<Disbursement, "nameCheck">) {
  return NAME_CHECK[payout.nameCheck] ?? UNKNOWN_NAME_CHECK;
}

/**
 * Anything short of a clear match needs a tick before paying: "Not checked" is
 * the least verified case (no name came back at all), so it gets the same gate
 * as "Names differ".
 */
export function needsNameAcknowledgement(payout: Pick<Disbursement, "nameCheck">) {
  return payout.nameCheck !== "MATCH";
}

/** The tickbox that unlocks "Pay" when the name check isn't a match. */
export function NameCheckAcknowledgement({
  payout,
  checked,
  onCheckedChange,
}: {
  payout: Pick<Disbursement, "nameCheck">;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const mismatch = payout.nameCheck === "MISMATCH";
  return (
    <label
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-sm text-[#001539]",
        mismatch ? "border-rose-200 bg-rose-50/60" : "border-amber-200 bg-amber-50/60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 size-4 accent-[#007050]"
      />
      {mismatch
        ? "I compared the names and this is the right account."
        : "The bank didn't confirm the name. I checked the account number with the household and it is the right account."}
    </label>
  );
}

/** Bank details of a prepared payout, with the name check made prominent. */
export function PayoutReview({ payout }: { payout: Disbursement }) {
  const check = nameCheckOf(payout);
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
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<"prepare" | "confirm" | "cancel" | "check" | null>(null);
  // After a confirm that may or may not have reached the bank, Pay waits until the status is checked again.
  const [unsure, setUnsure] = useState(false);
  // Closing a prepared payout first asks whether to keep or cancel it.
  const [closing, setClosing] = useState(false);
  const now = useNow(5_000);

  const isWorking = working !== null;
  const name = entry.fullName ?? `Beneficiary #${entry.beneficiaryId}`;
  const prepared = payout?.status === "AWAITING_CONFIRMATION";
  const finished = payout && !prepared;
  const expired = payout ? isExpired(payout, now) : false;

  function startOver() {
    setPayout(null);
    setAcknowledged(false);
    setUnsure(false);
    setClosing(false);
    attempt.current = { body: "", key: generateId() };
  }

  /** The payout moved on (paid, failed, needs checking, cancelled or expired). */
  function show(next: Disbursement) {
    setPayout(next);
    setUnsure(false);
    setClosing(false);
    onFinished(next);
  }

  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setFieldErrors({});
    setWorking("prepare");
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

  async function act(action: "confirm" | "cancel") {
    if (!payout) return;
    setError(null);
    setNotice(null);
    setWorking(action);
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/${action}`, {
        method: "POST",
        // The confirm contract only takes acknowledgeNameMismatch, for MISMATCH. The
        // "Not checked" tick is checked here in the browser only until the backend
        // accepts an acknowledgement for it (docs/backend-go-live-requests.md, section 3).
        body: JSON.stringify(action === "confirm" && payout.nameCheck === "MISMATCH" ? { acknowledgeNameMismatch: acknowledged } : {}),
      });
      setUnsure(false);
      setPayout(next);
      onFinished(next);
      if (action === "cancel") onClose();
    } catch (actError) {
      const described = describeError(actError, action === "confirm" ? "Couldn't send the payout." : "Couldn't cancel the payout.");
      const code = payoutCodeOf(actError);
      if (code && PREPARE_AGAIN.has(code)) {
        // The payout is gone (cancelled or expired): back to the form to prepare a new one.
        setError(described);
        startOver();
        return;
      }
      // The call failed, but the payout may have moved on anyway (a timeout while the bank
      // answered, a dropped connection): show where it stands now.
      const latest = await readPayout(payout.disbursementId);
      if (latest && latest.status !== "AWAITING_CONFIRMATION") {
        if (code) setError(described);
        else setNotice(CHECKED_AGAIN);
        show(latest);
        return;
      }
      if (latest) setPayout(latest);
      if (action === "confirm" && mayHaveReachedBank(actError)) {
        setUnsure(true);
        setError({ text: unsureConfirmText(described.text, latest !== null), existingId: null });
      } else {
        setError(described);
      }
    } finally {
      setWorking(null);
    }
  }

  async function checkStatus() {
    if (!payout) return;
    setError(null);
    setNotice(null);
    setWorking("check");
    try {
      const latest = await readPayout(payout.disbursementId);
      if (!latest) {
        setError({ text: "Couldn't check the payout. Try again in a moment.", existingId: null });
        return;
      }
      if (latest.status !== "AWAITING_CONFIRMATION") {
        show(latest);
        return;
      }
      setPayout(latest);
      setUnsure(false);
      setNotice("It still shows as Prepared. You can try paying again.");
    } finally {
      setWorking(null);
    }
  }

  function requestClose() {
    // A lookup or send is running: closing now would lose its result.
    if (isWorking) return;
    if (prepared && !expired) {
      setClosing(true);
      return;
    }
    onClose();
  }

  function keepAndClose() {
    if (payout) onFinished(payout);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && requestClose()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#001539]">{finished ? "Payout result" : prepared ? "Confirm the payout" : `Pay ${name}`}</DialogTitle>
          <DialogDescription>
            {finished
              ? name
              : prepared
                ? expired
                  ? "This payout has expired."
                  : `Check the details, then confirm before ${formatDateTime(payout.expiresAt ?? null)}.`
                : "The account is looked up with the bank first; nothing is paid until you confirm."}
          </DialogDescription>
        </DialogHeader>

        {notice ? <InlineAlert tone="info">{notice}</InlineAlert> : null}
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
                aria-invalid={fieldErrors.amountEtb ? true : undefined}
                className="tabular-nums"
              />
            </FormField>
            <FormField label="Note" htmlFor="payout-note" hint="e.g. October support" error={fieldErrors.note}>
              <Textarea id="payout-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={requestClose} disabled={isWorking}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isWorking || !(Number(amount) > 0) || (funds.data ? !(fund === "ZAKAT" ? funds.data.zakat : funds.data.waqf)?.ready : false)}
              >
                {working === "prepare" ? "Looking up the account…" : "Review payout"}
              </Button>
            </DialogFooter>
          </form>
        ) : prepared ? (
          <div className="space-y-4">
            <PayoutReview payout={payout} />
            {expired ? (
              <>
                <InlineAlert tone="warning">
                  This payout wasn&apos;t confirmed within 15 minutes, so it can&apos;t be paid. Prepare it again.
                </InlineAlert>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={startOver}>Prepare again</Button>
                </DialogFooter>
              </>
            ) : closing ? (
              <>
                <InlineAlert tone="warning" title="Close without paying?">
                  Nothing has been paid. If you keep this payout, you can still pay it from the Payouts page until{" "}
                  {formatDateTime(payout.expiresAt ?? null)}. Until then no other payout can be prepared for this household.
                </InlineAlert>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setClosing(false)} disabled={isWorking}>
                    Go back
                  </Button>
                  <Button type="button" variant="outline" onClick={keepAndClose} disabled={isWorking}>
                    Keep it
                  </Button>
                  <Button type="button" onClick={() => act("cancel")} disabled={isWorking} className="bg-rose-600 text-white hover:bg-rose-700">
                    {working === "cancel" ? "Cancelling…" : "Cancel payout"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                {needsNameAcknowledgement(payout) ? (
                  <NameCheckAcknowledgement payout={payout} checked={acknowledged} onCheckedChange={setAcknowledged} />
                ) : null}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => act("cancel")} disabled={isWorking}>
                    {working === "cancel" ? "Cancelling…" : "Cancel payout"}
                  </Button>
                  {unsure ? (
                    <Button onClick={checkStatus} disabled={isWorking}>
                      {working === "check" ? "Checking…" : "Check status"}
                    </Button>
                  ) : (
                    <Button onClick={() => act("confirm")} disabled={isWorking || (needsNameAcknowledgement(payout) && !acknowledged)}>
                      {working === "confirm" ? "Sending…" : `Pay ${formatEtb(payout.amountEtb)}`}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </div>
        ) : payout ? (
          <div className="space-y-4">
            <PayoutOutcome payout={payout} />
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
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
