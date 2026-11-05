import type { Metadata } from "next";

import "../globals.css";

import { JsonLd } from "@/components/seo/json-ld";
import { fontVariables } from "@/lib/fonts";
import { LOCALES, localeDirection } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/client";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

/** One static copy of every public page per language. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { common } = await getDictionary(locale);
  const defaults = pageMetadata({
    locale,
    path: "/",
    title: common.site.defaultTitle,
    description: common.site.tagline,
    keywords: common.site.keywords,
    absoluteTitle: true,
  });
  // Each page sets its own canonical, hreflang and Open Graph URL (lib/seo.ts
  // pageMetadata). The layout's would point every page at the home page.
  const { alternates: _homeAlternates, openGraph, ...rest } = defaults;
  void _homeAlternates;
  const { url: _homeUrl, ...openGraphDefaults } = (openGraph ?? {}) as Record<string, unknown>;
  void _homeUrl;
  return {
    ...rest,
    openGraph: openGraphDefaults,
    // Relative canonical, Open Graph and image URLs resolve against the public origin.
    metadataBase: siteUrl(),
    applicationName: common.site.name,
    // Pages give a plain title ("About the Commission"); the template adds the site name.
    title: { default: common.site.defaultTitle, template: `%s — ${common.site.name}` },
  };
}

export default async function PublicRootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const locale = localeFromParam((await params).lang);
  const { common } = await getDictionary(locale);

  return (
    <html lang={locale} dir={localeDirection(locale)} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* First stop for keyboard users: jumps past the navigation to the page's <main id="main">. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#001539] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007050]"
        >
          {common.skipToContent}
        </a>
        <I18nProvider locale={locale} common={common}>
          {children}
        </I18nProvider>
        <JsonLd data={[organizationJsonLd(common.site.tagline), websiteJsonLd(locale, common.site.defaultTitle, common.site.tagline)]} />
      </body>
    </html>
  );
}
