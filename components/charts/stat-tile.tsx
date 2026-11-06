import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { formatCount } from "@/lib/backoffice/format";

/** Thousands become 12.9K etc.; small numbers stay exact. Same as formatCount(value, { compact: true }). */
export function formatCompact(value: number | null | undefined) {
  return formatCount(value, { compact: true });
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-black/60">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand/[0.08] text-brand">
            <Icon className="size-4" />
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
      {hint ? <p className="mt-1 text-xs [overflow-wrap:anywhere] text-black/60">{hint}</p> : null}
    </div>
  );
}
