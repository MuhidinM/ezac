"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ImpactRegion } from "@/lib/zakat/impact";

/** The few pieces of the Google Maps JS API this component touches. */
type LatLng = { lat: number; lng: number };
type GoogleMapsApi = {
  maps?: {
    Map: new (
      element: HTMLElement,
      options: {
        center: LatLng;
        zoom: number;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      },
    ) => object;
    Marker: new (options: { position: LatLng; map: object; title?: string }) => object;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

const etbCompact = new Intl.NumberFormat("en-ET", { notation: "compact", maximumFractionDigits: 1 });
const count = new Intl.NumberFormat("en-ET");

function regionFacts(region: ImpactRegion) {
  const parts: string[] = [];
  if (region.beneficiaries) parts.push(`${count.format(region.beneficiaries)} beneficiaries`);
  if (region.distributedFundsEtb) parts.push(`ETB ${etbCompact.format(region.distributedFundsEtb)} distributed`);
  if (region.activeProjects) parts.push(`${count.format(region.activeProjects)} active projects`);
  return parts;
}

function markerTitle(region: ImpactRegion) {
  return [region.name, ...regionFacts(region)].join(" · ");
}

/** One marker per region, from GET /api/zakat/v1/impact/regions (passed in by the server page). */
export function ImpactMapTeaser({ regions = [] }: { regions?: ImpactRegion[] }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const pathname = usePathname();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const showMap = Boolean(apiKey);

  // The map sits near the bottom of the page: only load Google Maps (a paid,
  // heavy script) once the visitor scrolls close to it.
  useEffect(() => {
    const section = sectionRef.current;
    if (!showMap || !section) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setNearViewport(true), 0);
      return () => window.clearTimeout(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [showMap]);

  useEffect(() => {
    if (!apiKey || !nearViewport || !mapRef.current) return;

    const initializeMap = () => {
      const maps = window.google?.maps;
      if (!maps || !mapRef.current) return;

      const map = new maps.Map(mapRef.current, {
        center: { lat: 9.145, lng: 40.4897 },
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      regions.forEach((region) => {
        new maps.Marker({
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "impact-map";
    script.addEventListener("load", initializeMap);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initializeMap);
    };
  }, [apiKey, nearViewport, regions]);

  // Without a map key, a plain list of regions says the same thing; with no
  // regions either, there is nothing to show.
  if (!showMap && regions.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full overflow-hidden border-t border-black/5 bg-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand graphic served as a static asset */}
      <img
        src="/bg2.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-[-30%] z-0 h-[200%] w-auto max-w-none -translate-y-1/5 select-none invert opacity-[0.14]"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:px-8">
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
            Where support{" "}
            <span className="italic" style={{ color: "#e18f35" }}>
              reaches
            </span>
            .
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-5xl rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
          {showMap ? (
            <div
              className="relative overflow-hidden rounded-2xl border border-black/5 p-0"
              style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
            >
              <div className="relative aspect-5/3 w-full overflow-hidden rounded-2xl border border-black/10">
                <div
                  ref={mapRef}
                  className="h-full w-full"
                  role="region"
                  aria-label="Map of regions reached"
                />
              </div>
            </div>
          ) : (
            <ul className="grid gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/5 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((region) => {
                const facts = regionFacts(region);
                return (
                  <li key={region.code} className="bg-white p-5">
                    <p className="font-medium" style={{ color: "#001539" }}>
                      {region.name}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "#6F6F6F" }}>
                      {facts.length > 0 ? facts.join(" · ") : "No figures published yet"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Already on the dashboard? Don't offer a link back to the same page. */}
        {pathname !== "/transparency/dashboard" && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/transparency/dashboard"
              className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm transition-all duration-300 hover:scale-[1.01]"
              style={{ backgroundColor: "#007050", color: "#FFFFFF" }}
            >
              View Full Transparency Dashboard
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
