import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { causeCategoryLabel } from "@/components/site/cause-card";
import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { INTL_LOCALE, localizedPath } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { mediaSrc } from "@/lib/zakat/content";
import { getCause, isListedClosed } from "@/lib/zakat/impact";

export const revalidate = 300;

const causePath = (id: string) => `/causes/${encodeURIComponent(id)}`;

/** True once the end date (Addis Ababa) has passed; the page revalidates every 5 minutes. */
function hasEnded(endsOn: string | null) {
  return endsOn ? new Date(`${endsOn}T23:59:59+03:00`).getTime() < Date.now() : false;
}

/** A calendar day ("2026-11-04") as is, a timestamp in Addis Ababa time; the raw value if unreadable. */
function formatDay(value: string, intlLocale: string) {
  const dateOnly = value.length === 10;
  const date = new Date(dateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(intlLocale, {
    dateStyle: "medium",
    ...(dateOnly ? {} : { timeZone: "Africa/Addis_Ababa" }),
  });
}

/** The admin's description cut to about 160 characters for search results, at a word break. */
function metaDescription(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/causes/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const locale = localeFromParam(lang);
  const { giving } = await getDictionary(locale);
  const cause = await getCause(id);
  if (!cause) return { title: giving.cause.meta.fallbackTitle, robots: { index: false, follow: true } };

  // The public cause has no publish or update date, so it is a "website", not an "article".
  return pageMetadata({
    locale,
    path: causePath(id),
    title: cause.title,
    description: metaDescription(cause.description) || giving.causes.meta.description,
    keywords: [giving.cause.meta.keywords, causeCategoryLabel(giving.causes.categories, cause.category), cause.region]
      .filter(Boolean)
      .join(", "),
    image: mediaSrc(cause.imageUrl),
    imageAlt: format(giving.cause.coverAlt, { title: cause.title }),
  });
}

export default async function CausePage({ params }: PageProps<"/[lang]/causes/[id]">) {
  const { lang, id } = await params;
  const locale = localeFromParam(lang);
  const { giving } = await getDictionary(locale);
  const t = giving.cause;
  const intlLocale = INTL_LOCALE[locale];
  const etb = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 });

  // getCause throws when the zakat service is unavailable (the error page
  // offers Try again), so null here really means "no such public cause".
  const cause = await getCause(id);
  if (!cause) notFound();

  const pct = cause.progress != null ? Math.round(cause.progress * 100) : null;
  // A cause can be over-funded: the bar stops at full and says so.
  const goalReached = pct != null && pct >= 100;
  const progressText = goalReached ? t.goalReached : format(t.percentOfGoal, { pct: pct ?? 0 });
  // status is only sent once the backend adds it; until then the public closed
  // list tells a cause closed early, and the end date the rest.
  const closedEarly =
    cause.status === "CLOSED" || (cause.status === undefined && !hasEnded(cause.endsOn) && (await isListedClosed(cause.id)));
  const ended = closedEarly || hasEnded(cause.endsOn);
  const cover = mediaSrc(cause.imageUrl);
  const gallery = (cause.images ?? []).map(mediaSrc).filter((src): src is string => Boolean(src) && src !== cover);
  const category = causeCategoryLabel(giving.causes.categories, cause.category);

  const primary = {
    label: t.cta.primary,
    href: localizedPath(locale, "/transparency/dashboard"),
    title: t.cta.primaryTitle,
  };
  const secondary = { label: t.cta.secondary, href: localizedPath(locale, "/causes"), title: t.cta.secondaryTitle };

  return (
    <>
      <SitePage eyebrow={[category, cause.region].filter(Boolean).join(" · ")} title={cause.title} intro={cause.description}>
        <Section>
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /bff/media
                <img
                  src={cover}
                  alt={format(t.coverAlt, { title: cause.title })}
                  width={1600}
                  height={900}
                  fetchPriority="high"
                  className="aspect-16/9 w-full rounded-3xl object-cover"
                />
              ) : null}
              {cause.body ? (
                // Plain text from the admin; line breaks kept, never rendered as HTML.
                <p className="text-base leading-relaxed whitespace-pre-line text-black/75">{cause.body}</p>
              ) : null}
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((src, index) => (
                    // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /bff/media
                    <img
                      key={src}
                      src={src}
                      alt={format(t.galleryAlt, { n: index + 1, count: gallery.length, title: cause.title })}
                      width={800}
                      height={800}
                      className="aspect-square w-full rounded-2xl object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="h-fit space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 lg:sticky lg:top-28">
              <div>
                <p className="font-serif-display text-3xl tracking-[-1px] text-brand">
                  {cause.raisedEtb != null ? format(t.amount, { amount: etb.format(cause.raisedEtb) }) : t.noAmount}
                </p>
                <p className="mt-1 text-xs tracking-[0.12em] text-muted-ink uppercase rtl:tracking-normal">
                  {cause.goalEtb != null ? format(t.raisedOfGoal, { goal: etb.format(cause.goalEtb) }) : t.raised}
                </p>
              </div>
              {pct != null ? (
                <div className="space-y-2">
                  <div
                    role="progressbar"
                    aria-label={t.progressLabel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(pct, 100)}
                    aria-valuetext={progressText}
                    className="h-2 w-full overflow-hidden rounded-full bg-black/8"
                  >
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
                  </div>
                  <p className={`text-xs ${goalReached ? "text-brand" : "text-muted-ink"}`}>{progressText}</p>
                </div>
              ) : null}
              <dl className="space-y-2 text-sm">
                {cause.region ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-ink">{t.region}</dt>
                    <dd className="text-navy">{cause.region}</dd>
                  </div>
                ) : null}
                {closedEarly && cause.closedAt ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-ink">{t.closed}</dt>
                    <dd className="text-navy">{formatDay(cause.closedAt, intlLocale)}</dd>
                  </div>
                ) : cause.endsOn && !closedEarly ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-ink">{ended ? t.ended : t.ends}</dt>
                    <dd className="text-navy">{formatDay(cause.endsOn, intlLocale)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-ink">{t.zakatEligible}</dt>
                  <dd className="text-navy">{cause.acceptsZakat ? t.yes : t.no}</dd>
                </div>
              </dl>
              {ended ? (
                <p className="rounded-2xl bg-black/[0.03] p-4 text-sm text-muted-ink">{t.closedNote}</p>
              ) : (
                <Link
                  href={localizedPath(locale, "/zakat/pay")}
                  title={t.giveTitle}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand py-3.5 text-sm text-white transition-all duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {cause.acceptsZakat ? t.give : t.support}
                </Link>
              )}
              <p className="text-xs text-muted-ink">{t.paymentNote}</p>
            </aside>
          </div>
        </Section>
        <CtaBand title={t.cta.title} body={t.cta.body} primary={primary} secondary={secondary} />
      </SitePage>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: giving.breadcrumbs.home, path: "/" },
          { name: giving.causes.breadcrumb, path: "/causes" },
          { name: cause.title, path: causePath(id) },
        ])}
      />
    </>
  );
}
