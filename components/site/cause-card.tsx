import Link from "next/link";

import { categoryLabel, mediaSrc, type PublicCause } from "@/lib/zakat/content";

const etb = new Intl.NumberFormat("en-ET", { notation: "compact", maximumFractionDigits: 1 });

/** Public cause card (landing page and /causes). */
export function CauseCard({ cause, closed = false }: { cause: PublicCause; closed?: boolean }) {
  const image = mediaSrc(cause.imageUrl);
  const pct = cause.progress != null && Number.isFinite(cause.progress) ? Math.max(0, Math.round(cause.progress * 100)) : null;
  // Over-funded causes say so in words; the bar itself never runs past full.
  const goalReached = pct != null && pct >= 100;
  const barWidth = pct != null ? Math.min(100, pct) : 0;

  return (
    <article className="flex h-full flex-col rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white">
        <div className="relative aspect-16/10 w-full overflow-hidden bg-[#007050]/[0.06]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- cause images come from the zakat service via /bff/media
            <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : null}
          {cause.badge ? (
            <span
              className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase"
              style={{ backgroundColor: cause.badge === "urgent" ? "#e18f35" : "#001539", color: "#FFFFFF" }}
            >
              {cause.badge}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase" style={{ color: "#6F6F6F" }}>
              {categoryLabel(cause.category)}
            </span>
            {cause.region ? (
              <span className="text-xs" style={{ color: "#6F6F6F" }}>
                {cause.region}
              </span>
            ) : null}
          </div>
          {/* Admins can save long titles and descriptions: clamp them so one wordy cause doesn't stretch its row. */}
          <h3
            className="font-serif-display line-clamp-2 text-xl leading-tight sm:text-2xl"
            style={{ color: "#001539", letterSpacing: "-0.5px" }}
            title={cause.title}
          >
            <Link href={`/causes/${encodeURIComponent(cause.id)}`} className="hover:underline">
              {cause.title}
            </Link>
          </h3>
          {pct != null ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#6F6F6F" }}>
                  {cause.raisedEtb != null ? `ETB ${etb.format(cause.raisedEtb)}` : "Raised"}
                  {cause.goalEtb != null ? ` of ${etb.format(cause.goalEtb)}` : ""}
                </span>
                <span style={{ color: goalReached ? "#007050" : "#001539", fontWeight: 500 }}>
                  {goalReached ? "Goal reached" : `${pct}%`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: "#007050" }} />
              </div>
            </div>
          ) : null}
          <p className="line-clamp-3 text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
            {cause.description}
          </p>
          <Link
            href={closed ? `/causes/${encodeURIComponent(cause.id)}` : "/zakat/pay"}
            className="mt-auto inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm transition-all duration-300 hover:scale-[1.01]"
            style={closed ? { border: "1px solid rgba(0,0,0,0.12)", color: "#001539" } : { backgroundColor: "#007050", color: "#FFFFFF" }}
          >
            {closed ? "See the result" : cause.acceptsZakat ? "Give your Zakat" : "Support this cause"}
          </Link>
        </div>
      </div>
    </article>
  );
}
