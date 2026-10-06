import { cn } from "@/lib/utils";

export type BarListItem = {
  key: string;
  label: string;
  value: number;
  /** Override the bar colour (semantic sets such as risk only). */
  color?: string;
};

/**
 * Ranked horizontal bars, one hue. Values sit at the bar tip, so every
 * number is readable without hover; the row title carries the share.
 */
export function BarList({
  items,
  total,
  emptyText = "No data for this period.",
  color = "#007050",
  formatValue = (value) => value.toLocaleString(),
}: {
  items: BarListItem[];
  /** Denominator for shares; defaults to the sum of values. */
  total?: number;
  emptyText?: string;
  color?: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(0, ...items.map((item) => item.value));
  const sum = total ?? items.reduce((acc, item) => acc + item.value, 0);

  if (items.length === 0 || max === 0) {
    return <p className="py-6 text-center text-sm text-black/45">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const width = (item.value / max) * 100;
        const share = sum > 0 ? Math.round((item.value / sum) * 100) : 0;
        return (
          <li
            key={item.key}
            className="grid grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)] items-center gap-3"
            title={`${item.label}: ${item.value.toLocaleString()} (${share}%)`}
          >
            <span className="truncate text-sm text-black/65">{item.label}</span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 min-w-0 flex-1">
                <span
                  className={cn("block h-full rounded-r-[4px]", item.value === 0 && "opacity-0")}
                  style={{ width: `${Math.max(width, 1.5)}%`, backgroundColor: item.color ?? color }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-sm font-medium text-[#001539] tabular-nums">
                {formatValue(item.value)}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
