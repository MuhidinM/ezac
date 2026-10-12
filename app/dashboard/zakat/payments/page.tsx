"use client";

import { type FormEvent, useState } from "react";
import { BadgeCheck, CircleAlert, Copy, RefreshCw, Search } from "lucide-react";

import { StatTile } from "@/components/charts/stat-tile";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { EthqrTransactions } from "@/components/zakat/ethqr-transactions";
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
  canResolve,
  displayStatus,
  isQr,
  PAYMENT_STATUSES,
  type PaymentStatus,
  type PaymentSummary,
  paymentRangeQuery,
  type ZakatPayment,
} from "@/lib/zakat/payments";
import { cn } from "@/lib/utils";

const API = "/api/payments-admin/zakat-payments";
const PAGE_SIZE = 20;

export default function PaymentsAdminPage() {
  return (
    <RequireRole audience={["admin"]}>
      <PaymentsAdmin />
    </RequireRole>
  );
}

function PaymentsAdmin() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  // Captured once per mount; only used to show stale open payments as expired.
  const [now] = useState(() => Date.now());

  const rangeParams = paymentRangeQuery(range);
  const summary = useResource<PaymentSummary>(`${API}/summary?${rangeParams}`);
  const list = useResource<PaginatedItems<ZakatPayment>>(
    `${API}?${rangeParams}${status ? `&status=${status}` : ""}&page=${page}&limit=${PAGE_SIZE}`,
  );
  const rows = list.data?.items ?? [];
  const s = summary.data;
  const qrToConfirm = s?.byStatus.find((row) => row.status === "AWAITING_PAYMENT")?.count ?? 0;

  function filter(next: PaymentStatus | "") {
    setStatus(next);
    setPage(1);
  }

  function reloadAll() {
    summary.reload();
    list.reload();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Zakat payments"
        description="Payments made in the app, from a Coop Bank account or by QR code. Quote the message id and bank reference when asking Coop Bank about a payment."
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
        <InlineAlert tone="warning" title={`${s.needsChecking} payment${s.needsChecking === 1 ? "" : "s"} need checking`}>
          The bank gave no clear answer, so the money may or may not have moved. Ask Coop Bank and settle each one.{" "}
          {status !== "PROCESSING" ? (
            <button type="button" className="font-medium underline underline-offset-2" onClick={() => filter("PROCESSING")}>
              Show them
            </button>
          ) : null}
        </InlineAlert>
      ) : null}
      {qrToConfirm > 0 ? (
        <InlineAlert tone="warning" title={`${qrToConfirm} QR payment${qrToConfirm === 1 ? "" : "s"} to confirm`}>
          EthQR doesn&apos;t tell us which QR was paid yet. Match each one with the EthQR list below and confirm it.{" "}
          {status !== "AWAITING_PAYMENT" ? (
            <button type="button" className="font-medium underline underline-offset-2" onClick={() => filter("AWAITING_PAYMENT")}>
              Show them
            </button>
          ) : null}
        </InlineAlert>
      ) : null}
      {summary.error ? <InlineAlert>{summary.error.message}</InlineAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Collected" value={s ? formatEtb(s.succeededAmountEtb) : "—"} hint="Paid in this period" loading={summary.isLoading && !s} />
        <StatTile label="Paid" value={s ? s.succeededCount.toLocaleString("en") : "—"} hint={s ? `of ${s.totalCount.toLocaleString("en")} started` : undefined} loading={summary.isLoading && !s} />
        <StatTile
          label="Success rate"
          value={s && s.totalCount > 0 ? `${Math.round((s.succeededCount / s.totalCount) * 100)}%` : "—"}
          hint="Paid ÷ started"
          loading={summary.isLoading && !s}
        />
        <StatTile label="Needs checking" value={s ? s.needsChecking.toLocaleString("en") : "—"} hint="Waiting on Coop Bank" loading={summary.isLoading && !s} />
      </div>

      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-5 py-3">
          <div className="w-52">
            <NativeSelect aria-label="Status" value={status} onChange={(e) => filter(e.target.value as PaymentStatus | "")}>
              <option value="">All statuses</option>
              {PAYMENT_STATUSES.map((item) => {
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
          {status ? (
            <Button variant="ghost" size="sm" onClick={() => filter("")}>
              Clear
            </Button>
          ) : null}
        </div>
        {list.error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{list.error.message}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Payer</TableHead>
              <TableHead>For</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5">Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={5}>No payments in this period.</TableMessageRow>
            ) : (
              rows.map((payment) => {
                const shown = displayStatus(payment, now);
                return (
                  <TableRow
                    key={payment.paymentId}
                    className={cn(
                      "cursor-pointer",
                      (payment.status === "PROCESSING" || payment.status === "AWAITING_PAYMENT") && "bg-amber-50/60 hover:bg-amber-50",
                    )}
                    onClick={() => setOpenId(payment.paymentId)}
                  >
                    <TableCell className="pl-5">
                      <button type="button" className="text-left font-medium text-[#001539] hover:underline" onClick={() => setOpenId(payment.paymentId)}>
                        {payment.payerFullName ?? payment.accountHolderName ?? "Unknown payer"}
                      </button>
                      <span className="block text-xs text-black/50">
                        {[isQr(payment) ? "QR" : "Coop account", payment.payerPhone, payment.payerType === "guest" ? "Guest" : payment.payerType ? "App user" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-56 truncate">{payment.causeTitle ?? "—"}</span>
                      {payment.zakatType ? <span className="block text-xs capitalize text-black/50">{payment.zakatType.replace(/_/g, " ")}</span> : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatEtb(payment.amountEtb)}</TableCell>
                    <TableCell>
                      <Badge tone={shown.tone}>
                        {payment.status === "PROCESSING" || payment.status === "AWAITING_PAYMENT" ? <CircleAlert /> : null}
                        {shown.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-sm text-black/60">{formatDateTime(payment.createdAt)}</TableCell>
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

      <EthqrTransactions key={range} range={range} />

      <CertificateCheck />

      <PaymentSheet
        paymentId={openId}
        now={now}
        onClose={() => setOpenId(null)}
        onResolved={reloadAll}
      />
    </section>
  );
}

function CopyValue({ value }: { value: string | undefined }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[13px]">
      {value}
      <button
        type="button"
        aria-label="Copy"
        className="text-black/35 hover:text-[#001539]"
        onClick={() => void navigator.clipboard?.writeText(value)}
      >
        <Copy className="size-3.5" />
      </button>
    </span>
  );
}

function PaymentSheet({
  paymentId,
  now,
  onClose,
  onResolved,
}: {
  paymentId: string | null;
  now: number;
  onClose: () => void;
  onResolved: () => void;
}) {
  const { data: payment, error, mutate } = useResource<ZakatPayment>(paymentId ? `${API}/${encodeURIComponent(paymentId)}` : null);
  const shown = payment ? displayStatus(payment, now) : null;

  return (
    <Sheet open={paymentId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-[#001539]">{payment ? formatEtb(payment.amountEtb) : "Payment"}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {shown ? <Badge tone={shown.tone}>{shown.label}</Badge> : null}
            <span className="font-mono text-xs">{paymentId}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {error ? <InlineAlert>{error.message}</InlineAlert> : null}
          {!payment && !error ? <p className="text-sm text-black/45">Loading…</p> : null}
          {payment ? (
            <>
              {canResolve(payment) ? (
                <ResolveForm
                  key={payment.paymentId}
                  payment={payment}
                  onResolved={(next) => {
                    mutate(next);
                    onResolved();
                  }}
                />
              ) : null}

              <DetailList
                columns={2}
                items={[
                  { label: "Payer", value: payment.payerFullName },
                  { label: "Phone", value: payment.payerPhone },
                  { label: "Payer type", value: payment.payerType === "guest" ? "Guest" : payment.payerType ? "App user" : null },
                  { label: "Method", value: isQr(payment) ? "QR code (EthQR)" : "Coop Bank account" },
                  { label: "Zakat type", value: payment.zakatType?.replace(/_/g, " ") },
                  { label: "Cause", value: payment.causeTitle },
                  { label: "Certificate", value: payment.certificateId },
                ]}
              />
              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">Bank</p>
                <DetailList
                  columns={2}
                  items={[
                    { label: "Message id", value: <CopyValue value={payment.messageId} /> },
                    { label: "Bank reference", value: <CopyValue value={payment.providerReference} /> },
                    { label: "Debit account", value: <CopyValue value={payment.debitAccount} /> },
                    { label: "Account holder", value: payment.accountHolderName },
                    { label: "Credit account", value: <CopyValue value={payment.creditAccount} /> },
                    { label: "Failure reason", value: payment.failureReason },
                  ]}
                />
              </div>
              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">Timeline</p>
                <DetailList
                  columns={2}
                  items={[
                    { label: "Started", value: formatDateTime(payment.createdAt) },
                    { label: "Paid", value: formatDateTime(payment.paidAt ?? null) },
                    ...(isQr(payment) ? [{ label: "QR payable until", value: formatDateTime(payment.expiresAt ?? null) }] : []),
                    { label: "Last update", value: formatDateTime(payment.updatedAt ?? null) },
                    { label: "Settled by", value: payment.resolvedBy },
                  ]}
                />
                {payment.resolutionNote ? (
                  <p className="rounded-lg bg-black/[0.03] p-3 text-sm whitespace-pre-line text-black/70">{payment.resolutionNote}</p>
                ) : null}
              </div>
              {payment.providerResponse ? (
                <details className="border-t border-black/[0.06] pt-4">
                  <summary className="cursor-pointer text-xs font-medium text-black/55">Raw bank response</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/[0.03] p-3 text-xs whitespace-pre-wrap break-all">
                    {payment.providerResponse}
                  </pre>
                </details>
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ResolveForm({ payment, onResolved }: { payment: ZakatPayment; onResolved: (payment: ZakatPayment) => void }) {
  const qr = isQr(payment);
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
      const next = await apiClient<ZakatPayment>(`${API}/${encodeURIComponent(payment.paymentId)}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          status: outcome,
          ...(outcome === "SUCCEEDED" ? { providerReference: reference.trim() } : {}),
          note: note.trim(),
        }),
      });
      onResolved(next);
    } catch (resolveError) {
      const usedBy =
        resolveError instanceof ApiError && resolveError.status === 409
          ? (resolveError.data as { paymentId?: string } | null)?.paymentId
          : undefined;
      setError(
        usedBy
          ? `That reference already confirmed payment ${usedBy}. One EthQR transaction confirms one payment.`
          : errorMessage(resolveError, "Couldn't settle the payment"),
      );
      if (resolveError instanceof ApiError) setFieldErrors(fieldErrorMap(resolveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-[#001539]">{qr ? "Confirm this QR payment" : "Settle this payment"}</p>
        <p className="mt-0.5 text-xs text-black/55">
          {qr ? (
            <>
              Find a transaction of {formatEtb(payment.amountEtb)} around {formatDateTime(payment.createdAt)} in the EthQR list, then record it.
            </>
          ) : (
            <>
              Ask Coop Bank quoting message id <span className="font-mono">{payment.messageId ?? "—"}</span>, then record their answer.
            </>
          )}
        </p>
      </div>
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <div role="radiogroup" aria-label="Outcome" className="grid grid-cols-2 gap-2">
        {(
          qr
            ? ([
                ["SUCCEEDED", "Paid", "Matched in EthQR; issue the certificate"],
                ["FAILED", "Never paid", "Close the QR payment"],
              ] as const)
            : ([
                ["SUCCEEDED", "Money moved", "Mark paid and issue the certificate"],
                ["FAILED", "No debit", "Mark failed"],
              ] as const)
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
        <FormField label={qr ? "EthQR transaction reference" : "Bank reference"} htmlFor="resolve-ref" required error={fieldErrors.providerReference}>
          <Input id="resolve-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={qr ? undefined : "FT…"} required className="font-mono" />
        </FormField>
      ) : null}
      <FormField label="Note" htmlFor="resolve-note" required hint={qr ? "How you matched it, e.g. time and amount" : "Who at Coop Bank confirmed, and when"} error={fieldErrors.note}>
        <Textarea id="resolve-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} required />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || !outcome || !note.trim() || (outcome === "SUCCEEDED" && !reference.trim())}>
          {isSaving ? "Saving…" : qr ? "Record" : "Settle payment"}
        </Button>
      </div>
    </form>
  );
}

type CertificateResult = {
  valid: boolean;
  certificateId: string;
  payerName?: string | null;
  amountEtb?: number | null;
  zakatType?: string | null;
  paidAt?: string | null;
};

function CertificateCheck() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsChecking(true);
    try {
      setResult(await apiClient<CertificateResult>(`/api/certificates/verify/${encodeURIComponent(id.trim())}`));
    } catch (checkError) {
      setError(errorMessage(checkError, "Couldn't check the certificate"));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <Panel title="Check a certificate" description="Confirm a donor's zakat certificate number">
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
        <FormField label="Certificate number" htmlFor="cert-id" className="w-64">
          <Input id="cert-id" value={id} onChange={(e) => setId(e.target.value)} placeholder="ZC-2026-000451" className="font-mono" required />
        </FormField>
        <Button type="submit" variant="outline" disabled={isChecking || !id.trim()}>
          <Search />
          {isChecking ? "Checking…" : "Check"}
        </Button>
      </form>
      {error ? <InlineAlert className="mt-4">{error}</InlineAlert> : null}
      {result ? (
        result.valid ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              <BadgeCheck className="size-4" />
              Valid certificate
            </p>
            <DetailList
              columns={4}
              items={[
                { label: "Payer", value: result.payerName },
                { label: "Amount", value: formatEtb(result.amountEtb) },
                { label: "Zakat type", value: result.zakatType?.replace(/_/g, " ") },
                { label: "Paid", value: formatDateTime(result.paidAt ?? null) },
              ]}
            />
          </div>
        ) : (
          <InlineAlert className="mt-4">No valid certificate with that number.</InlineAlert>
        )
      ) : null}
    </Panel>
  );
}
