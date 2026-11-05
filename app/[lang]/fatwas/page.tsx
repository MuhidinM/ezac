import type { Metadata } from "next";
import Link from "next/link";

import { readCalculatorConfig } from "@/components/landing/read-calculator-config";
import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FaqAccordion, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { INTL_LOCALE, type Locale, localizedPath } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { type Dictionary, getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { MIXED_IRRIGATION_RATE, RIKAZ_RATE, type CalculatorConfig } from "@/lib/zakat/calculator-config";
import { formatPercent, getCalculatorConfig } from "@/lib/zakat/impact";

export async function generateMetadata({ params }: PageProps<"/[lang]/fatwas">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).transparency.fatwas;
  return pageMetadata({ locale, path: "/fatwas", ...meta });
}

// The figures below come from the rules version the calculator applies, refreshed
// every 5 minutes, so this page can't contradict the calculator.
export const revalidate = 300;

/** The wealth rate used in the answers when today's rules can't be loaded. */
const FALLBACK_WEALTH_RATE = 0.025;

/**
 * Rule figures are read from the live config. When it can't be loaded (gateway
 * down, or during the build), the answers fall back to wording without figures
 * and point to How it works, rather than state a threshold the calculator may
 * not apply.
 */
function rulings(config: CalculatorConfig | null, t: Dictionary["transparency"]["fatwas"], locale: Locale) {
  const grams = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const pct = (rate: number) => formatPercent(rate, locale);
  const rate = pct(config ? config.wealth.rate : FALLBACK_WEALTH_RATE);
  const { assets, nisab, ushr, business, rikaz, debts } = t.rulings;
  return [
    { q: assets.q, a: assets.a },
    {
      q: nisab.q,
      a: config
        ? format(nisab.aLive, {
            goldGrams: grams.format(config.nisab.goldGrams),
            silverGrams: grams.format(config.nisab.silverGrams),
            basis: t.basis[config.nisab.basis],
            basisGrams: grams.format(config.nisab.basis === "gold" ? config.nisab.goldGrams : config.nisab.silverGrams),
          })
        : nisab.a,
    },
    {
      q: ushr.q,
      a: config
        ? format(ushr.aLive, {
            rainFed: pct(config.crops.rainFedRate),
            mixed: pct(MIXED_IRRIGATION_RATE),
            irrigated: pct(config.crops.irrigatedRate),
            nisabKg: grams.format(config.crops.nisabKg),
          })
        : ushr.a,
    },
    { q: business.q, a: format(business.a, { rate }) },
    { q: rikaz.q, a: format(rikaz.a, { rikazRate: pct(RIKAZ_RATE), rate }) },
    { q: debts.q, a: debts.a },
  ];
}

export default async function FatwasPage({ params }: PageProps<"/[lang]/fatwas">) {
  const locale = localeFromParam((await params).lang);
  const { transparency } = await getDictionary(locale);
  const t = transparency.fatwas;
  // null means no prices are published yet. The catch keeps this page up during
  // an outage too: its wording without figures is still correct, unlike an empty
  // figure on the other pages, so it may be cached for the 5-minute window.
  const config = readCalculatorConfig(await getCalculatorConfig().catch(() => null));

  return (
    <SitePage {...t.header}>
      <Section>
        <SectionHeading {...t.heading} />
        <FaqAccordion items={rulings(config, t, locale)} />
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted-ink">
          {config ? (
            config.configVersion > 0 ? (
              format(t.figuresLiveVersion, { version: config.configVersion })
            ) : (
              t.figuresLive
            )
          ) : (
            <>
              {t.figuresMissing.before}
              <Link
                href={localizedPath(locale, "/how-it-works")}
                title={t.figuresMissing.linkTitle}
                className="text-brand underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t.figuresMissing.link}
              </Link>
              {t.figuresMissing.after}
            </>
          )}
        </p>
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/zakat/calculator", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/about/shariah-board", title: t.cta.secondaryTitle }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: transparency.breadcrumbs.home, path: "/" },
          { name: transparency.breadcrumbs.fatwas, path: "/fatwas" },
        ])}
      />
    </SitePage>
  );
}
