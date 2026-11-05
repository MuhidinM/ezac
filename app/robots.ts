import type { MetadataRoute } from "next";

// Read on each request so a SITE_URL set only on the server (not in the build
// environment) still reaches the sitemap line.
export const dynamic = "force-dynamic";

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

/** The staff portal, sign-in and the site's own API are not for search engines. */
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/bff"],
    },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
