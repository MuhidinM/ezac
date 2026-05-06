"use client";

import { Sparkles } from "@/components/ui/sparkles";

type Partner = {
  name: string;
  short: string;
};

const PARTNERS: Partner[] = [
  { name: "Supreme Council of Islamic Affairs (Majlis)", short: "Majlis" },
  { name: "Coopbank Alhuda", short: "Alhuda" },
  { name: "DX Valley", short: "DX Valley" },
  { name: "Fayda", short: "Fayda" },
  { name: "EthSwitch", short: "EthSwitch" },
];

export function PartnersSponsors() {
  return (
    <section className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-8 pt-20 pb-0">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#6F6F6F" }}
          >
            Institutional backing
          </p>
          <h2
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{
              color: "#000000",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            Partners{" "}
            <span className="italic" style={{ color: "#6F6F6F" }}>
              & sponsors
            </span>
            .
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-3xl bg-white p-0">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-linear-to-b from-white to-black/3 px-6 py-16">
            <Sparkles
              className="pointer-events-none absolute inset-0"
              color="#000000"
              opacity={0.18}
              size={1.6}
              speed={0.45}
              density={90}
            />

            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-white to-transparent" />

            <div className="group relative overflow-hidden">
              <div className="flex w-max animate-[partners-marquee_28s_linear_infinite] gap-3 group-hover:paused">
                {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
                  <div
                    key={`${partner.name}-${idx}`}
                    className="flex min-w-[240px] items-center gap-3 rounded-xl border border-black/10 bg-white/80 px-4 py-3 backdrop-blur-[1px]"
                    style={{ color: "#666666", filter: "grayscale(100%)" }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/3 text-[11px] font-semibold uppercase tracking-[0.08em]">
                      {partner.short.slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium">{partner.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes partners-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
