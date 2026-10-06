"use client";

import { useState } from "react";

import { niceTicks, useWidth } from "@/components/charts/use-width";
import type { ScoreDistribution } from "@/lib/api/backoffice-types";

const HEIGHT = 220;
const PAD = { top: 18, right: 12, bottom: 28, left: 36 };

// Risk is semantic, so bars take the same red / amber / green as the risk badges.
const BAND_COLOR = { HIGH: "#e11d48", MEDIUM: "#d97706", LOW: "#059669" } as const;

function bandFor(from: number, thresholds: ScoreDistribution["thresholds"]) {
  if (from >= thresholds.high) return "HIGH";
  if (from >= thresholds.medium) return "MEDIUM";
  return "LOW";
}

/** Columns of current scores, tinted by the risk band they fall in. */
export function ScoreHistogram({ data }: { data: ScoreDistribution }) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(0, ...data.buckets.map((bucket) => bucket.count));
  const ticks = niceTicks(max, 3);
  const top = ticks[ticks.length - 1] || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const scale = (score: number) => PAD.left + (score / data.max) * innerW;
  const y = (count: number) => PAD.top + innerH - (count / top) * innerH;
  const hovered = hover !== null ? data.buckets[hover] : null;

  if (data.scored === 0) {
    return <p className="flex h-[220px] items-center justify-center text-sm text-black/45">No scored assessments yet.</p>;
  }

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={HEIGHT} role="img" aria-label={`Score distribution of ${data.scored} assessments`}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="#ececec" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-black/45 text-[11px] tabular-nums">
              {tick}
            </text>
          </g>
        ))}
        {data.buckets.map((bucket, index) => {
          const x0 = scale(bucket.from) + 1;
          const barW = Math.max(1, scale(bucket.to + 1) - scale(bucket.from) - 2);
          const height = PAD.top + innerH - y(bucket.count);
          const color = BAND_COLOR[bandFor(bucket.from, data.thresholds)];
          return (
            <g key={bucket.from} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
              {/* Hit target taller than the mark. */}
              <rect x={x0} y={PAD.top} width={barW} height={innerH} fill="transparent" />
              {bucket.count > 0 ? (
                <path
                  d={`M${x0},${PAD.top + innerH} v${-Math.max(height - 3, 0)} q0,-3 3,-3 h${Math.max(barW - 6, 0)} q3,0 3,3 v${Math.max(height - 3, 0)} z`}
                  fill={color}
                  opacity={hover === null || hover === index ? 1 : 0.45}
                />
              ) : null}
            </g>
          );
        })}
        {[data.thresholds.medium, data.thresholds.high].map((threshold) => (
          <g key={threshold}>
            <line x1={scale(threshold)} x2={scale(threshold)} y1={PAD.top - 6} y2={PAD.top + innerH} stroke="#001539" strokeOpacity={0.35} strokeWidth={1} />
            <text x={scale(threshold) + 4} y={PAD.top - 6} className="fill-black/55 text-[10px]">
              {threshold === data.thresholds.high ? `High ≥ ${threshold}` : `Medium ≥ ${threshold}`}
            </text>
          </g>
        ))}
        {[0, data.thresholds.medium, data.thresholds.high, data.max].map((tick) => (
          <text key={tick} x={scale(tick)} y={HEIGHT - 8} textAnchor="middle" className="fill-black/45 text-[11px] tabular-nums">
            {tick}
          </text>
        ))}
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs shadow-md"
          style={{ left: Math.min(scale(hovered.from) + 12, width - 150) }}
        >
          <p className="font-medium text-[#001539] tabular-nums">
            Score {hovered.from}–{hovered.to}
          </p>
          <p className="text-black/60 tabular-nums">{hovered.count.toLocaleString()} assessments</p>
        </div>
      ) : null}
    </div>
  );
}
