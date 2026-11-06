import { describe, expect, it } from "vitest";

import {
  INTL_LOCALE,
  LOCALES,
  isLocale,
  isUnlocalizedPath,
  localeDirection,
  localizedPath,
  splitLocale,
} from "@/lib/i18n/config";

describe("isLocale", () => {
  it.each(["en", "am", "om", "ar"])("accepts %s", (value) => {
    expect(isLocale(value)).toBe(true);
  });

  it.each(["", "EN", "fr", "en-US", "amharic", "toString"])("rejects %j", (value) => {
    expect(isLocale(value)).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("localeDirection", () => {
  it("is right-to-left for Arabic only", () => {
    expect(LOCALES.filter((locale) => localeDirection(locale) === "rtl")).toEqual(["ar"]);
  });
});

describe("splitLocale", () => {
  it.each([
    ["/am/about", { locale: "am", path: "/about" }],
    ["/en/about/team", { locale: "en", path: "/about/team" }],
    ["/ar", { locale: "ar", path: "/" }],
    ["/om?x=1", { locale: "om", path: "/?x=1" }],
    ["/am#faq", { locale: "am", path: "/#faq" }],
    ["/about", { locale: null, path: "/about" }],
    ["/amharic/page", { locale: null, path: "/amharic/page" }],
    ["/", { locale: null, path: "/" }],
  ] as const)("%s", (input, expected) => {
    expect(splitLocale(input)).toEqual(expected);
  });
});

describe("isUnlocalizedPath", () => {
  it.each([
    "/dashboard",
    "/dashboard/households/42",
    "/login",
    "/login?next=/dashboard",
    "/bff/health",
    "/_next/static/chunk.js",
    "/__nextjs_original-stack-frame",
    "/.well-known/security.txt",
    "/robots.txt",
    "/sitemap.xml",
    "/og/ezac-og.png",
  ])("%s is never localized", (path) => {
    expect(isUnlocalizedPath(path)).toBe(true);
  });

  it.each(["/", "/about", "/dashboards", "/logins", "/about?v=1.2", "/about#v1.2", "/am/about"])(
    "%s is a public page",
    (path) => {
      expect(isUnlocalizedPath(path)).toBe(false);
    },
  );
});

describe("localizedPath", () => {
  it("keeps English URLs plain", () => {
    expect(localizedPath("en", "/about")).toBe("/about");
    expect(localizedPath("en", "/")).toBe("/");
  });

  it("prefixes the other languages", () => {
    expect(localizedPath("am", "/about")).toBe("/am/about");
    expect(localizedPath("om", "/about/team")).toBe("/om/about/team");
    expect(localizedPath("ar", "/")).toBe("/ar");
  });

  it("replaces a locale the path already has", () => {
    expect(localizedPath("ar", "/am/about")).toBe("/ar/about");
    expect(localizedPath("en", "/am/about")).toBe("/about");
    expect(localizedPath("en", "/am")).toBe("/");
  });

  it("keeps query strings and hashes, including on the home page", () => {
    expect(localizedPath("am", "/about?x=1#y")).toBe("/am/about?x=1#y");
    expect(localizedPath("am", "/?q=1")).toBe("/am?q=1");
    expect(localizedPath("om", "/#faq")).toBe("/om#faq");
    expect(localizedPath("om", "/am#top")).toBe("/om#top");
    expect(localizedPath("en", "/am?x=1")).toBe("/?x=1");
  });

  it.each(["https://ezaac.com/about", "//cdn.example/x", "mailto:info@example.org", "about", "#faq"])(
    "returns %s unchanged (not a site path)",
    (href) => {
      expect(localizedPath("am", href)).toBe(href);
    },
  );

  it.each(["/dashboard", "/login?next=/x", "/bff/health", "/robots.txt", "/_next/static/a.js"])(
    "returns %s unchanged (staff portal, BFF or file)",
    (path) => {
      expect(localizedPath("am", path)).toBe(path);
    },
  );

  it("only treats whole segments as the staff portal", () => {
    expect(localizedPath("am", "/dashboards")).toBe("/am/dashboards");
  });
});

describe("INTL_LOCALE", () => {
  // Amounts in birr must read the same as on receipts in every language, so
  // none of the formatting locales may switch to Arabic-Indic or Ethiopic digits.
  it.each(LOCALES)("%s formats numbers with Latin digits", (locale) => {
    const formatted = new Intl.NumberFormat(INTL_LOCALE[locale]).format(1234567.5);
    expect(formatted).toMatch(/^[0-9.,\s  ٫٬']+$/);
    expect(formatted.replace(/[^0-9]/g, "")).toBe("12345675");
  });
});
