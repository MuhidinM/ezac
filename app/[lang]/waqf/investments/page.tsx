import type { Metadata } from "next";
import { InfinityIcon, ShieldCheckIcon, SproutIcon, TrendingUpIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FeatureGrid, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const PATH = "/waqf/investments";

/** Paired by position with giving.waqf.investments.principles.items. */
const PRINCIPLE_ICONS = [InfinityIcon, ShieldCheckIcon, TrendingUpIcon, SproutIcon];

export async function generateMetadata({ params }: PageProps<"/[lang]/waqf/investments">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  return pageMetadata({ locale, path: PATH, ...giving.waqf.investments.meta });
}

export default async function WaqfInvestmentsPage({ params }: PageProps<"/[lang]/waqf/investments">) {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  const t = giving.waqf.investments;
  const primary = {
    label: t.cta.primary,
    href: localizedPath(locale, "/waqf/register-asset"),
    title: t.cta.primaryTitle,
  };
  const secondary = { label: t.cta.secondary, href: localizedPath(locale, "/contact"), title: t.cta.secondaryTitle };

  return (
    <>
      <SitePage eyebrow={t.hero.eyebrow} title={t.hero.title} accent={t.hero.accent} intro={t.hero.intro}>
        <Section>
          <SectionHeading eyebrow={t.principles.eyebrow} title={t.principles.title} intro={t.principles.intro} />
          <FeatureGrid
            items={t.principles.items.map((item, index) => ({ ...item, icon: PRINCIPLE_ICONS[index] }))}
            columns={2}
          />
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
