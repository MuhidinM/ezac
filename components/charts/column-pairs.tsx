"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartDataTable } from "@/components/charts/chart-data-table";
import { CATEGORICAL } from "@/components/charts/palette";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export type ColumnSeries = { key: string; label: string; color?: string };

/**
 * Two (or three) measures in the same unit side by side per period, on one
 * axis: e.g. Zakat collected and paid out each month. Never two scales.
 */
export function ColumnPairs({
  rows,
  series,
  label,
  formatLabel = (value) => value,
  formatValue,
  formatTick,
  height = 260,
  emptyText = "Nothing in this period.",
}: {
  rows: ({ period: string } & Record<string, number | string>)[];
  series: ColumnSeries[];
  label: string;
  formatLabel?: (value: string) => string;
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
  height?: number;
  emptyText?: string;
}) {
  const styled = series.map((item, index) => ({ ...item, color: item.color ?? CATEGORICAL[index % CATEGORICAL.length] }));
  const config = Object.fromEntries(styled.map((item) => [item.key, { label: item.label, color: item.color }])) satisfies ChartConfig;
  const max = Math.max(0, ...rows.flatMap((row) => styled.map((item) => Number(row[item.key] ?? 0))));
  if (rows.length === 0 || max === 0) {
    return <p className="flex items-center justify-center text-sm text-black/60" style={{ height }}>{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/65" aria-label="Legend">
        {styled.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: item.color }} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }} role="figure" aria-label={label}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--color-surface-muted)" />
          <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} tickFormatter={formatLabel} />
          <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={formatTick} />
          <ChartTooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(_, payload) => formatLabel(String(payload?.[0]?.payload?.period ?? ""))}
                valueFormatter={formatValue}
              />
            }
          />
          {styled.map((item) => (
            <Bar key={item.key} dataKey={item.key} fill={item.color} maxBarSize={18} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          ))}
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption={label}
        columns={["Period", ...styled.map((item) => item.label)]}
        rows={rows.map((row) => [formatLabel(row.period), ...styled.map((item) => formatValue(Number(row[item.key] ?? 0)))])}
      />
    </div>
  );
}
