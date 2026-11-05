import type { Metadata } from "next";
import {
  ArrowRightIcon,
  ArrowRightLeftIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  BuildingIcon,
  CalculatorIcon,
  ClipboardListIcon,
  FileSearchIcon,
  GaugeIcon,
  HandCoinsIcon,
  InboxIcon,
  QrCodeIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { readCalculatorConfig } from "@/components/landing/read-calculator-config";
import { JsonLd } from "@/components/seo/json-ld";
import { CertificateVerify } from "@/components/site/certificate-verify";
import { CtaBand, Section, SectionHeading } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { type Dictionary, getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import type { CalculatorConfig, LivestockRow } from "@/lib/zakat/calculator-config";
import {
  formatCount,
  formatDateTime,
  formatEtb,
  formatEtbCompact,
  formatPercent,
  getCalculatorConfig,
  getHomeSummary,
  getImpactSummary,
} from "@/lib/zakat/impact";

type Strings = Dictionary["transparency"]["howItWorks"];

export async function generateMetadata({ params }: PageProps<"/[lang]/how-it-works">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const { meta } = (await getDictionary(locale)).transparency.howItWorks;
  return pageMetadata({ locale, path: "/how-it-works", ...meta });
}

// Live rules and figures from zakat-engine, refreshed every 5 minutes.
export const revalidate = 300;

/** Icons for the steps and safeguards, by position in the dictionary arrays. */
const GIVING_ICONS: LucideIcon[] = [CalculatorIcon, QrCodeIcon, BadgeCheckIcon, FileSearchIcon];
const RECEIVING_ICONS: LucideIcon[] = [BuildingIcon, ClipboardListIcon, GaugeIcon, UserCheckIcon, InboxIcon, BanknoteIcon];
const SAFEGUARD_ICONS: LucideIcon[] = [ShieldCheckIcon, ScaleIcon, ArrowRightLeftIcon, FileSearchIcon, UserCheckIcon, HandCoinsIcon];

/** The eight eligible categories, in the order of Qur'an 9:60 ("other" is an internal value). */
const ELIGIBLE = [
  "poor",
  "needy",
  "zakat_administrator",
  "muallaf",
  "freeing_captives",
  "debtor",
  "fi_sabilillah",
  "stranded_traveler",
] as const;

const QURAN_9_60 = "https://quran.com/9/60";

/**
 * Example need bands (out of 270 points). Fixed in this page, not read from the
 * active points table (there is no public endpoint for it yet), so they are
 * labelled as an example rather than as the bands in force.
 */
const BAND_MAX = 270;
const BANDS = [
  { key: "low", from: 0, to: 110, className: "bg-[#4c9a7a] text-navy" },
  { key: "medium", from: 110, to: 180, className: "bg-accent-fill text-navy" },
  { key: "high", from: 180, to: 270, className: "bg-[#b4532a] text-white" },
] as const;

type Accent = "brand" | "navy";
const ACCENT_CLASSES: Record<Accent, { fill: string; text: string }> = {
  brand: { fill: "bg-brand", text: "text-brand" },
  navy: { fill: "bg-navy", text: "text-navy" },
};

function RulesTable({ config, t, locale }: { config: CalculatorConfig; t: Strings["rules"]; locale: Locale }) {
  const number = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const pct = (rate: number) => formatPercent(rate, locale);
  const etb = (value: number) => formatEtb(value, locale) ?? "—";
  const animals: Record<string, string> = t.animals;
  const prices = Object.entries(config.livestockAverageUnitPriceEtb ?? {});
  const livestockRows = (rows: LivestockRow[]) =>
    rows.map((row) => ({
      range:
        row.max != null
          ? format(t.rangeBetween, { min: number.format(row.min), max: number.format(row.max) })
          : format(t.rangeFrom, { min: number.format(row.min) }),
      due: row.due,
    }));
  const basisGrams = config.nisab.basis === "gold" ? config.nisab.goldGrams : config.nisab.silverGrams;
  const rows: [string, string][] = [
    [t.nisabBasis, format(t.nisabBasisValue, { metal: config.nisab.basis === "gold" ? t.gold : t.silver, grams: number.format(basisGrams) })],
    [t.nisabToday, etb(config.nisab.valueEtb)],
    [format(t.goldNisab, { grams: number.format(config.nisab.goldGrams) }), etb(config.nisab.goldValueEtb)],
    [format(t.silverNisab, { grams: number.format(config.nisab.silverGrams) }), etb(config.nisab.silverValueEtb)],
    [
      t.wealth,
      // 0 means the service didn't send the day count.
      config.wealth.hawlLunarDays > 0
        ? format(t.wealthAfterDays, { rate: pct(config.wealth.rate), days: number.format(config.wealth.hawlLunarDays) })
        : format(t.wealthAfterHawl, { rate: pct(config.wealth.rate) }),
    ],
    [t.cropsNisab, format(t.cropsNisabValue, { kg: number.format(config.crops.nisabKg) })],
    [t.cropsRates, format(t.cropsRatesValue, { rainFed: pct(config.crops.rainFedRate), irrigated: pct(config.crops.irrigatedRate) })],
    [t.pricesAsOf, formatDateTime(config.pricesAsOf, locale) ?? "—"],
  ];
  const version = number.format(config.configVersion);

  return (
    <div className="mt-12 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-serif-display text-xl text-navy">{t.nisabTitle}</h3>
        <dl className="mt-4 divide-y divide-black/5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-ink">{label}</dt>
              <dd className="text-end text-navy tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-ink">
          {config.priceSource ? format(t.versionWithSource, { version, source: config.priceSource }) : format(t.version, { version })}
        </p>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-serif-display text-xl text-navy">{t.livestockTitle}</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[
            { title: t.sheepGoats, rows: livestockRows(config.livestock.sheepGoats) },
            { title: t.camels, rows: livestockRows(config.livestock.camels) },
          ].map((table) => (
            <div key={table.title}>
              <h4 className="text-xs tracking-[0.12em] text-brand uppercase">{table.title}</h4>
              <table className="mt-2 w-full text-xs">
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.range} className="border-b border-black/5 last:border-0">
                      <td className="py-1.5 pe-2 text-muted-ink tabular-nums">{row.range}</td>
                      <td className="py-1.5 text-navy">{row.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-ink">
          {format(t.cattle, {
            minimum: number.format(config.livestock.cattle.minimum),
            tabiPer: number.format(config.livestock.cattle.tabiPer),
            musinnahPer: number.format(config.livestock.cattle.musinnahPer),
          })}
        </p>
        {prices.length > 0 ? (
          <p className="mt-3 text-sm text-muted-ink">
            {format(t.averagePrices, {
              prices: prices
                .map(([animal, price]) => format(t.animalPrice, { animal: animals[animal] ?? animal, price: etb(price) }))
                .join(" · "),
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Timeline({
  steps,
  icons,
  accent,
  stepLabel,
}: {
  steps: Strings["giving"]["steps"];
  icons: LucideIcon[];
  accent: Accent;
  stepLabel: string;
}) {
  const colors = ACCENT_CLASSES[accent];
  return (
    <ol className="relative mx-auto mt-12 max-w-3xl space-y-6 border-s border-black/10 ps-8">
      {steps.map(({ title, body, detail }, index) => {
        const Icon = icons[index] ?? FileSearchIcon;
        return (
          <li key={title} className="relative">
            <span
              className={`absolute -start-[3.05rem] flex size-9 items-center justify-center rounded-full text-white shadow-sm ${colors.fill}`}
              aria-hidden="true"
            >
              <Icon className="size-4" />
            </span>
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <p className={`text-xs tracking-[0.16em] uppercase ${colors.text}`}>{format(stepLabel, { n: index + 1 })}</p>
              <h3 className="font-serif-display mt-1 text-xl tracking-[-0.4px] text-navy sm:text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4a4a4a]">{body}</p>
              {detail.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-ink">
                  {detail.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className={`mt-2 size-1 shrink-0 rounded-full ${colors.fill}`} aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default async function HowItWorksPage({ params }: PageProps<"/[lang]/how-it-works">) {
  const locale = localeFromParam((await params).lang);
  const { transparency, giving } = await getDictionary(locale);
  const t = transparency.howItWorks;
  // null means not published (the section is left out); an outage throws, so
  // ISR keeps serving the last good page.
  const [rawConfig, home, impact] = await Promise.all([getCalculatorConfig(), getHomeSummary(), getImpactSummary()]);
  // A partial config would crash the rules table; leave the section out instead.
  const config = readCalculatorConfig(rawConfig);
  const live = [
    { value: formatEtbCompact(home?.totalCollectedEtb, locale), label: t.live.collected },
    { value: formatCount(home?.totalBeneficiariesSupported, locale), label: t.live.familiesSupported },
    { value: formatEtbCompact(impact?.distributedFundsEtb, locale), label: t.live.distributed },
    { value: formatCount(impact?.activeProjects, locale), label: t.live.activeCauses },
  ].filter((item) => item.value);
  const scale = new Intl.NumberFormat(INTL_LOCALE[locale]);

  return (
    <SitePage {...t.header}>
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { href: "#giving", ...t.paths.giving, border: "border-s-brand" },
            { href: "#receiving", ...t.paths.receiving, border: "border-s-navy" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              title={item.linkTitle}
              className={`group rounded-2xl border border-s-4 border-black/5 p-6 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${item.border}`}
            >
              <span className="font-serif-display flex items-center gap-2 text-2xl text-navy">
                {item.title}
                <ArrowRightIcon
                  className="size-5 transition group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-2 block text-sm text-muted-ink">{item.body}</span>
            </a>
          ))}
        </div>
        {live.length > 0 ? (
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {live.map((item) => (
              <div key={item.label} className="flex flex-col-reverse rounded-2xl bg-black/[0.03] p-5 text-center">
                <dt className="mt-1 text-xs tracking-[0.12em] text-muted-ink uppercase">{item.label}</dt>
                <dd className="font-serif-display text-2xl text-brand">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Section>

      <div id="giving" className="scroll-mt-24">
        <Section muted>
          <SectionHeading eyebrow={t.giving.eyebrow} title={t.giving.title} intro={t.giving.intro} />
          <Timeline steps={t.giving.steps} icons={GIVING_ICONS} accent="brand" stepLabel={t.step} />
        </Section>
      </div>

      {config ? (
        <Section>
          <SectionHeading eyebrow={t.rules.eyebrow} title={t.rules.title} intro={t.rules.intro} />
          <RulesTable config={config} t={t.rules} locale={locale} />
        </Section>
      ) : null}

      <div id="check-certificate" className="scroll-mt-24">
        <Section muted>
          <SectionHeading {...t.certificate} />
          <div className="mx-auto mt-10 max-w-2xl">
            <CertificateVerify t={giving.certificate} />
          </div>
        </Section>
      </div>

      <div id="receiving" className="scroll-mt-24">
        <Section>
          <SectionHeading eyebrow={t.receiving.eyebrow} title={t.receiving.title} intro={t.receiving.intro} />
          <Timeline steps={t.receiving.steps} icons={RECEIVING_ICONS} accent="navy" stepLabel={t.step} />
        </Section>
      </div>

      <Section muted>
        <SectionHeading eyebrow={t.needLevels.eyebrow} title={t.needLevels.title} intro={t.needLevels.intro} />
        <div className="mx-auto mt-10 max-w-3xl">
          <p className="mb-3 text-center text-xs tracking-[0.16em] text-brand uppercase">{t.needLevels.example}</p>
          <div className="flex h-12 overflow-hidden rounded-xl text-sm font-medium" aria-hidden="true">
            {BANDS.map((band) => (
              <div
                key={band.key}
                className={`flex items-center justify-center px-1 text-center ${band.className}`}
                style={{ width: `${((band.to - band.from) / BAND_MAX) * 100}%` }}
              >
                {t.needLevels.bands[band.key]}
              </div>
            ))}
          </div>
          <div className="relative mt-1 h-5 text-xs text-navy/70 tabular-nums" aria-hidden="true">
            <span className="absolute start-0">{scale.format(0)}</span>
            {BANDS.slice(1).map((band) => (
              <span
                key={band.key}
                className="absolute -translate-x-1/2 rtl:translate-x-1/2"
                style={{ insetInlineStart: `${(band.from / BAND_MAX) * 100}%` }}
              >
                {scale.format(band.from)}
              </span>
            ))}
            <span className="absolute end-0">{scale.format(BAND_MAX)}</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {t.needLevels.levels.map((level) => (
              <div key={level.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="font-medium text-navy">{level.title}</h3>
                <p className="text-sm text-brand tabular-nums">{level.range}</p>
                <p className="mt-2 text-sm text-muted-ink">{level.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-navy/70">{t.needLevels.note}</p>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow={t.urgent.eyebrow} title={t.urgent.title} intro={t.urgent.intro} />
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          {t.urgent.items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h3 className="font-serif-display text-2xl text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-ink">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow={t.eligible.eyebrow} title={t.eligible.title} intro={t.eligible.intro} />
        <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {ELIGIBLE.map((key) => (
            <li key={key} className="rounded-xl bg-white p-4 text-center text-sm text-navy shadow-sm">
              {transparency.asnaf[key]}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-navy/70">
          {t.eligible.source}{" "}
          <a
            href={QURAN_9_60}
            target="_blank"
            rel="noopener noreferrer"
            title={t.eligible.sourceTitle}
            className="text-brand underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t.eligible.sourceLink}
          </a>
        </p>
      </Section>

      <Section>
        <SectionHeading eyebrow={t.safeguards.eyebrow} title={t.safeguards.title} intro={t.safeguards.intro} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.safeguards.items.map(({ title, body }, index) => {
            const Icon = SAFEGUARD_ICONS[index] ?? ShieldCheckIcon;
            return (
              <div key={title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <Icon className="size-5 text-brand" aria-hidden="true" />
                <h3 className="mt-3 font-medium text-navy">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-ink">{body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/transparency/dashboard", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/zakat/calculator", title: t.cta.secondaryTitle }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: transparency.breadcrumbs.home, path: "/" },
          { name: transparency.breadcrumbs.howItWorks, path: "/how-it-works" },
        ])}
      />
    </SitePage>
  );
}
