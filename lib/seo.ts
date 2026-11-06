import type { Metadata } from "next";

import { LOCALES, type Locale, OG_LOCALE, localizedPath } from "@/lib/i18n/config";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/site";

type PageMetadataInput = {
  locale: Locale;
  /** The page's English path, e.g. "/about" or "/causes/12". */
  path: string;
  title: string;
  description: string;
  /** Comma-separated; appended to the site keywords. */
  keywords?: string;
  /** A path or absolute URL for the social preview image (1200x630 is best). */
  image?: string | null;
  imageAlt?: string;
  /** "article" for stories and reports; "website" otherwise. */
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /** Use for the 404 and error pages. */
  noIndex?: boolean;
  /** Set when the title is already complete (the home page): skips the " — EZAC" template. */
  absoluteTitle?: boolean;
};

/** hreflang links for every language, plus x-default (English). */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) languages[locale] = localizedPath(locale, path);
  languages["x-default"] = localizedPath("en", path);
  return languages;
}

/**
 * Metadata for a public page: title, description, keywords, a canonical URL,
 * hreflang alternates, Open Graph and Twitter card. Relative URLs resolve
 * against metadataBase (lib/site.ts siteUrl), set in app/[lang]/layout.tsx.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  keywords,
  image,
  imageAlt,
  type = "website",
  publishedTime,
  modifiedTime,
  noIndex,
  absoluteTitle,
}: PageMetadataInput): Metadata {
  const url = localizedPath(locale, path);
  // Only the default image has known dimensions; uploaded cause and story images vary.
  const images = [image ? { url: image, alt: imageAlt ?? title } : { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: imageAlt ?? title }];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((other) => other !== locale).map((other) => OG_LOCALE[other]),
      images,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((entry) => entry.url),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
