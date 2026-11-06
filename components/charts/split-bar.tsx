import { CATEGORICAL } from "@/components/charts/palette";
import { formatCount } from "@/lib/backoffice/format";
import { cn } from "@/lib/utils";

export type SplitPart = {
  key: string;
  label: string;
  value: number;
  /** Override the categorical slot (semantic sets: need level, status). */
  color?: string;
};

/**
 * One whole split into parts: a segmented bar (2px gaps, rounded ends) with
 * the parts listed underneath, each with its swatch, count and share. The
 * list carries every figure, so the bar itself needs no text; it is named for
 * screen readers. Parts at zero draw nothing but stay in the list.
 */
export function SplitBar({
  parts,
  size = "thin",
  emptyText = "No data yet.",
  formatValue = (value) => formatCount(value),
  columns = 1,
  label,
}: {
  parts: SplitPart[];
  /** "tall" (24px) for a bar that stands alone; "thin" (10px) above a list. */
  size?: "thin" | "tall";
  emptyText?: string;
  formatValue?: (value: number) => string;
  /** Lay the list out in 1 or 2 columns. */
  columns?: 1 | 2;
  /** Names the bar for screen readers. */
  label: string;
}) {
  const styled = parts.map((part, index) => ({ ...part, color: part.color ?? CATEGORICAL[index % CATEGORICAL.length] }));
  const total = styled.reduce((sum, part) => sum + part.value, 0);
  if (total === 0) return <p className="py-6 text-center text-sm text-black/60">{emptyText}</p>;
  const share = (value: number) => Math.round((value / total) * 100);
  const summary = `${label}: ${styled.map((part) => `${part.label} ${formatValue(part.value)} (${share(part.value)}%)`).join(", ")}`;

  return (
    <div className="space-y-4">
      <div
        role="img"
        aria-label={summary}
        className={cn("flex w-full gap-[2px]", size === "tall" ? "h-6" : "h-2.5")}
      >
        {styled
          .filter((part) => part.value > 0)
          .map((part) => (
            <span
              key={part.key}
              title={`${part.label}: ${formatValue(part.value)} (${share(part.value)}%)`}
              className="h-full min-w-[3px] first:rounded-s-full last:rounded-e-full transition-opacity hover:opacity-80"
              style={{ flexGrow: part.value, flexBasis: 0, backgroundColor: part.color }}
            />
          ))}
      </div>
      <ul className={cn("grid gap-x-6 gap-y-2", columns === 2 && "sm:grid-cols-2")}>
        {styled.map((part) => (
          <li key={part.key} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: part.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-black/70">{part.label}</span>
            <span className="font-medium text-navy tabular-nums">{formatValue(part.value)}</span>
            <span className="w-10 text-right text-xs text-black/60 tabular-nums">{share(part.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
