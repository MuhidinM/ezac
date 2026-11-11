"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { LocalizedLink, useI18n } from "@/lib/i18n/client";
import { type Locale, splitLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";
import { foreignLang } from "@/lib/zakat/content";
import type { ImpactRegion } from "@/lib/zakat/impact";

import { useNearViewport } from "./use-deferred-load";

type Strings = Dictionary["home"]["impactMap"];

/** The few pieces of the Google Maps JS API this component touches. */
type LatLng = { lat: number; lng: number };
type MapConstructor = new (
  element: HTMLElement,
  options: {
    center: LatLng;
    zoom: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  },
) => object;
type MarkerConstructor = new (options: { position: LatLng; map: object; title?: string }) => object;
type GoogleMapsApi = {
  maps?: {
    importLibrary?: (name: "maps" | "marker") => Promise<{ Map?: MapConstructor; Marker?: MarkerConstructor }>;
    Map?: MapConstructor;
    Marker?: MarkerConstructor;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __ezacGoogleMapsReady?: () => void;
  }
}

// Map labels in the visitor's language where Google has it.
const MAP_LANGUAGE: Partial<Record<Locale, string>> = { en: "en", am: "am", ar: "ar" };

let mapsApi: Promise<NonNullable<GoogleMapsApi["maps"]>> | null = null;

/**
 * Loads the Maps JS API once per page, the way Google asks for it:
 * `loading=async` with a callback, then the libraries through importLibrary.
 */
function loadGoogleMaps(apiKey: string, locale: Locale) {
  if (mapsApi) return mapsApi;
  mapsApi = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }
    window.__ezacGoogleMapsReady = () => {
      delete window.__ezacGoogleMapsReady;
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps loaded without its API"));
    };
    const params = new URLSearchParams({ key: apiKey, loading: "async", callback: "__ezacGoogleMapsReady", region: "ET" });
    const language = MAP_LANGUAGE[locale];
    if (language) params.set("language", language);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.dataset.googleMaps = "impact-map";
    script.addEventListener("error", () => {
      mapsApi = null; // Let a later visit to the section try again.
      script.remove();
      reject(new Error("Google Maps failed to load"));
    });
    document.head.appendChild(script);
  });
  return mapsApi;
}

function regionFacts(region: ImpactRegion, t: Strings, intlLocale: string) {
  const count = new Intl.NumberFormat(intlLocale);
  const compact = new Intl.NumberFormat(intlLocale, { notation: "compact", maximumFractionDigits: 1 });
  const parts: string[] = [];
  if (region.beneficiaries) parts.push(format(t.beneficiaries, { count: count.format(region.beneficiaries) }));
  if (region.distributedFundsEtb) parts.push(format(t.distributed, { amount: compact.format(region.distributedFundsEtb) }));
  if (region.activeProjects) parts.push(format(t.projects, { count: count.format(region.activeProjects) }));
  return parts;
}

/**
 * One marker per region, from GET /api/zakat/v1/impact/regions (passed in by
 * the server page). Used on the home page and the transparency dashboard.
 */
export function ImpactMapTeaser({ regions = [], t }: { regions?: ImpactRegion[]; t: Strings }) {
  const { locale, intlLocale } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const showMap = Boolean(apiKey);
  // The map sits near the bottom of the page: only load Google Maps (a paid,
  // heavy script) once the visitor scrolls close to it.
  const nearViewport = useNearViewport(sectionRef, showMap);

  useEffect(() => {
    if (!apiKey || !nearViewport) return;
    let cancelled = false;

    loadGoogleMaps(apiKey, locale)
      .then(async (maps) => {
        const { Map: GoogleMap } = maps.importLibrary ? await maps.importLibrary("maps") : maps;
        const { Marker } = maps.importLibrary ? await maps.importLibrary("marker") : maps;
        const element = mapRef.current;
        if (cancelled || !element || !GoogleMap || !Marker) return;

        const map = new GoogleMap(element, {
          center: { lat: 9.145, lng: 40.4897 },
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        regions.forEach((region) => {
          new Marker({
            position: { lat: region.latitude, lng: region.longitude },
            map,
            title: [region.name, ...regionFacts(region, t, intlLocale)].join(" · "),
          });
        });
      })
      .catch(() => {
        // The section still shows its heading and the dashboard link.
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, nearViewport, regions, locale, intlLocale, t]);

  // Without a map key, a plain list of regions says the same thing; with no
  // regions either, there is nothing to show.
  if (!showMap && regions.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="impact-map-title"
      className="relative z-10 w-full overflow-hidden border-t border-black/5 bg-white"
    >
      {/* Decorative brand watermark: a CSS background, so it isn't an image without a description. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1 -end-[30%] z-0 aspect-[900/1245] h-[200%] -translate-y-1/5 bg-[url(/images/bg2.webp)] bg-contain bg-no-repeat opacity-[0.14] invert select-none"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-ink">{t.eyebrow}</p>
          <h2
            id="impact-map-title"
            className="font-serif-display mt-3 text-4xl leading-none tracking-[-1.8px] text-navy sm:text-5xl md:text-6xl"
          >
            {t.title.before} <span className="italic text-accent-ink">{t.title.accent}</span>
            {t.title.after}
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-5xl rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
          {showMap ? (
            <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-black/2 p-0">
              <div className="relative aspect-5/3 w-full overflow-hidden rounded-2xl border border-black/10">
                <div ref={mapRef} className="h-full w-full" role="region" aria-label={t.mapLabel} />
              </div>
            </div>
          ) : (
            <ul className="grid gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/5 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((region) => {
                const facts = regionFacts(region, t, intlLocale);
                return (
                  <li key={region.code} className="bg-white p-5">
                    <p lang={foreignLang(region.lang, locale)} className="font-medium text-navy">
                      {region.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-ink">{facts.length > 0 ? facts.join(" · ") : t.noFigures}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Already on the dashboard? Don't offer a link back to the same page. */}
        {splitLocale(pathname || "/").path !== "/transparency/dashboard" && (
          <div className="mt-8 flex justify-center">
            <LocalizedLink
              href="/transparency/dashboard"
              title={t.dashboardLink.title}
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3.5 text-sm text-white transition-all duration-300 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {t.dashboardLink.label}
            </LocalizedLink>
          </div>
        )}
      </div>
    </section>
  );
}
