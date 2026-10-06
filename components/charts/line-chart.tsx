"use client";

import { useState } from "react";

import { niceTicks, useWidth } from "@/components/charts/use-width";

/** Validated categorical order (adjacent CVD ΔE ≥ 10 on white). Slot 4 is low-contrast: legend + tooltip carry it. */
export const SERIES_COLORS = ["#007050", "#eb6834", "#2a78d6", "#eda100"] as const;

export type LineSeries = {
  key: string;
  label: string;
  values: number[];
  color?: string;
};

const HEIGHT = 240;
const PAD = { top: 12, right: 16, bottom: 28, left: 40 };

/**
 * Multi-series line chart over shared x labels (one axis, ≤ 4 series), with a
 * crosshair + tooltip on hover and a legend for identity.
 */
export function LineChart({
  labels,
  series,
  formatLabel = (label) => label,
  emptyText = "No activity in this period.",
}: {
  labels: string[];
  series: LineSeries[];
  formatLabel?: (label: string) => string;
  emptyText?: string;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const colored = series.map((item, index) => ({ ...item, color: item.color ?? SERIES_COLORS[index % SERIES_COLORS.length] }));
  const max = Math.max(0, ...colored.flatMap((item) => item.values));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const n = labels.length;
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / top) * innerH;

  // Show at most ~6 x labels so they never collide.
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 90))));

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/60">
        {colored.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>

      <div ref={ref} className="relative">
        {n === 0 || max === 0 ? (
          <p className="flex h-[240px] items-center justify-center text-sm text-black/45">{emptyText}</p>
        ) : (
          <>
            <svg
              width={width}
              height={HEIGHT}
              role="img"
              aria-label={`Line chart: ${colored.map((item) => item.label).join(", ")}`}
              onMouseLeave={() => setHover(null)}
              onMouseMove={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                const px = event.clientX - box.left;
                const index = n <= 1 ? 0 : Math.round(((px - PAD.left) / innerW) * (n - 1));
                setHover(Math.min(n - 1, Math.max(0, index)));
              }}
            >
              {ticks.map((tick) => (
                <g key={tick}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="#ececec" strokeWidth={1} />
                  <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-black/45 text-[11px] tabular-nums">
                    {tick.toLocaleString()}
                  </text>
                </g>
              ))}
              {labels.map((label, i) =>
                i % every === 0 || i === n - 1 ? (
                  <text key={label} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-black/45 text-[11px]">
                    {formatLabel(label)}
                  </text>
                ) : null,
              )}
              {hover !== null ? (
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#c9c9c9" strokeWidth={1} />
              ) : null}
              {colored.map((item) => (
                <polyline
                  key={item.key}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={item.values.map((value, i) => `${x(i)},${y(value)}`).join(" ")}
                />
              ))}
              {hover !== null
                ? colored.map((item) => (
                    <circle
                      key={item.key}
                      cx={x(hover)}
                      cy={y(item.values[hover] ?? 0)}
                      r={4}
                      fill={item.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))
                : null}
            </svg>
            {hover !== null ? (
              <div
                className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs shadow-md"
                style={{
                  left: Math.min(Math.max(x(hover) + 12, 0), width - 160),
                }}
              >
                <p className="mb-1 font-medium text-[#001539]">{formatLabel(labels[hover])}</p>
                {colored.map((item) => (
                  <p key={item.key} className="flex items-center justify-between gap-4 text-black/65">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-medium text-[#001539] tabular-nums">
                      {(item.values[hover] ?? 0).toLocaleString()}
                    </span>
                  </p>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
