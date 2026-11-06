import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getApiBaseUrl } from "@/lib/api/config";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { logEvent, oneLine } from "@/lib/api/log";
import { logGatewayUnreachable } from "@/lib/api/network-error";
import type { CalculatorConfig } from "@/lib/zakat/calculator-config";
import { readCalculatorConfig } from "@/lib/zakat/calculator-read";
import type { PublicCause, PublicStory } from "@/lib/zakat/content";
import { ZAKAT_PUBLIC_TAG } from "@/lib/zakat/public-cache";

/**
 * Public impact and transparency data from zakat-engine (no login), fetched on
 * the server and kept for 5 minutes, or dropped at once when an admin saves a
 * change through the zakat-admin BFF (see lib/zakat/public-cache.ts).
 *
 * Every getter returns null only when there is nothing published: the service
 * answered 404 (or sent no data). When the service can't be reached, times out
 * or fails, the getter throws instead, so a page never tells the public that
 * nothing was published, or that a real cause doesn't exist, during an outage.
 * On a refresh Next then keeps serving the last good copy; a page with no
 * cached copy shows the error page (app/error.tsx) with a Try again button.
 *
 * Two endpoints use 503 `{ success: false }` to mean "nothing yet", not an
 * outage: /calculator/config (no prices stored yet) and /impact/timeseries (no
 * collections yet). Those two read that answer as not published (null).
 *
 * Exception: `next build` may run without the gateway. There the getters
 * return null so the build passes, and the first revalidation fills the page.
 */

const REQUEST_TIMEOUT_MS = 10_000;
const REFRESH_SECONDS = 300;

/** zakat-engine could not answer: unreachable, too slow, or an error status. */
export class PublicDataUnavailableError extends Error {
  constructor(path: string, cause: unknown) {
    super(`Public zakat data is unavailable (${path})`, { cause });
    this.name = "PublicDataUnavailableError";
  }
}

/**
 * What a zakat-engine answer means for the public site: its data, or null
 * when nothing is published (never published, taken down, or a malformed id).
 * Throws PublicDataUnavailableError when the answer is an outage.
 */
export async function readPublicAnswer(response: Response, path: string, emptyOn503 = false): Promise<unknown> {
  // Never log query strings (lib/api/log.ts).
  const where = { label: "zakat_public", path: path.split("?")[0] };
  // Never published, or taken down. A 400 is a malformed id in the URL.
  if (response.status === 404 || response.status === 410 || response.status === 400) return null;
  // zakat-engine's own "no data yet" answer. An nginx or gateway 503 (HTML, or
  // JSON without success: false) is still an outage.
  if (response.status === 503 && emptyOn503) {
    const body = (await response.json().catch(() => null)) as { success?: unknown } | null;
    if (body && typeof body === "object" && body.success === false) return null;
  }
  if (!response.ok) {
    logEvent("error", "public_data_http_error", { ...where, status: response.status });
    throw new PublicDataUnavailableError(path, new Error(`HTTP ${response.status}`));
  }

  let envelope: { success?: boolean; data?: unknown; message?: string };
  try {
    envelope = await response.json();
  } catch (error) {
    logEvent("error", "public_data_not_json", { ...where, status: response.status });
    throw new PublicDataUnavailableError(path, error);
  }
  if (!envelope.success) {
    logEvent("error", "public_data_failure", {
      ...where,
      status: response.status,
      message: envelope.message ? oneLine(String(envelope.message), 200) : undefined,
    });
    throw new PublicDataUnavailableError(path, new Error(envelope.message ?? "success: false"));
  }
  return envelope.data ?? null;
}

