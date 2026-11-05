import Link from "next/link";

import { INTL_LOCALE, type Locale, localizedPath } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { type Dictionary, getDictionary } from "@/lib/i18n/server";
import { mediaSrc, type PublicCause } from "@/lib/zakat/content";

type CauseLabels = Dictionary["giving"]["causes"];

/** A cause category ("water") in the visitor's language; an unknown value as the admin saved it. */
export function causeCategoryLabel(labels: CauseLabels["categories"], value: string | null | undefined): string {
  if (!value) return "";
  return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value as keyof typeof labels] : value;
}

function causeBadgeLabel(labels: CauseLabels["badges"], value: PublicCause["badge"]): string {
  if (!value) return "";
  return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : value;
}

/**
 * Public cause card (home page and /causes). Server component: it reads its
 * strings from the giving dictionary for `locale`. The cause's title and
 * description are shown as the admin entered them.
 */
export async function CauseCard({
  cause,
  locale,
  closed = false,
}: {
  cause: PublicCause;
  locale: Locale;
  closed?: boolean;
}) {
  const { giving } = await getDictionary(locale);
  const t = giving.causeCard;
  const etb = new Intl.NumberFormat(INTL_LOCALE[locale], { notation: "compact", maximumFractionDigits: 1 });

  const image = mediaSrc(cause.imageUrl);
  const pct = cause.progress != null && Number.isFinite(cause.progress) ? Math.max(0, Math.round(cause.progress * 100)) : null;
  // Over-funded causes say so in words; the bar itself never runs past full.
  const goalReached = pct != null && pct >= 100;
  const barWidth = pct != null ? Math.min(100, pct) : 0;
  const category = causeCategoryLabel(giving.causes.categories, cause.category);
  const badge = causeBadgeLabel(giving.causes.badges, cause.badge);
  const causeHref = localizedPath(locale, `/causes/${encodeURIComponent(cause.id)}`);

  const raised = cause.raisedEtb != null ? etb.format(cause.raisedEtb) : null;
  const goal = cause.goalEtb != null ? etb.format(cause.goalEtb) : null;
  const raisedText =
    raised != null && goal != null
      ? format(t.raisedOfGoal, { raised, goal })
      : raised != null
        ? format(t.raisedOnly, { raised })
        : goal != null
          ? format(t.goalOnly, { goal })
          : t.raised;

  return (
    <article className="flex h-full flex-col rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white">
        <div className="relative aspect-16/10 w-full overflow-hidden bg-brand/[0.06]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- cause images come from the zakat service via /bff/media
            <img
              src={image}
              alt={format(t.imageAlt, { title: cause.title })}
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {badge ? (
            <span
              className={`absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs tracking-[0.14em] uppercase rtl:tracking-normal ${
                cause.badge === "urgent" ? "bg-accent-fill text-navy" : "bg-navy text-white"
              }`}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
          {category || cause.region ? (
            <div className="flex flex-wrap items-center gap-2">
              {category ? (
                <span className="rounded-full border border-black/10 px-2.5 py-1 text-xs tracking-[0.14em] text-muted-ink uppercase rtl:tracking-normal">
                  {category}
                </span>
              ) : null}
              {cause.region ? <span className="text-xs text-muted-ink">{cause.region}</span> : null}
            </div>
          ) : null}
          {/* Admins can save long titles and descriptions: clamp them so one wordy cause doesn't stretch its row. */}
          <h3
            className="font-serif-display line-clamp-2 text-xl leading-tight tracking-[-0.5px] text-navy sm:text-2xl"
            title={cause.title}
          >
            <Link href={causeHref} className="hover:underline">
              {cause.title}
            </Link>
          </h3>
          {pct != null ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-ink">{raisedText}</span>
                <span className={`font-medium ${goalReached ? "text-brand" : "text-navy"}`}>
                  {goalReached ? t.goalReached : format(t.percent, { pct })}
                </span>
              </div>
              {/* The figures above say the same in words. */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/8" aria-hidden="true">
                <div className="h-full rounded-full bg-brand" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          ) : null}
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-ink">{cause.description}</p>
          <Link
            href={closed ? causeHref : localizedPath(locale, "/zakat/pay")}
            title={closed ? format(t.seeResultTitle, { title: cause.title }) : t.giveTitle}
            className={`mt-auto inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm transition-all duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
              closed ? "border border-black/12 text-navy" : "bg-brand text-white"
            }`}
          >
            {closed ? t.seeResult : cause.acceptsZakat ? t.give : t.support}
          </Link>
        </div>
      </div>
    </article>
  );
}
