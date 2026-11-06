"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartDataTable } from "@/components/charts/chart-data-table";
import { CATEGORICAL } from "@/components/charts/palette";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCount } from "@/lib/backoffice/format";

/** Kept for callers that colour their own legends to match. */
export const SERIES_COLORS = CATEGORICAL;

export type LineSeries = {
  key: string;
  label: string;
  values: number[];
  color?: string;
};

/**
 * Trend over time: one area per series (2px line over a light wash), with a
 * crosshair tooltip listing every series at the hovered period. Keyboard:
 * focus the chart and use the arrow keys (Recharts' accessibility layer);
 * "Show the numbers" opens the same data as a table.
 */
export function LineChart({
  labels,
  series,
  label,
  formatLabel = (value) => value,
  formatValue = (value) => formatCount(value),
  emptyText = "No activity in this period.",
  height = 260,
  stacked = false,
}: {
  labels: string[];
  series: LineSeries[];
  /** What the chart shows ("Weekly registrations"); names it for screen readers. */
  label?: string;
  formatLabel?: (label: string) => string;
  formatValue?: (value: number) => string;
  emptyText?: string;
  height?: number;
  /** Stack the areas (parts of one total) instead of overlaying them. */
  stacked?: boolean;
}) {
  const gradientId = useId().replace(/:/g, "");
  const styled = series.map((item, index) => ({ ...item, color: item.color ?? CATEGORICAL[index % CATEGORICAL.length] }));
  const config = Object.fromEntries(styled.map((item) => [item.key, { label: item.label, color: item.color }])) satisfies ChartConfig;
  const data = labels.map((period, i) => ({
    period,
    ...Object.fromEntries(styled.map((item) => [item.key, item.values[i] ?? 0])),
  }));
  const max = Math.max(0, ...styled.flatMap((item) => item.values));
  const name = label ?? `Area chart: ${styled.map((item) => item.label).join(", ")}`;

  if (labels.length === 0 || max === 0) {
    return <p className="flex items-center justify-center text-sm text-black/60" style={{ height }}>{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {styled.length > 1 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/65" aria-label="Legend">
          {styled.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }} aria-label={name} role="figure">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
          <defs>
            {styled.map((item) => (
              <linearGradient key={item.key} id={`${gradientId}-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity={stacked ? 0.35 : 0.18} />
                <stop offset="100%" stopColor={item.color} stopOpacity={stacked ? 0.12 : 0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-surface-muted)" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value: string) => formatLabel(value)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
            tickFormatter={(value: number) => formatCount(value, { compact: value >= 10_000 })}
          />
          <ChartTooltip
            cursor={{ stroke: "#c9c9c9", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(_, payload) => formatLabel(String(payload?.[0]?.payload?.period ?? ""))}
                valueFormatter={formatValue}
              />
            }
          />
          {styled.map((item) => (
            <Area
              key={item.key}
              dataKey={item.key}
              name={item.key}
              type="monotone"
              stackId={stacked ? "total" : undefined}
              stroke={item.color}
              strokeWidth={2}
              fill={`url(#${gradientId}-${item.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ChartContainer>

      <ChartDataTable
        caption={name}
        columns={["Period", ...styled.map((item) => item.label)]}
        rows={labels.map((value, i) => [formatLabel(value), ...styled.map((item) => formatValue(item.values[i] ?? 0))])}
      />
    </div>
  );
}
