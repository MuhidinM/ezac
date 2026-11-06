"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { CircleAlert, Pencil, RefreshCw, Save } from "lucide-react";

import { StatTile } from "@/components/charts/stat-tile";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  CHECKED_AGAIN,
  EXPIRING_SOON,
  NameCheckAcknowledgement,
  PayoutReview,
  isExpired,
  isExpiringSoon,
  mayHaveReachedBank,
  nameCheckOf,
  needsNameAcknowledgement,
  payoutCodeOf,
  readPayout,
  unsureConfirmText,
  useServerNow,
} from "@/components/disbursements/payout-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import type { RangeKey } from "@/lib/backoffice/date-range";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  BANK_CALL_OPERATION,
  BANK_CALL_OUTCOME,
  type BankCall,
  type Disbursement,
  DISBURSEMENT_STATUSES,
  type DisbursementStatus,
  type DisbursementSummary,
  disbursementStatus,
  type Fund,
  type FundAccount,
  type FundAccounts,
  FUNDS,
  fundLabel,
  payoutErrorMessage,
  type Rail,
  RAIL_LABEL,
} from "@/lib/zakat/disbursements";
import { paymentRangeQuery } from "@/lib/zakat/payments";
import { cn } from "@/lib/utils";

const API = "/bff/payments-admin/disbursements";
const PAGE_SIZE = 20;

export default function DisbursementsPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <Disbursements />
      </Suspense>
    </RequireRole>
  );
}

