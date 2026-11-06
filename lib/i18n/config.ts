/**
 * Languages of the public site. English is the default and keeps the plain
 * URLs (/about); the others live under a prefix (/am/about, /om/about,
 * /ar/about). proxy.ts rewrites unprefixed URLs to /en internally and
 * redirects /en/... back to the plain URL, so each page has one address per
 * language. The staff portal (/dashboard, /login) is English only.
 */
export const LOCALES = ["en", "am", "om", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Set by the language switcher; proxy.ts honours it on unprefixed URLs. */
export const LOCALE_COOKIE = "ezac_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Each language's own name, as shown in the language switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afaan Oromoo",
  ar: "العربية",
};

/** Short label for the closed switcher button. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  am: "አማ",
  om: "OM",
  ar: "ع",
};

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Locale for Intl number and date formatting. Server and browser must format
 * identically or client components hit hydration mismatches, so each value was
 * checked in Node and Chromium. Arabic keeps Latin digits so amounts in birr
 * read the same as on bank statements and receipts. English uses Irish
 * English: en-GB writes compact numbers as "1.2K" in Node but "1.2k" in Chrome.
 *
 * Afaan Oromoo uses Kenyan English: Chrome, Edge and Android have no Intl data
 * for "om", so "om-ET" fell back to each browser's own language there (Arabic
 * digits, "2,5 %") and the page no longer matched the server's HTML. en-KE
 * formats identically in Node and Chromium (Latin digits, "245,140.5", "2.5%",
 * "1.2M", "5 Nov 2026, 18:04"), so dates on Oromo pages use English month
 * names. Not a language tag: use the Locale itself for lang or inLanguage.
 */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-IE",
  am: "am-ET",
  om: "en-KE",
  ar: "ar-u-nu-latn",
};

/** Open Graph locale codes (language_TERRITORY). */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  am: "am_ET",
  om: "om_ET",
  ar: "ar_AR",
};

/**
 * The URL of a public path in a language: "/about" -> "/about" (en),
 * "/am/about" (am). Query strings and hashes are kept. External URLs,
 * staff portal paths and files are returned unchanged.
 */
export function localizedPath(locale: Locale, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (isUnlocalizedPath(path)) return path;
  const { path: bare } = splitLocale(path);
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${locale}` : bare.startsWith("/?") || bare.startsWith("/#") ? `/${locale}${bare.slice(1)}` : `/${locale}${bare}`;
}

/**
 * Paths that are never localized: the staff portal, the BFF, Next internals
 * (/_next, /__nextjs dev tools), dot-folders like /.well-known, and files
 * (robots.txt, sitemap.xml, llms.txt, images, PDFs).
 */
export function isUnlocalizedPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  if (/^\/(dashboard|login|bff)(\/|$)/.test(pathname)) return true;
  if (/^\/(_|\.)/.test(pathname)) return true;
  const last = pathname.split("/").pop() ?? "";
  return last.includes(".");
}

/** "/am/about" -> { locale: "am", path: "/about" }; "/about" -> { locale: null, path: "/about" }. */
export function splitLocale(path: string): { locale: Locale | null; path: string } {
  const match = /^\/([^/?#]+)(.*)$/.exec(path);
  if (match && isLocale(match[1])) {
    const rest = match[2] || "/";
    return { locale: match[1], path: rest.startsWith("/") ? rest : `/${rest}` };
  }
  return { locale: null, path };
}
