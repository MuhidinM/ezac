import type { Metadata } from "next";
import { Building2Icon, CoinsIcon, LeafIcon, TrendingUpIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FeatureGrid, Section, SectionHeading, StepList } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const PATH = "/waqf/register-asset";

/** Paired by position with giving.waqf.registerAsset.assets.items. */
const ASSET_ICONS = [Building2Icon, CoinsIcon, TrendingUpIcon, LeafIcon];

export async function generateMetadata({ params }: PageProps<"/[lang]/waqf/register-asset">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  return pageMetadata({ locale, path: PATH, ...giving.waqf.registerAsset.meta });
}

export default async function RegisterWaqfAssetPage({ params }: PageProps<"/[lang]/waqf/register-asset">) {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  const t = giving.waqf.registerAsset;
  const primary = { label: t.cta.primary, href: localizedPath(locale, "/contact"), title: t.cta.primaryTitle };
  const secondary = {
    label: t.cta.secondary,
    href: localizedPath(locale, "/waqf/investments"),
    title: t.cta.secondaryTitle,
  };

  return (
    <>
      <SitePage eyebrow={t.hero.eyebrow} title={t.hero.title} accent={t.hero.accent} intro={t.hero.intro}>
        <Section>
          <SectionHeading eyebrow={t.assets.eyebrow} title={t.assets.title} intro={t.assets.intro} />
          <FeatureGrid
            items={t.assets.items.map((item, index) => ({ ...item, icon: ASSET_ICONS[index] }))}
            columns={2}
          />
        </Section>
        <Section muted>
          <SectionHeading eyebrow={t.process.eyebrow} title={t.process.title} />
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
