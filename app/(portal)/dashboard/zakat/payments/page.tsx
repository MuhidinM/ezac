"use client";

import { type FormEvent, Suspense, useState } from "react";
import { BadgeCheck, CircleAlert, Copy, RefreshCw, ScanSearch, Search, X } from "lucide-react";

import { StatTile } from "@/components/charts/stat-tile";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { useServerNow } from "@/components/disbursements/payout-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { EthqrTransactions } from "@/components/zakat/ethqr-transactions";
import { PaymentModeBanner, TestBadge, isTestRail, usePaymentMode } from "@/components/zakat/payment-mode-banner";
import { staffRef } from "@/components/zakat/staff-ref";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  canResolve,
  checkCountsForNotPaid,
  displayStatus,
  isOpenQr,
  isQr,
  PAYMENT_STATUSES,
  type PaymentSummary,
  paymentRangeQuery,
  type QrCloseBlock,
  qrNotPaidBlock,
  type ZakatPayment,
} from "@/lib/zakat/payments";
import { cn } from "@/lib/utils";

const API = "/bff/payments-admin/zakat-payments";
const PAGE_SIZE = 20;

const LIST_DEFAULTS = { range: "30d", status: "", method: "", page: 1, open: "" };
const LIST_ALLOWED = {
  range: RANGE_OPTIONS.map((option) => option.key),
  status: ["", ...PAYMENT_STATUSES.map((item) => item.value)],
  method: ["", "ethqr", "coopbank"],
};

export default function PaymentsAdminPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <PaymentsAdmin />
      </Suspense>
    </RequireRole>
  );
}

