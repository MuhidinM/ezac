import type { Metadata } from "next";
import { BadgeCheckIcon, BookOpenIcon, ScaleIcon, UsersIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { SitePage } from "@/components/site/site-page";
import { CtaBand, FeatureGrid, Section, SectionHeading, StepList } from "@/components/site/sections";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/about/shariah-board">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).about.shariahBoard;
  return pageMetadata({ locale, path: "/about/shariah-board", ...meta });
}

/** Icons for the mandate cards, in the dictionary's order. */
const MANDATE_ICONS: LucideIcon[] = [BookOpenIcon, BadgeCheckIcon, ScaleIcon, UsersIcon];

export default async function ShariahBoardPage({ params }: PageProps<"/[lang]/about/shariah-board">) {
  const locale = localeFromParam((await params).lang);
  const dictionary = await getDictionary(locale);
  const t = dictionary.about.shariahBoard;
  const crumbs = dictionary.about.breadcrumbs;

  const mandate = t.mandate.items.map((item, index) => ({ ...item, icon: MANDATE_ICONS[index] }));

  return (
    <SitePage eyebrow={t.header.eyebrow} title={t.header.title} accent={t.header.accent} intro={t.header.intro}>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: crumbs.home, path: "/" },
          { name: crumbs.about, path: "/about" },
          { name: crumbs.shariahBoard, path: "/about/shariah-board" },
        ])}
      />
      <Section>
        <SectionHeading eyebrow={t.mandate.eyebrow} title={t.mandate.title} />
        <FeatureGrid items={mandate} columns={2} />
      </Section>
      <Section muted>
        <SectionHeading eyebrow={t.process.eyebrow} title={t.process.title} />
        <StepList steps={t.process.steps} />
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/fatwas", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/about/governance", title: t.cta.secondaryTitle }}
      />
    </SitePage>
  );
}
