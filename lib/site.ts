/**
 * Facts about the public site used in metadata, structured data, robots.txt,
 * sitemap.xml and llms.txt.
 */

const DEFAULT_SITE_URL = "https://ezaac.com";

/**
 * The public origin. SITE_URL overrides it (e.g. for a staging host); the
 * default is the production address. Read at build time for static pages.
 */
export function siteUrl(): URL {
  const raw = process.env.SITE_URL?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") return new URL(url.origin);
    } catch {
      // Fall through to the default.
    }
  }
  return new URL(DEFAULT_SITE_URL);
}

/** Absolute URL for a path on the public site. */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

export const SITE_NAME = "EZAC";

/**
 * The Commission's name as used across the site. The legal office still has
 * to confirm the exact legal name (docs/backend-go-live-requests.md, audit
 * finding seo-content-i18n-3); change it here only.
 */
export const ORGANIZATION_NAME = "Ethiopian Zakat and Awqaf Commission";

/** Default social preview image (1200x630), in public/. */
export const DEFAULT_OG_IMAGE = "/og/ezac-og.png";

export const LOGO_PATH = "/logo.svg";
