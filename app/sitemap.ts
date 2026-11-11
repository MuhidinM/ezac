import type { MetadataRoute } from "next";

import { errorFields, logEvent } from "@/lib/api/log";
import { LOCALES, localizedPath } from "@/lib/i18n/config";
import { getCauses, getStories } from "@/lib/zakat/impact";
import { absoluteUrl } from "@/lib/site";

// Causes and stories come from zakat-engine; their getters refresh every 5
// minutes, or at once when an admin saves (lib/zakat/public-cache.ts).
export const revalidate = 300;

/**
 * The public pages in app/[lang], by English path. Cause and story pages
 * (app/[lang]/causes/[id], app/[lang]/transparency/stories/[id]) are added
 * from the gateway below. Add a path here when a new public page is added.
 */
const PUBLIC_PATHS = [
  "/",
  "/about",
  "/about/governance",
  "/about/shariah-board",
  "/how-it-works",
  "/zakat/calculator",
  "/zakat/pay",
  "/zakat/corporate",
  "/donate",
  "/causes",
  "/waqf/crowdfunding",
  "/waqf/investments",
  "/waqf/register-asset",
  "/transparency/dashboard",
  "/transparency/reports",
  "/transparency/stories",
  "/fatwas",
  "/faq",
  "/contact",
  "/privacy",
];

/** Page size for the gateway lists, and how many pages to read at most. */
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

type Entry = { path: string; lastModified?: string };

/**
 * One sitemap entry per language for a page, each listing all four languages
 * and x-default (English) as alternates, as Google asks for hreflang sitemaps.
 */
function localizedEntries({ path, lastModified }: Entry): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) languages[locale] = absoluteUrl(localizedPath(locale, path));
  languages["x-default"] = absoluteUrl(localizedPath("en", path));

  return LOCALES.map((locale) => ({
    url: absoluteUrl(localizedPath(locale, path)),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

/** A date the sitemap can use, or undefined for a missing or malformed one. */
function validDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

/** Open and closed causes; both have a public page. */
async function causeEntries(): Promise<Entry[]> {
  const entries = new Map<string, Entry>();
  for (const status of ["active", "closed"] as const) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const result = await getCauses({ status, page, limit: PAGE_SIZE });
      if (!result) break;
      for (const cause of result.items) {
        entries.set(cause.id, {
          path: `/causes/${encodeURIComponent(cause.id)}`,
          lastModified: validDate(cause.updatedAt ?? cause.closedAt ?? cause.publishedAt),
        });
      }
      if (page >= (result.pagination?.totalPages ?? 1)) break;
    }
  }
  return [...entries.values()];
}

/** Published impact stories. */
async function storyEntries(): Promise<Entry[]> {
  const entries: Entry[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await getStories(page, PAGE_SIZE);
    if (!result) break;
    for (const story of result.items) {
      entries.push({
        path: `/transparency/stories/${encodeURIComponent(story.id)}`,
        lastModified: validDate(story.updatedAt ?? story.publishedAt),
      });
    }
    if (page >= (result.pagination?.totalPages ?? 1)) break;
  }
  return entries;
}

/**
 * The gateway may be down (or absent during `next build`, where the getters
 * return null). The static pages are listed either way; the cause and story
 * pages come back on the next refresh.
 */
async function fromGateway(label: string, load: () => Promise<Entry[]>): Promise<Entry[]> {
  try {
    return await load();
  } catch (error) {
    logEvent("warn", "sitemap_partial", { label, ...errorFields(error) });
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [causes, stories] = await Promise.all([fromGateway("causes", causeEntries), fromGateway("stories", storyEntries)]);
  return [...PUBLIC_PATHS.map((path) => ({ path })), ...causes, ...stories].flatMap(localizedEntries);
}
