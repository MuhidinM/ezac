import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getCalculatorConfig, getImpactRegions } from "@/lib/zakat/impact";

import { FeaturedCauses } from "./featured-causes";
import { Hero } from "./hero";
import { HowItWorksTrust } from "./how-it-works-trust";
import { ImpactMapTeaser } from "./impact-map-teaser";
import { Navbar } from "./navbar";
import { PartnersSponsors } from "./partners-sponsors";
import { SiteFooter } from "./site-footer";
import { TransparencyTicker } from "./transparency-ticker";
import { TrustStrip } from "./trust-strip";
import { VideoBackground } from "./video-background";
import { ZakatCalculator } from "./zakat-calculator";

/** The home page. Each section gets its slice of the dictionary in the visitor's language. */
export async function LandingPage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [regions, calculatorConfig] = await Promise.all([
    getImpactRegions(),
    // The ticker reads the same config in this render (one request); handing it to the
    // calculator saves the browser a second fetch. On failure the calculator fetches it itself.
    getCalculatorConfig().catch(() => null),
  ]);
  const { home } = dict;

  return (
    <div className="relative w-full overflow-x-hidden bg-white">
      {/* The navbar is position: fixed, so it can sit outside <main> without moving. */}
      <Navbar />
      {/* id="main" is the target of the skip link in app/[lang]/layout.tsx. */}
      <main id="main" tabIndex={-1} className="outline-none">
        <div className="relative min-h-screen w-full overflow-hidden">
          <VideoBackground />
          {/* Decorative brand watermark: a CSS background, so it is neither an
              image without a description nor the page's largest image. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-24 bottom-0 z-0 aspect-[900/1245] h-[70vh] bg-[url(/images/bg2.webp)] bg-contain bg-bottom bg-no-repeat opacity-[0.05] select-none"
          />
          <Hero t={home.hero} newTab={dict.common.newTab} locale={locale} />
        </div>
        <TrustStrip t={home.trustStrip} locale={locale} />
        <TransparencyTicker t={home.ticker} locale={locale} />
        <ZakatCalculator t={dict.calculator} initialConfig={calculatorConfig} />
        <FeaturedCauses t={home.causes} locale={locale} />
        <HowItWorksTrust t={home.howItWorks} locale={locale} />
        <ImpactMapTeaser regions={regions ?? []} t={home.impactMap} />
        <PartnersSponsors t={home.partners} />
      </main>
      <SiteFooter />
    </div>
  );
}
