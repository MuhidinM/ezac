import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { ZakatCalculator } from "@/components/landing/zakat-calculator";
import { JsonLd } from "@/components/seo/json-ld";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const PATH = "/zakat/calculator";

export async function generateMetadata({ params }: PageProps<"/[lang]/zakat/calculator">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { calculator } = await getDictionary(locale);
  return pageMetadata({ locale, path: PATH, ...calculator.meta });
}

const LINK_CLASS =
  "group inline-flex items-center gap-2 rounded-sm text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

export default async function ZakatCalculatorPage({ params }: PageProps<"/[lang]/zakat/calculator">) {
  const locale = localeFromParam((await params).lang);
  const t = await getDictionary(locale);
  const { page } = t.calculator;
  const { guide } = page;

  return (
    <SitePage eyebrow={page.eyebrow} title={page.title} accent={page.accent} intro={page.intro}>
      <ZakatCalculator t={t.calculator} />

      {/* The rules in brief: a direct answer for readers (and search and AI engines) before the details. */}
      <section aria-labelledby="calculator-guide-title" className="w-full bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8 sm:py-20">
          <p className="text-xs uppercase tracking-[0.18em] text-brand rtl:tracking-normal">{guide.eyebrow}</p>
          <h2
            id="calculator-guide-title"
            className="font-serif-display mt-3 text-3xl tracking-[-1px] text-navy sm:text-4xl rtl:tracking-normal"
          >
            {guide.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600">{guide.answer}</p>

          <div className="mt-10 space-y-8">
            {guide.items.map((item) => (
              <div key={item.question}>
                <h3 className="text-base font-medium text-navy">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-8">
            <Link href={localizedPath(locale, "/how-it-works")} title={guide.rulesLinkTitle} className={LINK_CLASS}>
              {guide.rulesLink}
              <ArrowRightIcon
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link href={localizedPath(locale, "/fatwas")} title={guide.fatwasLinkTitle} className={LINK_CLASS}>
              {guide.fatwasLink}
              <ArrowRightIcon
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: page.breadcrumbHome, path: "/" },
          { name: page.breadcrumbCurrent, path: PATH },
        ])}
      />
    </SitePage>
  );
}
