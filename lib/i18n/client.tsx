"use client";

import { type ComponentProps, createContext, useContext, useMemo } from "react";
import NextLink from "next/link";

import { INTL_LOCALE, type Locale, localeDirection, localizedPath } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type I18nValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  /** Shared strings (navigation, footer, errors). Page-specific strings come as props. */
  common: Dictionary["common"];
  /** The URL of a public path in the current language. */
  href: (path: string) => string;
  /** Intl locale for numbers and dates in the current language. */
  intlLocale: string;
  /**
   * The year the server rendered the page in, for the footer. Static pages are
   * rendered at build time, so a year computed in the browser would differ
   * from the server HTML after New Year and break hydration.
   */
  year: number;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  common,
  year,
  children,
}: {
  locale: Locale;
  common: Dictionary["common"];
  year: number;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir: localeDirection(locale),
      common,
      href: (path: string) => localizedPath(locale, path),
      intlLocale: INTL_LOCALE[locale],
      year,
    }),
    [locale, common, year],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The current language and shared strings. Only inside the public site (app/[lang]). */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n() must be used inside <I18nProvider> (app/[lang]/layout.tsx).");
  return value;
}

/**
 * next/link that keeps the visitor in their language: href="/about" becomes
 * "/am/about" on the Amharic site. Staff portal paths, files and external
 * URLs pass through unchanged.
 */
export function LocalizedLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n();
  const target = typeof href === "string" ? localizedPath(locale, href) : href;
  return <NextLink href={target} {...props} />;
}
