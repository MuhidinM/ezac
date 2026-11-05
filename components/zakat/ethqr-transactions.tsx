"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useResource } from "@/lib/api/use-resource";
import { type RangeKey, rangeDates } from "@/lib/backoffice/date-range";

const SIZE = 20;

/** One receipt as EthQR sends it; fields may be missing. */
type EthqrReceipt = {
  id?: string | number | null;
  amount?: number | string | null;
  currency?: string | null;
  referenceNumber?: string | null;
  payerName?: string | null;
  description?: string | null;
  status?: string | null;
  /** Addis Ababa local time without an offset, e.g. "2026-11-05T12:30:00". */
  transactedAt?: string | null;
  sourceBankBic?: string | null;
  sourceBankCode?: string | null;
  categoryPurpose?: string | null;
  endToEndId?: string | null;
  bizMsgIdr?: string | null;
  storeLabel?: string | null;
  /** The payment id the QR was made for (e.g. zp_…). */
  terminalLabel?: string | null;
};

/** EthQR's page, passed through by the payments service. */
type EthqrPage = {
  content?: EthqrReceipt[];
  pagination?: { currentPage?: number; pageSize?: number; totalPages?: number; totalElements?: number };
  /** Older answers put the paging at the top level. */
  totalPages?: number;
  totalElements?: number;
};

const amountFormat = new Intl.NumberFormat("en-ET", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const timeFormat = new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" });

/** EthQR times carry no offset and are Addis Ababa time. */
function formatAddisTime(value: string | null | undefined) {
  if (!value) return "—";
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasOffset ? value : `${value}+03:00`);
  return Number.isNaN(date.getTime()) ? value : timeFormat.format(date);
}

function formatAmount(receipt: EthqrReceipt) {
  if (receipt.amount === null || receipt.amount === undefined || receipt.amount === "") return "—";
  const amount = Number(receipt.amount);
  const text = Number.isFinite(amount) ? amountFormat.format(amount) : String(receipt.amount);
  return `${receipt.currency ?? "ETB"} ${text}`;
}

function text(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

/**
 * What EthQR says it received, so an admin can match QR payments by amount
 * and time and confirm them with the transaction's reference.
 */
export function EthqrTransactions({ range, onOpenPayment }: { range: RangeKey; onOpenPayment?: (paymentId: string) => void }) {
  const [page, setPage] = useState(0);
  const { from, to } = rangeDates(range);
  // EthQR takes Addis Ababa local times, without an offset; page starts at 0.
  const params = new URLSearchParams({
    page: String(page),
    size: String(SIZE),
    from: `${from}T00:00:00`,
    to: `${to}T23:59:59`,
  });
  const { data, error, isLoading } = useResource<EthqrPage>(`/bff/payments-admin/ethqr/transactions?${params}`);
  const rows = data?.content ?? [];
  const notRegistered = error?.status === 409;
  const totalPages = data?.pagination?.totalPages ?? data?.totalPages;
  const totalElements = data?.pagination?.totalElements ?? data?.totalElements;
  const hasNext = totalPages != null ? page + 1 < totalPages : rows.length === SIZE;

  return (
    <Panel
      title="Received through EthQR"
      description="EthQR's own list, newest first, for reconciliation. Times are Addis Ababa time. QR payments confirm themselves; use this only when one needs confirming by hand."
      flush
    >
      {notRegistered ? (
        <div className="px-5 py-4">
          <InlineAlert tone="info">QR payments aren&apos;t set up yet. Register the commission account with EthQR in Zakat settings.</InlineAlert>
        </div>
      ) : error ? (
        <div className="px-5 py-4">
          <InlineAlert>{error.message}</InlineAlert>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.015]">
                  <TableHead className="pl-5">Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Bank reference</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>From bank</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5">
                    <span className="sr-only">Copy</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && rows.length === 0 ? (
                  <TableSkeletonRows colSpan={8} />
                ) : rows.length === 0 ? (
                  <TableMessageRow colSpan={8}>Nothing received in this period.</TableMessageRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={`${row.id ?? row.referenceNumber ?? "row"}-${index}`}>
                      <TableCell className="pl-5 text-sm whitespace-nowrap">{formatAddisTime(row.transactedAt)}</TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">{formatAmount(row)}</TableCell>
                      <TableCell className="font-mono text-xs">{text(row.referenceNumber ?? row.id)}</TableCell>
                      <TableCell>
                        <span className="block max-w-48 truncate" title={row.payerName ?? undefined}>
                          {text(row.payerName)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{text(row.sourceBankCode ?? row.sourceBankBic)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.terminalLabel && onOpenPayment ? (
                          <button
                            type="button"
                            className="text-[#007050] underline underline-offset-2 hover:text-[#001539]"
                            onClick={() => onOpenPayment(row.terminalLabel!)}
                          >
                            {row.terminalLabel}
                          </button>
                        ) : (
                          text(row.terminalLabel)
                        )}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{text(row.status?.toLowerCase())}</TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Copy all details of this transaction"
                          title="Copy all details"
                          onClick={() => void navigator.clipboard?.writeText(JSON.stringify(row, null, 2))}
                        >
                          <Copy className="text-black/40" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3 text-sm text-black/55">
            <span>
              Page {page + 1}
              {totalPages != null ? ` of ${Math.max(totalPages, 1)}` : ""}
              {totalElements != null ? ` · ${totalElements.toLocaleString("en")} received` : ""}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0 || isLoading} onClick={() => setPage((value) => value - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!hasNext || isLoading} onClick={() => setPage((value) => value + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
