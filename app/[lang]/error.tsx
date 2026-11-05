"use client"; // Error boundaries must be Client Components.

import { useLoggedError } from "@/components/errors/use-logged-error";
import { Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { LocalizedLink, useI18n } from "@/lib/i18n/client";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

/**
 * Catches render errors in public pages (the portal has its own boundary in
 * app/dashboard/error.tsx). A public page that can't reach the zakat service
 * and has no cached copy lands here too. Errors in the root layout itself go
 * to app/global-error.tsx.
 */
export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = useLoggedError("site", error);
  const { common } = useI18n();
  const t = common.errors.error;

  return (
    <SitePage eyebrow={t.eyebrow} title={t.title} accent={t.accent} intro={t.body}>
      <title>{`${t.metaTitle} — ${common.site.name}`}</title>
      <meta name="robots" content="noindex" />
      <Section>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {/* retry() fetches the page again, so it also recovers from a brief outage. */}
            <button
              type="button"
              onClick={() => retry()}
              className={`inline-flex items-center justify-center rounded-full bg-brand px-7 py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:scale-[1.03] ${FOCUS_RING}`}
            >
              {t.tryAgain}
            </button>
            <LocalizedLink
              href="/"
              title={t.goHome.title}
              className={`inline-flex items-center justify-center rounded-full border border-black/15 px-7 py-3.5 text-sm text-navy transition-colors hover:bg-black/[0.03] ${FOCUS_RING}`}
            >
              {t.goHome.label}
            </LocalizedLink>
          </div>
          {reference ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-ink">
                {t.contact.before}{" "}
                <LocalizedLink
                  href="/contact"
                  title={t.contact.title}
                  className="rounded-sm text-brand underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {t.contact.link}
                </LocalizedLink>{" "}
                {t.contact.after}
              </p>
              {/* Support can match the reference to the server log entry, so the page never shows the raw error. */}
              <p className="text-xs text-muted-ink">
                {t.reference}{" "}
                <span dir="ltr" className="font-mono text-navy select-all">
                  {reference}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      </Section>
    </SitePage>
  );
}
