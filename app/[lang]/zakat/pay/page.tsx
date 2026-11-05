import type { Metadata } from "next";
import {
  Building2Icon,
  DownloadIcon,
  QrCodeIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, FeatureGrid, Section, SectionHeading, StepList } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { CITIZEN_APP_DOWNLOAD_URL } from "@/lib/constants/app-download";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const PATH = "/zakat/pay";

/** Paired by position with giving.pay.channels.items. */
const CHANNEL_ICONS = [QrCodeIcon, Building2Icon, ShieldCheckIcon, ReceiptIcon];

export async function generateMetadata({ params }: PageProps<"/[lang]/zakat/pay">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  return pageMetadata({ locale, path: PATH, ...giving.pay.meta });
}

export default async function PayZakatPage({ params }: PageProps<"/[lang]/zakat/pay">) {
  const locale = localeFromParam((await params).lang);
  const { giving } = await getDictionary(locale);
  const t = giving.pay;
  const primary = { label: t.cta.primary, href: localizedPath(locale, "/zakat/calculator"), title: t.cta.primaryTitle };
  const secondary = {
    label: t.cta.secondary,
    href: localizedPath(locale, "/transparency/dashboard"),
    title: t.cta.secondaryTitle,
  };

  return (
    <>
      <SitePage eyebrow={t.hero.eyebrow} title={t.hero.title} accent={t.hero.accent} intro={t.hero.intro}>
        <Section>
          <SectionHeading eyebrow={t.channels.eyebrow} title={t.channels.title} intro={t.channels.intro} />
          <FeatureGrid
            items={t.channels.items.map((item, index) => ({ ...item, icon: CHANNEL_ICONS[index] }))}
            columns={2}
          />
        </Section>
        <Section muted>
          <SectionHeading eyebrow={t.steps.eyebrow} title={t.steps.title} intro={t.steps.intro} />
          <StepList steps={t.steps.items} />
        </Section>
        {/* The calculator's "Proceed to Pay Zakat" lands here: give people the app itself. */}
        <Section>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm sm:p-10">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
              <SmartphoneIcon className="h-6 w-6 text-brand" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-serif-display text-3xl tracking-[-1px] text-navy sm:text-4xl">{t.app.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-ink">{t.app.body}</p>
            </div>
            <a
              href={CITIZEN_APP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t.app.downloadTitle}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <DownloadIcon className="h-4 w-4" aria-hidden="true" />
              {t.app.download}
              <span className="sr-only">{t.app.downloadNote}</span>
            </a>
          </div>
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
