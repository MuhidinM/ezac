"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { CircleAlert, RefreshCw } from "lucide-react";

import { StatTile } from "@/components/charts/stat-tile";
import { PayoutReview } from "@/components/disbursements/payout-dialog";
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
  type Disbursement,
  DISBURSEMENT_STATUSES,
  type DisbursementStatus,
  type DisbursementSummary,
  disbursementStatus,
  NAME_CHECK,
  payoutErrorMessage,
  type Rail,
  RAIL_LABEL,
} from "@/lib/zakat/disbursements";
import { paymentRangeQuery } from "@/lib/zakat/payments";
import { cn } from "@/lib/utils";

const API = "/api/payments-admin/disbursements";
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
  const [page, setPage] = useState(1);

  const rangeParams = paymentRangeQuery(range);
  const summary = useResource<DisbursementSummary>(`${API}/summary?${rangeParams}`);
  const list = useResource<PaginatedItems<Disbursement>>(
    `${API}?${rangeParams}${status ? `&status=${status}` : ""}${rail ? `&rail=${rail}` : ""}&page=${page}&limit=${PAGE_SIZE}`,
  );
  const rows = list.data?.items ?? [];
  const s = summary.data;

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
        description="Payments from the commission account to pooled households. Coop Bank accounts are paid by internal transfer, other banks by IPS. Start a payout from the disbursement pool."
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Paid out" value={s ? formatEtb(s.succeededAmountEtb) : "—"} hint="In this period" loading={summary.isLoading && !s} />
        <StatTile label="Households paid" value={s ? s.succeededCount.toLocaleString("en") : "—"} hint={s ? `of ${s.totalCount.toLocaleString("en")} payouts` : undefined} loading={summary.isLoading && !s} />
        <StatTile
          label="Average payout"
          value={s && s.succeededCount > 0 ? formatEtb(Math.round(s.succeededAmountEtb / s.succeededCount)) : "—"}
          loading={summary.isLoading && !s}
        />
        <StatTile label="Needs checking" value={s ? s.needsChecking.toLocaleString("en") : "—"} hint="Waiting on the bank" loading={summary.isLoading && !s} />
      </div>

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
                const count = s?.byStatus.find((row) => row.status === item.value)?.count;
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
                const shown = disbursementStatus(payout.status);
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
                    <TableCell className="text-right tabular-nums">{formatEtb(payout.amountEtb)}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={shown.tone}>
                          {payout.status === "PROCESSING" ? <CircleAlert /> : null}
                          {shown.label}
                        </Badge>
                        {payout.nameCheck === "MISMATCH" ? <Badge tone="danger">Names differ</Badge> : null}
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
  const [isWorking, setIsWorking] = useState(false);
  const shown = payout ? disbursementStatus(payout.status) : null;

  async function act(action: "confirm" | "cancel") {
    if (!payout) return;
    setActionError(null);
    setIsWorking(true);
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "confirm" && payout.nameCheck === "MISMATCH" ? { acknowledgeNameMismatch: acknowledged } : {}),
      });
      mutate(next);
      onChanged();
    } catch (actError) {
      setActionError(actError instanceof ApiError ? payoutErrorMessage(actError.code, actError.message) : "Something went wrong");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <Sheet open={payoutId !== null} onOpenChange={(value) => !value && onClose()}>
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

              {payout.status === "AWAITING_CONFIRMATION" ? (
                <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
                  <p className="text-sm text-[#001539]">
                    Prepared, not paid. Confirm before {formatDateTime(payout.expiresAt ?? null)} or it expires.
                  </p>
                  {payout.nameCheck === "MISMATCH" ? (
                    <label className="flex items-start gap-2 text-sm text-[#001539]">
                      <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5 size-4 accent-[#007050]" />
                      I compared the names and this is the right account.
                    </label>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => act("cancel")} disabled={isWorking}>
                      Cancel payout
                    </Button>
                    <Button size="sm" onClick={() => act("confirm")} disabled={isWorking || (payout.nameCheck === "MISMATCH" && !acknowledged)}>
                      {isWorking ? "Sending…" : `Pay ${formatEtb(payout.amountEtb)}`}
                    </Button>
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
                    { label: "Rail", value: RAIL_LABEL[payout.rail] ?? payout.rail },
                    { label: "Name check", value: NAME_CHECK[payout.nameCheck]?.label },
                    { label: "Message id", value: payout.messageId ? <span className="font-mono">{payout.messageId}</span> : null },
                    { label: "Bank reference", value: payout.providerReference ? <span className="font-mono">{payout.providerReference}</span> : null },
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
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSaving(true);
    try {
      const next = await apiClient<Disbursement>(`${API}/${encodeURIComponent(payout.disbursementId)}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          status: outcome,
          ...(outcome === "SUCCEEDED" ? { providerReference: reference.trim() } : {}),
          note: note.trim(),
        }),
      });
      onSettled(next);
    } catch (settleError) {
      setError(errorMessage(settleError, "Couldn't settle the payout"));
      if (settleError instanceof ApiError) setFieldErrors(fieldErrorMap(settleError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-[#001539]">Settle this payout</p>
        <p className="mt-0.5 text-xs text-black/55">
          Ask Coop Bank quoting message id <span className="font-mono">{payout.messageId ?? "—"}</span>, then record their answer.
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
      {outcome === "SUCCEEDED" ? (
        <FormField label="Bank reference" htmlFor="settle-ref" required error={fieldErrors.providerReference}>
          <Input id="settle-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="FT…" required className="font-mono" />
        </FormField>
      ) : null}
      <FormField label="Note" htmlFor="settle-note" required hint="Who at Coop Bank confirmed, and when" error={fieldErrors.note}>
        <Textarea id="settle-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} required />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || !outcome || !note.trim() || (outcome === "SUCCEEDED" && !reference.trim())}>
          {isSaving ? "Saving…" : "Settle payout"}
        </Button>
      </div>
    </form>
  );
}
