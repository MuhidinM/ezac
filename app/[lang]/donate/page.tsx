import type { Metadata } from "next";
import { CoinsIcon, HeartHandshakeIcon, InfinityIcon, MoonIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FeatureGrid, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const PATH = "/donate";

/** Paired by position with giving.donate.ways.items. */
const WAY_ICONS = [CoinsIcon, HeartHandshakeIcon, MoonIcon, InfinityIcon];

export async function generateMetadata({ params }: PageProps<"/[lang]/donate">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  return pageMetadata({ locale, path: PATH, ...giving.donate.meta });
}

export default async function DonatePage({ params }: PageProps<"/[lang]/donate">) {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  const t = giving.donate;
  const primary = { label: t.cta.primary, href: localizedPath(locale, "/zakat/calculator"), title: t.cta.primaryTitle };
  const secondary = { label: t.cta.secondary, href: localizedPath(locale, "/causes"), title: t.cta.secondaryTitle };

  return (
    <>
      <SitePage eyebrow={t.hero.eyebrow} title={t.hero.title} accent={t.hero.accent} intro={t.hero.intro}>
        <Section>
          <SectionHeading eyebrow={t.ways.eyebrow} title={t.ways.title} intro={t.ways.intro} />
          <FeatureGrid items={t.ways.items.map((item, index) => ({ ...item, icon: WAY_ICONS[index] }))} columns={2} />
        </Section>
        <CtaBand title={t.cta.title} body={t.cta.body} primary={primary} secondary={secondary} />
      </SitePage>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: giving.breadcrumbs.home, path: "/" },
          { name: t.breadcrumb, path: PATH },
        ])}
      />
    </>
  );
}
