import Link from "next/link";
import { ArrowRightIcon, BadgeCheckIcon, ClipboardCheckIcon, LockIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { type Locale, localizedPath } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";

/** One icon per step in home.howItWorks.steps, in the same order. */
const STEP_ICONS: LucideIcon[] = [BadgeCheckIcon, ClipboardCheckIcon, LockIcon];

export function HowItWorksTrust({ t, locale }: { t: Dictionary["home"]["howItWorks"]; locale: Locale }) {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="relative z-10 w-full overflow-hidden border-t border-black/5 bg-brand"
    >
      {/* Decorative brand graphic: a CSS background, so it isn't an image without a description. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -end-[12%] z-0 aspect-[1200/1038] h-[150%] -translate-y-1/2 bg-[url(/images/bg.webp)] bg-contain bg-no-repeat opacity-60 select-none"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-8 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-white/90">{t.eyebrow}</p>
          <h2
            id="how-it-works-title"
            className="font-serif-display mt-3 text-4xl leading-none tracking-[-1.8px] text-white sm:text-5xl md:text-6xl"
          >
            {t.title}
          </h2>
          {/* The direct answer to the heading's question, before the detail. */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">{t.intro}</p>
        </div>

        <ol className="relative mx-auto mt-12 grid w-full max-w-6xl gap-5 md:grid-cols-3 md:gap-6">
          {t.steps.map(({ title, description }, idx) => {
            const Icon = STEP_ICONS[idx] ?? BadgeCheckIcon;
            return (
              <li key={title} className="rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
                <article className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      aria-hidden="true"
                      className="rounded-full border border-black/10 px-2.5 py-1 text-xs uppercase tracking-[0.12em] text-muted-ink"
                    >
                      {format(t.step, { n: idx + 1 })}
                    </span>
                    <span className="rounded-full border border-black/10 p-2">
                      <Icon aria-hidden="true" className="h-4 w-4 text-navy" />
                    </span>
                  </div>
                  <h3 className="font-serif-display text-2xl leading-tight tracking-[-0.5px] text-navy">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-ink">{description}</p>
                </article>
              </li>
            );
          })}
        </ol>

        <div className="relative mt-10 text-center">
          <Link
            href={localizedPath(locale, "/how-it-works")}
            title={t.cta.title}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
          >
            {t.cta.label}
            <ArrowRightIcon aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
