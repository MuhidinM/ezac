import { Hero } from "./hero";
import { Navbar } from "./navbar";
import { TransparencyTicker } from "./transparency-ticker";
import { TrustStrip } from "./trust-strip";
import { VideoBackground } from "./video-background";
import { ZakatCalculator } from "./zakat-calculator";

export function LandingPage() {
  return (
    <div className="relative w-full overflow-x-hidden bg-white">
      <div className="relative min-h-screen w-full overflow-hidden">
        <VideoBackground />
        <Navbar />
        <Hero />
      </div>
      <TrustStrip />
      <TransparencyTicker />
      <ZakatCalculator />
    </div>
  );
}
