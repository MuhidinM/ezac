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
const MAX_COLUMNS = 8;

/** EthQR's own page, passed through unchanged; its item fields aren't documented yet. */
type EthqrPage = {
  content?: Record<string, unknown>[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

function cellText(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * What EthQR says it received, so an admin can match QR payments by amount
 * and time and confirm them with the transaction's reference.
 */
export function EthqrTransactions({ range }: { range: RangeKey }) {
  const [page, setPage] = useState(0);
  const { from, to } = rangeDates(range);
  // EthQR takes Addis Ababa local times, without an offset; page starts at 0.
  const params = new URLSearchParams({
    page: String(page),
    size: String(SIZE),
    from: `${from}T00:00:00`,
    to: `${to}T23:59:59`,
  });
  const { data, error, isLoading } = useResource<EthqrPage>(`/api/payments-admin/ethqr/transactions?${params}`);
  const rows = data?.content ?? [];
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, MAX_COLUMNS);
  const notRegistered = error?.status === 409;
  const hasNext = data?.totalPages != null ? page + 1 < data.totalPages : rows.length === SIZE;

  return (
    <Panel
      title="Received through EthQR"
      description="EthQR's own list, newest first. Match a QR payment by amount and time, then confirm it with the transaction's reference."
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
                  {columns.length ? (
                    columns.map((column, index) => (
                      <TableHead key={column} className={index === 0 ? "pl-5" : undefined}>
                        {column}
                      </TableHead>
                    ))
                  ) : (
                    <TableHead className="pl-5">Transaction</TableHead>
                  )}
                  <TableHead className="pr-5">
                    <span className="sr-only">Copy</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && rows.length === 0 ? (
                  <TableSkeletonRows colSpan={Math.max(columns.length, 1) + 1} />
                ) : rows.length === 0 ? (
                  <TableMessageRow colSpan={Math.max(columns.length, 1) + 1}>Nothing received in this period.</TableMessageRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column, columnIndex) => (
                        <TableCell key={column} className={columnIndex === 0 ? "pl-5 font-mono text-xs" : "font-mono text-xs"}>
                          <span className="block max-w-56 truncate" title={cellText(row[column])}>
                            {cellText(row[column])}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Copy the whole transaction"
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
            <span>Page {page + 1}</span>
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
