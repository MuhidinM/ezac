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

/** "vs previous 30 days": how a range's comparison period reads in a stat tile. */
export const PREVIOUS_LABEL: Record<RangeKey, string> = {
  "30d": "vs previous 30 days",
  "90d": "vs previous 90 days",
  "1y": "vs previous 12 months",
};

/** The window of the same length just before `rangeDates(key)`, for "change vs previous period". */
export function previousRangeDates(key: RangeKey) {
  const { from } = rangeDates(key);
  const start = new Date(`${from}T00:00:00`);
  const to = new Date(start);
  to.setDate(to.getDate() - 1);
  const previousFrom = new Date(start);
  if (key === "30d") previousFrom.setDate(previousFrom.getDate() - 30);
  else if (key === "90d") previousFrom.setDate(previousFrom.getDate() - 90);
  else previousFrom.setFullYear(previousFrom.getFullYear() - 1);
  return { from: isoDate(previousFrom), to: isoDate(to) };
}
