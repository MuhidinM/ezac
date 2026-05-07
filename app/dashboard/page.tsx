export default function DashboardHomePage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif-display text-4xl tracking-tight text-black">Overview</h1>
      <p className="max-w-2xl text-black/65">
        Welcome to your dashboard. This area is now routed with a shared layout,
        so the top navigation and sidebar remain fixed while only page content changes.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["Total Donations", "Active Waqf Projects", "Pending Reports"].map((label) => (
          <article
            key={label}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-black/5"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-black/45">{label}</p>
            <p className="mt-3 text-2xl font-medium text-black">--</p>
          </article>
        ))}
      </div>
    </section>
  );
}
