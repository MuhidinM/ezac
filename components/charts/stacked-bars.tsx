"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartDataTable } from "@/components/charts/chart-data-table";
import { CATEGORICAL } from "@/components/charts/palette";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCount } from "@/lib/backoffice/format";

export type StackSeries = { key: string; label: string; color?: string };
export type StackRow = { id: string; label: string } & Record<string, number | string>;

/**
 * Several wholes compared on one axis: one horizontal bar per row, split into
 * the same parts in the same order and colours (2px gaps between parts). The
 * legend names the parts; the tooltip lists every part of the hovered row.
 */
export function StackedBars({
  rows,
  series,
  label,
  emptyText = "No data yet.",
}: {
  rows: StackRow[];
  series: StackSeries[];
  label: string;
  emptyText?: string;
}) {
  const styled = series.map((item, index) => ({ ...item, color: item.color ?? CATEGORICAL[index % CATEGORICAL.length] }));
  const config = Object.fromEntries(styled.map((item) => [item.key, { label: item.label, color: item.color }])) satisfies ChartConfig;
  const total = (row: StackRow) => styled.reduce((sum, item) => sum + Number(row[item.key] ?? 0), 0);
  const shown = rows.filter((row) => total(row) > 0);
  if (shown.length === 0) return <p className="py-6 text-center text-sm text-black/60">{emptyText}</p>;
  const height = shown.length * 40 + 40;

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
        <BarChart data={shown} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }} barCategoryGap={10} accessibilityLayer>
          <CartesianGrid horizontal={false} stroke="var(--color-surface-muted)" />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={150}
            tick={{ fill: "rgba(0,0,0,0.7)", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
            content={<ChartTooltipContent indicator="dot" valueFormatter={(value) => formatCount(value)} />}
          />
          {styled.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              stackId="total"
              fill={item.color}
              maxBarSize={22}
              stroke="#ffffff"
              strokeWidth={2}
              radius={index === styled.length - 1 ? [0, 4, 4, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption={label}
        columns={["", ...styled.map((item) => item.label)]}
        rows={rows.map((row) => [row.label, ...styled.map((item) => formatCount(Number(row[item.key] ?? 0)))])}
      />
    </div>
  );
}
