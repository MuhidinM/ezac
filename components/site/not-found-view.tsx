"use client";

import { Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { LocalizedLink, useI18n } from "@/lib/i18n/client";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

/**
 * The 404 page body. A client component because not-found.tsx gets no route
 * params: the language comes from the provider in app/[lang]/layout.tsx.
 */
export function NotFoundView() {
  const { common } = useI18n();
  const t = common.errors.notFound;

  return (
    <SitePage eyebrow={t.eyebrow} title={t.title} accent={t.accent} intro={t.body}>
      <Section>
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
          <LocalizedLink
            href="/"
            title={t.goHome.title}
            className={`inline-flex items-center justify-center rounded-full bg-brand px-7 py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.03] ${FOCUS_RING}`}
          >
            {t.goHome.label}
          </LocalizedLink>
          <LocalizedLink
            href="/causes"
            title={t.seeCauses.title}
            className={`inline-flex items-center justify-center rounded-full border border-black/15 px-7 py-3.5 text-sm text-navy transition-colors hover:bg-black/[0.03] ${FOCUS_RING}`}
          >
            {t.seeCauses.label}
          </LocalizedLink>
        </div>
      </Section>
    </SitePage>
  );
}
