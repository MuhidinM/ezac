"use client";

import Link from "next/link";
import { type FormEvent, Suspense, useState } from "react";
import { CircleAlert, Pencil, RefreshCw, Save, UserRound, X } from "lucide-react";

import { StatTile } from "@/components/charts/stat-tile";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import {
  CHECKED_AGAIN,
  EXPIRING_SOON,
  NameCheckAcknowledgement,
  PayoutReview,
  isExpired,
  isExpiringSoon,
  mayHaveReachedBank,
  nameCheckOf,
  payoutCodeOf,
  readPayout,
  registeredNameOf,
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
import { type PaymentMode, PaymentModeBanner, isTestRail, usePaymentMode } from "@/components/zakat/payment-mode-banner";
import { staffRef } from "@/components/zakat/staff-ref";
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
import { ChoiceCards, type ChoiceOption } from "@/components/ui/segmented-control";
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
import { RANGE_OPTIONS, type RangeKey } from "@/lib/backoffice/date-range";
import { formatCount, formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { useListState } from "@/lib/hooks/use-list-state";
import {
  BANK_CALL_OPERATION,
  BANK_CALL_OUTCOME,
  type BankCall,
  type Disbursement,
  DISBURSEMENT_STATUSES,
  type DisbursementSummary,
  disbursementStatus,
  type FundAccount,
  type FundAccountChange,
  type FundAccounts,
  fundAccountChanges,
  FUNDS,
  fundLabel,
  needsNameAcknowledgement,
  payoutAuditNotes,
  payoutErrorMessage,
  RAIL_LABEL,
  sameStaff,
} from "@/lib/zakat/disbursements";
import { paymentRangeQuery } from "@/lib/zakat/payments";
import type { PayloadField } from "@/lib/zakat/redact";
import { cn } from "@/lib/utils";

const API = "/bff/payments-admin/disbursements";
const PAGE_SIZE = 20;

const LIST_DEFAULTS = { range: "30d", status: "", rail: "", fund: "", page: 1, open: "" };
const LIST_ALLOWED = {
  range: RANGE_OPTIONS.map((option) => option.key),
  status: ["", ...DISBURSEMENT_STATUSES.map((item) => item.value)],
  rail: ["", "COOP", "IPS"],
  fund: ["", ...FUNDS.map((item) => item.value)],
};

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
  // Filters, page and the open payout live in the URL: reload, Back and a shared link
  // show the same list, and the pool's "Open it" link lands on its payout.
  const [list, setList] = useListState("", LIST_DEFAULTS, { allowed: LIST_ALLOWED });
  const range = list.range as RangeKey;
  const mode = usePaymentMode();

  const rangeParams = paymentRangeQuery(range);
  const summary = useResource<DisbursementSummary>(`${API}/summary?${rangeParams}`);
  const payouts = useResource<PaginatedItems<Disbursement>>(
    `${API}?${rangeParams}${list.status ? `&status=${list.status}` : ""}${list.rail ? `&rail=${list.rail}` : ""}${list.fund ? `&fund=${list.fund}` : ""}&page=${list.page}&limit=${PAGE_SIZE}`,
  );
  const rows = payouts.data?.items ?? [];
  const s = summary.data;
  const now = useServerNow(30_000);
  const filtered = Boolean(list.status || list.rail || list.fund);

  function open(id: string | null) {
    setList({ open: id ?? "" }, { keepPage: true });
  }

  function reloadAll() {
    summary.reload();
    payouts.reload();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Payments from the Zakat or Awqaf fund account to pooled households. Coop Bank accounts are paid by internal transfer, other banks by interbank transfer. Start a payout from the disbursement pool."
        actions={
          <>
            <RangeSelect value={range} onChange={(value) => setList({ range: value })} />
            <Button variant="outline" onClick={reloadAll}>
              <RefreshCw />
              Refresh
            </Button>
          </>
        }
      />

      <PaymentModeBanner mode={mode} rails={["bank"]} />

      {s && s.needsChecking > 0 ? (
        <InlineAlert tone="warning" title={`${formatCount(s.needsChecking)} payout${s.needsChecking === 1 ? "" : "s"} need checking`}>
          The bank gave no clear answer, so the money may or may not have moved. Ask Coop Bank and settle each one.{" "}
          {list.status !== "PROCESSING" ? (
            <button type="button" className="font-medium underline underline-offset-2" onClick={() => setList({ status: "PROCESSING" })}>
              Show them
            </button>
          ) : null}
        </InlineAlert>
      ) : null}
      <ErrorAlert error={summary.error} onRetry={summary.reload} />

      {/* The summary has no fund or bank filter, so the tiles always cover both. */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-ink">All funds and banks, in this period</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Paid out"
            value={s ? formatEtb(s.succeededAmountEtb, { compact: true }) : "—"}
            hint={
              s
                ? [
                    s.succeededAmountEtb >= 10_000 ? formatEtb(s.succeededAmountEtb) : null,
                    s.paidByFund?.length ? s.paidByFund.map((row) => `${fundLabel(row.fund)}: ${formatEtb(row.amountEtb)}`).join(" · ") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "In this period"
                : undefined
            }
            loading={summary.isLoading && !s}
          />
          <StatTile
            label="Households paid"
            value={s ? formatCount(s.succeededCount, { compact: true }) : "—"}
            hint={s ? `of ${formatCount(s.totalCount)} payouts` : undefined}
            loading={summary.isLoading && !s}
          />
          <StatTile
            label="Average payout"
            value={s && s.succeededCount > 0 ? formatEtb(Math.round(s.succeededAmountEtb / s.succeededCount), { compact: true }) : "—"}
            hint={s && s.succeededCount > 0 ? formatEtb(Math.round(s.succeededAmountEtb / s.succeededCount)) : undefined}
            loading={summary.isLoading && !s}
          />
          <StatTile
            label="Needs checking"
            value={s ? formatCount(s.needsChecking, { compact: true }) : "—"}
            hint="Waiting on the bank"
            loading={summary.isLoading && !s}
          />
        </div>
      </div>

      <FundAccountsPanel />

      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-5 py-3">
          <div className="w-48">
            <NativeSelect aria-label="Status" value={list.status} onChange={(e) => setList({ status: e.target.value })}>
              <option value="">All statuses</option>
              {DISBURSEMENT_STATUSES.map((item) => {
                // The counts cover all funds and banks, so they'd mislead next to a fund or bank filter.
                const count = list.rail || list.fund ? null : s?.byStatus.find((row) => row.status === item.value)?.count;
                return (
                  <option key={item.value} value={item.value}>
                    {item.label}
                    {count != null ? ` (${formatCount(count)})` : ""}
                  </option>
                );
              })}
            </NativeSelect>
          </div>
          <div className="w-52">
            <NativeSelect aria-label="Bank" value={list.rail} onChange={(e) => setList({ rail: e.target.value })}>
              <option value="">All banks</option>
              <option value="COOP">{RAIL_LABEL.COOP}</option>
              <option value="IPS">{RAIL_LABEL.IPS}</option>
            </NativeSelect>
          </div>
          <div className="w-40">
            <NativeSelect aria-label="Fund" value={list.fund} onChange={(e) => setList({ fund: e.target.value })}>
              <option value="">All funds</option>
              {FUNDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} fund
                </option>
              ))}
            </NativeSelect>
          </div>
          {filtered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setList({ status: "", rail: "", fund: "" })}
            >
              <X />
              Clear
            </Button>
          ) : null}
        </div>
        {payouts.error ? (
          <div className="px-5 pt-4">
            <ErrorAlert error={payouts.error} onRetry={payouts.reload} />
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
            {payouts.isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={5}>
                {filtered ? "No payouts match these filters in this period." : "No payouts in this period."}
              </TableMessageRow>
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
                      <button type="button" className="text-left font-medium text-navy hover:underline" onClick={() => open(payout.disbursementId)}>
                        {payout.beneficiaryName ?? `Beneficiary #${payout.beneficiaryId}`}
                      </button>
                      <span className="block text-xs text-black/60">
                        {[payout.assessmentNumber ?? (payout.source === "WHITELIST" ? "Whitelist" : null), payout.branchName].filter(Boolean).join(" · ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block">{payout.bankName ?? "—"}</span>
                      <span className="block font-mono text-xs text-black/60">{payout.creditAccount}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEtb(payout.amountEtb)}
                      {payout.fund ? <span className="block text-xs text-black/60">{fundLabel(payout.fund)} fund</span> : null}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={shown.tone}>
                          {payout.status === "PROCESSING" ? <CircleAlert /> : null}
                          {shown.label}
                        </Badge>
                        {payout.nameCheck === "MISMATCH" ? <Badge tone="danger">Names differ</Badge> : null}
                        {payout.nameCheck === "NOT_CHECKED" ? <Badge tone="warning">Name not checked</Badge> : null}
                        {sameStaff(payout.createdBy, payout.confirmedBy) ? (
                          <Badge tone="warning" title="The same staff account prepared and paid this payout">
                            <UserRound />
                            One person
                          </Badge>
                        ) : null}
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
          page={list.page}
          pageSize={PAGE_SIZE}
          totalItems={payouts.data?.pagination.totalItems ?? 0}
          totalPages={payouts.data?.pagination.totalPages ?? 1}
          disabled={payouts.isLoading}
          onPageChange={(page) => setList({ page })}
        />
      </Panel>

      <PayoutSheet key={list.open || "none"} payoutId={list.open || null} mode={mode} onClose={() => open(null)} onChanged={reloadAll} />
    </section>
  );
}

function PayoutSheet({
  payoutId,
  mode,
  onClose,
  onChanged,
}: {
  payoutId: string | null;
  mode: PaymentMode;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { data: payout, error, mutate, reload } = useResource<Disbursement>(payoutId ? `${API}/${encodeURIComponent(payoutId)}` : null);
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
  const registeredName = payout ? registeredNameOf(payout) : null;
  const needsTick = payout ? needsNameAcknowledgement(payout, registeredName) : false;
  const auditNotes = payout ? payoutAuditNotes(payout) : [];
  const test = isTestRail(mode, "bank");

  async function act(action: "confirm" | "cancel") {
    if (!payout) return;
    setActionError(null);
    setNotice(null);
    setWorking(action);
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/${action}`, {
        method: "POST",
        // The confirm contract only takes acknowledgeNameMismatch, for MISMATCH. The other ticks are
        // checked here in the browser until the backend takes an acknowledgement and a reason (§3).
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
          <SheetTitle className="text-navy">{payout ? (payout.beneficiaryName ?? `Beneficiary #${payout.beneficiaryId}`) : "Payout"}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {shown ? <Badge tone={shown.tone}>{shown.label}</Badge> : null}
            <span className="font-mono text-xs">{payoutId}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <PaymentModeBanner mode={mode} rails={["bank"]} />
          <ErrorAlert error={error} onRetry={reload} />
          {notice ? <InlineAlert tone="info">{notice}</InlineAlert> : null}
          {actionError ? <InlineAlert>{actionError}</InlineAlert> : null}
          {!payout && !error ? <p className="text-sm text-black/60">Loading…</p> : null}
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
                  <p className="text-sm text-navy">
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
                  <p className="text-sm text-navy">
                    Prepared, not paid. Confirm before {formatDateTime(payout.expiresAt ?? null)} or it expires.
                  </p>
                  {expiringSoon ? <InlineAlert tone="warning">{EXPIRING_SOON}</InlineAlert> : null}
                  {needsTick ? (
                    <NameCheckAcknowledgement payout={payout} registeredName={registeredName} checked={acknowledged} onCheckedChange={setAcknowledged} />
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive-outline"
                      size="sm"
                      onClick={() => act("cancel")}
                      disabled={isWorking && working !== "cancel"}
                      loading={working === "cancel"}
                      loadingText="Cancelling…"
                    >
                      Cancel payout
                    </Button>
                    {unsure ? (
                      <Button size="sm" onClick={checkStatus} disabled={isWorking && working !== "check"} loading={working === "check"} loadingText="Checking…">
                        Check status
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => act("confirm")}
                        disabled={(isWorking && working !== "confirm") || (needsTick && !acknowledged)}
                        loading={working === "confirm"}
                        loadingText="Sending…"
                      >
                        Pay {formatEtb(payout.amountEtb)}
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}

              {payout.status === "SUCCEEDED" && test ? (
                <InlineAlert tone="warning">Paid in test mode: the bank connection is a sandbox, so no money moved.</InlineAlert>
              ) : null}
              {payout.status === "SUCCEEDED" && payout.poolUpdated === false ? (
                <InlineAlert tone="info">Paid. The pool record hasn&apos;t caught up yet; it&apos;s retried every minute.</InlineAlert>
              ) : null}

              <PayoutReview payout={payout} registeredName={registeredName} />

              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/60 uppercase">Who did what</p>
                <DetailList
                  columns={2}
                  items={[
                    { label: "Prepared by", value: staffRef(payout.createdBy, payout.createdByName) },
                    { label: "Paid by", value: staffRef(payout.confirmedBy, payout.confirmedByName) },
                    { label: "Settled by", value: staffRef(payout.resolvedBy, payout.resolvedByName) },
                  ]}
                />
                {auditNotes.length ? (
                  <InlineAlert tone="warning">
                    <ul className="list-disc space-y-0.5 pl-4">
                      {auditNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </InlineAlert>
                ) : null}
              </div>

              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/60 uppercase">Household</p>
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
                <p className="text-xs font-semibold tracking-wide text-black/60 uppercase">Bank and timeline</p>
                <DetailList
                  columns={2}
                  items={[
                    { label: "Fund", value: payout.fund ? `${fundLabel(payout.fund)} fund` : null },
                    { label: "Payment method", value: RAIL_LABEL[payout.rail] ?? payout.rail },
                    { label: "Name check", value: nameCheckOf(payout).label },
                    { label: "Bank request number", value: payout.messageId ? <span className="font-mono">{payout.messageId}</span> : null },
                    { label: "Bank reference (FT)", value: payout.providerReference ? <span className="font-mono">{payout.providerReference}</span> : null },
                    ...(payout.rail === "IPS"
                      ? [
                          { label: "Receiving bank code", value: payout.destinationBankCode ? <span className="font-mono">{payout.destinationBankCode}</span> : null },
                          { label: "Interbank transaction number", value: payout.providerTransactionId ? <span className="font-mono text-xs break-all">{payout.providerTransactionId}</span> : null },
                          { label: "Interbank request number", value: payout.providerMessageId ? <span className="font-mono text-xs break-all">{payout.providerMessageId}</span> : null },
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

type BankAnswer = "SUCCEEDED" | "FAILED";

const BANK_ANSWERS: readonly ChoiceOption<BankAnswer>[] = [
  { value: "SUCCEEDED", label: "Money moved", description: "Mark paid; the household leaves the pool" },
  { value: "FAILED", label: "Not paid", description: "The household stays pooled", tone: "destructive" },
];

function SettleForm({ payout, onSettled }: { payout: Disbursement; onSettled: (payout: Disbursement) => void }) {
  const [outcome, setOutcome] = useState<BankAnswer | null>(null);
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
          <p className="text-sm font-semibold text-navy">Settle this payout</p>
          <p className="mt-0.5 text-xs text-black/60">
            Ask Coop Bank quoting bank request number <span className="font-mono">{payout.messageId ?? "—"}</span>, then record their answer. The
            bank calls below show what the bank answered.
          </p>
        </div>
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <FormField label="Bank answer" required>
          {(control) => <ChoiceCards id={control.id} value={outcome} onValueChange={setOutcome} options={BANK_ANSWERS} required />}
        </FormField>
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

/**
 * Every call made to the bank for one payout, oldest first. Used when settling
 * a PROCESSING payout. The BFF passes only the status, codes, messages and
 * references of each call (account numbers masked), never the raw bodies.
 */
function BankCalls({ payoutId, defaultOpen }: { payoutId: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { data, error, isLoading, reload } = useResource<BankCall[]>(open ? `${API}/${encodeURIComponent(payoutId)}/bank-calls` : null);
  const calls = data ?? [];

  return (
    <div className="space-y-3 border-t border-black/[0.06] pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-black/60 uppercase">Bank calls</p>
        <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open ? (
        <>
          <ErrorAlert error={error} onRetry={reload} />
          {isLoading && !data ? <p className="text-sm text-black/60">Loading…</p> : null}
          {data && calls.length === 0 ? <p className="text-sm text-black/60">No calls to the bank yet.</p> : null}
          <ol className="space-y-2">
            {calls.map((call) => (
              <li key={call.callId} className="rounded-lg border border-black/[0.08] p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-navy">{BANK_CALL_OPERATION[call.operation] ?? call.operation}</span>
                  <Badge tone={BANK_CALL_OUTCOME[call.outcome] ?? "neutral"}>{call.outcome}</Badge>
                  {call.httpStatus != null ? <span className="font-mono text-xs text-black/60">HTTP {call.httpStatus}</span> : null}
                  {call.durationMs != null ? <span className="text-xs text-black/60">{formatCount(call.durationMs)} ms</span> : null}
                  <span className="ml-auto text-xs text-black/60">{formatDateTime(call.at)}</span>
                </div>
                {call.messageId ? (
                  <p className="mt-1 text-xs text-black/60">
                    Bank request number <span className="font-mono">{call.messageId}</span>
                  </p>
                ) : null}
                {call.correlationId ? (
                  <p className="mt-0.5 text-xs text-black/60">
                    Tracking number <span className="font-mono">{call.correlationId}</span>
                  </p>
                ) : null}
                {call.error ? <p className="mt-1 text-xs text-rose-700">{call.error}</p> : null}
                <CallFields label="Sent" fields={call.requestFields} />
                <CallFields label="Bank answered" fields={call.responseFields} />
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

function CallFields({ label, fields }: { label: string; fields?: PayloadField[] }) {
  if (!fields?.length) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-black/60">{label}</p>
      <dl className="mt-1 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs">
        {fields.map((field, index) => (
          <div key={`${field.label}-${index}`} className="contents">
            <dt className="text-black/60">{field.label}</dt>
            <dd className="font-mono break-all text-navy">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The Zakat and Awqaf accounts payouts are paid from. Each account is looked up with Coop Bank on save. */
function FundAccountsPanel() {
  const { data, error, mutate, reload } = useResource<FundAccounts>(`${API}/funds`);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
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
      <ErrorAlert error={error} onRetry={reload} />
      {notice ? (
        <InlineAlert tone="success" className="mb-4">
          {notice}
        </InlineAlert>
      ) : null}
      {!data && !error ? <p className="text-sm text-black/60">Loading…</p> : null}
      {data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <div key={account.fund} className="rounded-xl border border-black/[0.08] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy">{account.label ?? fundLabel(account.fund)} fund</p>
                <Badge tone={account.ready ? "success" : "warning"}>{account.ready ? "Ready" : "Not set"}</Badge>
              </div>
              <p className="mt-2 font-mono text-sm text-navy">{account.accountNumber ?? "—"}</p>
              <p className="mt-0.5 text-xs text-black/60">
                {account.accountName || account.bankHolderName || "No name"}
                {account.bankHolderName && account.accountName && account.bankHolderName !== account.accountName
                  ? ` (bank: ${account.bankHolderName})`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {data?.updatedAt ? (
        <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-black/60">
          Last changed {formatDateTime(data.updatedAt)}
          {data.updatedBy || data.updatedByName ? <>by {staffRef(data.updatedBy, data.updatedByName)}</> : null}
        </p>
      ) : null}
      {editing && data ? (
        <FundAccountsDialog
          accounts={data}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            mutate(next);
            setEditing(false);
            setNotice("Fund accounts saved. New payouts are paid from these accounts.");
          }}
        />
      ) : null}
    </Panel>
  );
}

function changeText(change: FundAccountChange) {
  const what = change.field === "accountNumber" ? "account number" : "account name";
  if (change.cleared) return `${fundLabel(change.fund)} ${what} cleared (was ${change.from}). This fund can't pay out until a new account is set.`;
  if (!change.from) return `${fundLabel(change.fund)} ${what} set to ${change.to}.`;
  if (!change.to) return `${fundLabel(change.fund)} ${what} removed (was ${change.from}).`;
  return `${fundLabel(change.fund)} ${what}: ${change.from} → ${change.to}.`;
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
  const [confirming, setConfirming] = useState(false);
  const changes = fundAccountChanges(accounts, form);

  function set(fund: "zakat" | "waqf", key: "accountNumber" | "accountName", value: string) {
    setForm((prev) => ({ ...prev, [fund]: { ...prev[fund], [key]: value } }));
  }

  // Payouts are paid from these accounts, so a save first shows what changes.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (changes.length) setConfirming(true);
  }

  async function save() {
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
      // Shown on the form, next to the fields, once the confirm step closes.
      setError(saveError instanceof ApiError ? payoutErrorMessage(saveError.code, saveError.message) : "Couldn't save the fund accounts");
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    }
  }

  return (
    <Dialog open onOpenChange={(value) => !value && !confirming && onClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-navy">Fund accounts</DialogTitle>
            <DialogDescription>
              Each account is looked up with Coop Bank. Leave a number blank to clear that fund. The name is sent to the bank as the payer
              name; if blank, the bank&apos;s own name for the account is used.
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          {(["zakat", "waqf"] as const).map((key) => (
            <fieldset key={key} className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-semibold text-navy">{key === "zakat" ? "Zakat" : "Awqaf"} fund</legend>
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
            <Button type="submit" disabled={changes.length === 0}>
              <Save />
              Review changes
            </Button>
          </DialogFooter>
        </form>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title="Change the payout accounts?"
          description="New payouts are paid from these accounts. Each account is checked with Coop Bank when you save."
          confirmLabel="Save accounts"
          destructive={changes.some((change) => change.cleared)}
          onConfirm={save}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-navy">
            {changes.map((change) => (
              <li key={`${change.fund}-${change.field}`} className={cn(change.cleared && "text-rose-700")}>
                {changeText(change)}
              </li>
            ))}
          </ul>
        </ConfirmDialog>
      </DialogContent>
    </Dialog>
  );
}
