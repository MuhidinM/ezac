const etb = new Intl.NumberFormat("en-ET", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatEtb(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${etb.format(value)} ETB`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ET", { dateStyle: "medium" }).format(date);
}

/**
 * A turnaround in days ("2.5 d"). Under a day it reads in hours ("7 h"), so a
 * same-day median doesn't show as "0.0 d".
 */
export function formatDays(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value >= 1) return `${value.toFixed(1)} d`;
  const hours = value * 24;
  return hours < 1 ? "Under 1 h" : `${Math.round(hours)} h`;
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
