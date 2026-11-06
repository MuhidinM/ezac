import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, HandCoinsIcon, InfinityIcon, UsersIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FeatureGrid, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const PATH = "/waqf/crowdfunding";

// No projects are published yet. When they are, list real records from the
// zakat service here; never stand-in campaigns, figures or certification tags.

/** Paired by position with giving.waqf.crowdfunding.howItWorks.items. */
const HOW_IT_WORKS_ICONS = [UsersIcon, InfinityIcon, HandCoinsIcon];

export async function generateMetadata({ params }: PageProps<"/[lang]/waqf/crowdfunding">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  return pageMetadata({ locale, path: PATH, ...giving.waqf.crowdfunding.meta });
}

export default async function WaqfCrowdfundingPage({ params }: PageProps<"/[lang]/waqf/crowdfunding">) {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  const t = giving.waqf.crowdfunding;
  const nextSteps = [
    { href: localizedPath(locale, "/causes"), ...t.projects.causes },
    { href: localizedPath(locale, "/contact"), ...t.projects.contact },
  ];
  const primary = {
    label: t.cta.primary,
    href: localizedPath(locale, "/waqf/register-asset"),
    title: t.cta.primaryTitle,
  };
  const secondary = {
    label: t.cta.secondary,
    href: localizedPath(locale, "/waqf/investments"),
    title: t.cta.secondaryTitle,
  };

  return (
    <>
      <SitePage eyebrow={t.hero.eyebrow} title={t.hero.title} accent={t.hero.accent} intro={t.hero.intro}>
        <Section>
          <SectionHeading eyebrow={t.projects.eyebrow} title={t.projects.title} intro={t.projects.intro} />
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            {nextSteps.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                title={step.linkTitle}
                className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <span className="flex items-center justify-between gap-3 font-medium text-navy">
                  {step.title}
                  <ArrowRightIcon
                    className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-muted-ink">{step.body}</span>
              </Link>
            ))}
          </div>
        </Section>
        <Section muted>
          <SectionHeading eyebrow={t.howItWorks.eyebrow} title={t.howItWorks.title} intro={t.howItWorks.intro} />
          <FeatureGrid items={t.howItWorks.items.map((item, index) => ({ ...item, icon: HOW_IT_WORKS_ICONS[index] }))} />
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
