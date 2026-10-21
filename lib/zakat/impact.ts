import { getApiBaseUrl } from "@/lib/api/config";
import { logGatewayUnreachable } from "@/lib/api/network-error";
import type { CalculatorConfig } from "@/lib/zakat/calculator-config";
import type { PublicCause, PublicStory } from "@/lib/zakat/content";

/**
 * Public impact and transparency data from zakat-engine (no login).
 * Fetched on the server and revalidated every 5 minutes; any failure
 * resolves to null so public pages still render.
 */

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

async function getPublic<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/zakat/v1${path}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const envelope = (await response.json()) as { success?: boolean; data?: T };
    return envelope.success ? (envelope.data ?? null) : null;
  } catch (error) {
    logGatewayUnreachable(`zakat${path}`, error);
    return null;
  }
}

export const getHomeSummary = () => getPublic<HomeSummary>("/home/summary");
export const getImpactSummary = () => getPublic<ImpactSummary>("/impact/summary");
export const getImpactRegions = () => getPublic<ImpactRegion[]>("/impact/regions");
export const getImpactTimeseries = () => getPublic<ImpactTimeseries>("/impact/timeseries");
export const getCalculatorConfig = () => getPublic<CalculatorConfig>("/calculator/config");
/** Published reports; tolerates both a plain array and a paginated page. */
export async function getImpactReports(page = 1, limit = 50): Promise<ImpactReport[] | null> {
  const data = await getPublic<ImpactReport[] | { items: ImpactReport[] }>(`/impact/reports?page=${page}&limit=${limit}`);
  if (!data) return null;
  return Array.isArray(data) ? data : data.items;
}

type Page<T> = { items: T[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };

/** Public causes. The permanent general fund (id "general") is left out of campaign lists. */
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

export const getCause = (id: string) => getPublic<PublicCause>(`/causes/${encodeURIComponent(id)}`);

export const getStories = (page = 1, limit = 24) =>
  getPublic<Page<PublicStory>>(`/impact/stories?page=${page}&limit=${limit}`);

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
