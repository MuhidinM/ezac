import Link from "next/link";

import { CauseCard } from "@/components/site/cause-card";
import { getCauses } from "@/lib/zakat/impact";

/**
 * Featured causes from zakat-engine: urgent ones first, else the newest
 * active ones. Only real, published causes are shown: when the service can't
 * be reached the section is left out, and when nothing is open it says so.
 */
export async function FeaturedCauses() {
  const urgent = await getCauses({ urgent: true, limit: 6 });
  const page = urgent?.items.length ? urgent : await getCauses({ limit: 6 });
  if (!page) return null;
  const causes = page.items;

  return (
    <section className="relative z-10 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: "#6F6F6F" }}>
            {causes.length > 0 ? "Urgent needs" : "Causes"}
          </p>
          <h2
            className="font-serif-display mt-3 text-4xl sm:text-5xl md:text-6xl"
            style={{ color: "#001539", lineHeight: 1, letterSpacing: "-1.8px" }}
          >
            Causes your{" "}
            <span className="italic" style={{ color: "#e18f35" }}>
              Zakat
            </span>{" "}
            reaches.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "#6F6F6F" }}>
            {causes.length > 0
              ? "Verified projects across Ethiopia, each with transparent progress toward its goal."
              : "No causes are open right now. New causes appear here as soon as the Commission publishes them."}
          </p>
        </div>

        {causes.length > 0 ? (
          <>
            <div className="mx-auto mt-12 grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {causes.slice(0, 3).map((cause) => (
                <CauseCard key={cause.id} cause={cause} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/causes" className="text-sm font-medium underline underline-offset-4" style={{ color: "#007050" }}>
                See all causes
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-8 text-center">
            <Link
              href="/how-it-works#receiving"
              className="text-sm font-medium underline underline-offset-4"
              style={{ color: "#007050" }}
            >
              How Zakat reaches families
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
