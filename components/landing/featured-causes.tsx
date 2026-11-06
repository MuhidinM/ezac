import Link from "next/link";

import { CauseCard } from "@/components/site/cause-card";
import { type Locale, localizedPath } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getCauses } from "@/lib/zakat/impact";

const LINK_CLASS =
  "rounded-sm text-sm font-medium text-brand underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

/**
 * Featured causes from zakat-engine: urgent ones first, else the newest
 * active ones. Only real, published causes are shown: when the service can't
 * be reached the section is left out, and when nothing is open it says so.
 */
export async function FeaturedCauses({ t, locale }: { t: Dictionary["home"]["causes"]; locale: Locale }) {
  const urgent = await getCauses({ urgent: true, limit: 6 });
  const showingUrgent = Boolean(urgent?.items.length);
  const page = showingUrgent ? urgent : await getCauses({ limit: 6 });
  if (!page) return null;
  const open = page.items;
  // Nothing open: show the latest completed causes rather than an empty section.
  const closed = open.length === 0 ? ((await getCauses({ status: "closed", limit: 3 }).catch(() => null))?.items ?? []) : [];
  const showingClosed = closed.length > 0;
  const causes = showingClosed ? closed : open;
  // Only call them urgent when they are: the fallback is the newest open causes.
  const eyebrow = showingClosed
    ? t.eyebrowClosed
    : causes.length === 0
      ? t.eyebrowEmpty
      : showingUrgent
        ? t.eyebrowUrgent
        : t.eyebrowOpen;

  return (
    <section aria-labelledby="featured-causes-title" className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-ink">{eyebrow}</p>
          <h2
            id="featured-causes-title"
            className="font-serif-display mt-3 text-4xl leading-none tracking-[-1.8px] text-navy sm:text-5xl md:text-6xl"
          >
            {t.title.before} <span className="italic text-accent-ink">{t.title.accent}</span> {t.title.after}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-ink sm:text-lg">
            {showingClosed ? t.introClosed : causes.length > 0 ? t.intro : t.introEmpty}
          </p>
        </div>

        {causes.length > 0 ? (
          <>
            <div className="mx-auto mt-12 grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {causes.slice(0, 3).map((cause) => (
                <CauseCard key={cause.id} cause={cause} locale={locale} closed={showingClosed} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href={localizedPath(locale, showingClosed ? "/causes?status=closed" : "/causes")}
                title={showingClosed ? t.seeClosed.title : t.seeAll.title}
                className={LINK_CLASS}
              >
                {showingClosed ? t.seeClosed.label : t.seeAll.label}
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-8 text-center">
            <Link
              href={localizedPath(locale, "/how-it-works#receiving")}
              title={t.howReaches.title}
              className={LINK_CLASS}
            >
              {t.howReaches.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
