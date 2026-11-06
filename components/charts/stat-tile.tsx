import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Sparkline } from "@/components/charts/sparkline";
import { formatCount } from "@/lib/backoffice/format";
import { cn } from "@/lib/utils";

/** Thousands become 12.9K etc.; small numbers stay exact. Same as formatCount(value, { compact: true }). */
export function formatCompact(value: number | null | undefined) {
  return formatCount(value, { compact: true });
}

/** Change against the previous period of the same length. */
export type StatDelta = {
  /** Current and previous totals; the change is worked out from them. */
  current: number;
  previous: number;
  /** "vs previous 30 days" */
  label: string;
  /** False when a rise is bad news (e.g. a growing backlog). */
  upIsGood?: boolean;
};

function DeltaBadge({ delta }: { delta: StatDelta }) {
  const { current, previous, upIsGood = true } = delta;
  const change = current - previous;
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  // From zero any rise is "new"; a percentage would be infinite.
  const text =
    direction === "flat" ? "No change"
    : previous === 0 ? `+${formatCount(change)} new`
    : `${change > 0 ? "+" : "−"}${Math.round((Math.abs(change) / previous) * 100)}%`;
  const good = direction === "flat" ? null : (direction === "up") === upIsGood;
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-black/60">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
          good === null ? "bg-black/[0.05] text-black/70" : good ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
        )}
      >
        <Icon className="size-3" aria-hidden="true" />
        {text}
      </span>
      <span>{delta.label}</span>
    </p>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  trend,
  delta,
  trendColor,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  /** Values per period for a sparkline under the figure. */
  trend?: number[];
  delta?: StatDelta;
  trendColor?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-black/60">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand/[0.08] text-brand">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-black/[0.06]" />
      ) : (
        // A long figure ("ETB 1,234,567.50") wraps instead of overflowing the tile (ui-18);
        // the title shows it whole on hover.
        <p
          className="mt-2 min-w-0 text-3xl font-semibold tracking-tight [overflow-wrap:anywhere] text-navy"
          title={typeof value === "string" || typeof value === "number" ? String(value) : undefined}
        >
          {value}
        </p>
      )}
      {!loading && delta ? <DeltaBadge delta={delta} /> : null}
      {hint ? <p className="mt-1 text-xs [overflow-wrap:anywhere] text-black/60">{hint}</p> : null}
      {trend ? (
        <div className="-mx-1 mt-auto pt-3">
          <Sparkline values={trend} color={trendColor} />
        </div>
      ) : null}
    </div>
  );
}
