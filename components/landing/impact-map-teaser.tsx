 "use client";

import { useEffect, useRef } from "react";

import type { ImpactRegion } from "@/lib/zakat/impact";

function markerTitle(region: ImpactRegion) {
  const parts = [region.name];
  if (region.beneficiaries) parts.push(`${region.beneficiaries.toLocaleString()} beneficiaries`);
  if (region.distributedFundsEtb) parts.push(`ETB ${region.distributedFundsEtb.toLocaleString()} distributed`);
  if (region.activeProjects) parts.push(`${region.activeProjects} active projects`);
  return parts.join(" · ");
}

declare global {
  interface Window {
    google?: any;
  }
}

/** One marker per region, from GET /api/zakat/v1/impact/regions (passed in by the server page). */
export function ImpactMapTeaser({ regions = [] }: { regions?: ImpactRegion[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    const initializeMap = () => {
      if (!window.google?.maps || !mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 9.145, lng: 40.4897 },
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      regions.forEach((region) => {
        new window.google.maps.Marker({
          position: { lat: region.latitude, lng: region.longitude },
          map,
          title: markerTitle(region),
        });
      });
    };

    if (window.google?.maps) {
      initializeMap();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="impact-map"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", initializeMap);
      return () => existingScript.removeEventListener("load", initializeMap);
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "impact-map";
    script.addEventListener("load", initializeMap);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initializeMap);
    };
  }, [apiKey, regions]);

  return (
    <section className="relative z-10 w-full overflow-hidden border-t border-black/5 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand graphic served as a static asset */}
      <img
        src="/bg2.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-[-30%] z-0 h-[200%] w-auto max-w-none -translate-y-1/5 select-none invert opacity-[0.14]"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-8 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#6F6F6F" }}
          >
            Nationwide visibility
          </p>
          <h2
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{
              color: "#001539",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            The impact{" "}
            <span className="italic" style={{ color: "#e18f35" }}>
              map
            </span>{" "}
            teaser.
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-5xl rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
          <div
            className="relative overflow-hidden rounded-2xl border border-black/5 p-0"
            style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
          >
            <div className="relative aspect-5/3 w-full overflow-hidden rounded-2xl border border-black/10">
              {apiKey ? (
                <div ref={mapRef} className="h-full w-full" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center px-6 text-center text-sm"
                  style={{ color: "#6F6F6F" }}
                >
                  Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable interactive map
                  markers.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/transparency/dashboard"
            className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm transition-all duration-300 hover:scale-[1.01]"
            style={{ backgroundColor: "#007050", color: "#FFFFFF" }}
          >
            View Full Transparency Dashboard
          </a>
        </div>
      </div>
    </section>
  );
}
