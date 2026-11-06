"use client";

import { type KeyboardEvent, useId, useState } from "react";

import { ChartDataTable } from "@/components/charts/chart-data-table";
import { niceTicks, useWidth } from "@/components/charts/use-width";
import { formatCount } from "@/lib/backoffice/format";

/** Validated categorical order (adjacent CVD ΔE ≥ 10 on white). Slot 4 is low-contrast: legend + tooltip carry it. */
export const SERIES_COLORS = ["#007050", "#eb6834", "#2a78d6", "#eda100"] as const;

/**
 * Each series also gets its own line pattern and marker shape, so the lines
 * stay apart without colour (colour-blind readers, greyscale prints).
 */
const SERIES_DASHES = [undefined, "6 4", "2 3", "9 3 2 3"] as const;
const SERIES_MARKERS = ["circle", "square", "triangle", "diamond"] as const;
type Marker = (typeof SERIES_MARKERS)[number];

export type LineSeries = {
  key: string;
  label: string;
  values: number[];
  color?: string;
};

const HEIGHT = 240;
const PAD = { top: 12, right: 16, bottom: 28, left: 40 };

function MarkerShape({ shape, x, y, size, color }: { shape: Marker; x: number; y: number; size: number; color: string }) {
  const common = { fill: color, stroke: "#ffffff", strokeWidth: 1.5 };
  if (shape === "square") return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} {...common} />;
  if (shape === "triangle") {
    return <path d={`M${x},${y - size * 1.2} L${x + size * 1.1},${y + size * 0.8} L${x - size * 1.1},${y + size * 0.8} Z`} {...common} />;
  }
  if (shape === "diamond") {
    return <path d={`M${x},${y - size * 1.25} L${x + size * 1.25},${y} L${x},${y + size * 1.25} L${x - size * 1.25},${y} Z`} {...common} />;
  }
  return <circle cx={x} cy={y} r={size} {...common} />;
}

/** The legend's sample: a short stretch of the series' line with its marker. */
function LegendSample({ color, dash, marker }: { color: string; dash?: string; marker: Marker }) {
  return (
    <svg width="22" height="10" aria-hidden="true" className="shrink-0">
      <line x1="1" x2="21" y1="5" y2="5" stroke={color} strokeWidth={2} strokeDasharray={dash} strokeLinecap="round" />
      <MarkerShape shape={marker} x={11} y={5} size={3} color={color} />
    </svg>
  );
}

/**
 * Multi-series line chart over shared x labels (one axis, ≤ 4 series), with
 * a crosshair + tooltip on hover. Without a mouse: focus the chart and use
 * Left/Right (Home/End) to step through the periods; screen readers hear
 * each period's values, and "Show the numbers" opens them all as a table.
 */
export function LineChart({
  labels,
  series,
  label,
  formatLabel = (value) => value,
  formatValue = (value) => formatCount(value),
  emptyText = "No activity in this period.",
}: {
  labels: string[];
  series: LineSeries[];
  /** What the chart shows ("Weekly registrations"); names it for screen readers. */
  label?: string;
  formatLabel?: (label: string) => string;
  formatValue?: (value: number) => string;
  emptyText?: string;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const hintId = useId();

  const styled = series.map((item, index) => ({
    ...item,
    color: item.color ?? SERIES_COLORS[index % SERIES_COLORS.length],
    dash: SERIES_DASHES[index % SERIES_DASHES.length],
    marker: SERIES_MARKERS[index % SERIES_MARKERS.length],
  }));
  const max = Math.max(0, ...styled.flatMap((item) => item.values));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const n = labels.length;
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / top) * innerH;
  const name = label ?? `Line chart: ${styled.map((item) => item.label).join(", ")}`;

  // Show at most ~6 x labels so they never collide.
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 90))));

  const describe = (index: number) =>
    `${formatLabel(labels[index])}: ${styled.map((item) => `${item.label} ${formatValue(item.values[index] ?? 0)}`).join(", ")}`;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = n - 1;
    const current = hover ?? last;
    const next =
      event.key === "ArrowLeft" ? Math.max(0, current - 1)
      : event.key === "ArrowRight" ? Math.min(last, current + 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) {
      if (event.key === "Escape") setHover(null);
      return;
    }
    event.preventDefault();
    setHover(next);
  }

  const empty = n === 0 || max === 0;

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/60" aria-label="Legend">
        {styled.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5">
            <LegendSample color={item.color} dash={item.dash} marker={item.marker} />
            {item.label}
          </li>
        ))}
      </ul>

      <div ref={ref} className="relative">
        {empty ? (
          <p className="flex h-[240px] items-center justify-center text-sm text-black/60">{emptyText}</p>
        ) : (
          <>
            <div
              role="group"
              aria-label={name}
              aria-describedby={hintId}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onFocus={() => setHover((current) => current ?? n - 1)}
              onBlur={() => setHover(null)}
              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span id={hintId} className="sr-only">
                Use the left and right arrow keys to read each period.
              </span>
              <svg
                width={width}
                height={HEIGHT}
                aria-hidden="true"
                className="block"
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
                    <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-surface-muted)" strokeWidth={1} />
                    <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-black/60 text-[11px] tabular-nums">
                      {formatCount(tick)}
                    </text>
                  </g>
                ))}
                {labels.map((value, i) =>
                  i % every === 0 || i === n - 1 ? (
                    <text key={value} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-black/60 text-[11px]">
                      {formatLabel(value)}
                    </text>
                  ) : null,
                )}
                {hover !== null ? (
                  <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#c9c9c9" strokeWidth={1} />
                ) : null}
                {styled.map((item) => (
                  <polyline
                    key={item.key}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={2}
                    strokeDasharray={item.dash}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={item.values.map((value, i) => `${x(i)},${y(value)}`).join(" ")}
                  />
                ))}
                {/* Each line ends in its marker, so the legend's shapes find their line. */}
                {styled.map((item) =>
                  n > 0 && hover !== n - 1 ? (
                    <MarkerShape key={item.key} shape={item.marker} x={x(n - 1)} y={y(item.values[n - 1] ?? 0)} size={3.5} color={item.color} />
                  ) : null,
                )}
                {hover !== null
                  ? styled.map((item) => (
                      <MarkerShape key={item.key} shape={item.marker} x={x(hover)} y={y(item.values[hover] ?? 0)} size={4.5} color={item.color} />
                    ))
                  : null}
              </svg>
              <p className="sr-only" aria-live="polite">
                {hover !== null ? describe(hover) : ""}
              </p>
            </div>
            {hover !== null ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs shadow-md"
                style={{
                  left: Math.min(Math.max(x(hover) + 12, 0), width - 160),
                }}
              >
                <p className="mb-1 font-medium text-navy">{formatLabel(labels[hover])}</p>
                {styled.map((item) => (
                  <p key={item.key} className="flex items-center justify-between gap-4 text-black/65">
                    <span className="flex items-center gap-1.5">
                      <LegendSample color={item.color} dash={item.dash} marker={item.marker} />
                      {item.label}
                    </span>
                    <span className="font-medium text-navy tabular-nums">{formatValue(item.values[hover] ?? 0)}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      {empty ? null : (
        <ChartDataTable
          caption={name}
          columns={["Period", ...styled.map((item) => item.label)]}
          rows={labels.map((value, i) => [formatLabel(value), ...styled.map((item) => formatValue(item.values[i] ?? 0))])}
        />
      )}
    </div>
  );
}
