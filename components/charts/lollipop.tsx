"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import { ChartDataTable } from "@/components/charts/chart-data-table";
import { CATEGORICAL } from "@/components/charts/palette";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCount } from "@/lib/backoffice/format";

export type RankedItem = { key: string; label: string; value: number };

type StickProps = { x?: number; y?: number; width?: number; height?: number; fill?: string };

/** A thin stem with a dot at the value: lighter than a bar when many rows are compared. */
function Stick({ x = 0, y = 0, width = 0, height = 0, fill }: StickProps) {
  const cy = y + height / 2;
  return (
    <g>
      <line x1={x} x2={x + width} y1={cy} y2={cy} stroke={fill} strokeWidth={2} strokeLinecap="round" />
      <circle cx={x + width} cy={cy} r={5} fill={fill} stroke="#ffffff" strokeWidth={2} />
    </g>
  );
}

/**
 * Ranked categories, largest first, as lollipops (one colour: the ranking is
 * the message, not identity). Values print at the dot, so the tooltip only
 * repeats them.
 */
export function Lollipop({
  items,
  label,
  color = CATEGORICAL[0],
  emptyText = "No data yet.",
  formatValue = (value) => formatCount(value),
  max = 8,
}: {
  items: RankedItem[];
  label: string;
  color?: string;
  emptyText?: string;
  formatValue?: (value: number) => string;
  /** Rows shown; the rest stay in the table. */
  max?: number;
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, max);
  const config = { value: { label, color } } satisfies ChartConfig;
  if (shown.length === 0 || shown.every((item) => item.value === 0)) {
    return <p className="py-6 text-center text-sm text-black/60">{emptyText}</p>;
  }
  const height = shown.length * 34 + 8;

  return (
    <div className="space-y-3">
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }} role="figure" aria-label={label}>
        <BarChart data={shown} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} accessibilityLayer>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
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
            content={<ChartTooltipContent hideIndicator nameKey="value" valueFormatter={formatValue} />}
          />
          <Bar dataKey="value" fill={color} shape={<Stick />} isAnimationActive={false}>
            <LabelList
              dataKey="value"
              position="right"
              offset={12}
              className="fill-navy"
              fontSize={12}
              fontWeight={600}
              formatter={(value: unknown) => (typeof value === "number" ? formatValue(value) : "")}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <ChartDataTable caption={label} columns={["Category", "Count"]} rows={sorted.map((item) => [item.label, formatValue(item.value)])} />
    </div>
  );
}
