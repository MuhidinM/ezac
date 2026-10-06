import { getApiBaseUrl } from "@/lib/api/config";
import type { CalculatorConfig } from "@/lib/zakat/calculator-config";

/**
 * Public impact and transparency data from zakat-engine (no login).
 * Fetched on the server and revalidated every 5 minutes; any failure
 * resolves to null so public pages still render.
 */

export type HomeSummary = {
  totalCollectedEtb: number | null;
  totalBeneficiariesSupported: number | null;
  asOf: string | null;
};

export type ImpactSummary = {
  scope: string;
  regionCode: string | null;
  regionName: string;
  distributedFundsEtb: number | null;
  livesTouched: number | null;
  activeProjects: number | null;
  beneficiariesByAsnaf: { asnaf?: string; key?: string; count?: number; beneficiaries?: number }[];
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
  } catch {
    return null;
  }
}

export const getHomeSummary = () => getPublic<HomeSummary>("/home/summary");
export const getImpactSummary = () => getPublic<ImpactSummary>("/impact/summary");
export const getImpactRegions = () => getPublic<ImpactRegion[]>("/impact/regions");
export const getImpactTimeseries = () => getPublic<ImpactTimeseries>("/impact/timeseries");
export const getCalculatorConfig = () => getPublic<CalculatorConfig>("/calculator/config");
export const getImpactReports = (page = 1, limit = 50) =>
  getPublic<{ items: ImpactReport[]; pagination: { totalItems: number } }>(
    `/impact/reports?page=${page}&limit=${limit}`,
  );

const etb = new Intl.NumberFormat("en-ET", { notation: "compact", maximumFractionDigits: 1 });
const count = new Intl.NumberFormat("en-ET");

/** "ETB 1.8M", or null when the figure isn't published yet. */
export function formatEtbCompact(value: number | null | undefined) {
  return value === null || value === undefined ? null : `ETB ${etb.format(value)}`;
}

export function formatCount(value: number | null | undefined) {
  return value === null || value === undefined ? null : count.format(value);
}
