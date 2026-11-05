import type { Metadata } from "next";
import { BadgeCheckIcon, BarChart3Icon, ScaleIcon, UsersIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FeatureGrid, Section, SectionHeading, StepList } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const PATH = "/zakat/corporate";

/** Paired by position with giving.corporate.features.items. */
const FEATURE_ICONS = [ScaleIcon, UsersIcon, BarChart3Icon, BadgeCheckIcon];

export async function generateMetadata({ params }: PageProps<"/[lang]/zakat/corporate">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  return pageMetadata({ locale, path: PATH, ...giving.corporate.meta });
}

export default async function CorporateZakatPage({ params }: PageProps<"/[lang]/zakat/corporate">) {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  const t = giving.corporate;
  const primary = { label: t.cta.primary, href: localizedPath(locale, "/contact"), title: t.cta.primaryTitle };
  const secondary = {
    label: t.cta.secondary,
    href: localizedPath(locale, "/zakat/calculator"),
    title: t.cta.secondaryTitle,
  };

  return (
    <>
      <SitePage eyebrow={t.hero.eyebrow} title={t.hero.title} accent={t.hero.accent} intro={t.hero.intro}>
        <Section>
          <SectionHeading eyebrow={t.features.eyebrow} title={t.features.title} intro={t.features.intro} />
          <FeatureGrid
            items={t.features.items.map((item, index) => ({ ...item, icon: FEATURE_ICONS[index] }))}
            columns={2}
          />
        </Section>
        <Section muted>
          <SectionHeading eyebrow={t.process.eyebrow} title={t.process.title} intro={t.process.intro} />
          <StepList steps={t.process.items} />
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
