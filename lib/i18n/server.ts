import "server-only";

import { notFound } from "next/navigation";

import { type Locale, isLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/lib/i18n/dictionaries/en").then((module) => module.default),
  am: () => import("@/lib/i18n/dictionaries/am").then((module) => module.default),
  om: () => import("@/lib/i18n/dictionaries/om").then((module) => module.default),
  ar: () => import("@/lib/i18n/dictionaries/ar").then((module) => module.default),
};

/** The dictionary for a language. Server only: pages pass slices to client components. */
export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}

/**
 * The `lang` route param as a Locale, or a 404 for anything else. Every page
 * under app/[lang] calls this first.
 */
export function localeFromParam(lang: string): Locale {
  if (!isLocale(lang)) notFound();
  return lang;
}

export type { Dictionary };
