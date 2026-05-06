const IMPACT_DOTS = [
  { id: "addis", top: "52%", left: "52%", label: "Addis Ababa" },
  { id: "bahirdar", top: "28%", left: "40%", label: "Bahir Dar" },
  { id: "mekelle", top: "14%", left: "56%", label: "Mekelle" },
  { id: "jigjiga", top: "34%", left: "76%", label: "Jigjiga" },
  { id: "adama", top: "56%", left: "61%", label: "Adama" },
  { id: "hawassa", top: "70%", left: "56%", label: "Hawassa" },
  { id: "jimma", top: "62%", left: "39%", label: "Jimma" },
];

export function ImpactMapTeaser() {
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
            className="relative overflow-hidden rounded-2xl border border-black/5 p-8 sm:p-10"
            style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
          >
            <div className="mx-auto aspect-5/3 w-full max-w-4xl">
              <svg
                viewBox="0 0 640 380"
                className="h-full w-full"
                role="img"
                aria-label="Stylized map of Ethiopia with distributed fund points"
              >
                <path
                  d="M292 25l54 29 45 8 43 38-5 37 32 41-25 59-48 12-21 42-38 19-48-8-32 11-44-16-13-31-46-21-8-50 33-40-10-43 25-39 44-16 34-33z"
                  fill="rgba(0,0,0,0.06)"
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {IMPACT_DOTS.map((dot) => (
              <div
                key={dot.id}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: dot.top, left: dot.left }}
              >
                <div className="relative h-3 w-3 rounded-full bg-black">
                  <span className="absolute inset-0 rounded-full bg-black/50 animate-ping" />
                </div>
                <span
                  className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: "#6F6F6F" }}
                >
                  {dot.label}
                </span>
              </div>
            ))}
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
