"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { LineChart } from "@/components/charts/line-chart";
import { StatTile } from "@/components/charts/stat-tile";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { LivestockPricesPanel } from "@/components/zakat/livestock-prices-panel";
import { enteredByLabel, PriceStatusPanel, type PriceValues } from "@/components/zakat/price-status-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { rangeQuery, type RangeKey } from "@/lib/backoffice/date-range";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import type { CalculatorConfig } from "@/lib/zakat/calculator-config";

const PAGE_SIZE = 20;
/** The history API answers at most 50 a page, so the chart reads several pages. */
const CHART_PAGE_SIZE = 50;
const CHART_MAX_PAGES = 10;

type PriceRecord = {
  id: string;
  pricesAsOf: string;
  source: string | null;
  usdEtbRate: number | null;
  goldPricePerGramEtb: Record<string, number> | number | null;
  silverPricePerGramEtb: number | null;
  manual: boolean;
  enteredBy?: string | null;
  enteredByName?: string | null;
  note?: string | null;
  createdAt: string;
};

function gold24(record: PriceRecord) {
  const gold = record.goldPricePerGramEtb;
  if (typeof gold === "number") return gold;
  return gold?.["24k"] ?? null;
}

/**
 * One chart series: the points that have a value, oldest first. A missing
 * price is left out instead of drawn as 0 (gap-r1-4-2), so each chart gets
 * its own dates.
 */
function chartSeries(points: PriceRecord[], value: (point: PriceRecord) => number | null) {
  const kept = points.flatMap((point) => {
    const amount = value(point);
    return amount != null && Number.isFinite(amount) ? [{ label: point.pricesAsOf, amount }] : [];
  });
  return { labels: kept.map((point) => point.label), values: kept.map((point) => point.amount), skipped: points.length - kept.length };
}

const chartDate = (label: string) => new Date(label).toLocaleDateString("en", { month: "short", day: "numeric" });

function toPriceValues(record: PriceRecord): PriceValues {
  const gold = record.goldPricePerGramEtb;
  return {
    pricesAsOf: record.pricesAsOf,
    source: record.source,
    manual: record.manual,
    usdEtbRate: record.usdEtbRate,
    goldPricePerGramEtb: typeof gold === "number" ? { "24k": gold } : (gold ?? {}),
    silverPricePerGramEtb: record.silverPricePerGramEtb,
    note: record.note,
  };
}

type ChartState = { key: string | null; points?: PriceRecord[]; capped?: boolean; error?: ApiError | null };

/**
 * Every stored price in the range for the chart, newest first, read 50 at a
 * time (the API's limit) up to CHART_MAX_PAGES pages.
 */
