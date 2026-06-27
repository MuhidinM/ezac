"use client";

import { Sparkles } from "@/components/ui/sparkles";

type Partner = {
  name: string;
  short: string;
  logoSrc?: string;
  href?: string;
  logoClassName?: string;
};

const PARTNERS: Partner[] = [
  { name: "Supreme Council of Islamic Affairs (Majlis)", short: "Majlis" },
  {
    name: "Coopbank Alhuda",
    short: "Alhuda",
    logoSrc: "/Coopbank-Alhuda-Logo.png",
    href: "https://coopbankoromia.com.et/coopbank-alhuda/",
    logoClassName: "h-8 w-auto sm:h-9",
  },
  {
    name: "DX Valley",
    short: "DX Valley",
    logoSrc: "/dxvalley-logo.png",
    href: "https://dxvalley.com/",
    logoClassName: "h-7 w-auto sm:h-8",
  },
  { name: "Fayda", short: "Fayda" },
  { name: "EthSwitch", short: "EthSwitch" },
];

function PartnerMark({ partner }: { partner: Partner }) {
  if (partner.logoSrc) {
    const logo = (
      /* eslint-disable-next-line @next/next/no-img-element -- partner logo served as a static asset */
      <img
        src={partner.logoSrc}
        alt={partner.name}
        className={`object-contain ${partner.logoClassName ?? "h-8 w-auto"}`}
      />
    );

    if (partner.href) {
      return (
        <a
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 transition-opacity hover:opacity-80"
        >
          {logo}
        </a>
      );
    }

    return <div className="shrink-0">{logo}</div>;
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/3 text-[11px] font-semibold uppercase tracking-[0.08em]">
      {partner.short.slice(0, 2)}
    </div>
  );
}

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
              color: "#001539",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            Partners{" "}
            <span className="italic" style={{ color: "#e18f35" }}>
              & sponsors
            </span>
            .
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-3xl bg-white p-0">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-linear-to-b from-white to-black/3 px-6 py-16">
            <Sparkles
              className="pointer-events-none absolute inset-0"
              color="#007050"
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
                    className={`flex items-center rounded-xl border border-black/10 bg-white/80 px-4 py-3 backdrop-blur-[1px] ${
                      partner.logoSrc ? "justify-center" : "min-w-[240px] gap-3"
                    }`}
                    style={
                      partner.logoSrc
                        ? { color: "#666666" }
                        : { color: "#666666", filter: "grayscale(100%)" }
                    }
                  >
                    <PartnerMark partner={partner} />
                    {!partner.logoSrc ? (
                      <span className="text-sm font-medium">{partner.name}</span>
                    ) : null}
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
