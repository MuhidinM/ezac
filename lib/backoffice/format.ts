// Staff-portal number formats. One fixed locale ("en": 1,234.5) so a figure
// reads the same on every machine, whatever the browser's language.
const LOCALE = "en";

const whole = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });

/** Below this, compact figures stay exact (9,999 not 10K); from it they shorten (12.9K). */
const COMPACT_FROM = 10_000;

/** Between "ETB" and the number, so the pair never wraps onto two lines. */
const NBSP = " ";

function finite(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}

/**
 * An amount in birr for the staff portal: "ETB 1,234", "ETB 1,234.50" (cents
 * only when there are any), or with `compact` "ETB 12.9K" from 10,000 up.
 * A dash when there is no amount.
 */
export function formatEtb(value: number | null | undefined, options: { compact?: boolean } = {}) {
  if (!finite(value)) return "—";
  let number: string;
  if (options.compact && Math.abs(value) >= COMPACT_FROM) number = compact.format(value);
  else if (Number.isInteger(Math.round(value * 100) / 100)) number = whole.format(value);
  else number = cents.format(value);
  return `ETB${NBSP}${number}`;
}

/**
 * A count ("1,234"), or with `compact` "12.9K" from 10,000 up. A dash when
 * there is no number. Use instead of toLocaleString(), which follows the
 * browser's language.
 */
export function formatCount(value: number | null | undefined, options: { compact?: boolean } = {}) {
  if (!finite(value)) return "—";
  if (options.compact && Math.abs(value) >= COMPACT_FROM) return compact.format(value);
  return whole.format(value);
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
