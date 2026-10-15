"use client";

import { useState } from "react";

import { LineChart } from "@/components/charts/line-chart";
import { StatTile } from "@/components/charts/stat-tile";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { LivestockPricesPanel } from "@/components/zakat/livestock-prices-panel";
import { PriceStatusPanel } from "@/components/zakat/price-status-panel";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { rangeQuery, type RangeKey } from "@/lib/backoffice/date-range";
import { formatDateTime } from "@/lib/beneficiary/format";
import type { CalculatorConfig } from "@/lib/zakat/calculator-config";

const PAGE_SIZE = 20;

type PriceRecord = {
  id: string;
  pricesAsOf: string;
  source: string | null;
  usdEtbRate: number | null;
  goldPricePerGramEtb: Record<string, number> | number | null;
  silverPricePerGramEtb: number | null;
  manual: boolean;
  enteredBy?: string | null;
  note?: string | null;
  createdAt: string;
};

const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 });

function gold24(record: PriceRecord) {
  const gold = record.goldPricePerGramEtb;
  if (typeof gold === "number") return gold;
  return gold?.["24k"] ?? null;
}

export default function PricesPage() {
  return (
    <RequireRole audience={["admin"]}>
      <Prices />
    </RequireRole>
  );
}

function Prices() {
  const [range, setRange] = useState<RangeKey>("90d");
  const [page, setPage] = useState(1);
  const config = useResource<CalculatorConfig>("/api/zakat/calculator-config");
  const history = useResource<PaginatedItems<PriceRecord>>(
    `/api/zakat-admin/prices/history?${rangeQuery(range)}&page=${page}&limit=${PAGE_SIZE}`,
  );
  // The chart reads up to 100 points so it isn't limited to the table page.
  const chart = useResource<PaginatedItems<PriceRecord>>(
    `/api/zakat-admin/prices/history?${rangeQuery(range)}&page=1&limit=100`,
  );

  const c = config.data;
  const rows = history.data?.items ?? [];
  const points = [...(chart.data?.items ?? [])].reverse();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Prices & nisab"
        description="Gold, silver and livestock prices behind the public Zakat calculator, and the nisab it applies."
        actions={<RangeSelect value={range} onChange={(value) => { setRange(value); setPage(1); }} />}
      />

      <PriceStatusPanel
        onChanged={() => {
          config.reload();
          history.reload();
          chart.reload();
        }}
      />

      {config.error ? <InlineAlert>{config.error.message}</InlineAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={`Nisab (${c?.nisab.basis ?? "—"})`}
          value={c ? `ETB ${etb.format(Math.round(c.nisab.valueEtb))}` : "—"}
          hint={c ? `Gold ${c.nisab.goldGrams}g · silver ${c.nisab.silverGrams}g` : undefined}
          loading={config.isLoading && !c}
        />
        <StatTile
          label="Gold 24k"
          value={c ? `ETB ${etb.format(c.goldPricePerGramEtb["24k"] ?? 0)}` : "—"}
          hint="Per gram"
          loading={config.isLoading && !c}
        />
        <StatTile
          label="Silver"
          value={c ? `ETB ${etb.format(c.silverPricePerGramEtb)}` : "—"}
          hint={c ? `Silver nisab ETB ${etb.format(Math.round(c.nisab.silverValueEtb))}` : "Per gram"}
          loading={config.isLoading && !c}
        />
        <StatTile
          label="Prices as of"
          value={c ? new Date(c.pricesAsOf).toLocaleDateString("en", { dateStyle: "medium" }) : "—"}
          hint={c ? [c.priceSource, `rules v${c.configVersion}`].filter(Boolean).join(" · ") : undefined}
          loading={config.isLoading && !c}
        />
      </div>

      <LivestockPricesPanel onChanged={() => config.reload()} />

      <Panel title="Gold and silver per gram" description="ETB, from the stored price history">
        {chart.error ? (
          <InlineAlert>{chart.error.message}</InlineAlert>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <LineChart
              labels={points.map((point) => point.pricesAsOf)}
              formatLabel={(label) => new Date(label).toLocaleDateString("en", { month: "short", day: "numeric" })}
              series={[{ key: "gold", label: "Gold 24k", values: points.map((point) => gold24(point) ?? 0) }]}
              emptyText="No prices stored in this period."
            />
            <LineChart
              labels={points.map((point) => point.pricesAsOf)}
              formatLabel={(label) => new Date(label).toLocaleDateString("en", { month: "short", day: "numeric" })}
              series={[{ key: "silver", label: "Silver", values: points.map((point) => point.silverPricePerGramEtb ?? 0), color: "#2a78d6" }]}
              emptyText="No prices stored in this period."
            />
          </div>
        )}
      </Panel>

      <Panel title="Price history" flush>
        {history.error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{history.error.message}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">As of</TableHead>
              <TableHead className="text-right">Gold 24k / g</TableHead>
              <TableHead className="text-right">Silver / g</TableHead>
              <TableHead className="text-right">USD/ETB</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="pr-5">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={6} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={6}>No prices stored in this period.</TableMessageRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-5">{formatDateTime(row.pricesAsOf)}</TableCell>
                  <TableCell className="text-right tabular-nums">{gold24(row) != null ? etb.format(gold24(row)!) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.silverPricePerGramEtb != null ? etb.format(row.silverPricePerGramEtb) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.usdEtbRate != null ? row.usdEtbRate.toFixed(2) : "—"}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {row.manual ? <Badge tone="warning">Manual</Badge> : null}
                      <span className="text-sm text-black/60">{row.source ?? "—"}</span>
                    </span>
                    {row.enteredBy ? <p className="text-xs text-black/45">{row.enteredBy}</p> : null}
                  </TableCell>
                  <TableCell className="pr-5 text-sm text-black/60">{row.note ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ListPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={history.data?.pagination.totalItems ?? 0}
          totalPages={history.data?.pagination.totalPages ?? 1}
          disabled={history.isLoading}
          onPageChange={setPage}
        />
      </Panel>
    </section>
  );
}
