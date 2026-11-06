import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

// Read on each request so a SITE_URL set only on the server (not in the build
// environment) still reaches the sitemap line. Without SITE_URL, lib/site.ts
// falls back to the production address.
export const dynamic = "force-dynamic";

/**
 * Every public page in every language is open to crawlers. The staff portal,
 * sign-in and the site's own API are not for search engines, except the
 * public photos under /bff/media/: cause and story pages use them as their
 * share images, and X and LinkedIn show no picture for a blocked image URL.
 * Crawlers pick the longest matching rule, so /bff/media/ wins over /bff.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/bff/media/"],
      disallow: ["/dashboard", "/login", "/bff"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
