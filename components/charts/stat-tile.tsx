import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** Thousands become 12.9K etc.; small numbers stay exact. */
export function formatCompact(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return Math.abs(value) >= 10_000 ? compact.format(value) : value.toLocaleString();
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
    <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-black/60">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#007050]/[0.08] text-[#007050]">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-black/[0.06]" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-[#001539]">{value}</p>
      )}
      {hint ? <p className="mt-1 text-xs text-black/50">{hint}</p> : null}
    </div>
  );
}
