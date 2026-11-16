import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

// Only the locales from generateStaticParams: any other first segment is a 404
// that is never rendered or cached (bots probe thousands of paths).
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { home } = await getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/",
    title: home.meta.title,
    description: home.meta.description,
    keywords: home.meta.keywords,
    // The home title already names the site: no " — EZAC" suffix.
    absoluteTitle: true,
  });
}

export default async function Page({ params }: PageProps<"/[lang]">) {
  const locale = localeFromParam((await params).lang);
  const dict = await getDictionary(locale);
  return <LandingPage locale={locale} dict={dict} />;
}
