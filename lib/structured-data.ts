import { INTL_LOCALE, type Locale, localizedPath } from "@/lib/i18n/config";
import { LOGO_PATH, ORGANIZATION_NAME, SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * schema.org objects for JSON-LD. Only facts the site already states are
 * included: no phone numbers or addresses until the Commission confirms them
 * (the contact page still shows placeholders).
 */

export function organizationJsonLd(description: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "@id": absoluteUrl("/#organization"),
    name: ORGANIZATION_NAME,
    alternateName: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl(LOGO_PATH),
    description,
    areaServed: { "@type": "Country", name: "Ethiopia" },
  };
}

export function websiteJsonLd(locale: Locale, name: string, description: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name,
    url: absoluteUrl(localizedPath(locale, "/")),
    description,
    inLanguage: INTL_LOCALE[locale].split("-")[0],
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

export function faqJsonLd(items: readonly { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(locale: Locale, crumbs: readonly { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(localizedPath(locale, crumb.path)),
    })),
  };
}

export function articleJsonLd(input: {
  locale: Locale;
  path: string;
  headline: string;
  description: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(localizedPath(input.locale, input.path)),
    inLanguage: INTL_LOCALE[input.locale].split("-")[0],
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified || input.datePublished ? { dateModified: input.dateModified ?? input.datePublished } : {}),
    author: { "@id": absoluteUrl("/#organization") },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}
