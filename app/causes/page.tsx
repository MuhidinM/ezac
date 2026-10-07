import type { Metadata } from "next";
import Link from "next/link";

import { CauseCard } from "@/components/site/cause-card";
import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { getCauses } from "@/lib/zakat/impact";

export const metadata: Metadata = {
  title: "Causes — EZAC",
  description: "Verified causes across Ethiopia that your Zakat supports, with transparent progress toward every goal.",
};

// Causes come from zakat-engine and refresh every 5 minutes.
export const revalidate = 300;

export default async function CausesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = raw === "closed" ? "closed" : "active";
  const causes = (await getCauses({ status, limit: 48 }))?.items ?? [];

  return (
    <SitePage
      eyebrow="Zakat"
      title="Causes"
      accent="you can support"
      intro="Every cause is reviewed before it's listed. Urgent needs come first; each shows how much has been raised so far."
    >
      <Section>
        <nav className="flex justify-center gap-2" aria-label="Cause status">
          {(
            [
              ["active", "Open now"],
              ["closed", "Completed"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              href={value === "active" ? "/causes" : "/causes?status=closed"}
              aria-current={status === value ? "page" : undefined}
              className="rounded-full border px-4 py-2 text-sm transition"
              style={
                status === value
                  ? { backgroundColor: "#001539", borderColor: "#001539", color: "#FFFFFF" }
                  : { borderColor: "rgba(0,0,0,0.12)", color: "#001539" }
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        {causes.length === 0 ? (
          <p className="mx-auto mt-12 max-w-xl rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm" style={{ color: "#6F6F6F" }}>
            {status === "active" ? "No causes are open right now. Your Zakat still reaches families through the general fund." : "No completed causes yet."}
          </p>
        ) : (
          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {causes.map((cause) => (
              <CauseCard key={cause.id} cause={cause} closed={status === "closed"} />
            ))}
          </div>
        )}
      </Section>
      <CtaBand
        title="Not sure where to give?"
        body="The general Zakat fund reaches verified families wherever the need is greatest."
        primary={{ label: "Pay Zakat now", href: "/zakat/pay" }}
        secondary={{ label: "See our impact", href: "/transparency/dashboard" }}
      />
    </SitePage>
  );
}
