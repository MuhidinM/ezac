import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DownloadIcon, FileTextIcon } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { isPastLastPage, listPath, pageFromParam } from "@/components/site/list-page";
import { Pagination } from "@/components/site/pagination";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { mediaSrc } from "@/lib/zakat/content";
import { type ImpactReport, formatDate, getImpactReports } from "@/lib/zakat/impact";

const PATH = "/transparency/reports";
const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]/transparency/reports">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const page = pageFromParam((await searchParams).page);
  const { transparency, common } = await getDictionary(locale);
  const { meta } = transparency.reports;
  return pageMetadata({
    locale,
    path: listPath(PATH, page),
    ...meta,
    title: page > 1 ? format(common.pagination.pageTitle, { title: meta.title, page }) : meta.title,
  });
}

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

/**
 * Reports grouped by the year they were published, newest year first and
 * newest report first within a year; undated reports come last.
 */
function byYear(reports: ImpactReport[]) {
  const time = (r: ImpactReport) => (r.publishedAt ? Date.parse(r.publishedAt) || 0 : 0);
  const groups = new Map<number | null, ImpactReport[]>();
  for (const report of [...reports].sort((a, b) => time(b) - time(a))) {
    const t = time(report);
    const year = t ? new Date(t).getUTCFullYear() : null;
    groups.set(year, [...(groups.get(year) ?? []), report]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : b - a))
    .map(([year, items]) => ({ year, items }));
}


export default async function ImpactReportsPage({ params, searchParams }: PageProps<"/[lang]/transparency/reports">) {
  const locale = localeFromParam((await params).lang);
  const page = pageFromParam((await searchParams).page);
  const { transparency, common } = await getDictionary(locale);
  const t = transparency.reports;
  // null means none published. Published reports are cached (lib/zakat/impact.ts):
  // an outage keeps the last good copy, and with none cached shows the error page.
  const result = await getImpactReports(page, PAGE_SIZE);
  const reports = result?.items ?? [];
  const totalPages = result?.pagination.totalPages ?? 0;
  if (isPastLastPage(page, totalPages)) notFound();

  return (
    <SitePage {...t.header}>
      <Section>
        <SectionHeading {...t.library} />
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm text-muted-ink">{t.empty}</p>
          ) : null}
          {byYear(reports).map(({ year, items }) => (
            <section key={year ?? "undated"} aria-labelledby={`reports-${year ?? "undated"}`} className="space-y-3 pt-4 first:pt-0">
              <h3 id={`reports-${year ?? "undated"}`} className="text-xs font-medium uppercase tracking-[0.14em] text-muted-ink">
                {year ? format(t.yearHeading, { year: String(year) }) : t.undated}
              </h3>
              {items.map((report) => {
                const size = fileSize(report.sizeBytes, locale);
                const published = formatDate(report.publishedAt, locale);
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
                      <span className="mt-0.5 block text-xs text-muted-ink">
                        {published ? (
                          <time dateTime={report.publishedAt ?? undefined}>{format(t.published, { date: published })}</time>
                        ) : (
                          t.undated
                        )}
                        {report.period ? (
                          <>
                            {" · "}
                            <span className="text-accent-ink">{report.period}</span>
                          </>
                        ) : null}
                      </span>
                      {report.summary ? <span className="mt-1 block text-xs text-muted-ink">{report.summary}</span> : null}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs text-navy">
                      <DownloadIcon className="size-3.5" aria-hidden="true" />
                      {size ? format(t.fileWithSize, { size }) : t.file}
                    </span>
                    <span className="sr-only">{t.newTab}</span>
                  </a>
                );
              })}
            </section>
          ))}
        </div>
        <Pagination locale={locale} t={common.pagination} path={PATH} page={page} totalPages={totalPages} />
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/transparency/dashboard", title: t.cta.primaryTitle }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: transparency.breadcrumbs.home, path: "/" },
          { name: transparency.breadcrumbs.reports, path: PATH },
        ])}
      />
    </SitePage>
  );
}