function PaymentsAdmin() {
  // Filters, page and the open payment live in the URL, so reload and Back keep them.
  const [list, setList] = useListState("", LIST_DEFAULTS, { allowed: LIST_ALLOWED });
  const range = list.range as RangeKey;
  const { status, method } = list;
  const openId = list.open || null;
  // Captured once per mount; only used to show stale open payments as expired.
  const [now] = useState(() => Date.now());
  const mode = usePaymentMode();

  const rangeParams = paymentRangeQuery(range);
  const summary = useResource<PaymentSummary>(`${API}/summary?${rangeParams}`);
  const payments = useResource<PaginatedItems<ZakatPayment>>(
    `${API}?${rangeParams}${status ? `&status=${status}` : ""}&page=${list.page}&limit=${PAGE_SIZE}`,
  );
  // The API can't filter by method yet, so the method filter narrows the loaded page only.
  const allRows = payments.data?.items ?? [];
  const rows = method ? allRows.filter((row) => (method === "ethqr" ? isQr(row) : !isQr(row))) : allRows;
  const s = summary.data;

  function setOpenId(id: string | null) {
    setList({ open: id ?? "" }, { keepPage: true });
  }

  function reloadAll() {
    summary.reload();
    payments.reload();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Zakat payments"
        description="Donations made in the app. Donors pay by QR code from any bank app, and QR payments confirm themselves. Quote the bank reference when asking Coop Bank about a payment."
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

      <PaymentModeBanner mode={mode} rails={["bank", "qr", "otp"]} />

      {s && s.needsChecking > 0 ? (
        <InlineAlert tone="warning" title={`${formatCount(s.needsChecking)} payment${s.needsChecking === 1 ? "" : "s"} need checking`}>
          The bank reference already confirmed another payment, or the bank gave no clear answer. Check each one (see its failure reason) and settle it.{" "}
          {status !== "PROCESSING" ? (
            <button type="button" className="font-medium underline underline-offset-2" onClick={() => setList({ status: "PROCESSING" })}>
              Show them
            </button>
          ) : null}
        </InlineAlert>
      ) : null}
      <ErrorAlert error={summary.error} onRetry={summary.reload} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Collected"
          value={s ? formatEtb(s.succeededAmountEtb, { compact: true }) : "—"}
          hint={s && s.succeededAmountEtb >= 10_000 ? `${formatEtb(s.succeededAmountEtb)} paid in this period` : "Paid in this period"}
          loading={summary.isLoading && !s}
        />
        <StatTile
          label="Paid"
          value={s ? formatCount(s.succeededCount, { compact: true }) : "—"}
          hint={s ? `of ${formatCount(s.totalCount)} started` : undefined}
          loading={summary.isLoading && !s}
        />
        <StatTile
          label="Success rate"
          value={s && s.totalCount > 0 ? `${Math.round((s.succeededCount / s.totalCount) * 100)}%` : "—"}
          hint="Paid ÷ started"
          loading={summary.isLoading && !s}
        />
        <StatTile label="Needs checking" value={s ? formatCount(s.needsChecking) : "—"} hint="Settle by hand" loading={summary.isLoading && !s} />
      </div>

      <Panel flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-5 py-3">
          <div className="w-52">
            <NativeSelect aria-label="Status" value={status} onChange={(e) => setList({ status: e.target.value })}>
              <option value="">All statuses</option>
              {PAYMENT_STATUSES.map((item) => {
                const count = s?.byStatus.find((row) => row.status === item.value)?.count;
                return (
                  <option key={item.value} value={item.value}>
                    {item.label}
                    {count != null ? ` (${formatCount(count)})` : ""}
                  </option>
                );
              })}
            </NativeSelect>
          </div>
          <div className="w-44">
            <NativeSelect aria-label="Method" value={method} onChange={(e) => setList({ method: e.target.value }, { keepPage: true })}>
              <option value="">All methods</option>
              <option value="ethqr">QR</option>
              <option value="coopbank">Coop account</option>
            </NativeSelect>
          </div>
          {method ? <span className="text-xs text-black/45">Method filter applies to this page</span> : null}
          {status === "AWAITING_CONFIRMATION" || status === "OTP_SENT" || status === "EXPIRED" ? (
            <span className="text-xs text-black/45">
              {status === "EXPIRED"
                ? "Old Coop account payments left open over 15 minutes show as Expired, but are counted under Started or Waiting for code until the server closes them."
                : "Rows marked Expired were left open over 15 minutes and can no longer finish. The server still counts them here."}
            </span>
          ) : null}
          {status || method ? (
            <Button variant="ghost" size="sm" onClick={() => setList({ status: "", method: "" })}>
              <X />
              Clear
            </Button>
          ) : null}
        </div>
        {payments.error ? (
          <div className="px-5 pt-4">
            <ErrorAlert error={payments.error} onRetry={payments.reload} />
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
            {payments.isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={5}>{allRows.length ? "No payments with this method on this page." : "No payments in this period."}</TableMessageRow>
            ) : (
              rows.map((payment) => {
                const shown = displayStatus(payment, now);
                return (
                  <TableRow
                    key={payment.paymentId}
                    className={cn("cursor-pointer", payment.status === "PROCESSING" && "bg-amber-50/60 hover:bg-amber-50")}
                    onClick={() => setOpenId(payment.paymentId)}
                  >
                    <TableCell className="pl-5">
                      <button type="button" className="text-left font-medium text-navy hover:underline" onClick={() => setOpenId(payment.paymentId)}>
                        {payment.payerFullName ?? payment.paidByName ?? payment.accountHolderName ?? "Unknown payer"}
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
                    <TableCell className="text-right tabular-nums">
                      {formatEtb(payment.amountEtb)}
                      {payment.issuedAmountEtb != null ? (
                        <span className="block text-xs text-amber-700">QR asked {formatEtb(payment.issuedAmountEtb)}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={shown.tone}>
                          {payment.status === "PROCESSING" ? <CircleAlert /> : null}
                          {shown.label}
                        </Badge>
                        {payment.sandbox ? <TestBadge title="EthQR marked this payment as a sandbox payment: no money moved" /> : null}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 text-sm text-black/60">{formatDateTime(payment.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <ListPagination
          page={list.page}
          pageSize={PAGE_SIZE}
          totalItems={payments.data?.pagination.totalItems ?? 0}
          totalPages={payments.data?.pagination.totalPages ?? 1}
          disabled={payments.isLoading}
          onPageChange={(page) => setList({ page })}
        />
      </Panel>

      <EthqrTransactions key={range} range={range} onOpenPayment={setOpenId} test={isTestRail(mode, "qr")} />

      <CertificateCheck />

      <PaymentSheet
        key={openId ?? "none"}
        paymentId={openId}
        now={now}
        onClose={() => setOpenId(null)}
        onResolved={reloadAll}
      />
    </section>
  );
}

function CopyValue({ value }: { value: string | undefined | null }) {
  if (!value) return null;
  // Masked by the BFF (last 4 digits only): nothing useful to copy.
  if (value.includes("•")) return <span className="font-mono text-[13px]">{value}</span>;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[13px]">
      {value}
      <button
        type="button"
        aria-label="Copy"
        className="text-black/35 hover:text-navy"
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
  const { data: payment, error, mutate, reload } = useResource<ZakatPayment>(paymentId ? `${API}/${encodeURIComponent(paymentId)}` : null);
  const shown = payment ? displayStatus(payment, now) : null;
  const [check, setCheck] = useState<{ tone: "success" | "info" | "error"; text: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  // "Not paid" on an open QR payment waits for one "Check now" in this sheet (gap-r1-1-2).
  const [checkedNow, setCheckedNow] = useState(false);
  // The server's clock, so a wrong browser clock can't open "Not paid" early; the page's time until it is known.
  const serverNow = useServerNow(30_000);
  const notPaidBlock = payment ? qrNotPaidBlock(payment, serverNow ?? now, checkedNow) : null;

  async function checkNow() {
    if (!payment) return;
    setCheck(null);
    setIsChecking(true);
    try {
      const next = await apiClient<ZakatPayment>(`${API}/${encodeURIComponent(payment.paymentId)}/check`, { method: "POST" });
      mutate(next);
      setCheckedNow(true);
      if (next.status === "SUCCEEDED") {
        setCheck({ tone: "success", text: "EthQR reports it paid. The certificate has been issued." });
        onResolved();
      } else {
        setCheck({ tone: "info", text: "EthQR doesn't report it paid yet." });
      }
    } catch (checkError) {
      // Only a check EthQR answered (or can't be asked for) unlocks "Not paid".
      if (checkError instanceof ApiError && checkCountsForNotPaid(checkError)) setCheckedNow(true);
      setCheck({
        tone: "error",
        text:
          checkError instanceof ApiError && checkError.status === 409
            ? "This QR payment was started before automatic confirmation, so EthQR can't be asked. Confirm it by hand."
            : errorMessage(checkError, "Couldn't check with EthQR"),
      });
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <Sheet open={paymentId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-navy">{payment ? formatEtb(payment.amountEtb) : "Payment"}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {shown ? <Badge tone={shown.tone}>{shown.label}</Badge> : null}
            {payment?.sandbox ? <TestBadge /> : null}
            <span className="font-mono text-xs">{paymentId}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <ErrorAlert error={error} onRetry={reload} />
          {!payment && !error ? <p className="text-sm text-black/45">Loading…</p> : null}
          {payment ? (
            <>
              {payment.sandbox ? (
                <InlineAlert tone="warning" title="Test payment">
                  EthQR marked this as a sandbox payment: no money moved, even if it shows as paid.
                </InlineAlert>
              ) : null}
              {isOpenQr(payment) ? (
                <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
                  <p className="text-sm text-navy">
                    QR payments confirm themselves; the server keeps checking until 24 hours after the QR expires.
                    {payment.qrCheckCount != null
                      ? ` Checked ${payment.qrCheckCount} time${payment.qrCheckCount === 1 ? "" : "s"}${payment.qrLastCheckedAt ? `, last ${formatDateTime(payment.qrLastCheckedAt)}` : ""}.`
                      : ""}
                  </p>
                  {check ? <InlineAlert tone={check.tone}>{check.text}</InlineAlert> : null}
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={checkNow} loading={isChecking} loadingText="Checking…">
                      <ScanSearch />
                      Check now
                    </Button>
                  </div>
                </div>
              ) : null}

              {payment.status === "PROCESSING" ? (
                <ResolveForm
                  key={payment.paymentId}
                  payment={payment}
                  notPaidBlock={notPaidBlock}
                  onResolved={(next) => {
                    mutate(next);
                    onResolved();
                  }}
                />
              ) : canResolve(payment) ? (
                <details className="group rounded-xl border border-black/[0.08] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-navy">Confirm by hand or close as unpaid</summary>
                  <div className="mt-4">
                    <ResolveForm
                      key={payment.paymentId}
                      payment={payment}
                      notPaidBlock={notPaidBlock}
                      onResolved={(next) => {
                        mutate(next);
                        onResolved();
                      }}
                    />
                  </div>
                </details>
              ) : null}

              <DetailList
                columns={2}
                items={[
                  { label: "Payer", value: payment.payerFullName },
                  { label: "Phone", value: payment.payerPhone },
                  { label: "Payer type", value: payment.payerType === "guest" ? "Guest" : payment.payerType ? "App user" : null },
                  { label: "Method", value: isQr(payment) ? "QR code (EthQR)" : "Coop Bank account" },
                  ...(payment.issuedAmountEtb != null
                    ? [{ label: "QR asked for", value: <span className="text-amber-700">{formatEtb(payment.issuedAmountEtb)}</span> }]
                    : []),
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
                    ...(isQr(payment)
                      ? [
                          { label: "Paid by", value: payment.paidByName },
                          { label: "Paid from", value: payment.paidFromBank },
                          { label: "Bank paid at", value: formatDateTime(payment.bankPaidAt ?? null) },
                          { label: "QR order id", value: payment.ethqrOrderId ? <CopyValue value={payment.ethqrOrderId} /> : "None (old QR payment)" },
                        ]
                      : []),
                    { label: "Message id", value: payment.messageId ? <CopyValue value={payment.messageId} /> : null },
                    { label: "Bank reference", value: payment.providerReference ? <CopyValue value={payment.providerReference} /> : null },
                    { label: "Debit account", value: payment.debitAccount ? <CopyValue value={payment.debitAccount} /> : null },
                    { label: "Account holder", value: payment.accountHolderName },
                    { label: "Credit account", value: payment.creditAccount ? <CopyValue value={payment.creditAccount} /> : null },
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
                    { label: "Settled by", value: staffRef(payment.resolvedBy, payment.resolvedByName) },
                  ]}
                />
                {payment.resolutionNote ? (
                  <p className="rounded-lg bg-black/[0.03] p-3 text-sm whitespace-pre-line text-black/70">{payment.resolutionNote}</p>
                ) : null}
              </div>
              {payment.bankAnswer?.length ? (
                <div className="space-y-3 border-t border-black/[0.06] pt-4">
                  <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">What the bank answered</p>
                  <DetailList columns={2} items={payment.bankAnswer.map((field) => ({ label: field.label, value: field.value }))} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type Outcome = "SUCCEEDED" | "FAILED";

/** Why "Not paid" is greyed out on an open QR payment, in words. */
function notPaidBlockText(block: QrCloseBlock) {
  return block.reason === "still-checking"
    ? `Not before ${formatDateTime(new Date(block.until).toISOString())}: until then the donor can still pay or the server is still checking.`
    : "Click Check now first, so EthQR is asked once more.";
}

function ResolveForm({
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
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const paid = outcome === "SUCCEEDED";
  const donor = payment.payerFullName?.trim() || "the donor";
  const outcomes: readonly ChoiceOption<Outcome>[] = qr
    ? [
        { value: "SUCCEEDED", label: "Paid", description: "Issue the certificate" },
        {
          value: "FAILED",
          label: "Not paid",
          description: notPaidBlock ? notPaidBlockText(notPaidBlock) : "Close the payment as unpaid",
          disabled: notPaidBlock !== null,
          tone: "destructive",
        },
      ]
    : [
        { value: "SUCCEEDED", label: "Money moved", description: "Mark paid and issue the certificate" },
        { value: "FAILED", label: "No debit", description: "Mark failed", tone: "destructive" },
      ];
  // A "Not paid" picked before the block applied (e.g. the sheet reloaded) doesn't count.
  const chosen = outcome === "FAILED" && notPaidBlock ? null : outcome;

  // There's no undo, so the form only opens a confirm step that restates the outcome.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setConfirming(true);
  }

  async function resolve() {
    try {
      const next = await apiClient<ZakatPayment>(`${API}/${encodeURIComponent(payment.paymentId)}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          status: chosen,
          ...(paid ? { providerReference: reference.trim() } : {}),
          note: note.trim(),
        }),
      });
      onResolved(next);
    } catch (resolveError) {
      // Shown on the form, next to the fields, once the confirm step closes.
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
    }
  }

  return (
    <>
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-navy">{qr ? "Confirm this QR payment" : "Settle this payment"}</p>
        <p className="mt-0.5 text-xs text-black/55">
          {qr ? (
            <>
              Only if automatic confirmation failed: find the bank&apos;s transaction of {formatEtb(payment.amountEtb)} around{" "}
              {formatDateTime(payment.createdAt)} in the EthQR list below, then record its reference.
            </>
          ) : (
            <>
              Ask Coop Bank quoting message id <span className="font-mono">{payment.messageId ?? "—"}</span>, then record their answer.
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
        <FormField label="Bank reference" htmlFor="resolve-ref" required error={fieldErrors.providerReference}>
          <Input id="resolve-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="FT…" required className="font-mono" />
        </FormField>
      ) : null}
      <FormField label="Note" htmlFor="resolve-note" required hint={qr ? "How you matched it, e.g. time and amount" : "Who at Coop Bank confirmed, and when"} error={fieldErrors.note}>
        <Textarea id="resolve-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} required />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" disabled={confirming || !chosen || !note.trim() || (paid && !reference.trim())}>
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
              {formatEtb(payment.amountEtb)} from {donor}, bank reference{" "}
              <span className="font-mono">{reference.trim()}</span>. This issues a Zakat certificate that the public
              certificate check shows as genuine. Only do this if the bank confirmed the money arrived. This can&apos;t
              be undone.
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

type CertificateResult = {
  valid: boolean;
  certificateId: string;
  amountEtb?: number | null;
  zakatType?: string | null;
  paidAt?: string | null;
};

function CertificateCheck() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<CertificateResult | null>(null);
  // The number the result is for, as checked.
  const [checked, setChecked] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsChecking(true);
    const number = id.trim();
    try {
      const answer = await apiClient<CertificateResult>(`/bff/certificates/verify/${encodeURIComponent(number)}`);
      setChecked(number);
      setResult(answer);
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
          <Input
            id="cert-id"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              // A result belongs to the number that was checked.
              setResult(null);
              setError(null);
            }}
            placeholder="ZC-2026-000451"
            className="font-mono"
            required
          />
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
              Valid certificate: <span className="font-mono">{result.certificateId || checked}</span>
            </p>
            <DetailList
              columns={3}
              items={[
                { label: "Amount", value: formatEtb(result.amountEtb) },
                { label: "Zakat type", value: result.zakatType?.replace(/_/g, " ") },
                { label: "Paid", value: formatDateTime(result.paidAt ?? null) },
              ]}
            />
          </div>
        ) : (
          <InlineAlert className="mt-4">
            No valid certificate with the number <span className="font-mono">{result.certificateId || checked}</span>.
          </InlineAlert>
        )
      ) : null}
    </Panel>
  );
}