/** One zakat-engine read, uncached: its data, null when not published; throws on an outage. */
export async function fetchPublic(path: string, emptyOn503 = false): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/zakat/v1${path}`, {
      // Cached below as an answer, not here as a response.
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logGatewayUnreachable(`zakat${path}`, error);
    throw new PublicDataUnavailableError(path, error);
  }
  return readPublicAnswer(response, path, emptyOn503);
}

/**
 * The answer is cached, not the HTTP response. Next's fetch cache only ever
 * stores a 200, so when a story or cause was taken down, the refresh got a
 * 404 that was never stored and the old copy was served again on every visit
 * (UAT #15). Here "not published" (null) is cached like any other answer, so a
 * removed story or cause is gone after the next refresh. An outage throws, and
 * a refresh that throws is never stored: the last good copy stays up.
 */
const cachedPublic = unstable_cache(fetchPublic, ["zakat-public-answer"], {
  revalidate: REFRESH_SECONDS,
  // Admin changes expire the tag at once (app/bff/zakat-admin).
  tags: [ZAKAT_PUBLIC_TAG],
});

/**
 * One read per path per render: the cause and story pages load the same
 * record in generateMetadata and in the page.
 */
const loadPublic = cache(async (path: string, emptyOn503 = false): Promise<unknown> => {
  try {
    return await cachedPublic(path, emptyOn503);
  } catch (error) {
    if (error instanceof PublicDataUnavailableError && process.env.NEXT_PHASE === "phase-production-build") return null;
    throw error;
  }
});

/** null = not published. Throws when the service is unavailable (see above). */
async function getPublic<T>(path: string, emptyOn503 = false): Promise<T | null> {
  return (await loadPublic(path, emptyOn503)) as T | null;
}

export type HomeSummary = {
  totalCollectedEtb: number | null;
  totalBeneficiariesSupported: number | null;
  /** Calendar month, Addis Ababa time; null when unavailable. */
  currentMonth?: {
    collectedEtb: number | null;
    previousMonthCollectedEtb: number | null;
    /** One decimal; null when last month was 0 (show no trend). */
    changePercent: number | null;
  } | null;
  asOf: string | null;
};

export type ImpactSummary = {
  scope: string;
  regionCode: string | null;
  regionName: string;
  distributedFundsEtb: number | null;
  livesTouched: number | null;
  activeProjects: number | null;
  beneficiariesByAsnaf: { asnaf: string; count: number }[];
  asOf: string | null;
};

export type ImpactRegion = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  distributedFundsEtb: number | null;
  beneficiaries: number | null;
  activeProjects: number | null;
};

export type ImpactTimeseries = {
  interval: "month";
  from: string;
  to: string;
  points: { period: string; collectedEtb: number | null; disbursedEtb: number | null }[];
  totalCollectedEtb: number | null;
  asOf: string | null;
};

export type ImpactReport = {
  id: string;
  title: string;
  period: string | null;
  summary: string | null;
  publishedAt: string | null;
  fileUrl: string;
  sizeBytes: number | null;
};

/** A page of a public list, as zakat-engine sends it. */
export type PublicPage<T> = {
  items: T[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
};

/** An answer that should be a page; a plain array (as older services sent) becomes one page. */
function asPage<T>(data: PublicPage<T> | T[] | null, limit: number): PublicPage<T> | null {
  if (!data) return null;
  if (!Array.isArray(data)) return data;
  return { items: data, pagination: { page: 1, limit, totalItems: data.length, totalPages: data.length > 0 ? 1 : 0 } };
}

// Each getter: the data, or null when it isn't published. Throws when
// zakat-engine is unavailable at runtime (see PublicDataUnavailableError).
export const getHomeSummary = () => getPublic<HomeSummary>("/home/summary");
export const getImpactSummary = () => getPublic<ImpactSummary>("/impact/summary");
export const getImpactRegions = () => getPublic<ImpactRegion[]>("/impact/regions");
export const getImpactTimeseries = () => getPublic<ImpactTimeseries>("/impact/timeseries", true);

/**
 * The official calculator config, checked (lib/zakat/calculator-read.ts): null
 * when none is published, or when a field the site relies on is missing.
 */
export async function getCalculatorConfig(): Promise<CalculatorConfig | null> {
  return readCalculatorConfig(await getPublic<unknown>("/calculator/config", true));
}

/** One page of published reports (null: none published). */
export async function getImpactReports(page = 1, limit = 50): Promise<PublicPage<ImpactReport> | null> {
  return asPage(
    await getPublic<PublicPage<ImpactReport> | ImpactReport[]>(`/impact/reports?page=${page}&limit=${limit}`),
    limit,
  );
}

/**
 * Public causes (null: none published). The permanent general fund (id
 * "general") is left out of campaign lists.
 */
export async function getCauses(query: { status?: "active" | "closed"; urgent?: boolean; page?: number; limit?: number } = {}) {
  const limit = query.limit ?? 24;
  const params = new URLSearchParams({
    status: query.status ?? "active",
    page: String(query.page ?? 1),
    limit: String(limit),
  });
  if (query.urgent) params.set("urgent", "true");
  const data = asPage(await getPublic<PublicPage<PublicCause>>(`/causes?${params}`), limit);
  if (!data) return null;
  return { ...data, items: data.items.filter((cause) => cause.id !== "general") };
}

/** One cause; null means it doesn't exist or isn't public (a real 404). */
export const getCause = (id: string) => getPublic<PublicCause>(`/causes/${encodeURIComponent(id)}`);

/**
 * True when the cause is on the public closed list. The single-cause answer
 * has no status yet (docs/backend-go-live-requests.md §21), so this is how the
 * cause page learns that a cause was closed before its end date. Only the
 * newest closed causes are checked, and an outage counts as "not listed".
 */
export async function isListedClosed(id: string): Promise<boolean> {
  try {
    const closed = await getCauses({ status: "closed", page: 1, limit: 50 });
    return closed?.items.some((cause) => cause.id === id) ?? false;
  } catch {
    return false;
  }
}

/** One page of published stories (null: none published). */
export const getStories = async (page = 1, limit = 24) =>
  asPage(await getPublic<PublicPage<PublicStory>>(`/impact/stories?page=${page}&limit=${limit}`), limit);

/** One story; null means it doesn't exist or isn't public (a real 404). */
export const getStory = (id: string) => getPublic<PublicStory>(`/impact/stories/${encodeURIComponent(id)}`);

/*
 * Formatting for public figures. Every helper takes the page's language
 * (default English) and formats with INTL_LOCALE, so amounts and dates read
 * naturally in each language: "ETB 1.8M" (en), "1.8 مليون ETB" (ar). Each
 * returns null when the figure isn't published yet; pages show a dash.
 */

const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

function numberFormat(locale: Locale, name: string, options: Intl.NumberFormatOptions) {
  const key = `${locale}:${name}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(INTL_LOCALE[locale], options);
    numberFormats.set(key, format);
  }
  return format;
}

