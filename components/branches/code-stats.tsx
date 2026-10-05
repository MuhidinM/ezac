import type { CodeStats } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ITEMS: { key: keyof CodeStats; label: string; hint: string; dot: string }[] = [
  { key: "available", label: "Available", hint: "Ready to hand out", dot: "bg-emerald-500" },
  { key: "reserved", label: "Reserved", hint: "Fayda registration in progress", dot: "bg-sky-500" },
  { key: "consumed", label: "Used", hint: "Linked to a beneficiary", dot: "bg-[#001539]" },
  { key: "revoked", label: "Revoked", hint: "No longer valid", dot: "bg-black/30" },
];

/** Registration code counts as four stat tiles. */
export function CodeStatTiles({ stats }: { stats: CodeStats | null | undefined }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {ITEMS.map((item) => (
        <div key={item.key} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-xs">
          <p className="flex items-center gap-2 text-sm font-medium text-black/60">
            <span className={cn("size-2 rounded-full", item.dot)} />
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#001539] tabular-nums">
            {stats ? stats[item.key].toLocaleString() : "—"}
          </p>
          <p className="mt-0.5 text-xs text-black/45">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

/** Compact inline version for table cells. */
export function CodeStatsInline({ stats }: { stats: CodeStats | null | undefined }) {
  if (!stats) return <span className="text-black/40">—</span>;
  return (
    <span className="inline-flex items-center gap-3 text-xs text-black/60 tabular-nums">
      {ITEMS.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1" title={item.label}>
          <span className={cn("size-1.5 rounded-full", item.dot)} />
          {stats[item.key]}
        </span>
      ))}
    </span>
  );
}
