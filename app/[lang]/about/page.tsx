import type { Metadata } from "next";
import {
  BookOpenIcon,
  BuildingIcon,
  DownloadIcon,
  GlobeIcon,
  HandCoinsIcon,
  LandmarkIcon,
  LineChartIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { DocumentGallery, type LegalDocument } from "@/components/site/document-gallery";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { type Dictionary, getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).about.about;
  return pageMetadata({ locale, path: "/about", ...meta });
}

/** The full set of scans, as one file. */
const LEGAL_PDF = "/legal/ezac-legal-documents.pdf";

/** Card anchors in the documents section; "Source:" links jump to them. */
const DOC_IDS = {
  certificate: "certificate-of-establishment",
  taxpayer: "taxpayer-registration-certificate",
  proclamation: "proclamation-1207-2020",
  regulation: "zakat-commission-regulation",
} as const;

/** The scans in public/legal, in display order, with their pixel sizes. */
const SCANS: { key: keyof typeof DOC_IDS; src: string; width: number; height: number; landscape?: boolean }[] = [
  { key: "certificate", src: "/legal/certificate-of-establishment.jpg", width: 1346, height: 952, landscape: true },
  { key: "taxpayer", src: "/legal/taxpayer-registration-certificate.jpg", width: 1268, height: 980, landscape: true },
  { key: "proclamation", src: "/legal/proclamation-1207-2020.jpg", width: 980, height: 1268 },
  { key: "regulation", src: "/legal/zakat-commission-regulation-cover.jpg", width: 952, height: 1346 },
];

/** The document behind each timeline entry, in the dictionary's order. */
const HISTORY_SOURCES: (keyof typeof DOC_IDS)[] = ["proclamation", "regulation", "certificate", "taxpayer"];

/** Icons for the mandate cards, in the dictionary's order. */
const MANDATE_ICONS: LucideIcon[] = [
  HandCoinsIcon,
  UsersIcon,
  ShieldCheckIcon,
  LineChartIcon,
  LandmarkIcon,
  BookOpenIcon,
  BuildingIcon,
  GlobeIcon,
];

const sourceLinkClass =
  "text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

/** "Source: <document>" under a fact, linking to the scan in the documents section. */
function SourceLine({ t, docId, name }: { t: Dictionary["about"]["about"]["source"]; docId: string; name: string }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-muted-ink">
      {t.label}{" "}
      <a href={`#${docId}`} title={t.linkTitle} className={sourceLinkClass}>
        {name}
      </a>
    </p>
  );
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const locale = localeFromParam((await params).lang);
  const dictionary = await getDictionary(locale);
  const t = dictionary.about.about;
  const crumbs = dictionary.about.breadcrumbs;

  const documents: LegalDocument[] = SCANS.map(({ key, ...scan }) => ({
    ...scan,
    ...dictionary.about.documents.items[key],
    id: DOC_IDS[key],
  }));

  return (
    <SitePage eyebrow={t.header.eyebrow} title={t.header.title} accent={t.header.accent} intro={t.header.intro}>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: crumbs.home, path: "/" },
          { name: crumbs.about, path: "/about" },
        ])}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <p className="text-xs tracking-[0.18em] text-brand uppercase">{t.why.eyebrow}</p>
            <h2 className="font-serif-display mt-3 text-3xl tracking-[-1px] text-navy sm:text-4xl">{t.why.title}</h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-neutral-700">
              {t.why.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {t.stats.map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="font-serif-display text-3xl tracking-[-1px] text-brand">{value}</p>
                <p className="mt-2 text-xs leading-relaxed tracking-[0.08em] text-muted-ink uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow={t.history.eyebrow} title={t.history.title} intro={t.history.intro} />
        <ol className="relative mx-auto mt-12 max-w-3xl space-y-6 border-s border-black/10 ps-8">
          {t.history.items.map((item, index) => (
            <li key={item.title} className="relative">
              <span
                aria-hidden="true"
                className="absolute -start-[2.45rem] top-6 h-4 w-4 rounded-full border-4 border-surface-muted bg-brand"
              />
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs tracking-[0.16em] text-brand uppercase tabular-nums">{item.date}</p>
                <h3 className="font-serif-display mt-1 text-xl text-navy sm:text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.body}</p>
                <SourceLine t={t.source} docId={DOC_IDS[HISTORY_SOURCES[index] ?? "regulation"]} name={item.source} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHeading eyebrow={t.mandate.eyebrow} title={t.mandate.title} />
        <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-muted-ink">
          {t.mandate.intro.before}
          <a href={`#${DOC_IDS.regulation}`} title={t.source.linkTitle} className={sourceLinkClass}>
            {t.mandate.intro.link}
          </a>
          {t.mandate.intro.after}
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.mandate.items.map(({ title, body }, index) => {
            const Icon = MANDATE_ICONS[index] ?? ShieldCheckIcon;
            return (
              <div key={title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
                <h3 className="mt-3 font-medium text-navy">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-ink">{body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow={t.governance.eyebrow} title={t.governance.title} intro={t.governance.intro} />
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          {t.governance.items.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-serif-display text-xl text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-5xl items-start gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <ScaleIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="text-sm leading-relaxed text-neutral-700">
              <span className="font-medium text-navy">{t.governance.scope.title} </span>
              {t.governance.scope.body}
            </p>
            <SourceLine t={t.source} docId={DOC_IDS.regulation} name={t.governance.source} />
          </div>
        </div>
      </Section>

      <div id="documents" className="scroll-mt-24">
        <Section>
          <SectionHeading eyebrow={t.documents.eyebrow} title={t.documents.title} intro={t.documents.intro} />
          <div className="mt-12">
            <DocumentGallery documents={documents} t={dictionary.about.documents.gallery} />
          </div>
          <div className="mt-10 text-center">
            <a
              href={LEGAL_PDF}
              title={t.documents.downloadTitle}
              className="inline-flex items-center gap-2 rounded-full bg-navy px-7 py-3.5 text-sm text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              <DownloadIcon className="h-4 w-4" aria-hidden="true" />
              {t.documents.download}
            </a>
          </div>
        </Section>
      </div>

      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/how-it-works", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/transparency/dashboard", title: t.cta.secondaryTitle }}
      />
    </SitePage>
  );
}
