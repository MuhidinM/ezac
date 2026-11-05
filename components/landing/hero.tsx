import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { type Locale, localizedPath } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

import { COOPBANK_ALHUDA_LOGO, COOPBANK_ALHUDA_URL, DX_VALLEY_LOGO, DX_VALLEY_URL } from "./partner-links";

// The fade-rise classes start at opacity 0. With reduced motion, skip the
// animation and show the text at once (! beats the unlayered global CSS).
const SHOW_WITHOUT_MOTION = "motion-reduce:animate-none! motion-reduce:opacity-100!";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

export function Hero({ t, newTab, locale }: { t: Dictionary["home"]["hero"]; newTab: string; locale: Locale }) {
  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center px-6 pt-48 pb-32 text-center">
      <h1
        className={`animate-fade-rise font-serif-display text-6xl leading-[0.95] font-normal tracking-[-2.46px] text-navy sm:text-7xl md:text-8xl ${SHOW_WITHOUT_MOTION}`}
      >
        <span className="italic text-accent-ink">{t.title.accent1}</span> {t.title.text1}{" "}
        <span className="italic text-accent-ink">{t.title.accent2}</span> {t.title.text2}
      </h1>

      <p
        className={`animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-muted-ink sm:text-lg ${SHOW_WITHOUT_MOTION}`}
      >
        {t.body}
      </p>

      <div className={`animate-fade-rise-delay-2 mt-12 flex flex-col items-center gap-4 sm:flex-row ${SHOW_WITHOUT_MOTION}`}>
        <Link
          href={localizedPath(locale, "/zakat/calculator")}
          title={t.calculate.title}
          className={`inline-flex items-center gap-2 rounded-full bg-brand px-10 py-5 text-base text-white transition-transform duration-300 hover:scale-[1.03] ${FOCUS_RING}`}
        >
          {t.calculate.label}
          <ArrowRightIcon aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100" />
        </Link>

        {/* Households are registered at a branch or by a field officer, not
            online: explain that instead of sending them to the staff sign-in. */}
        <Link
          href={localizedPath(locale, "/how-it-works#receiving")}
          title={t.receive.title}
          className={`group relative isolate inline-flex overflow-hidden rounded-full border border-navy px-8 py-5 text-base ${FOCUS_RING}`}
        >
          {/* The fill sweeps in from the reading start: the left in English, the right in Arabic. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 bg-navy transition-transform duration-500 ease-out ltr:-translate-x-full rtl:translate-x-full group-hover:translate-x-0"
          />
          <span className="relative z-10 inline-flex items-center gap-2 text-navy transition-colors duration-500 group-hover:text-white">
            {t.receive.label}
            <ArrowRightIcon
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-500 rtl:-scale-x-100 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            />
          </span>
        </Link>
      </div>

      <div className={`animate-fade-rise-delay-2 mt-auto w-full pt-20 ${SHOW_WITHOUT_MOTION}`}>
        <p className="text-xs uppercase tracking-[0.16em] text-muted-ink">{t.partnersLabel}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          <a
            href={COOPBANK_ALHUDA_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={t.partners.coopbank.title}
            className={`rounded-sm transition-opacity hover:opacity-80 ${FOCUS_RING}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- partner logo served as an optimized static asset */}
            <img
              src={COOPBANK_ALHUDA_LOGO.src}
              width={COOPBANK_ALHUDA_LOGO.width}
              height={COOPBANK_ALHUDA_LOGO.height}
              alt={t.partners.coopbank.alt}
              className="h-9 w-auto object-contain sm:h-10"
            />
            <span className="sr-only"> {newTab}</span>
          </a>
          <a
            href={DX_VALLEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={t.partners.dxvalley.title}
            className={`rounded-sm transition-opacity hover:opacity-80 ${FOCUS_RING}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- partner logo served as an optimized static asset */}
            <img
              src={DX_VALLEY_LOGO.src}
              width={DX_VALLEY_LOGO.width}
              height={DX_VALLEY_LOGO.height}
              alt={t.partners.dxvalley.alt}
              className="h-8 w-auto object-contain sm:h-9"
            />
            <span className="sr-only"> {newTab}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
