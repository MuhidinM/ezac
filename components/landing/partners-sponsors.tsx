"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";

import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";

import { COOPBANK_ALHUDA_LOGO, COOPBANK_ALHUDA_URL, DX_VALLEY_LOGO, DX_VALLEY_URL } from "./partner-links";
import { useIdleAfterLoad, useMediaQuery, useNearViewport } from "./use-deferred-load";

type Strings = Dictionary["home"]["partners"];
type PartnerKey = keyof Strings["names"];

// tsparticles is heavy: its code is fetched only when the effect is shown.
const Sparkles = dynamic(() => import("@/components/ui/sparkles").then((module) => module.Sparkles), { ssr: false });

type Partner = {
  key: PartnerKey;
  short: string;
  logo?: { src: string; width: number; height: number };
  href?: string;
  logoClassName?: string;
};

const PARTNERS: Partner[] = [
  { key: "majlis", short: "Majlis" },
  {
    key: "coopbank",
    short: "Alhuda",
    logo: COOPBANK_ALHUDA_LOGO,
    href: COOPBANK_ALHUDA_URL,
    logoClassName: "h-8 w-auto sm:h-9",
  },
  {
    key: "dxvalley",
    short: "DX Valley",
    logo: DX_VALLEY_LOGO,
    href: DX_VALLEY_URL,
    logoClassName: "h-7 w-auto sm:h-8",
  },
  { key: "fayda", short: "Fayda" },
  { key: "ethswitch", short: "EthSwitch" },
];

function PartnerMark({ partner, name, visitTitle, newTab, hidden }: {
  partner: Partner;
  name: string;
  visitTitle: string;
  newTab: string;
  /** A marquee repeat: out of the tab order and hidden from screen readers. */
  hidden: boolean;
}) {
  if (partner.logo) {
    const logo = (
      /* eslint-disable-next-line @next/next/no-img-element -- partner logo served as an optimized static asset */
      <img
        src={partner.logo.src}
        width={partner.logo.width}
        height={partner.logo.height}
        alt={name}
        loading="lazy"
        className={`object-contain ${partner.logoClassName ?? "h-8 w-auto"}`}
      />
    );

    if (partner.href) {
      return (
        <a
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
          title={visitTitle}
          tabIndex={hidden ? -1 : undefined}
          className="shrink-0 rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {logo}
          <span className="sr-only"> {newTab}</span>
        </a>
      );
    }

    return <div className="shrink-0">{logo}</div>;
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/3 text-xs font-semibold uppercase tracking-[0.08em]"
    >
      {partner.short.slice(0, 2)}
    </div>
  );
}

/**
 * The sparkle effect is decoration: it loads only on md screens and up,
 * without reduced motion, once the section is close and the page is idle.
 */
function useShowSparkles(ref: React.RefObject<HTMLElement | null>) {
  const wideScreen = useMediaQuery("(min-width: 768px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const allowed = wideScreen && !reducedMotion;
  const near = useNearViewport(ref, allowed);
  return useIdleAfterLoad(allowed && near);
}

export function PartnersSponsors({ t }: { t: Strings }) {
  const { common } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const showSparkles = useShowSparkles(sectionRef);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="partners-title"
      className="relative z-10 w-full border-t border-black/5 bg-white"
    >
      <div className="mx-auto max-w-7xl px-8 pt-20 pb-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-ink">{t.eyebrow}</p>
          <h2
            id="partners-title"
            className="font-serif-display mt-3 text-4xl leading-none tracking-[-1.8px] text-navy sm:text-5xl md:text-6xl"
          >
            {t.title.before} <span className="italic text-accent-ink">{t.title.accent}</span>
            {t.title.after}
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-3xl bg-white p-0">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-linear-to-b from-white to-black/3 px-6 py-16">
            {showSparkles ? (
              <Sparkles
                className="pointer-events-none absolute inset-0"
                // Canvas colour, so a value rather than a class: the brand green.
                color="#007050"
                opacity={0.18}
                size={1.6}
                speed={0.45}
                density={90}
              />
            ) : null}

            {/* Edge fades. They mirror each other, so they need no RTL variant. */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-white to-transparent" />

            <div className="group relative overflow-hidden">
              {/* The list runs twice for a seamless loop (keyframes in globals.css;
                  marquee-rtl scrolls the other way for Arabic). The second copy is
                  hidden from screen readers and the tab order, and dropped when
                  motion is reduced. */}
              <ul className="flex w-max animate-[marquee_28s_linear_infinite] gap-3 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] rtl:animate-[marquee-rtl_28s_linear_infinite] motion-reduce:w-auto motion-reduce:animate-none! motion-reduce:flex-wrap motion-reduce:justify-center">
                {[...PARTNERS, ...PARTNERS].map((partner, idx) => {
                  const repeat = idx >= PARTNERS.length;
                  const name = t.names[partner.key];
                  return (
                    <li
                      key={`${partner.key}-${idx}`}
                      aria-hidden={repeat || undefined}
                      className={`flex items-center rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-muted-ink backdrop-blur-[1px] ${
                        partner.logo ? "justify-center" : "min-w-[240px] gap-3 grayscale"
                      } ${repeat ? "motion-reduce:hidden" : ""}`}
                    >
                      <PartnerMark
                        partner={partner}
                        name={name}
                        visitTitle={format(t.visit, { name })}
                        newTab={common.newTab}
                        hidden={repeat}
                      />
                      {!partner.logo ? <span className="text-sm font-medium">{name}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
