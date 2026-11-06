import type { MetadataRoute } from "next";

import { getDictionary } from "@/lib/i18n/server";
import { ORGANIZATION_NAME, SITE_NAME } from "@/lib/site";

/**
 * The web app manifest (/manifest.webmanifest): the name and icons a phone
 * shows when someone adds the site to the home screen. English, like the
 * site's plain URLs. Colours are the brand green (--color-brand in
 * app/globals.css) and white.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { common } = await getDictionary("en");
  return {
    name: ORGANIZATION_NAME,
    short_name: SITE_NAME,
    description: common.site.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#007050",
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "256x256", type: "image/x-icon" },
    ],
  };
}
