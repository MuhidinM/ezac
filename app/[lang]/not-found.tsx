import type { Metadata } from "next";

import { NotFoundView } from "@/components/site/not-found-view";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Next passes the segment's params to a not-found file's generateMetadata
 * (not to the component), so the title can be in the page's language. Next
 * adds `noindex` to 404 responses on its own; this says it for the streamed
 * case too.
 */
export async function generateMetadata({ params }: { params?: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = (await params)?.lang;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const { common } = await getDictionary(locale);
  return {
    title: common.errors.notFound.metaTitle,
    robots: { index: false, follow: true },
  };
}

/** 404 for unknown URLs and for causes or stories that don't exist (or were taken down). */
export default function NotFound() {
  return <NotFoundView />;
}
