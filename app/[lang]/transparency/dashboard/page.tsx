import type { Metadata } from "next";

import { ImpactMapTeaser } from "@/components/landing/impact-map-teaser";
import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { ASNAF, labelFor } from "@/lib/backoffice/options";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { foreignLang } from "@/lib/zakat/content";
import {
  collectedEtb,
  formatCount,
  formatDate,
  formatDateTime,
  formatEtbCompact,
  formatMonth,
  formatPercent,
  getHomeSummary,
  getImpactRegions,
  getImpactSummary,
  getImpactTimeseries,
  householdFigures,
} from "@/lib/zakat/impact";

export async function generateMetadata({ params }: PageProps<"/[lang]/transparency/dashboard">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).transparency.dashboard;
  return pageMetadata({ locale, path: "/transparency/dashboard", ...meta });
}

// Figures come from zakat-engine and refresh every 5 minutes.
export const revalidate = 300;

export default async function LiveDashboardPage({ params }: PageProps<"/[lang]/transparency/dashboard">) {
  const locale = localeFromParam((await params).lang);
  const dictionary = await getDictionary(locale);
  const { transparency } = dictionary;
  const t = transparency.dashboard;
  const asnafLabels: Record<string, string> = transparency.asnaf;
  const dash = transparency.notPublished;

  const [home, impact, regions, series] = await Promise.all([
    getHomeSummary(),
    getImpactSummary(),
    getImpactRegions(locale),
    getImpactTimeseries(),
  ]);

  const month = home?.currentMonth ?? null;
  // Both count households: when they match, the figure is shown once.
  const households = householdFigures(home, impact);
  type Stat = { value: string | null; label: string; trend?: number | null };
  const stats = ([
    // Online and offline together; the note below says how much was offline.
    { value: formatEtbCompact(collectedEtb(home), locale), label: t.stats.totalCollected },
    {
      value: formatEtbCompact(month?.collectedEtb, locale),
      label: t.stats.collectedThisMonth,
      trend: month?.changePercent ?? null,
    },
    { value: formatCount(households.families, locale), label: t.stats.familiesSupported },
    { value: formatEtbCompact(impact?.distributedFundsEtb, locale), label: t.stats.fundsDistributed },
    households.lives != null ? { value: formatCount(households.lives, locale), label: t.stats.livesTouched } : null,
    { value: formatCount(impact?.activeProjects, locale), label: t.stats.activeProjects },
  ] satisfies (Stat | null)[]).filter((stat): stat is Stat => stat !== null);
  const offlineAmount = (home?.offlineCollectedEtb ?? 0) > 0 ? formatEtbCompact(home?.offlineCollectedEtb, locale) : null;
  const offlineDate = formatDate(home?.offlineAsOfDate, locale);
  const asOf = formatDateTime(impact?.asOf ?? home?.asOf, locale);
  const asnaf = (impact?.beneficiariesByAsnaf ?? []).filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
  const maxAsnaf = Math.max(1, ...asnaf.map((row) => row.count));
  const points = (series?.points ?? []).filter((point) => point.collectedEtb !== null || point.disbursedEtb !== null);
  // disbursedEtb is the amount paid out that month (0 until the first payout).
  const showDisbursed = points.some((point) => point.disbursedEtb !== null);
  const maxMonthly = Math.max(1, ...points.flatMap((point) => [point.collectedEtb ?? 0, point.disbursedEtb ?? 0]));
  // Hide the table until at least one region has published figures.
  const regionsWithData = (regions ?? []).filter(
    (region) => (region.beneficiaries ?? 0) > 0 || (region.distributedFundsEtb ?? 0) > 0 || (region.activeProjects ?? 0) > 0,
  );
  const regionRows = [...(regionsWithData.length > 0 ? (regions ?? []) : [])].sort(
    (a, b) => (b.beneficiaries ?? 0) - (a.beneficiaries ?? 0) || a.name.localeCompare(b.name, locale),
  );

  return (
    <SitePage {...t.header}>
      <Section>
        <SectionHeading
          eyebrow={t.glance.eyebrow}
          title={t.glance.title}
          intro={asOf ? format(t.glance.asOf, { date: asOf }) : t.glance.noDate}
        />
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="font-serif-display text-3xl tracking-[-1px] text-brand sm:text-4xl">{stat.value ?? dash}</p>
              <p className="mt-2 text-xs tracking-[0.12em] text-muted-ink uppercase">{stat.label}</p>
              {stat.trend != null ? (
                <p className={`mt-1 text-xs tabular-nums ${stat.trend >= 0 ? "text-brand" : "text-accent-ink"}`}>
                  <span aria-hidden="true">{stat.trend >= 0 ? "▲" : "▼"} </span>
                  <span className="sr-only">{stat.trend >= 0 ? t.trendUp : t.trendDown} </span>
                  {format(t.trend, { percent: formatPercent(Math.abs(stat.trend) / 100, locale) })}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        {offlineAmount && offlineDate ? (
          <p className="mt-4 text-center text-xs text-muted-ink">
            {format(t.glance.offline, { amount: offlineAmount, date: offlineDate })}
          </p>
        ) : null}

        {points.length > 0 ? (
          <div className="mt-12 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-navy">{showDisbursed ? t.monthly.titleBoth : t.monthly.titleCollected}</h3>
              {showDisbursed ? (
                <div className="flex gap-4 text-xs text-muted-ink" aria-hidden="true">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-brand" />
                    {t.monthly.collected}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-accent-fill" />
                    {t.monthly.distributed}
                  </span>
                </div>
              ) : null}
            </div>
            <ul className="mt-5 space-y-3">
              {points.map((point) => (
                <li key={point.period} className="grid grid-cols-[6rem_minmax(0,1fr)_7rem] items-center gap-x-3 gap-y-1 text-sm">
                  <span className={`text-muted-ink ${showDisbursed ? "row-span-2" : ""}`}>{formatMonth(point.period, locale)}</span>
                  <span className="h-2.5" aria-hidden="true">
                    <span
                      className="block h-full rounded-e-[4px] bg-brand"
                      style={{ width: `${((point.collectedEtb ?? 0) / maxMonthly) * 100}%` }}
                    />
                  </span>
                  <span className="text-end text-navy tabular-nums">
                    {showDisbursed ? <span className="sr-only">{t.monthly.collected}: </span> : null}
                    {formatEtbCompact(point.collectedEtb, locale) ?? dash}
                  </span>
                  {showDisbursed ? (
                    <>
                      <span className="h-2.5" aria-hidden="true">
                        <span
                          className="block h-full rounded-e-[4px] bg-accent-fill"
                          style={{ width: `${((point.disbursedEtb ?? 0) / maxMonthly) * 100}%` }}
                        />
                      </span>
                      <span className="text-end text-xs text-muted-ink tabular-nums">
                        <span className="sr-only">{t.monthly.distributed}: </span>
                        {formatEtbCompact(point.disbursedEtb, locale) ?? dash}
                      </span>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {asnaf.length > 0 ? (
          <div className="mt-12 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-navy">{t.asnafTitle}</h3>
            <ul className="mt-5 space-y-2">
              {asnaf.map((row) => (
                <li key={row.asnaf} className="grid grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)_4rem] items-center gap-3 text-sm">
                  <span className="text-muted-ink">{asnafLabels[row.asnaf] ?? labelFor(ASNAF, row.asnaf)}</span>
                  <span className="h-2.5" aria-hidden="true">
                    <span className="block h-full rounded-e-[4px] bg-accent-fill" style={{ width: `${(row.count / maxAsnaf) * 100}%` }} />
                  </span>
                  <span className="text-end text-navy tabular-nums">{formatCount(row.count, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {regionRows.length > 0 ? (
          <div className="mt-12 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-sm">
              <caption className="sr-only">{t.regions.caption}</caption>
              <thead>
                <tr className="border-b border-black/5 text-start text-xs tracking-[0.12em] text-muted-ink uppercase">
                  <th scope="col" className="px-6 py-4 text-start font-medium">
                    {t.regions.region}
                  </th>
                  <th scope="col" className="px-6 py-4 text-end font-medium">
                    {t.regions.beneficiaries}
                  </th>
                  <th scope="col" className="px-6 py-4 text-end font-medium">
                    {t.regions.fundsDistributed}
                  </th>
                  <th scope="col" className="px-6 py-4 text-end font-medium">
                    {t.regions.activeProjects}
                  </th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map((region) => (
                  <tr key={region.code} className="border-b border-black/5 last:border-0">
                    <th scope="row" lang={foreignLang(region.lang, locale)} className="px-6 py-3 text-start font-medium text-navy">
                      {region.name}
                    </th>
                    <td className="px-6 py-3 text-end tabular-nums">{formatCount(region.beneficiaries, locale) ?? dash}</td>
                    <td className="px-6 py-3 text-end tabular-nums">{formatEtbCompact(region.distributedFundsEtb, locale) ?? dash}</td>
                    <td className="px-6 py-3 text-end tabular-nums">{formatCount(region.activeProjects, locale) ?? dash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Section>
      <ImpactMapTeaser regions={regions ?? []} t={dictionary.home.impactMap} />
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/transparency/reports", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/contact", title: t.cta.secondaryTitle }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: transparency.breadcrumbs.home, path: "/" },
          { name: transparency.breadcrumbs.dashboard, path: "/transparency/dashboard" },
        ])}
      />
    </SitePage>
  );
}
