import type { Metadata } from "next";
import { DownloadIcon, FileTextIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { mediaSrc } from "@/lib/zakat/content";
import { formatDate, getImpactReports } from "@/lib/zakat/impact";

export async function generateMetadata({ params }: PageProps<"/[lang]/transparency/reports">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).transparency.reports;
  return pageMetadata({ locale, path: "/transparency/reports", ...meta });
}

// Published reports from zakat-engine, refreshed every 5 minutes.
export const revalidate = 300;

/** "1.2 MB" or "640 kB" in the page's language; null when the size isn't known. */
function fileSize(bytes: number | null, locale: Locale) {
  if (!bytes) return null;
  const megabytes = bytes > 1024 * 1024;
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "unit",
    unit: megabytes ? "megabyte" : "kilobyte",
    maximumFractionDigits: megabytes ? 1 : 0,
  }).format(megabytes ? bytes / (1024 * 1024) : bytes / 1024);
}

export default async function ImpactReportsPage({ params }: PageProps<"/[lang]/transparency/reports">) {
  const locale = localeFromParam((await params).lang);
  const { transparency } = await getDictionary(locale);
  const t = transparency.reports;
  // null means none published; an outage throws, so ISR keeps the last good list.
  const reports = (await getImpactReports()) ?? [];

  return (
    <SitePage {...t.header}>
      <Section>
        <SectionHeading {...t.library} />
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm text-muted-ink">{t.empty}</p>
          ) : null}
          {reports.map((report) => {
            const size = fileSize(report.sizeBytes, locale);
            const published = formatDate(report.publishedAt, locale);
            const details = report.summary ?? (published ? format(t.published, { date: published }) : null);
            return (
              <a
                key={report.id}
                href={mediaSrc(report.fileUrl) ?? report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={format(t.linkTitle, { title: report.title })}
                className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition hover:border-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                  <FileTextIcon className="size-5 text-brand" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-navy">{report.title}</span>
                  {report.period || details ? (
                    <span className="mt-0.5 block text-xs text-muted-ink">
                      {report.period ? <span className="text-accent-ink">{report.period}</span> : null}
                      {report.period && details ? " · " : null}
                      {details}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs text-navy">
                  <DownloadIcon className="size-3.5" aria-hidden="true" />
                  {size ? format(t.fileWithSize, { size }) : t.file}
                </span>
                <span className="sr-only">{t.newTab}</span>
              </a>
            );
          })}
        </div>
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/transparency/dashboard", title: t.cta.primaryTitle }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: transparency.breadcrumbs.home, path: "/" },
          { name: transparency.breadcrumbs.reports, path: "/transparency/reports" },
        ])}
      />
    </SitePage>
  );
}
