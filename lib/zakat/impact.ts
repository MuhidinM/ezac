import { cache } from "react";

import { getApiBaseUrl } from "@/lib/api/config";
import { logGatewayUnreachable } from "@/lib/api/network-error";
import type { CalculatorConfig } from "@/lib/zakat/calculator-config";
import type { PublicCause, PublicStory } from "@/lib/zakat/content";

/**
 * Public impact and transparency data from zakat-engine (no login), fetched on
 * the server and revalidated every 5 minutes.
 *
 * Every getter returns null only when there is nothing published: the service
 * answered 404 (or sent no data). When the service can't be reached, times out
 * or fails, the getter throws instead, so a page never tells the public that
 * nothing was published, or that a real cause doesn't exist, during an outage.
 * On a revalidation Next then keeps serving the last good page; a page with no
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

/** zakat-engine could not answer: unreachable, too slow, or an error status. */
export class PublicDataUnavailableError extends Error {
  constructor(path: string, cause: unknown) {
    super(`Public zakat data is unavailable (${path})`, { cause });
    this.name = "PublicDataUnavailableError";
  }
}

function unavailable(path: string, cause: unknown): null {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  throw new PublicDataUnavailableError(path, cause);
}

/**
 * One request per path per render. The timeout signal opts the fetch out of
 * Next's own request memoization, and the cause and story pages load the same
 * record in generateMetadata and in the page.
 */
const loadPublic = cache(async (path: string, emptyOn503 = false): Promise<unknown> => {
  const label = `zakat${path}`;
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/zakat/v1${path}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logGatewayUnreachable(label, error);
    return unavailable(path, error);
  }

  // Never published, or taken down. A 400 is a malformed id in the URL.
  if (response.status === 404 || response.status === 410 || response.status === 400) return null;
  // zakat-engine's own "no data yet" answer. An nginx or gateway 503 (HTML, or
  // JSON without success: false) is still an outage.
  if (response.status === 503 && emptyOn503) {
    const body = (await response.json().catch(() => null)) as { success?: unknown } | null;
    if (body && typeof body === "object" && body.success === false) return null;
  }
  if (!response.ok) {
    console.error(`[${label}] the gateway answered HTTP ${response.status}`);
    return unavailable(path, new Error(`HTTP ${response.status}`));
  }

  let envelope: { success?: boolean; data?: unknown; message?: string };
  try {
    envelope = await response.json();
  } catch (error) {
    console.error(`[${label}] the gateway answered with a body that isn't JSON`);
    return unavailable(path, error);
  }
  if (!envelope.success) {
    console.error(`[${label}] the gateway reported a failure`, envelope.message ?? "");
    return unavailable(path, new Error(envelope.message ?? "success: false"));
  }
  return envelope.data ?? null;
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

// Each getter: the data, or null when it isn't published. Throws when
// zakat-engine is unavailable at runtime (see PublicDataUnavailableError).
export const getHomeSummary = () => getPublic<HomeSummary>("/home/summary");
export const getImpactSummary = () => getPublic<ImpactSummary>("/impact/summary");
export const getImpactRegions = () => getPublic<ImpactRegion[]>("/impact/regions");
export const getImpactTimeseries = () => getPublic<ImpactTimeseries>("/impact/timeseries", true);
export const getCalculatorConfig = () => getPublic<CalculatorConfig>("/calculator/config", true);
/** Published reports (null: none published); tolerates both a plain array and a paginated page. */
export async function getImpactReports(page = 1, limit = 50): Promise<ImpactReport[] | null> {
  const data = await getPublic<ImpactReport[] | { items: ImpactReport[] }>(`/impact/reports?page=${page}&limit=${limit}`);
  if (!data) return null;
  return Array.isArray(data) ? data : data.items;
}

type Page<T> = { items: T[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };

/**
 * Public causes (null: none published). The permanent general fund (id
 * "general") is left out of campaign lists.
 */
export async function getCauses(query: { status?: "active" | "closed"; urgent?: boolean; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams({
    status: query.status ?? "active",
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 24),
  });
  if (query.urgent) params.set("urgent", "true");
  const data = await getPublic<Page<PublicCause>>(`/causes?${params}`);
  if (!data) return null;
  return { ...data, items: data.items.filter((cause) => cause.id !== "general") };
}

/** One cause; null means it doesn't exist or isn't public (a real 404). */
export const getCause = (id: string) => getPublic<PublicCause>(`/causes/${encodeURIComponent(id)}`);

export const getStories = (page = 1, limit = 24) =>
  getPublic<Page<PublicStory>>(`/impact/stories?page=${page}&limit=${limit}`);

/** One story; null means it doesn't exist or isn't public (a real 404). */
export const getStory = (id: string) => getPublic<PublicStory>(`/impact/stories/${encodeURIComponent(id)}`);

const etb = new Intl.NumberFormat("en-ET", { notation: "compact", maximumFractionDigits: 1 });
const count = new Intl.NumberFormat("en-ET");

/** "ETB 1.8M", or null when the figure isn't published yet. */
export function formatEtbCompact(value: number | null | undefined) {
  return value === null || value === undefined ? null : `ETB ${etb.format(value)}`;
}

export function formatCount(value: number | null | undefined) {
  return value === null || value === undefined ? null : count.format(value);
}
