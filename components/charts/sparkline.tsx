"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

import { CATEGORICAL } from "@/components/charts/palette";

/**
 * A small trend line for a stat tile: no axes, a light wash, and a dot on the
 * latest value. Decorative next to the tile's number (the number and its
 * change carry the meaning), so it is hidden from screen readers.
 */
export function Sparkline({ values, color = CATEGORICAL[0], height = 40 }: { values: number[]; color?: string; height?: number }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2 || values.every((value) => value === 0)) return <div style={{ height }} aria-hidden="true" />;
  const data = values.map((value, index) => ({ index, value }));
  const last = data.length - 1;
  return (
    <div style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 160, height }}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, "dataMax"]} />
          <Area
            dataKey="value"
            type="monotone"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#spark-${id})`}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number }) =>
              props.index === last && props.cx != null && props.cy != null ? (
                <circle key="last" cx={props.cx} cy={props.cy} r={3} fill={color} stroke="#ffffff" strokeWidth={1.5} />
              ) : (
                <g key={props.index} />
              )
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