function usePriceChart(query: string) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<ChartState>({ key: null });
  const key = `${query}#${nonce}`;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const points: PriceRecord[] = [];
      let totalPages = 1;
      for (let page = 1; page <= Math.min(totalPages, CHART_MAX_PAGES); page++) {
        const data = await apiClient<PaginatedItems<PriceRecord>>(
          `/bff/zakat-admin/prices/history?${query}&page=${page}&limit=${CHART_PAGE_SIZE}`,
        );
        if (cancelled) return null;
        points.push(...data.items);
        totalPages = data.pagination.totalPages;
      }
      return { points, capped: totalPages > CHART_MAX_PAGES };
    }
    load()
      .then((result) => {
        if (!cancelled && result) setState({ key, ...result, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const apiError = error instanceof ApiError ? error : new ApiError("Couldn't load the price chart. Try again.", 500);
        setState((prev) => ({ ...prev, key, error: apiError }));
      });
    return () => {
      cancelled = true;
    };
  }, [key, query]);

  return {
    points: state.points ?? [],
    capped: state.capped ?? false,
    error: state.key === key ? (state.error ?? null) : null,
    isLoading: state.key !== key,
    reload: () => setNonce((value) => value + 1),
  };
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
  const [reuse, setReuse] = useState<PriceValues | null>(null);
  const config = useResource<CalculatorConfig>("/bff/zakat/calculator-config");
  const history = useResource<PaginatedItems<PriceRecord>>(
    `/bff/zakat-admin/prices/history?${rangeQuery(range)}&page=${page}&limit=${PAGE_SIZE}`,
  );
  // The chart isn't limited to the table page.
  const chart = usePriceChart(rangeQuery(range));

  const c = config.data;
  const rows = history.data?.items ?? [];
  const points = [...chart.points].reverse();
  const goldSeries = chartSeries(points, gold24);
  const silverSeries = chartSeries(points, (point) => point.silverPricePerGramEtb);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Prices & nisab"
        description="Gold and silver prices behind the public Zakat calculator and the nisab it applies, plus the average livestock prices shown on the public How it works page."
        actions={<RangeSelect value={range} onChange={(value) => { setRange(value); setPage(1); }} />}
      />

      <PriceStatusPanel
        nisab={c ? c.nisab : null}
        reuse={reuse}
        onReuseClose={() => setReuse(null)}
        onChanged={() => {
          config.reload();
          history.reload();
          chart.reload();
        }}
      />

      <ErrorAlert error={config.error} onRetry={config.reload} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={`Nisab (${c?.nisab.basis ?? "—"})`}
          value={c ? formatEtb(Math.round(c.nisab.valueEtb), { compact: true }) : "—"}
          hint={c ? `${formatEtb(Math.round(c.nisab.valueEtb))} · gold ${c.nisab.goldGrams}g · silver ${c.nisab.silverGrams}g` : undefined}
          loading={config.isLoading && !c}
        />
        <StatTile
          label="Gold 24k"
          value={c ? formatEtb(c.goldPricePerGramEtb["24k"] ?? null) : "—"}
          hint="Per gram"
          loading={config.isLoading && !c}
        />
        <StatTile
          label="Silver"
          value={c ? formatEtb(c.silverPricePerGramEtb) : "—"}
          hint={c ? `Per gram · silver nisab ${formatEtb(Math.round(c.nisab.silverValueEtb))}` : "Per gram"}
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

      <Panel
        title="Gold and silver per gram"
        description={`ETB, from the stored price history${chart.capped ? ` (the latest ${CHART_PAGE_SIZE * CHART_MAX_PAGES} prices)` : ""}`}
      >
        {chart.error ? (
          <ErrorAlert error={chart.error} onRetry={chart.reload} />
        ) : chart.isLoading && points.length === 0 ? (
          <p className="text-sm text-black/45">Loading…</p>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <LineChart
                label="Gold 24k price per gram"
                labels={goldSeries.labels}
                formatLabel={chartDate}
                formatValue={(value) => formatEtb(value)}
                series={[{ key: "gold", label: "Gold 24k", values: goldSeries.values }]}
                emptyText="No gold prices stored in this period."
              />
              <LineChart
                label="Silver price per gram"
                labels={silverSeries.labels}
                formatLabel={chartDate}
                formatValue={(value) => formatEtb(value)}
                series={[{ key: "silver", label: "Silver", values: silverSeries.values, color: "#2a78d6" }]}
                emptyText="No silver prices stored in this period."
              />
            </div>
            {goldSeries.skipped || silverSeries.skipped ? (
              <p className="mt-3 text-xs text-black/45">
                Prices with no gold or silver value are left out of that chart
                {goldSeries.skipped ? ` (gold: ${goldSeries.skipped})` : ""}
                {silverSeries.skipped ? ` (silver: ${silverSeries.skipped})` : ""}.
              </p>
            ) : null}
          </>
        )}
      </Panel>

      <Panel title="Price history" flush>
        {history.error ? (
          <div className="px-5 pt-4">
            <ErrorAlert error={history.error} onRetry={history.reload} />
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
              <TableHead>Note</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Use again</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={7} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={7}>No prices stored in this period.</TableMessageRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-5">{formatDateTime(row.pricesAsOf)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatEtb(gold24(row))}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatEtb(row.silverPricePerGramEtb)}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.usdEtbRate != null ? row.usdEtbRate.toFixed(2) : "—"}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {row.manual ? <Badge tone="warning">Entered by hand</Badge> : <Badge tone="success">Automatic</Badge>}
                      {row.source ? <span className="text-sm text-black/60">{row.source}</span> : null}
                    </span>
                    {enteredByLabel(row) ? <p className="text-xs text-black/45">by {enteredByLabel(row)}</p> : null}
                  </TableCell>
                  <TableCell className="text-sm text-black/60">{row.note ?? "—"}</TableCell>
                  <TableCell className="pr-5 text-right">
                    {/* The newest row of the range (it ends today) is the price in use. */}
                    {!(page === 1 && index === 0) && gold24(row) != null && row.silverPricePerGramEtb != null ? (
                      <Button variant="ghost" size="sm" onClick={() => setReuse(toPriceValues(row))}>
                        <RotateCcw />
                        Use again
                      </Button>
                    ) : null}
                  </TableCell>
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
