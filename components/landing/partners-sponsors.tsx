const PARTNERS = [
  "Supreme Council of Islamic Affairs (Majlis)",
  "Coopbank Alhuda",
  "DX Valley",
  "Fayda",
  "EthSwitch",
];

export function PartnersSponsors() {
  return (
    <section className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-8 py-20">
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

        <div className="relative mx-auto mt-12 w-full max-w-6xl rounded-3xl border border-black/5 bg-white p-2 shadow-xl shadow-black/5">
          <div className="flex gap-3 overflow-x-auto rounded-2xl border border-black/5 p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
              <div
                key={`${partner}-${idx}`}
                className="min-w-[240px] shrink-0 rounded-xl border border-black/10 bg-black/2 px-5 py-4 text-center"
                style={{ color: "#8A8A8A", filter: "grayscale(100%)" }}
              >
                <span className="text-sm font-medium">{partner}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
