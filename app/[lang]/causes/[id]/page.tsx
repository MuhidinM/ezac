import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { categoryLabel, mediaSrc } from "@/lib/zakat/content";
import { getCause, isListedClosed } from "@/lib/zakat/impact";

export const revalidate = 300;

const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 });

/** True once the end date (Addis Ababa) has passed; the page revalidates every 5 minutes. */
function hasEnded(endsOn: string | null) {
  return endsOn ? new Date(`${endsOn}T23:59:59+03:00`).getTime() < Date.now() : false;
}

/** A calendar day ("2026-11-04") as is, a timestamp in Addis Ababa time; the raw value if unreadable. */
function formatDay(value: string) {
  const dateOnly = value.length === 10;
  const date = new Date(dateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en", { dateStyle: "medium", ...(dateOnly ? {} : { timeZone: "Africa/Addis_Ababa" }) });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cause = await getCause(id);
  return cause ? { title: `${cause.title} — EZAC`, description: cause.description } : { title: "Cause — EZAC" };
}

export default async function CausePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // getCause throws when the zakat service is unavailable (the error page
  // offers Try again), so null here really means "no such public cause".
  const cause = await getCause(id);
  if (!cause) notFound();

  const pct = cause.progress != null ? Math.round(cause.progress * 100) : null;
  // A cause can be over-funded: the bar stops at full and says so.
  const goalReached = pct != null && pct >= 100;
  // status is only sent once the backend adds it; until then the public closed
  // list tells a cause closed early, and the end date the rest.
  const closedEarly =
    cause.status === "CLOSED" || (cause.status === undefined && !hasEnded(cause.endsOn) && (await isListedClosed(cause.id)));
  const ended = closedEarly || hasEnded(cause.endsOn);
  const cover = mediaSrc(cause.imageUrl);
  const gallery = (cause.images ?? []).map(mediaSrc).filter((src): src is string => Boolean(src) && src !== cover);

  return (
    <SitePage eyebrow={[categoryLabel(cause.category), cause.region].filter(Boolean).join(" · ")} title={cause.title} intro={cause.description}>
      <Section>
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /bff/media
              <img src={cover} alt="" className="aspect-16/9 w-full rounded-3xl object-cover" />
            ) : null}
            {cause.body ? (
              // Plain text from the admin; line breaks kept, never rendered as HTML.
              <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "#3d3d3d" }}>
                {cause.body}
              </p>
            ) : null}
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /bff/media
                  <img key={src} src={src} alt="" className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />
                ))}
              </div>
            ) : null}
          </div>

          <aside className="h-fit space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 lg:sticky lg:top-28">
            <div>
              <p className="font-serif-display text-3xl" style={{ color: "#007050", letterSpacing: "-1px" }}>
                {cause.raisedEtb != null ? `ETB ${etb.format(cause.raisedEtb)}` : "—"}
              </p>
              <p className="mt-1 text-xs tracking-[0.12em] uppercase" style={{ color: "#6F6F6F" }}>
                Raised{cause.goalEtb != null ? ` of ETB ${etb.format(cause.goalEtb)}` : ""}
              </p>
            </div>
            {pct != null ? (
              <div className="space-y-2">
                <div
                  role="progressbar"
                  aria-label="Raised toward the goal"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(pct, 100)}
                  aria-valuetext={goalReached ? "Goal reached" : `${pct}% of the goal`}
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                >
                  <div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: "#007050" }} />
                </div>
                <p className="text-xs" style={{ color: goalReached ? "#007050" : "#6F6F6F" }}>
                  {goalReached ? "Goal reached" : `${pct}% of the goal`}
                </p>
              </div>
            ) : null}
            <dl className="space-y-2 text-sm">
              {cause.region ? (
                <div className="flex justify-between gap-4">
                  <dt style={{ color: "#6F6F6F" }}>Region</dt>
                  <dd style={{ color: "#001539" }}>{cause.region}</dd>
                </div>
              ) : null}
              {closedEarly && cause.closedAt ? (
                <div className="flex justify-between gap-4">
                  <dt style={{ color: "#6F6F6F" }}>Closed</dt>
                  <dd style={{ color: "#001539" }}>{formatDay(cause.closedAt)}</dd>
                </div>
              ) : cause.endsOn && !closedEarly ? (
                <div className="flex justify-between gap-4">
                  <dt style={{ color: "#6F6F6F" }}>{ended ? "Ended" : "Ends"}</dt>
                  <dd style={{ color: "#001539" }}>{formatDay(cause.endsOn)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt style={{ color: "#6F6F6F" }}>Zakat eligible</dt>
                <dd style={{ color: "#001539" }}>{cause.acceptsZakat ? "Yes" : "No"}</dd>
              </div>
            </dl>
            {ended ? (
              <p className="rounded-2xl bg-black/[0.03] p-4 text-sm" style={{ color: "#6F6F6F" }}>
                This cause has closed. Thank you to everyone who gave.
              </p>
            ) : (
              <Link
                href="/zakat/pay"
                className="inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm transition-all duration-300 hover:scale-[1.01]"
                style={{ backgroundColor: "#007050", color: "#FFFFFF" }}
              >
                {cause.acceptsZakat ? "Give your Zakat" : "Support this cause"}
              </Link>
            )}
            <p className="text-xs" style={{ color: "#6F6F6F" }}>
              Payments are made in the EZAC app through Cooperative Bank of Oromia.
            </p>
          </aside>
        </div>
      </Section>
      <CtaBand
        title="See where Zakat goes"
        body="Follow collection and distribution across Ethiopia on the live dashboard."
        primary={{ label: "Live dashboard", href: "/transparency/dashboard" }}
        secondary={{ label: "All causes", href: "/causes" }}
      />
    </SitePage>
  );
}
