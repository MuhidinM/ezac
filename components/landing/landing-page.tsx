import { Hero } from "./hero";
import { Navbar } from "./navbar";
import { TransparencyTicker } from "./transparency-ticker";
import { TrustStrip } from "./trust-strip";
import { VideoBackground } from "./video-background";
import { FeaturedWaqfCampaigns } from "./featured-waqf-campaigns";
import { HowItWorksTrust } from "./how-it-works-trust";
import { ImpactMapTeaser } from "./impact-map-teaser";
import { PartnersSponsors } from "./partners-sponsors";
import { SiteFooter } from "./site-footer";
import { ZakatCalculator } from "./zakat-calculator";

export function LandingPage() {
  return (
    <div className="relative w-full overflow-x-hidden bg-white">
      <div className="relative min-h-screen w-full overflow-hidden">
        <VideoBackground />
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand watermark served as a static asset */}
        <img
          src="/bg2.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 z-0 h-[70vh] w-auto select-none opacity-[0.05]"
        />
        <Navbar />
        <Hero />
      </div>
      <TrustStrip />
      <TransparencyTicker />
      <ZakatCalculator />
      <FeaturedWaqfCampaigns />
      <HowItWorksTrust />
      <ImpactMapTeaser />
      <PartnersSponsors />
      <SiteFooter />
    </div>
  );
}