function Disbursements() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("open");
  const [range, setRange] = useState<RangeKey>("30d");
  const [status, setStatus] = useState<DisbursementStatus | "">("");
  const [rail, setRail] = useState<Rail | "">("");
  const [fund, setFund] = useState<Fund | "">("");
  const [page, setPage] = useState(1);

  const rangeParams = paymentRangeQuery(range);
  const summary = useResource<DisbursementSummary>(`${API}/summary?${rangeParams}`);
  const list = useResource<PaginatedItems<Disbursement>>(
    `${API}?${rangeParams}${status ? `&status=${status}` : ""}${rail ? `&rail=${rail}` : ""}${fund ? `&fund=${fund}` : ""}&page=${page}&limit=${PAGE_SIZE}`,
  );
  const rows = list.data?.items ?? [];
  const s = summary.data;
  const now = useServerNow(30_000);

  // The open payout lives in the URL so the pool's "Open it" link lands on it.
  function open(id: string | null) {
    router.replace(id ? `/dashboard/disbursements?open=${encodeURIComponent(id)}` : "/dashboard/disbursements", { scroll: false });
  }

  function reloadAll() {
    summary.reload();
    list.reload();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Payments from the Zakat or Awqaf fund account to pooled households. Coop Bank accounts are paid by internal transfer, other banks by IPS. Start a payout from the disbursement pool."
        actions={
          <>
            <RangeSelect
              value={range}
              onChange={(value) => {
                setRange(value);
                setPage(1);
              }}
            />
            <Button variant="outline" onClick={reloadAll}>
              <RefreshCw />
              Refresh
            </Button>
          </>
        }
      />

      {s && s.needsChecking > 0 ? (
        <InlineAlert tone="warning" title={`${s.needsChecking} payout${s.needsChecking === 1 ? "" : "s"} need checking`}>
          The bank gave no clear answer, so the money may or may not have moved. Ask Coop Bank and settle each one.{" "}
          {status !== "PROCESSING" ? (
            <button
              type="button"
              className="font-medium underline underline-offset-2"
              onClick={() => {
                setStatus("PROCESSING");
                setPage(1);
              }}
            >
              Show them
            </button>
          ) : null}
        </InlineAlert>
      ) : null}
      {summary.error ? <InlineAlert>{summary.error.message}</InlineAlert> : null}

      {/* The summary has no fund or bank filter, so the tiles always cover both. */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-ink">All funds and banks, in this period</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Paid out"
            value={s ? formatEtb(s.succeededAmountEtb) : "—"}
            hint={
              s?.paidByFund?.length
                ? s.paidByFund.map((row) => `${fundLabel(row.fund)} ${formatEtb(row.amountEtb)}`).join(" · ")
                : "In this period"
            }
            loading={summary.isLoading && !s}
          />
          <StatTile label="Households paid" value={s ? s.succeededCount.toLocaleString("en") : "—"} hint={s ? `of ${s.totalCount.toLocaleString("en")} payouts` : undefined} loading={summary.isLoading && !s} />
          <StatTile
            label="Average payout"
            value={s && s.succeededCount > 0 ? formatEtb(Math.round(s.succeededAmountEtb / s.succeededCount)) : "—"}
            loading={summary.isLoading && !s}
          />
          <StatTile label="Needs checking" value={s ? s.needsChecking.toLocaleString("en") : "—"} hint="Waiting on the bank" loading={summary.isLoading && !s} />
        </div>
      </div>

      <FundAccountsPanel />

      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-5 py-3">
          <div className="w-48">
            <NativeSelect
              aria-label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as DisbursementStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {DISBURSEMENT_STATUSES.map((item) => {
                // The counts cover all funds and banks, so they'd mislead next to a fund or bank filter.
                const count = rail || fund ? null : s?.byStatus.find((row) => row.status === item.value)?.count;
                return (
                  <option key={item.value} value={item.value}>
                    {item.label}
                    {count != null ? ` (${count})` : ""}
                  </option>
                );
              })}
            </NativeSelect>
          </div>
          <div className="w-52">
            <NativeSelect
              aria-label="Rail"
              value={rail}
              onChange={(e) => {
                setRail(e.target.value as Rail | "");
                setPage(1);
              }}
            >
              <option value="">All banks</option>
              <option value="COOP">{RAIL_LABEL.COOP}</option>
              <option value="IPS">{RAIL_LABEL.IPS}</option>
            </NativeSelect>
          </div>
          <div className="w-40">
            <NativeSelect
              aria-label="Fund"
              value={fund}
              onChange={(e) => {
                setFund(e.target.value as Fund | "");
                setPage(1);
              }}
            >
              <option value="">All funds</option>
              {FUNDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} fund
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        {list.error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{list.error.message}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Household</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5">Prepared</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={5}>No payouts in this period.</TableMessageRow>
            ) : (
              rows.map((payout) => {
                // A prepared payout past its 15 minutes can't be paid, even before the backend marks it expired.
                const shown = disbursementStatus(isExpired(payout, now) ? "EXPIRED" : payout.status);
                return (
                  <TableRow
                    key={payout.disbursementId}
                    className={cn("cursor-pointer", payout.status === "PROCESSING" && "bg-amber-50/60 hover:bg-amber-50")}
                    onClick={() => open(payout.disbursementId)}
                  >
                    <TableCell className="pl-5">
                      <button type="button" className="text-left font-medium text-[#001539] hover:underline" onClick={() => open(payout.disbursementId)}>
                        {payout.beneficiaryName ?? `Beneficiary #${payout.beneficiaryId}`}
                      </button>
                      <span className="block text-xs text-black/50">
                        {[payout.assessmentNumber ?? (payout.source === "WHITELIST" ? "Whitelist" : null), payout.branchName].filter(Boolean).join(" · ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block">{payout.bankName ?? "—"}</span>
                      <span className="block font-mono text-xs text-black/50">{payout.creditAccount}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEtb(payout.amountEtb)}
                      {payout.fund ? <span className="block text-xs text-black/50">{fundLabel(payout.fund)} fund</span> : null}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={shown.tone}>
                          {payout.status === "PROCESSING" ? <CircleAlert /> : null}
                          {shown.label}
                        </Badge>
                        {payout.nameCheck === "MISMATCH" ? <Badge tone="danger">Names differ</Badge> : null}
                        {payout.nameCheck === "NOT_CHECKED" ? <Badge tone="warning">Name not checked</Badge> : null}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 text-sm text-black/60">{formatDateTime(payout.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ListPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={list.data?.pagination.totalItems ?? 0}
          totalPages={list.data?.pagination.totalPages ?? 1}
          disabled={list.isLoading}
          onPageChange={setPage}
        />
      </Panel>

      <PayoutSheet key={openId ?? "none"} payoutId={openId} onClose={() => open(null)} onChanged={reloadAll} />
    </section>
  );
}

function PayoutSheet({ payoutId, onClose, onChanged }: { payoutId: string | null; onClose: () => void; onChanged: () => void }) {
  const { data: payout, error, mutate } = useResource<Disbursement>(payoutId ? `${API}/${encodeURIComponent(payoutId)}` : null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState<"confirm" | "cancel" | "check" | null>(null);
  // After a confirm that may or may not have reached the bank, Pay waits until the status is checked again.
  const [unsure, setUnsure] = useState(false);
  const now = useServerNow(5_000);
  const isWorking = working !== null;
  const expired = payout ? isExpired(payout, now) : false;
  const expiringSoon = payout ? isExpiringSoon(payout, now) : false;
  const shown = payout ? (expired ? disbursementStatus("EXPIRED") : disbursementStatus(payout.status)) : null;

  async function act(action: "confirm" | "cancel") {
    if (!payout) return;
    setActionError(null);
    setNotice(null);
    setWorking(action);
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "confirm" && payout.nameCheck === "MISMATCH" ? { acknowledgeNameMismatch: acknowledged } : {}),
      });
      mutate(next);
      setUnsure(false);
      onChanged();
    } catch (actError) {
      const message =
        actError instanceof ApiError ? payoutErrorMessage(actError.code, actError.message, actError.data) : "Something went wrong.";
      // Whatever went wrong, show the payout as it is now (it may have expired, or the bank
      // may have answered after a timeout) and refresh the list and the totals.
      const latest = await readPayout(payout.disbursementId);
      if (latest) mutate(latest);
      onChanged();
      if (latest && latest.status !== payout.status && !payoutCodeOf(actError)) {
        setNotice(CHECKED_AGAIN);
      } else if (action === "confirm" && (!latest || latest.status === "AWAITING_CONFIRMATION") && mayHaveReachedBank(actError)) {
        setUnsure(true);
        setActionError(unsureConfirmText(message, latest !== null));
      } else {
        setActionError(message);
      }
    } finally {
      setWorking(null);
    }
  }

  async function checkStatus() {
    if (!payout) return;
    setActionError(null);
    setNotice(null);
    setWorking("check");
    try {
      const latest = await readPayout(payout.disbursementId);
      if (!latest) {
        setActionError("Couldn't check the payout. Try again in a moment.");
        return;
      }
      mutate(latest);
      setUnsure(false);
      onChanged();
      if (latest.status === "AWAITING_CONFIRMATION") setNotice("It still shows as Prepared. You can try paying again.");
    } finally {
      setWorking(null);
    }
  }

  return (
    // Closing while a send is running would hide its result.
    <Sheet open={payoutId !== null} onOpenChange={(value) => !value && !isWorking && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-[#001539]">{payout ? (payout.beneficiaryName ?? `Beneficiary #${payout.beneficiaryId}`) : "Payout"}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {shown ? <Badge tone={shown.tone}>{shown.label}</Badge> : null}
            <span className="font-mono text-xs">{payoutId}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {error ? <InlineAlert>{error.message}</InlineAlert> : null}
          {notice ? <InlineAlert tone="info">{notice}</InlineAlert> : null}
          {actionError ? <InlineAlert>{actionError}</InlineAlert> : null}
          {!payout && !error ? <p className="text-sm text-black/45">Loading…</p> : null}
          {payout ? (
            <>
              {payout.status === "PROCESSING" ? (
                <SettleForm
                  key={payout.disbursementId}
                  payout={payout}
                  onSettled={(next) => {
                    mutate(next);
                    onChanged();
                  }}
                />
              ) : null}

              {payout.status === "AWAITING_CONFIRMATION" && expired ? (
                <div className="space-y-2 rounded-xl border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-sm text-[#001539]">
                    This payout wasn&apos;t confirmed by {formatDateTime(payout.expiresAt ?? null)}, so it can&apos;t be paid. Start a new one
                    from the{" "}
                    <Link href="/dashboard/pool" className="font-medium underline underline-offset-2">
                      disbursement pool
                    </Link>
                    .
                  </p>
                </div>
              ) : payout.status === "AWAITING_CONFIRMATION" ? (
                <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
                  <p className="text-sm text-[#001539]">
                    Prepared, not paid. Confirm before {formatDateTime(payout.expiresAt ?? null)} or it expires.
                  </p>
                  {expiringSoon ? <InlineAlert tone="warning">{EXPIRING_SOON}</InlineAlert> : null}
                  {needsNameAcknowledgement(payout) ? (
                    <NameCheckAcknowledgement payout={payout} checked={acknowledged} onCheckedChange={setAcknowledged} />
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => act("cancel")} disabled={isWorking}>
                      {working === "cancel" ? "Cancelling…" : "Cancel payout"}
                    </Button>
                    {unsure ? (
                      <Button size="sm" onClick={checkStatus} disabled={isWorking}>
                        {working === "check" ? "Checking…" : "Check status"}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => act("confirm")} disabled={isWorking || (needsNameAcknowledgement(payout) && !acknowledged)}>
                        {working === "confirm" ? "Sending…" : `Pay ${formatEtb(payout.amountEtb)}`}
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}

              {payout.status === "SUCCEEDED" && payout.poolUpdated === false ? (
                <InlineAlert tone="info">Paid. The pool record hasn&apos;t caught up yet; it&apos;s retried every minute.</InlineAlert>
              ) : null}

              <PayoutReview payout={payout} />

              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">Household</p>
                <DetailList
                  columns={2}
                  items={[
                    {
                      label: "Beneficiary",
                      value: (
                        <Link href={`/dashboard/beneficiary/${payout.beneficiaryId}`} className="hover:underline">
                          {payout.beneficiaryName ?? `#${payout.beneficiaryId}`}
                        </Link>
                      ),
                    },
                    {
                      label: "Assessment",
                      value: payout.assessmentId ? (
                        <Link href={`/dashboard/assessments/${payout.assessmentId}`} className="hover:underline">
                          {payout.assessmentNumber ?? `#${payout.assessmentId}`}
                        </Link>
                      ) : payout.source === "WHITELIST" ? (
                        "Whitelist (no assessment)"
                      ) : null,
                    },
                    { label: "Branch", value: payout.branchName },
                    { label: "Region", value: payout.region },
                  ]}
                />
              </div>

              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">Bank and timeline</p>
                <DetailList
                  columns={2}
                  items={[
                    { label: "Fund", value: payout.fund ? `${fundLabel(payout.fund)} fund` : null },
                    { label: "Rail", value: RAIL_LABEL[payout.rail] ?? payout.rail },
                    { label: "Name check", value: nameCheckOf(payout).label },
                    { label: "Message id", value: payout.messageId ? <span className="font-mono">{payout.messageId}</span> : null },
                    { label: "Bank reference (FT)", value: payout.providerReference ? <span className="font-mono">{payout.providerReference}</span> : null },
                    ...(payout.rail === "IPS"
                      ? [
                          { label: "IPS transaction id", value: payout.providerTransactionId ? <span className="font-mono text-xs break-all">{payout.providerTransactionId}</span> : null },
                          { label: "IPS message id", value: payout.providerMessageId ? <span className="font-mono text-xs break-all">{payout.providerMessageId}</span> : null },
                          { label: "Credited account", value: payout.creditedAccount ? <span className="font-mono">{payout.creditedAccount}</span> : null },
                          { label: "Settled at the bank", value: formatDateTime(payout.bankSettledAt ?? null) },
                        ]
                      : []),
                    { label: "Prepared", value: formatDateTime(payout.createdAt) },
                    { label: "Confirmed", value: formatDateTime(payout.confirmedAt ?? null) },
                    { label: "Paid", value: formatDateTime(payout.paidAt ?? null) },
                    { label: "Failure reason", value: payout.failureReason },
                  ]}
                />
                {payout.note ? <p className="rounded-lg bg-black/[0.03] p-3 text-sm whitespace-pre-line text-black/70">{payout.note}</p> : null}
                {payout.resolutionNote ? (
                  <p className="rounded-lg bg-black/[0.03] p-3 text-sm whitespace-pre-line text-black/70">Settled: {payout.resolutionNote}</p>
                ) : null}
              </div>

              <BankCalls key={`${payout.disbursementId}-${payout.updatedAt ?? ""}`} payoutId={payout.disbursementId} defaultOpen={payout.status === "PROCESSING"} />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettleForm({ payout, onSettled }: { payout: Disbursement; onSettled: (payout: Disbursement) => void }) {
  const [outcome, setOutcome] = useState<"SUCCEEDED" | "FAILED" | "">("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const paid = outcome === "SUCCEEDED";
  const name = payout.beneficiaryName ?? "the household";

  // There's no undo, so the form only opens a confirm step that restates the outcome.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setConfirming(true);
  }

  async function settle() {
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          status: outcome,
          ...(paid ? { providerReference: reference.trim() } : {}),
          note: note.trim(),
        }),
      });
      onSettled(next);
    } catch (settleError) {
      // Shown on the form, next to the fields, once the confirm step closes.
      setError(errorMessage(settleError, "Couldn't settle the payout"));
      if (settleError instanceof ApiError) setFieldErrors(fieldErrorMap(settleError.errors));
    }
  }

  return (
    <>
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-[#001539]">Settle this payout</p>
        <p className="mt-0.5 text-xs text-black/55">
          Ask Coop Bank quoting message id <span className="font-mono">{payout.messageId ?? "—"}</span>, then record their answer. The
          bank calls below show what was sent and what came back.
        </p>
      </div>
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <div role="radiogroup" aria-label="Bank answer" className="grid grid-cols-2 gap-2">
        {(
          [
            ["SUCCEEDED", "Money moved", "Mark paid; the household leaves the pool"],
            ["FAILED", "Not paid", "The household stays pooled"],
          ] as const
        ).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={outcome === value}
            onClick={() => setOutcome(value)}
            className={cn(
              "rounded-lg border bg-white p-3 text-left transition",
              outcome === value ? "border-[#007050] ring-1 ring-[#007050]" : "border-black/10 hover:border-black/20",
            )}
          >
            <span className="block text-sm font-semibold text-[#001539]">{label}</span>
            <span className="mt-0.5 block text-xs text-black/55">{hint}</span>
          </button>
        ))}
      </div>
      {paid ? (
        <FormField label="Bank reference" htmlFor="settle-ref" required error={fieldErrors.providerReference}>
          <Input id="settle-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="FT…" required className="font-mono" />
        </FormField>
      ) : null}
      <FormField label="Note" htmlFor="settle-note" required hint="Who at Coop Bank confirmed, and when" error={fieldErrors.note}>
        <Textarea id="settle-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} required />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" disabled={confirming || !outcome || !note.trim() || (paid && !reference.trim())}>
          Settle payout
        </Button>
      </div>
    </form>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={paid ? "Mark this payout as paid?" : "Mark this payout as not paid?"}
        description={
          paid ? (
            <>
              {formatEtb(payout.amountEtb)} to {name}, bank reference <span className="font-mono">{reference.trim()}</span>. Only do this if
              Coop Bank confirmed the money moved. The household leaves the pool. This can&apos;t be undone.
            </>
          ) : (
            <>
              {formatEtb(payout.amountEtb)} to {name}. Only do this if Coop Bank confirmed no money moved. The household stays in the pool
              and can be paid again, so a wrong answer can mean paying twice. This can&apos;t be undone.
            </>
          )
        }
        confirmLabel={paid ? "Mark as paid" : "Mark as not paid"}
        destructive={!paid}
        onConfirm={settle}
      />
    </>
  );
}

/** Every call made to the bank for one payout, oldest first. Used when settling a PROCESSING payout. */
function BankCalls({ payoutId, defaultOpen }: { payoutId: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { data, error, isLoading } = useResource<BankCall[]>(open ? `${API}/${encodeURIComponent(payoutId)}/bank-calls` : null);
  const calls = data ?? [];

  return (
    <div className="space-y-3 border-t border-black/[0.06] pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">Bank calls</p>
        <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open ? (
        <>
          {error ? <InlineAlert>{error.message}</InlineAlert> : null}
          {isLoading && !data ? <p className="text-sm text-black/45">Loading…</p> : null}
          {data && calls.length === 0 ? <p className="text-sm text-black/45">No calls to the bank yet.</p> : null}
          <ol className="space-y-2">
            {calls.map((call) => (
              <li key={call.callId} className="rounded-lg border border-black/[0.08] p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[#001539]">{BANK_CALL_OPERATION[call.operation] ?? call.operation}</span>
                  <Badge tone={BANK_CALL_OUTCOME[call.outcome] ?? "neutral"}>{call.outcome}</Badge>
                  {call.httpStatus != null ? <span className="font-mono text-xs text-black/50">HTTP {call.httpStatus}</span> : null}
                  {call.durationMs != null ? <span className="text-xs text-black/50">{call.durationMs} ms</span> : null}
                  <span className="ml-auto text-xs text-black/50">{formatDateTime(call.at)}</span>
                </div>
                {call.messageId ? (
                  <p className="mt-1 text-xs text-black/55">
                    Message id <span className="font-mono">{call.messageId}</span>
                  </p>
                ) : null}
                {call.error ? <p className="mt-1 text-xs text-rose-700">{call.error}</p> : null}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-black/55">Request and response</summary>
                  <div className="mt-2 space-y-2">
                    {call.url ? <p className="font-mono text-xs break-all text-black/55">{call.url}</p> : null}
                    <JsonBlock label="Request" value={call.request} />
                    <JsonBlock label="Response" value={call.response} />
                    {call.correlationId ? (
                      <p className="text-xs text-black/50">
                        Correlation id <span className="font-mono">{call.correlationId}</span>
                      </p>
                    ) : null}
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === "") return null;
  let text: string;
  if (typeof value === "string") {
    try {
      text = JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      text = value;
    }
  } else {
    text = JSON.stringify(value, null, 2);
  }
  return (
    <div>
      <p className="text-xs font-medium text-black/55">{label}</p>
      <pre className="mt-1 max-h-60 overflow-auto rounded bg-black/[0.03] p-2 text-xs break-all whitespace-pre-wrap">{text}</pre>
    </div>
  );
}

/** The Zakat and Awqaf accounts payouts are paid from. Each account is looked up with Coop Bank on save. */
function FundAccountsPanel() {
  const { data, error, mutate } = useResource<FundAccounts>(`${API}/funds`);
  const [editing, setEditing] = useState(false);
  const accounts = data ? [data.zakat, data.waqf] : [];

  return (
    <Panel
      title="Fund accounts"
      description="Payouts are paid from the Zakat or the Awqaf fund, chosen on each payout. A fund with no account can't be paid from."
      actions={
        <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={!data}>
          <Pencil />
          Edit
        </Button>
      }
    >
      {error ? <InlineAlert>{error.message}</InlineAlert> : null}
      {!data && !error ? <p className="text-sm text-black/45">Loading…</p> : null}
      {data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <div key={account.fund} className="rounded-xl border border-black/[0.08] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#001539]">{account.label ?? fundLabel(account.fund)} fund</p>
                <Badge tone={account.ready ? "success" : "warning"}>{account.ready ? "Ready" : "Not set"}</Badge>
              </div>
              <p className="mt-2 font-mono text-sm text-[#001539]">{account.accountNumber ?? "—"}</p>
              <p className="mt-0.5 text-xs text-black/55">
                {account.accountName || account.bankHolderName || "No name"}
                {account.bankHolderName && account.accountName && account.bankHolderName !== account.accountName
                  ? ` (bank: ${account.bankHolderName})`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {data?.updatedAt ? <p className="mt-3 text-xs text-black/45">Last changed {formatDateTime(data.updatedAt)}</p> : null}
      {editing && data ? (
        <FundAccountsDialog
          accounts={data}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            mutate(next);
            setEditing(false);
          }}
        />
      ) : null}
    </Panel>
  );
}

function FundAccountsDialog({
  accounts,
  onClose,
  onSaved,
}: {
  accounts: FundAccounts;
  onClose: () => void;
  onSaved: (accounts: FundAccounts) => void;
}) {
  const initial = (account: FundAccount) => ({ accountNumber: account.accountNumber ?? "", accountName: account.accountName ?? "" });
  const [form, setForm] = useState({ zakat: initial(accounts.zakat), waqf: initial(accounts.waqf) });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function set(fund: "zakat" | "waqf", key: "accountNumber" | "accountName", value: string) {
    setForm((prev) => ({ ...prev, [fund]: { ...prev[fund], [key]: value } }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSaving(true);
    try {
      // Both funds are always sent: a fund left out or with a blank account is cleared.
      const trim = (value: { accountNumber: string; accountName: string }) => ({
        accountNumber: value.accountNumber.trim(),
        accountName: value.accountName.trim(),
      });
      const saved = await apiClient<FundAccounts>(`${API}/funds`, {
        method: "PUT",
        body: JSON.stringify({ zakat: trim(form.zakat), waqf: trim(form.waqf) }),
      });
      onSaved(saved);
    } catch (saveError) {
      setError(saveError instanceof ApiError ? payoutErrorMessage(saveError.code, saveError.message) : "Couldn't save the fund accounts");
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">Fund accounts</DialogTitle>
            <DialogDescription>
              Each account is looked up with Coop Bank. Leave a number blank to clear that fund. The name is sent to the bank as the payer
              name; if blank, the bank&apos;s own name for the account is used.
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          {(["zakat", "waqf"] as const).map((key) => (
            <fieldset key={key} className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-semibold text-[#001539]">{key === "zakat" ? "Zakat" : "Awqaf"} fund</legend>
              <FormField label="Account number" htmlFor={`fund-${key}-number`} error={fieldErrors[`${key}.accountNumber`] ?? fieldErrors[key]}>
                <Input
                  id={`fund-${key}-number`}
                  inputMode="numeric"
                  value={form[key].accountNumber}
                  onChange={(e) => set(key, "accountNumber", e.target.value)}
                  className="font-mono"
                />
              </FormField>
              <FormField label="Account name" htmlFor={`fund-${key}-name`} hint="Optional" error={fieldErrors[`${key}.accountName`]}>
                <Input id={`fund-${key}-name`} value={form[key].accountName} onChange={(e) => set(key, "accountName", e.target.value)} />
              </FormField>
            </fieldset>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save />
              {isSaving ? "Checking with the bank…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