function dateFormat(locale: Locale, name: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${name}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(INTL_LOCALE[locale], options);
    dateFormats.set(key, format);
  }
  return format;
}

const isMissing = (value: number | null | undefined): value is null | undefined =>
  value === null || value === undefined || !Number.isFinite(value);

/** "ETB 1.8M", or null when the figure isn't published yet. */
export function formatEtbCompact(value: number | null | undefined, locale: Locale = "en") {
  return isMissing(value)
    ? null
    : numberFormat(locale, "etbCompact", {
        style: "currency",
        currency: "ETB",
        currencyDisplay: "code",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
}

/** "ETB 612,345" (whole birr), or null when the figure isn't published yet. */
export function formatEtb(value: number | null | undefined, locale: Locale = "en") {
  return isMissing(value)
    ? null
    : numberFormat(locale, "etb", {
        style: "currency",
        currency: "ETB",
        currencyDisplay: "code",
        maximumFractionDigits: 0,
      }).format(Math.round(value));
}

/** "12,345", or null when the figure isn't published yet. */
export function formatCount(value: number | null | undefined, locale: Locale = "en") {
  return isMissing(value) ? null : numberFormat(locale, "count", {}).format(value);
}

/** A rate as a percentage: 0.025 -> "2.5%". */
export function formatPercent(rate: number, locale: Locale = "en") {
  return numberFormat(locale, "percent", { style: "percent", maximumFractionDigits: 2 }).format(rate);
}

/**
 * The calendar date of an ISO date or timestamp, as sent: "2026-03-04" or
 * "2026-03-04T08:00:00Z" -> "4 Mar 2026" (en, medium). null when missing or
 * unreadable.
 */
export function formatDate(value: string | null | undefined, locale: Locale = "en", style: "medium" | "long" = "medium") {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  return dateFormat(locale, `date-${style}`, { dateStyle: style, timeZone: "UTC" }).format(date);
}

/** A timestamp in Addis Ababa time: "5 Nov 2026, 15:04" (en). null when missing or unreadable. */
export function formatDateTime(value: string | null | undefined, locale: Locale = "en") {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return dateFormat(locale, "datetime", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" }).format(date);
}

/** A "YYYY-MM" period as a short month: "2026-03" -> "Mar 2026" (en). Unreadable periods are returned as sent. */
export function formatMonth(period: string, locale: Locale = "en") {
  const match = /^(\d{4})-(\d{2})/.exec(period);
  if (!match) return period;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  if (Number.isNaN(date.getTime())) return period;
  return dateFormat(locale, "month", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
