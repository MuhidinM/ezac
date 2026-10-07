import type { Metadata } from "next";

import { ImpactMapTeaser } from "@/components/landing/impact-map-teaser";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { ASNAF, labelFor } from "@/lib/backoffice/options";
import {
  formatCount,
  formatEtbCompact,
  getHomeSummary,
  getImpactRegions,
  getImpactSummary,
  getImpactTimeseries,
} from "@/lib/zakat/impact";

export const metadata: Metadata = {
  title: "Live Dashboard — EZAC",
  description:
    "Published figures on Zakat collected, families supported, and funds distributed across Ethiopia.",
};

// Figures come from zakat-engine and refresh every 5 minutes.
export const revalidate = 300;

const monthFormat = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

function monthLabel(period: string) {
  const date = new Date(`${period}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? period : monthFormat.format(date);
}

export default async function LiveDashboardPage() {
  const [home, impact, regions, series] = await Promise.all([
    getHomeSummary(),
    getImpactSummary(),
    getImpactRegions(),
    getImpactTimeseries(),
  ]);

  const month = home?.currentMonth ?? null;
  const stats = [
    { value: formatEtbCompact(home?.totalCollectedEtb), label: "Zakat collected (all time)" },
    {
      value: formatEtbCompact(month?.collectedEtb),
      label: "Collected this month",
      trend: month?.changePercent ?? null,
    },
    { value: formatCount(home?.totalBeneficiariesSupported), label: "Families supported" },
    { value: formatEtbCompact(impact?.distributedFundsEtb), label: "Funds distributed" },
    { value: formatCount(impact?.livesTouched), label: "Lives touched" },
    { value: formatCount(impact?.activeProjects), label: "Active projects" },
  ];
  const asOf = impact?.asOf ?? home?.asOf;
  const asnaf = (impact?.beneficiariesByAsnaf ?? []).filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
  const maxAsnaf = Math.max(1, ...asnaf.map((row) => row.count));
  const points = (series?.points ?? []).filter((point) => point.collectedEtb !== null);
  const maxCollected = Math.max(1, ...points.map((point) => point.collectedEtb ?? 0));
  // Hide the table until at least one region has published figures.
  const regionsWithData = (regions ?? []).filter(
    (region) => (region.beneficiaries ?? 0) > 0 || (region.distributedFundsEtb ?? 0) > 0 || (region.activeProjects ?? 0) > 0,
  );
  const regionRows = [...(regionsWithData.length > 0 ? (regions ?? []) : [])].sort(
    (a, b) => (b.beneficiaries ?? 0) - (a.beneficiaries ?? 0) || a.name.localeCompare(b.name),
  );

  return (
    <SitePage
      eyebrow="Transparency & Impact"
      title="Live"
      accent="dashboard"
      intro="Public and traceable. Follow Zakat collection and distribution across Ethiopia, figures published as they are recorded."
    >
      <Section>
        <SectionHeading
          eyebrow="At a glance"
          title="The numbers"
          intro={
            asOf
              ? `Published figures as of ${new Date(asOf).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}.`
              : "Published figures. A dash means the figure hasn't been published yet."
          }
        />
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="font-serif-display text-3xl sm:text-4xl" style={{ color: "#007050", letterSpacing: "-1px" }}>
                {stat.value ?? "—"}
              </p>
              <p className="mt-2 text-xs tracking-[0.12em] uppercase" style={{ color: "#6F6F6F" }}>
                {stat.label}
              </p>
              {"trend" in stat && stat.trend != null ? (
                <p className="mt-1 text-xs tabular-nums" style={{ color: stat.trend >= 0 ? "#007050" : "#b4532a" }}>
                  {stat.trend >= 0 ? "▲" : "▼"} {Math.abs(stat.trend)}% vs last month
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {points.length > 0 ? (
          <div className="mt-12 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium" style={{ color: "#001539" }}>
              Zakat collected per month
            </p>
            <ul className="mt-5 space-y-2">
              {points.map((point) => (
                <li key={point.period} className="grid grid-cols-[6rem_minmax(0,1fr)_7rem] items-center gap-3 text-sm">
                  <span style={{ color: "#6F6F6F" }}>{monthLabel(point.period)}</span>
                  <span className="h-2.5">
                    <span
                      className="block h-full rounded-r-[4px]"
                      style={{ width: `${((point.collectedEtb ?? 0) / maxCollected) * 100}%`, backgroundColor: "#007050" }}
                    />
                  </span>
                  <span className="text-right tabular-nums" style={{ color: "#001539" }}>
                    {formatEtbCompact(point.collectedEtb)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {asnaf.length > 0 ? (
          <div className="mt-12 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium" style={{ color: "#001539" }}>
              Families supported, by eligible category (asnaf)
            </p>
            <ul className="mt-5 space-y-2">
              {asnaf.map((row) => (
                <li key={row.asnaf} className="grid grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)_4rem] items-center gap-3 text-sm">
                  <span style={{ color: "#6F6F6F" }}>{labelFor(ASNAF, row.asnaf)}</span>
                  <span className="h-2.5">
                    <span
                      className="block h-full rounded-r-[4px]"
                      style={{ width: `${(row.count / maxAsnaf) * 100}%`, backgroundColor: "#e18f35" }}
                    />
                  </span>
                  <span className="text-right tabular-nums" style={{ color: "#001539" }}>
                    {formatCount(row.count)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {regionRows.length > 0 ? (
          <div className="mt-12 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs tracking-[0.12em] uppercase" style={{ color: "#6F6F6F" }}>
                  <th className="px-6 py-4 font-medium">Region</th>
                  <th className="px-6 py-4 text-right font-medium">Beneficiaries</th>
                  <th className="px-6 py-4 text-right font-medium">Funds distributed</th>
                  <th className="px-6 py-4 text-right font-medium">Active projects</th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map((region) => (
                  <tr key={region.code} className="border-b border-black/5 last:border-0">
                    <td className="px-6 py-3 font-medium" style={{ color: "#001539" }}>
                      {region.name}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">{formatCount(region.beneficiaries) ?? "—"}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{formatEtbCompact(region.distributedFundsEtb) ?? "—"}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{formatCount(region.activeProjects) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Section>
      <ImpactMapTeaser regions={regions ?? []} />
      <CtaBand
        title="Want the detail behind the numbers?"
        body="Download published impact reports or get in touch with our transparency office."
        primary={{ label: "View impact reports", href: "/transparency/reports" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </SitePage>
  );
}
