 "use client";

import { useEffect, useRef } from "react";

const IMPACT_POINTS = [
  { label: "Mekelle", lat: 13.4967, lng: 39.4753 },
  { label: "Bahir Dar", lat: 11.5742, lng: 37.3614 },
  { label: "Addis Ababa", lat: 8.9806, lng: 38.7578 },
  { label: "Adama", lat: 8.54, lng: 39.27 },
  { label: "Jimma", lat: 7.6736, lng: 36.8344 },
  { label: "Hawassa", lat: 7.0621, lng: 38.4764 },
];

declare global {
  interface Window {
    google?: any;
  }
}

export function ImpactMapTeaser() {
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

      IMPACT_POINTS.forEach((point) => {
        new window.google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map,
          title: point.label,
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
  }, [apiKey]);

  return (
    <section className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-8 py-24">
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
              color: "#000000",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            The impact{" "}
            <span className="italic" style={{ color: "#6F6F6F" }}>
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
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm transition-all duration-300 hover:scale-[1.01]"
            style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
          >
            View Full Transparency Dashboard
          </button>
        </div>
      </div>
    </section>
  );
}
