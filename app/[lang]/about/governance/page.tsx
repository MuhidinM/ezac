import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3Icon, LandmarkIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { SitePage } from "@/components/site/site-page";
import { CtaBand, FeatureGrid, Section, SectionHeading } from "@/components/site/sections";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/about/governance">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).about.governance;
  return pageMetadata({ locale, path: "/about/governance", ...meta });
}

/** Icons for the structure cards, in the dictionary's order. */
const PILLAR_ICONS: LucideIcon[] = [LandmarkIcon, UsersIcon, ShieldCheckIcon, BarChart3Icon];

export default async function GovernancePage({ params }: PageProps<"/[lang]/about/governance">) {
  const locale = localeFromParam((await params).lang);
  const dictionary = await getDictionary(locale);
  const t = dictionary.about.governance;
  const crumbs = dictionary.about.breadcrumbs;

  const pillars = t.structure.items.map((item, index) => ({ ...item, icon: PILLAR_ICONS[index] }));

  return (
    <SitePage eyebrow={t.header.eyebrow} title={t.header.title} accent={t.header.accent} intro={t.header.intro}>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: crumbs.home, path: "/" },
          { name: crumbs.about, path: "/about" },
          { name: crumbs.governance, path: "/about/governance" },
        ])}
      />
      <Section>
        <SectionHeading eyebrow={t.structure.eyebrow} title={t.structure.title} intro={t.structure.intro} />
        <FeatureGrid items={pillars} columns={2} />
      </Section>
      <Section muted>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif-display text-2xl tracking-[-0.5px] text-navy sm:text-3xl">{t.mandate.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-ink">{t.mandate.body}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-ink">
            {t.mandate.source.before}
            <Link
              href={localizedPath(locale, "/about#zakat-commission-regulation")}
              title={t.mandate.sourceTitle}
              className="text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {t.mandate.source.link}
            </Link>
            {t.mandate.source.after}
          </p>
        </div>
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/about/shariah-board", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/about#documents", title: t.cta.secondaryTitle }}
      />
    </SitePage>
  );
}
