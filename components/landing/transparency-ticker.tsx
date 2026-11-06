import { TrendingUpIcon } from "lucide-react";

import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";
import { getCalculatorConfig, getHomeSummary, getImpactSummary } from "@/lib/zakat/impact";

type Strings = Dictionary["home"]["ticker"];

type Stat = {
  value: string;
  label: string;
};

/** Number formatting in the visitor's language. */
function formatters(locale: Locale, t: Strings) {
  const whole = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat(INTL_LOCALE[locale], { notation: "compact", maximumFractionDigits: 1 });
  const has = (value: number | null | undefined): value is number => value !== null && value !== undefined;
  return {
    has,
    birr: (value: number) => format(t.etb, { amount: whole.format(Math.round(value)) }),
    birrPerGram: (value: number) => format(t.etbPerGram, { amount: whole.format(Math.round(value)) }),
    birrCompact: (value: number) => format(t.etb, { amount: compact.format(value) }),
    count: (value: number) => whole.format(value),
  };
}

/**
 * Live figures from zakat-engine. One rule for every figure: a published value
 * is shown, zero included; an unpublished one (null) is left out.
 */
async function loadStats(locale: Locale, t: Strings): Promise<Stat[]> {
  // The config comes checked: a partial one is null, not a crash.
  const [home, impact, config] = await Promise.all([getHomeSummary(), getImpactSummary(), getCalculatorConfig()]);
  const { has, birr, birrPerGram, birrCompact, count } = formatters(locale, t);
  const month = home?.currentMonth;
  const gold24k = config?.goldPricePerGramEtb["24k"];

  const stats: (Stat | null)[] = [
    config
      ? { value: birr(config.nisab.valueEtb), label: config.nisab.basis === "gold" ? t.nisabGold : t.nisabSilver }
      : null,
    has(gold24k) ? { value: birrPerGram(gold24k), label: t.gold24k } : null,
    has(home?.totalCollectedEtb) ? { value: birrCompact(home.totalCollectedEtb), label: t.collected } : null,
    has(month?.collectedEtb)
      ? {
          value: `${birrCompact(month.collectedEtb)}${
            month.changePercent != null ? ` ${month.changePercent >= 0 ? "▲" : "▼"} ${Math.abs(month.changePercent)}%` : ""
          }`,
          label: t.thisMonth,
        }
      : null,
    has(home?.totalBeneficiariesSupported) ? { value: count(home.totalBeneficiariesSupported), label: t.families } : null,
    has(impact?.distributedFundsEtb) ? { value: birrCompact(impact.distributedFundsEtb), label: t.distributed } : null,
    has(impact?.livesTouched) ? { value: count(impact.livesTouched), label: t.lives } : null,
    has(impact?.activeProjects) ? { value: count(impact.activeProjects), label: t.projects } : null,
  ];
  return stats.filter((stat): stat is Stat => stat !== null);
}

function StatItem({ stat }: { stat: Stat }) {
  return (
    <div className="flex shrink-0 items-baseline gap-3 px-10">
      {/* Figures stay left-to-right inside Arabic text. */}
      <span dir="ltr" className="font-serif-display text-2xl tracking-[-0.5px] text-white">
        {stat.value}
      </span>
      <span className="text-xs uppercase tracking-[0.18em] text-white/60">{stat.label}</span>
    </div>
  );
}

export async function TransparencyTicker({ t, locale }: { t: Strings; locale: Locale }) {
  const stats = await loadStats(locale, t);
  if (stats.length === 0) return null;
  // Repeat short lists so the marquee still fills the strip.
  const loop = Array.from({ length: Math.max(2, Math.ceil(8 / stats.length) * 2) }, () => stats).flat();

  return (
    <section className="relative z-10 w-full overflow-hidden bg-navy" aria-label={t.ariaLabel}>
      <div className="flex items-stretch">
        <div className="hidden shrink-0 items-center gap-3 border-e border-white/10 px-8 py-5 md:flex">
          <span aria-hidden="true" className="relative flex h-2 w-2">
            <span className="animate-pulse-dot absolute inset-0 rounded-full bg-brand motion-reduce:animate-none!" />
            <span className="relative h-2 w-2 rounded-full bg-brand" />
          </span>
          <span className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-white">{t.live}</span>
          <TrendingUpIcon aria-hidden="true" className="h-3.5 w-3.5 text-white/60" />
        </div>

        {/* The strip pauses on hover and while focused (it's in the tab order
            for that), and with reduced motion it becomes a static, wrapped
            list. The marquee keyframes live in globals.css (marquee-rtl runs
            the other way for Arabic); the animation is set as a utility here
            so the pause and motion-reduce rules can override it. */}
        <div
          role="group"
          aria-label={t.groupLabel}
          tabIndex={0}
          className="group relative flex-1 overflow-hidden py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
        >
          <ul className="flex w-max animate-[marquee_40s_linear_infinite] whitespace-nowrap group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] rtl:animate-[marquee-rtl_40s_linear_infinite] motion-reduce:w-auto motion-reduce:animate-none! motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-3 motion-reduce:whitespace-normal">
            {loop.map((stat, i) => {
              // Repeats only keep the marquee seamless: hide them from screen
              // readers, and drop them when the strip is static.
              const repeat = i >= stats.length;
              return (
                <li
                  key={i}
                  aria-hidden={repeat || undefined}
                  className={`flex shrink-0 items-center ${repeat ? "motion-reduce:hidden" : ""}`}
                >
                  <StatItem stat={stat} />
                  <span aria-hidden="true" className="self-center text-white/20 motion-reduce:hidden">
                    ◆
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Edge fades. They mirror each other, so they need no RTL variant. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-navy to-transparent motion-reduce:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-navy to-transparent motion-reduce:hidden" />
        </div>
      </div>
    </section>
  );
}
