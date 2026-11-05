import type { MetadataRoute } from "next";

// Read SITE_URL on each request, like robots.ts.
export const dynamic = "force-dynamic";

/**
 * The public pages that exist in app/. Cause and story pages are left out:
 * listing them needs the gateway, and the list pages link to each of them.
 * Add a path here when a new public page is added.
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

/** The public origin (SITE_URL, e.g. https://ezac.gov.et), or null when unset or invalid. */
function siteOrigin(): string | null {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

/** Without SITE_URL there is no absolute address to give, so the sitemap is empty. */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  if (!origin) return [];
  return PUBLIC_PATHS.map((path) => ({ url: path === "/" ? origin : `${origin}${path}` }));
}
