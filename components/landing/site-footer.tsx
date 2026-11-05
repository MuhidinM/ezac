"use client";

import Link from "next/link";
import { DownloadIcon } from "lucide-react";

import { CITIZEN_APP_DOWNLOAD_URL } from "@/lib/constants/app-download";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";

import { DX_VALLEY_URL } from "./partner-links";

type FooterLinkKey = keyof Dictionary["common"]["footer"]["links"];

// There is no Terms page yet; add it here once the Commission publishes one.
const FOOTER_LINKS: { key: FooterLinkKey; href: string }[] = [
  { key: "privacy", href: "/privacy" },
  { key: "faq", href: "/faq" },
  { key: "fatwas", href: "/fatwas" },
  { key: "contact", href: "/contact" },
];

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

// Social links are left out until the Commission confirms its official
// accounts; add them here (with the right brand icons) once it does.

/**
 * A client component so it can read the shared strings from the language
 * context: it renders under server pages and under the error boundary alike.
 */
export function SiteFooter() {
  const { common, href } = useI18n();
  const footer = common.footer;

  return (
    <footer className="relative z-10 w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-0 pb-16 sm:px-8">
        <div className="rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
          <div className="rounded-2xl border border-black/5 px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-10">
              <Link
                href={href("/")}
                title={common.nav.home.title}
                className={`flex w-fit items-center gap-3 rounded-sm ${FOCUS_RING}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
                <img src="/logo.svg" alt={common.site.logoAlt} width={36} height={36} className="h-9 w-auto" />
                <span className="flex flex-col leading-tight">
                  <span className="font-serif-display text-lg tracking-tight text-navy">{common.site.name}</span>
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-ink">{common.nav.home.tagline}</span>
                </span>
              </Link>

              <div className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-black/2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-ink">{footer.app.eyebrow}</p>
                  <p className="font-serif-display mt-1.5 text-2xl tracking-[-0.5px] text-navy sm:text-3xl">
                    {footer.app.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-ink">{footer.app.body}</p>
                </div>
                {/* One honest button: the only build is an Android APK, so no store badges. */}
                <a
                  href={CITIZEN_APP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={footer.app.downloadTitle}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm text-navy transition-colors hover:bg-black/2 ${FOCUS_RING}`}
                >
                  <DownloadIcon aria-hidden="true" className="h-4 w-4" />
                  {footer.app.download}
                  <span className="sr-only"> {footer.app.downloadNote}</span>
                </a>
              </div>

              <nav
                aria-label={footer.ariaLabel}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8 md:flex md:flex-wrap md:gap-x-6"
              >
                {FOOTER_LINKS.map((link) => (
                  <Link
                    key={link.key}
                    href={href(link.href)}
                    title={footer.links[link.key].title}
                    className={`w-fit rounded-sm text-sm text-muted-ink transition-colors hover:text-navy ${FOCUS_RING}`}
                  >
                    {footer.links[link.key].label}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-2 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-ink">{format(footer.copyright, { year: new Date().getFullYear() })}</p>
                <a
                  href={DX_VALLEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={footer.developedByTitle}
                  className={`w-fit rounded-sm text-xs text-accent-ink transition-colors hover:text-brand ${FOCUS_RING}`}
                >
                  {footer.developedBy}
                  <span className="sr-only"> {common.newTab}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
