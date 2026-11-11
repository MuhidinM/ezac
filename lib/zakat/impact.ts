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
 * Public impact and transparency data from zakat-engine, and the need bands
 * from beneficiary-service (no login), fetched on
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

/** The public services the site reads, by their gateway base path. */
const SERVICE_BASE = {
  zakat: "/api/zakat/v1",
  beneficiaries: "/api/beneficiaries/v1",
} as const;
type PublicService = keyof typeof SERVICE_BASE;

/**
 * One public read, uncached: its data, null when not published; throws on an
 * outage. zakat-engine by default; the public scoring bands come from
 * beneficiary-service, which answers in the same envelope.
 */
export async function fetchPublic(path: string, emptyOn503 = false, service: PublicService = "zakat"): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${SERVICE_BASE[service]}${path}`, {
      // Cached below as an answer, not here as a response.
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logGatewayUnreachable(`${service}${path}`, error);
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
 *
 * The cache key is the arguments, so each language (`?lang=am`) has its own
 * copy; they all share ZAKAT_PUBLIC_TAG, so an admin save drops every
 * language at once.
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
const loadPublic = cache(async (path: string, emptyOn503 = false, service: PublicService = "zakat"): Promise<unknown> => {
  try {
    return await cachedPublic(path, emptyOn503, service);
  } catch (error) {
    if (error instanceof PublicDataUnavailableError && process.env.NEXT_PHASE === "phase-production-build") return null;
    throw error;
  }
});

/** null = not published. Throws when the service is unavailable (see above). */
async function getPublic<T>(path: string, emptyOn503 = false, service: PublicService = "zakat"): Promise<T | null> {
  return (await loadPublic(path, emptyOn503, service)) as T | null;
}

/**
 * zakat-engine has Amharic text for causes, stories and regions (falling back
 * to English per item, which then says `lang: "en"`). Other languages read
 * the English text.
 */
function withLang(path: string, locale: Locale): string {
  if (locale !== "am") return path;
  return `${path}${path.includes("?") ? "&" : "?"}lang=am`;
}

export type HomeSummary = {
  /** Live plus offline: the figure to show. Never add the parts to it. */
  totalCollectedEtb: number | null;
  /** Live plus offline households. */
  totalBeneficiariesSupported: number | null;
  /** Succeeded online payments. */
  liveCollectedEtb?: number | null;
  /** Given at branches; entered by ADMIN and approved by a second ADMIN. */
  offlineCollectedEtb?: number | null;
  liveBeneficiariesSupported?: number | null;
  offlineBeneficiariesSupported?: number | null;
  /** The day the offline figures were counted up to ("2026-11-05"). */
  offlineAsOfDate?: string | null;
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
  /** In Amharic on an Amharic read when one is entered (see `lang`), else English. */
  name: string;
  nameAm?: string | null;
  /** "am" or "en": the language of `name`. */
  lang?: string;
  latitude: number;
  longitude: number;
  /** null: not entered. */
  distributedFundsEtb: number | null;
  beneficiaries: number | null;
  activeProjects: number | null;
  /** Households: the entered figure when ADMIN entered one, else the live count. */
  livesTouched?: number | null;
  livesTouchedSource?: "ENTERED" | "LIVE" | null;
  distributedFundsSource?: "ENTERED" | "LIVE" | null;
  livesTouchedEntered?: number | null;
  livesTouchedLive?: number | null;
  distributedFundsEnteredEtb?: number | null;
};

/** The need bands in force (beneficiary-service `GET /public/scoring-bands`). */
export type ScoringBands = {
  version: number;
  activeSince: string | null;
  maxTotal: number;
  bands: { risk: string; min: number; max: number }[];
  sectionMaxima?: Record<string, number>;
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
export const getImpactRegions = (locale: Locale = "en") => getPublic<ImpactRegion[]>(withLang("/impact/regions", locale));
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
 * The need bands in force, from the active points table (no login; the
 * service caches them for 5 minutes). null when not published.
 */
export const getScoringBands = () => getPublic<ScoringBands>("/public/scoring-bands", false, "beneficiaries");

/**
 * Public causes (null: none published). The permanent general fund (id
 * "general") is left out of campaign lists.
 */
export async function getCauses(
  query: { status?: "active" | "closed"; urgent?: boolean; page?: number; limit?: number; locale?: Locale } = {},
) {
  const limit = query.limit ?? 24;
  const params = new URLSearchParams({
    status: query.status ?? "active",
    page: String(query.page ?? 1),
    limit: String(limit),
  });
  if (query.urgent) params.set("urgent", "true");
  const data = asPage(await getPublic<PublicPage<PublicCause>>(withLang(`/causes?${params}`, query.locale ?? "en")), limit);
  if (!data) return null;
  return { ...data, items: data.items.filter((cause) => cause.id !== "general") };
}

/** One cause; null means it doesn't exist or isn't public (a real 404). */
export const getCause = (id: string, locale: Locale = "en") =>
  getPublic<PublicCause>(withLang(`/causes/${encodeURIComponent(id)}`, locale));

/** One page of published stories (null: none published). */
export const getStories = async (page = 1, limit = 24, locale: Locale = "en") =>
  asPage(await getPublic<PublicPage<PublicStory>>(withLang(`/impact/stories?page=${page}&limit=${limit}`, locale)), limit);

/** One story; null means it doesn't exist or isn't public (a real 404). */
export const getStory = (id: string, locale: Locale = "en") =>
  getPublic<PublicStory>(withLang(`/impact/stories/${encodeURIComponent(id)}`, locale));

/**
 * Money collected, live and offline together. totalCollectedEtb already is
 * the sum; the parts are only added when an older answer has no total.
 */
export function collectedEtb(home: HomeSummary | null | undefined): number | null {
  if (!home) return null;
  if (home.totalCollectedEtb != null) return home.totalCollectedEtb;
  const parts = [home.liveCollectedEtb, home.offlineCollectedEtb].filter((value): value is number => value != null);
  return parts.length > 0 ? parts.reduce((sum, value) => sum + value, 0) : null;
}

/**
 * "Families supported" (home summary) and "lives touched" (impact summary)
 * both count households. They differ only when ADMIN entered a lives-touched
 * figure; when they match, lives touched is dropped so the same number isn't
 * shown twice.
 */
export function householdFigures(
  home: HomeSummary | null | undefined,
  impact: ImpactSummary | null | undefined,
): { families: number | null; lives: number | null } {
  const families = home?.totalBeneficiariesSupported ?? null;
  const lives = impact?.livesTouched ?? null;
  return { families, lives: families != null && lives === families ? null : lives };
}

/** One need band for the public scale: from its lowest score up to where the next band starts. */
export type NeedBand = { key: "low" | "medium" | "high"; min: number; max: number; from: number; to: number };

const NEED_KEYS = ["low", "medium", "high"] as const;

/**
 * The bands in force as low, medium and high, in order, or null when the
 * answer isn't the three bands the page explains (the page then shows its
 * example instead).
 */
export function needBands(data: ScoringBands | null | undefined): { bands: NeedBand[]; maxTotal: number } | null {
  if (!data || !Number.isFinite(data.maxTotal) || data.maxTotal <= 0 || !Array.isArray(data.bands)) return null;
  const rows = [...data.bands].sort((a, b) => a.min - b.min);
  if (rows.length !== NEED_KEYS.length) return null;
  const bands: NeedBand[] = [];
  for (const [index, row] of rows.entries()) {
    const key = NEED_KEYS[index];
    if (row.risk?.toLowerCase() !== key || !Number.isFinite(row.min) || !Number.isFinite(row.max) || row.max < row.min) {
      return null;
    }
    const next = rows[index + 1];
    bands.push({ key, min: row.min, max: row.max, from: row.min, to: next ? next.min : data.maxTotal });
  }
  return { bands, maxTotal: data.maxTotal };
}

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
