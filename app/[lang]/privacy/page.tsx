import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { SitePage } from "@/components/site/site-page";
import { LegalProse, Section } from "@/components/site/sections";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).about.privacy;
  return pageMetadata({ locale, path: "/privacy", ...meta });
}

/** The policy text is a template awaiting legal review: its wording lives in the "about" dictionary, unchanged. */
export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const locale = localeFromParam((await params).lang);
  const dictionary = await getDictionary(locale);
  const t = dictionary.about.privacy;
  const crumbs = dictionary.about.breadcrumbs;

  return (
    <SitePage eyebrow={t.header.eyebrow} title={t.header.title} accent={t.header.accent} intro={t.header.intro}>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: crumbs.home, path: "/" },
          { name: crumbs.privacy, path: "/privacy" },
        ])}
      />
      <Section>
        <LegalProse sections={t.sections} />
      </Section>
    </SitePage>
  );
}
