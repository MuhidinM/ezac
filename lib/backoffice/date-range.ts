export type RangeKey = "30d" | "90d" | "1y";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "1y", label: "Last 12 months" },
];

function isoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Inclusive `from`/`to` (YYYY-MM-DD) ending today, for analytics queries. */
export function rangeDates(key: RangeKey) {
  const to = new Date();
  const from = new Date(to);
  if (key === "30d") from.setDate(from.getDate() - 29);
  else if (key === "90d") from.setDate(from.getDate() - 89);
  else from.setFullYear(from.getFullYear() - 1);
  return { from: isoDate(from), to: isoDate(to) };
}

export function rangeQuery(key: RangeKey) {
  const { from, to } = rangeDates(key);
  return `from=${from}&to=${to}`;
}
