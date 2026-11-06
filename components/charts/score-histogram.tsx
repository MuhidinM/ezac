"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, XAxis, YAxis } from "recharts";

import { ChartDataTable } from "@/components/charts/chart-data-table";
import { NEED, NEED_WASH } from "@/components/charts/palette";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ScoreDistribution } from "@/lib/api/backoffice-types";
import { formatCount } from "@/lib/backoffice/format";

type Band = keyof typeof NEED;
const BAND_LABEL: Record<Band, string> = { HIGH: "High need", MEDIUM: "Medium need", LOW: "Low need" };

function bandFor(from: number, thresholds: ScoreDistribution["thresholds"]): Band {
  if (from >= thresholds.high) return "HIGH";
  if (from >= thresholds.medium) return "MEDIUM";
  return "LOW";
}

/**
 * Current scores in buckets, drawn over the three need bands (light washes
 * with their names), each column in its band's colour. The band names make
 * the colour redundant; "Show the numbers" lists every bucket.
 */
export function ScoreHistogram({ data, height = 240 }: { data: ScoreDistribution; height?: number }) {
  const rows = data.buckets.map((bucket) => ({
    range: `${bucket.from}–${bucket.to}`,
    from: bucket.from,
    count: bucket.count,
    band: bandFor(bucket.from, data.thresholds),
  }));
  const config = { count: { label: "Assessments", color: NEED.MEDIUM } } satisfies ChartConfig;
  const name = `Score distribution of ${formatCount(data.scored)} assessments, out of ${data.max}`;
  const firstOf = (band: Band) => rows.find((row) => row.band === band)?.range;
  const lastOf = (band: Band) => [...rows].reverse().find((row) => row.band === band)?.range;

  if (data.scored === 0) return <p className="py-10 text-center text-sm text-black/60">No scored assessments yet.</p>;

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/65" aria-label="Need bands">
        {(["LOW", "MEDIUM", "HIGH"] as const).map((band) => (
          <li key={band} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: NEED[band] }} aria-hidden="true" />
            {BAND_LABEL[band]}
            <span className="text-black/60">
              {band === "LOW" ? `under ${data.thresholds.medium}` : band === "MEDIUM" ? `${data.thresholds.medium}–${data.thresholds.high - 1}` : `${data.thresholds.high}+`}
            </span>
          </li>
        ))}
      </ul>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }} role="figure" aria-label={name}>
        <BarChart data={rows} margin={{ top: 18, right: 8, bottom: 0, left: 0 }} barCategoryGap={2} accessibilityLayer>
          {(["LOW", "MEDIUM", "HIGH"] as const).map((band) => {
            const x1 = firstOf(band);
            const x2 = lastOf(band);
            return x1 && x2 ? (
              <ReferenceArea
                key={band}
                x1={x1}
                x2={x2}
                fill={NEED_WASH[band]}
                fillOpacity={0.55}
                strokeOpacity={0}
                label={{ value: BAND_LABEL[band], position: "insideTop", fill: "#4b5563", fontSize: 11 }}
              />
            ) : null;
          })}
          <CartesianGrid vertical={false} stroke="var(--color-surface-muted)" />
          <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <ChartTooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                  return row ? `Score ${row.range} · ${BAND_LABEL[row.band]}` : "";
                }}
                valueFormatter={(value) => formatCount(value)}
              />
            }
          />
          <Bar dataKey="count" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.range} fill={NEED[row.band]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption={name}
        columns={["Score", "Need level", "Assessments"]}
        rows={rows.map((row) => [row.range, BAND_LABEL[row.band], formatCount(row.count)])}
      />
    </div>
  );
}
