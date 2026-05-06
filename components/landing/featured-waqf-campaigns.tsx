type WaqfCampaign = {
  id: string;
  title: string;
  description: string;
  fundedPct: number;
  imageSrc: string;
  imageAlt: string;
};

const CAMPAIGNS: WaqfCampaign[] = [
  {
    id: "water-well",
    title: "Addis Ababa Water Well",
    description:
      "Permanent waqf borehole serving families without reliable clean water. Funding completes drilling, pumps, and community upkeep.",
    fundedPct: 75,
    imageSrc:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80",
    imageAlt: "Community water pump and families collecting clean water",
  },
  {
    id: "madrasa",
    title: "Rural Madrasa Rebuild",
    description:
      "Structural repairs and classrooms for a waqf-run Quranic school in Oromia—roofing, desks, and safe sanitation.",
    fundedPct: 42,
    imageSrc:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    imageAlt: "School desks and books in a classroom",
  },
  {
    id: "orphan-wing",
    title: "Orphan Housing Wing",
    description:
      "Final phase of a dedicated residence wing under waqf management—bedding, meals program, and resident guardians.",
    fundedPct: 88,
    imageSrc:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773f?w=800&q=80",
    imageAlt: "Children playing outdoors at a community home",
  },
];

export function FeaturedWaqfCampaigns() {
  return (
    <section className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-8 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#6F6F6F" }}
          >
            Urgent impact
          </p>
          <h2
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{
              color: "#000000",
              lineHeight: 1,
              letterSpacing: "-1.8px",
            }}
          >
            Featured{" "}
            <span className="italic" style={{ color: "#6F6F6F" }}>
              Waqf
            </span>{" "}
            crowdfunding campaigns.
          </h2>
          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: "#6F6F6F" }}
          >
            Shari&apos;ah-reviewed projects you can fund alongside your Zakat.
            Every listing shows transparent progress toward its waqf goal.
          </p>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-6xl">
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
            {CAMPAIGNS.map((campaign) => (
              <article
                key={campaign.id}
                className="w-[min(100%,320px)] shrink-0 snap-center rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5 md:w-auto md:shrink"
              >
                <div className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white">
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote campaign thumbnails; no static assets yet */}
                    <img
                      src={campaign.imageSrc}
                      alt={campaign.imageAlt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col gap-3 p-5 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
                        style={{ color: "#6F6F6F" }}
                      >
                        Shari&apos;ah Certified
                      </span>
                    </div>
                    <h3
                      className="font-serif-display text-xl leading-tight sm:text-2xl"
                      style={{
                        color: "#000000",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {campaign.title}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "#6F6F6F" }}>Funded</span>
                        <span style={{ color: "#000000", fontWeight: 500 }}>
                          {campaign.fundedPct}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                      >
                        <div
                          className="h-full rounded-full transition-[width]"
                          style={{
                            width: `${campaign.fundedPct}%`,
                            backgroundColor: "#000000",
                          }}
                        />
                      </div>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#6F6F6F" }}
                    >
                      {campaign.description}
                    </p>
                    <button
                      type="button"
                      className="mt-1 inline-flex w-full items-center justify-center rounded-full py-3.5 text-sm transition-all duration-300 hover:scale-[1.01]"
                      style={{
                        backgroundColor: "#000000",
                        color: "#FFFFFF",
                      }}
                    >
                      Fund This Project
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
