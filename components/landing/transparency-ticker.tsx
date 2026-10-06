import { Fragment } from "react";
import { TrendingUpIcon } from "lucide-react";

import {
  formatCount,
  formatEtbCompact,
  getCalculatorConfig,
  getHomeSummary,
  getImpactSummary,
} from "@/lib/zakat/impact";

type Stat = {
  value: string;
  label: string;
};

/** Live figures from zakat-engine; unpublished ones are left out. */
async function loadStats(): Promise<Stat[]> {
  const [home, impact, config] = await Promise.all([getHomeSummary(), getImpactSummary(), getCalculatorConfig()]);
  const stats: (Stat | null)[] = [
    config
      ? { value: `ETB ${new Intl.NumberFormat("en-ET").format(Math.round(config.nisab.valueEtb))}`, label: `Nisab today (${config.nisab.basis})` }
      : null,
    config
      ? { value: `ETB ${new Intl.NumberFormat("en-ET").format(Math.round(config.goldPricePerGramEtb["24k"] ?? 0))}/g`, label: "Gold 24k" }
      : null,
    formatEtbCompact(home?.totalCollectedEtb) ? { value: formatEtbCompact(home?.totalCollectedEtb)!, label: "Zakat Collected" } : null,
    formatCount(home?.totalBeneficiariesSupported)
      ? { value: formatCount(home?.totalBeneficiariesSupported)!, label: "Families Supported" }
      : null,
    impact?.distributedFundsEtb
      ? { value: formatEtbCompact(impact.distributedFundsEtb)!, label: "Funds Distributed" }
      : null,
    formatCount(impact?.livesTouched) ? { value: formatCount(impact?.livesTouched)!, label: "Lives Touched" } : null,
    impact?.activeProjects ? { value: formatCount(impact.activeProjects)!, label: "Active Projects" } : null,
  ];
  return stats.filter((stat): stat is Stat => stat !== null);
}

function StatItem({ stat }: { stat: Stat }) {
  return (
    <div className="flex shrink-0 items-baseline gap-3 px-10">
      <span
        className="font-serif-display text-2xl"
        style={{
          color: "#FFFFFF",
          letterSpacing: "-0.5px",
        }}
      >
        {stat.value}
      </span>
      <span
        className="text-xs uppercase tracking-[0.18em]"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {stat.label}
      </span>
    </div>
  );
}

export async function TransparencyTicker() {
  const stats = await loadStats();
  if (stats.length === 0) return null;
  // Repeat short lists so the marquee still fills the strip.
  const loop = Array.from({ length: Math.max(2, Math.ceil(8 / stats.length) * 2) }, () => stats).flat();

  return (
    <section
      className="relative z-10 w-full overflow-hidden"
      style={{ backgroundColor: "#001539" }}
      aria-label="Live impact ticker"
    >
      <div className="flex items-stretch">
        <div
          className="hidden shrink-0 items-center gap-3 border-r px-8 py-5 md:flex"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-pulse-dot absolute inset-0 rounded-full"
              style={{ backgroundColor: "#007050" }}
            />
            <span
              className="relative h-2 w-2 rounded-full"
              style={{ backgroundColor: "#007050" }}
            />
          </span>
          <span
            className="whitespace-nowrap text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "#FFFFFF" }}
          >
            Live Impact
          </span>
          <TrendingUpIcon
            className="h-3.5 w-3.5"
            style={{ color: "rgba(255,255,255,0.6)" }}
          />
        </div>

        <div className="relative flex-1 overflow-hidden py-5">
          <div
            className="animate-marquee flex whitespace-nowrap"
            style={{ width: "max-content" }}
          >
            {loop.map((stat, i) => (
              <Fragment key={i}>
                <StatItem stat={stat} />
                <span
                  className="self-center"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  ◆
                </span>
              </Fragment>
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-24"
            style={{
              background:
                "linear-gradient(to right, #001539 0%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-24"
            style={{
              background:
                "linear-gradient(to left, #001539 0%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
