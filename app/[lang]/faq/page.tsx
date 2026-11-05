import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FaqAccordion, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).transparency.faq;
  return pageMetadata({ locale, path: "/faq", ...meta });
}

export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const locale = localeFromParam((await params).lang);
  const { transparency } = await getDictionary(locale);
  const t = transparency.faq;

  return (
    <SitePage {...t.header}>
      <Section>
        <SectionHeading {...t.heading} />
        <FaqAccordion items={t.items} />
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/contact", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/fatwas", title: t.cta.secondaryTitle }}
      />
      <JsonLd
        data={[
          faqJsonLd(t.items),
          breadcrumbJsonLd(locale, [
            { name: transparency.breadcrumbs.home, path: "/" },
            { name: transparency.breadcrumbs.faq, path: "/faq" },
          ]),
        ]}
      />
    </SitePage>
  );
}
