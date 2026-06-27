import { Fragment } from "react";
import { TrendingUpIcon } from "lucide-react";

type Stat = {
  value: string;
  label: string;
};

const STATS: Stat[] = [
  { value: "ETB 45,200,000", label: "Zakat Collected" },
  { value: "12,450", label: "Families Supported" },
  { value: "847", label: "Waqf Assets Registered" },
  { value: "3,210", label: "Diaspora Donors" },
  { value: "124", label: "Active Crowdfunding Projects" },
  { value: "ETB 8.4M", label: "Disbursed This Week" },
];

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

export function TransparencyTicker() {
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
            Ramadan 2026 · Live Impact
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
            {[...STATS, ...STATS].map((stat, i) => (
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
