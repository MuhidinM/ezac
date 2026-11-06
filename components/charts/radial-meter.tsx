"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

import { CATEGORICAL } from "@/components/charts/palette";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

/**
 * One ratio against its limit (0 to 1) as a three-quarter ring with the
 * percentage in the middle. The track is a light step of the same colour, so
 * the ring reads as "how full" at a glance; the number carries the value.
 */
export function RadialMeter({
  value,
  label,
  caption,
  color = CATEGORICAL[0],
  size = 168,
}: {
  /** 0..1, or null when unknown. */
  value: number | null | undefined;
  /** Names the meter for screen readers and sits under the number. */
  label: string;
  caption?: string;
  color?: string;
  size?: number;
}) {
  const known = typeof value === "number" && Number.isFinite(value);
  const percent = known ? Math.round(Math.min(1, Math.max(0, value)) * 100) : null;
  const config = { meter: { label, color } } satisfies ChartConfig;

  return (
    <figure className="flex flex-col items-center" aria-label={`${label}: ${percent === null ? "not known" : `${percent}%`}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <ChartContainer config={config} className="aspect-square h-full w-full" aria-hidden="true">
          <RadialBarChart
            data={[{ name: "meter", value: percent ?? 0 }]}
            startAngle={225}
            endAngle={-45}
            innerRadius="78%"
            outerRadius="100%"
            barSize={14}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={8}
              fill={color}
              background={{ fill: `color-mix(in srgb, ${color} 14%, white)` }}
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight text-navy">{percent === null ? "—" : `${percent}%`}</span>
          <span className="mt-0.5 max-w-[70%] text-center text-xs leading-tight text-black/60">{label}</span>
        </div>
      </div>
      {caption ? <figcaption className="mt-1 max-w-56 text-center text-xs text-black/60">{caption}</figcaption> : null}
    </figure>
  );
}
