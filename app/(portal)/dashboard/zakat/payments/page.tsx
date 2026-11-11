"use client";

import { type FormEvent, Suspense, useState } from "react";
import { BadgeCheck, CircleAlert, Copy, RefreshCw, ScanSearch, Search, X } from "lucide-react";

import { StatTile } from "@/components/charts/stat-tile";
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
import { PaymentModeBanner, usePaymentMode } from "@/components/zakat/payment-mode-banner";
import { ApprovalPanel } from "@/components/zakat/payments/approval-panel";
import { ResolveForm } from "@/components/zakat/payments/resolve-form";
import { useMyUserId } from "@/lib/auth/use-my-user-id";
import { VoidPanel } from "@/components/zakat/payments/void-panel";
import { staffRef } from "@/components/zakat/staff-ref";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/backoffice/date-range";
import { formatCount, formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { useListState } from "@/lib/hooks/use-list-state";
import {
  awaitsApproval,
  canResolve,
  canVoid,
  checkCountsForNotPaid,
  displayStatus,
  isOpenQr,
  isQr,
  PAYMENT_STATUSES,
  type PaymentSummary,
  paymentListQuery,
  paymentRangeQuery,
  qrNotPaidBlock,
  type ZakatPayment,
} from "@/lib/zakat/payments";
import { cn } from "@/lib/utils";

const API = "/bff/payments-admin/zakat-payments";
const PAGE_SIZE = 20;

const LIST_DEFAULTS = { range: "30d", status: "", method: "", q: "", action: false, page: 1, open: "" };
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
  const { status, method, q } = list;
  // "Needs action": payments waiting for an admin, oldest first, whatever their date.
  const needsAction = list.action;
  const openId = list.open || null;
  const [draftSearch, setDraftSearch] = useState(q);
  // Captured once per mount; only used to show stale open payments as expired.
  const [now] = useState(() => Date.now());
  const mode = usePaymentMode();
  const mySub = useMyUserId();

  const summary = useResource<PaymentSummary>(`${API}/summary?${paymentRangeQuery(range)}`);
  const actionCount = useResource<{ count: number }>(`${API}/needs-action/count`);
  const payments = useResource<PaginatedItems<ZakatPayment>>(
    `${API}?${paymentListQuery({ range, status, method, q, needsAction, page: list.page, limit: PAGE_SIZE })}`,
  );
  const rows = payments.data?.items ?? [];
  const s = summary.data;
  const waiting = actionCount.data?.count ?? null;
  const filtered = Boolean(status || method || q || needsAction);

  function setOpenId(id: string | null) {
    setList({ open: id ?? "" }, { keepPage: true });
  }

  function reloadAll() {
    summary.reload();
    actionCount.reload();
    payments.reload();
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setList({ q: draftSearch.trim() });
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

      {waiting ? (
        <InlineAlert tone="warning" title={`${formatCount(waiting)} payment${waiting === 1 ? "" : "s"} waiting for an admin`}>
          A payment needs checking (the bank gave no clear answer, or its reference already confirmed another payment), or a
          payment marked paid by hand waits for a second admin to approve it.{" "}
          {!needsAction ? (
            <button type="button" className="font-medium underline underline-offset-2" onClick={() => setList({ action: true })}>
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
        <StatTile
          label="Needs action"
          value={waiting != null ? formatCount(waiting) : "—"}
          hint="Any date: check, settle or approve"
          loading={actionCount.isLoading && waiting == null}
        />
      </div>

      <Panel flush>
        <form role="search" onSubmit={onSearch} className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-5 py-3">
          <SearchInput
            label="Search payments"
            wrapperClassName="min-w-60 flex-[2]"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Payer name or phone, payment id, bank reference, certificate"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
          <Button
            type="button"
            variant={needsAction ? "default" : "outline"}
            aria-pressed={needsAction}
            onClick={() => setList({ action: !needsAction })}
          >
            Needs action
            {waiting ? (
              <Badge tone={needsAction ? "neutral" : "warning"} className="ml-1">
                {formatCount(waiting)}
              </Badge>
            ) : null}
          </Button>
          {!needsAction ? (
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
          ) : null}
          <div className="w-44">
            <NativeSelect aria-label="Method" value={method} onChange={(e) => setList({ method: e.target.value })}>
              <option value="">All methods</option>
              <option value="ethqr">QR</option>
              <option value="coopbank">Coop account</option>
            </NativeSelect>
          </div>
          {filtered ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraftSearch("");
                setList({ status: "", method: "", q: "", action: false });
              }}
            >
              <X />
              Clear
            </Button>
          ) : null}
          {needsAction ? (
            <p className="w-full text-xs text-black/60">Waiting for an admin, oldest first. The date range and status don&apos;t apply.</p>
          ) : status === "AWAITING_CONFIRMATION" || status === "OTP_SENT" || status === "EXPIRED" ? (
            <p className="w-full text-xs text-black/60">
              {status === "EXPIRED"
                ? "Old Coop account payments left open over 15 minutes show as Expired, but are counted under Started or Waiting for code until the server closes them."
                : "Rows marked Expired were left open over 15 minutes and can no longer finish. The server still counts them here."}
            </p>
          ) : null}
        </form>
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
              <TableMessageRow colSpan={5}>
                {needsAction ? "Nothing is waiting for an admin." : filtered ? "No payments match these filters." : "No payments in this period."}
              </TableMessageRow>
            ) : (
              rows.map((payment) => {
                const shown = displayStatus(payment, now);
                return (
                  <TableRow
                    key={payment.paymentId}
                    className={cn("cursor-pointer", payment.needsAction && "bg-amber-50/60 hover:bg-amber-50")}
                    onClick={() => setOpenId(payment.paymentId)}
                  >
                    <TableCell className="pl-5">
                      <button type="button" className="text-left font-medium text-navy hover:underline" onClick={() => setOpenId(payment.paymentId)}>
                        {payment.payerFullName ?? payment.paidByName ?? payment.accountHolderName ?? "Unknown payer"}
                      </button>
                      <span className="block text-xs text-black/60">
                        {[isQr(payment) ? "QR" : "Coop account", payment.payerPhone, payment.payerType === "guest" ? "Guest" : payment.payerType ? "App user" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-56 truncate">{payment.causeTitle ?? "—"}</span>
                      {payment.zakatType ? <span className="block text-xs capitalize text-black/60">{payment.zakatType.replace(/_/g, " ")}</span> : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEtb(payment.amountEtb)}
                      {payment.issuedAmountEtb != null ? (
                        <span className="block text-xs text-amber-700">QR asked {formatEtb(payment.issuedAmountEtb)}</span>
                      ) : null}
                      {payment.amountReceived != null && payment.amountReceived !== payment.amountEtb ? (
                        <span className="block text-xs text-amber-700">Received {formatEtb(payment.amountReceived)}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={shown.tone}>
                          {payment.needsAction ? <CircleAlert /> : null}
                          {shown.label}
                        </Badge>
                        {payment.settledManually ? <Badge tone="neutral">By hand</Badge> : null}
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

      <EthqrTransactions key={range} range={range} onOpenPayment={setOpenId} />

      <CertificateCheck />

      <PaymentSheet
        key={openId ?? "none"}
        paymentId={openId}
        now={now}
        mySub={mySub}
        onClose={() => setOpenId(null)}
        onChanged={reloadAll}
      />
    </section>
  );
}

function CopyValue({ value }: { value: string | undefined | null }) {
  if (!value) return null;
  // Masked by payment-service (last 4 digits only): nothing useful to copy.
  if (/[•*]/.test(value)) return <span className="font-mono text-[13px]">{value}</span>;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[13px]">
      {value}
      <button
        type="button"
        aria-label="Copy"
        className="text-black/60 hover:text-navy"
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
  mySub,
  onClose,
  onChanged,
}: {
  paymentId: string | null;
  now: number;
  mySub: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { data: payment, error, mutate, reload } = useResource<ZakatPayment>(paymentId ? `${API}/${encodeURIComponent(paymentId)}` : null);
  const shown = payment ? displayStatus(payment, now) : null;
  const [check, setCheck] = useState<{ tone: "success" | "info" | "error"; text: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  // What the last action did, shown at the top of the sheet.
  const [notice, setNotice] = useState<string | null>(null);
  // "Not paid" on an open QR payment waits for one "Check now" in this sheet (gap-r1-1-2).
  const [checkedNow, setCheckedNow] = useState(false);
  // The server's clock, so a wrong browser clock can't open "Not paid" early; the page's time until it is known.
  const serverNow = useServerNow(30_000);
  const notPaidBlock = payment ? qrNotPaidBlock(payment, serverNow ?? now, checkedNow) : null;

  function changed(next: ZakatPayment, text: string) {
    mutate(next);
    setNotice(text);
    onChanged();
  }

  function stale() {
    setNotice(null);
    reload();
    onChanged();
  }

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
        onChanged();
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

  const onResolved = (next: ZakatPayment) =>
    changed(
      next,
      next.status === "AWAITING_APPROVAL"
        ? "Marked paid. Another admin must approve it before the certificate is issued."
        : "Payment closed as not paid.",
    );

  return (
    <Sheet open={paymentId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-navy">{payment ? formatEtb(payment.amountEtb) : "Payment"}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            {shown ? <Badge tone={shown.tone}>{shown.label}</Badge> : null}
            {payment?.settledManually ? <Badge tone="neutral">Settled by hand</Badge> : null}
            <span className="font-mono text-xs">{paymentId}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <ErrorAlert error={error} onRetry={reload} />
          {!payment && !error ? <p className="text-sm text-black/60">Loading…</p> : null}
          {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
          {payment ? (
            <>
              {payment.status === "VOIDED" ? (
                <InlineAlert tone="error" title="Voided">
                  {payment.voidedByName || payment.voidedBy ? <>By {staffRef(payment.voidedBy, payment.voidedByName)}</> : "Voided"}
                  {payment.voidedAt ? `, ${formatDateTime(payment.voidedAt)}` : ""}. The certificate no longer verifies and the amount
                  is left out of every total.
                  {payment.voidReason ? <span className="mt-1 block whitespace-pre-line">Reason: {payment.voidReason}</span> : null}
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

              {awaitsApproval(payment) ? (
                <ApprovalPanel
                  payment={payment}
                  mySub={mySub}
                  onStale={stale}
                  onDecided={(next, decision) =>
                    changed(
                      next,
                      decision === "approve"
                        ? "Approved. The Zakat certificate has been issued."
                        : "Rejected. The payment is back where it was before it was marked paid.",
                    )
                  }
                />
              ) : payment.status === "PROCESSING" ? (
                <ResolveForm key={payment.paymentId} payment={payment} notPaidBlock={notPaidBlock} onResolved={onResolved} />
              ) : canResolve(payment) ? (
                <details className="group rounded-xl border border-black/[0.08] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-navy">Confirm by hand or close as unpaid</summary>
                  <div className="mt-4">
                    <ResolveForm key={payment.paymentId} payment={payment} notPaidBlock={notPaidBlock} onResolved={onResolved} />
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
                  ...(payment.amountReceived != null ? [{ label: "Amount received", value: formatEtb(payment.amountReceived) }] : []),
                  { label: "Zakat type", value: payment.zakatType?.replace(/_/g, " ") },
                  { label: "Cause", value: payment.causeTitle },
                  { label: "Certificate", value: payment.certificateId },
                ]}
              />
              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/60 uppercase">Bank</p>
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
                    { label: "Bank request number", value: payment.messageId ? <CopyValue value={payment.messageId} /> : null },
                    { label: "Bank reference", value: payment.providerReference ? <CopyValue value={payment.providerReference} /> : null },
                    { label: "Debit account", value: payment.debitAccount ? <CopyValue value={payment.debitAccount} /> : null },
                    { label: "Account holder", value: payment.accountHolderName },
                    { label: "Credit account", value: payment.creditAccount ? <CopyValue value={payment.creditAccount} /> : null },
                    { label: "Failure reason", value: payment.failureReason },
                  ]}
                />
              </div>
              <div className="space-y-3 border-t border-black/[0.06] pt-4">
                <p className="text-xs font-semibold tracking-wide text-black/60 uppercase">Timeline</p>
                <DetailList
                  columns={2}
                  items={[
                    { label: "Started", value: formatDateTime(payment.createdAt) },
                    { label: "Paid", value: formatDateTime(payment.paidAt ?? null) },
                    ...(isQr(payment) ? [{ label: "QR payable until", value: formatDateTime(payment.expiresAt ?? null) }] : []),
                    { label: "Last update", value: formatDateTime(payment.updatedAt ?? null) },
                    { label: "Settled by", value: staffRef(payment.resolvedBy, payment.resolvedByName) },
                    ...(payment.requestedBy || payment.requestedAt
                      ? [
                          {
                            label: "Marked paid by",
                            value: (
                              <>
                                {staffRef(payment.requestedBy, payment.requestedByName) ?? "—"}
                                {payment.requestedAt ? <span className="block text-xs text-black/60">{formatDateTime(payment.requestedAt)}</span> : null}
                              </>
                            ),
                          },
                        ]
                      : []),
                    ...(payment.approvedBy || payment.approvedAt
                      ? [
                          {
                            label: "Approved by",
                            value: (
                              <>
                                {staffRef(payment.approvedBy, payment.approvedByName) ?? "—"}
                                {payment.approvedAt ? <span className="block text-xs text-black/60">{formatDateTime(payment.approvedAt)}</span> : null}
                              </>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
                {payment.resolutionNote && !awaitsApproval(payment) ? (
                  <p className="rounded-lg bg-black/[0.03] p-3 text-sm whitespace-pre-line text-black/70">{payment.resolutionNote}</p>
                ) : null}
              </div>

              {canVoid(payment) ? (
                <VoidPanel
                  payment={payment}
                  onStale={stale}
                  onVoided={(next) => changed(next, "Payment voided. Its certificate no longer verifies.")}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
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
            No valid certificate with the number <span className="font-mono">{result.certificateId || checked}</span>. It may be
            unknown or voided.
          </InlineAlert>
        )
      ) : null}
    </Panel>
  );
}
