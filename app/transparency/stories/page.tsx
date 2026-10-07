import type { Metadata } from "next";
import Link from "next/link";

import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { categoryLabel, mediaSrc } from "@/lib/zakat/content";
import { getStories } from "@/lib/zakat/impact";

export const metadata: Metadata = {
  title: "Impact Stories — EZAC",
  description: "Stories from the families and communities your Zakat has reached, shared with their consent.",
};

export const revalidate = 300;

export default async function ImpactStoriesPage() {
  const stories = (await getStories(1, 48))?.items ?? [];

  return (
    <SitePage
      eyebrow="Transparency & Impact"
      title="Impact"
      accent="stories"
      intro="What Zakat changes, in the words of the communities it reaches. Every story is shared with the family's consent."
    >
      <Section>
        {stories.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm" style={{ color: "#6F6F6F" }}>
            No stories have been published yet.
          </p>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {stories.map((story) => {
              const image = mediaSrc(story.imageUrl);
              return (
                <article key={story.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xl shadow-black/5">
                  <div className="aspect-16/10 w-full overflow-hidden bg-[#007050]/[0.06]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /api/media
                      <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <p className="text-[10px] tracking-[0.14em] uppercase" style={{ color: "#007050" }}>
                      {[categoryLabel(story.category), story.region].filter(Boolean).join(" · ")}
                    </p>
                    <h2 className="font-serif-display text-xl leading-tight sm:text-2xl" style={{ color: "#001539", letterSpacing: "-0.5px" }}>
                      <Link href={`/transparency/stories/${encodeURIComponent(story.id)}`} className="after:absolute after:inset-0">
                        {story.title}
                      </Link>
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: "#6F6F6F" }}>
                      {story.summary}
                    </p>
                    {story.publishedAt ? (
                      <p className="mt-auto text-xs" style={{ color: "#6F6F6F" }}>
                        {new Date(`${story.publishedAt.slice(0, 10)}T00:00:00`).toLocaleDateString("en", { dateStyle: "medium" })}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>
      <CtaBand
        title="Be part of the next story"
        body="Your Zakat reaches verified families across Ethiopia."
        primary={{ label: "Pay Zakat now", href: "/zakat/pay" }}
        secondary={{ label: "See the numbers", href: "/transparency/dashboard" }}
      />
    </SitePage>
  );
}
