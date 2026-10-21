import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { categoryLabel, mediaSrc } from "@/lib/zakat/content";
import { getStory } from "@/lib/zakat/impact";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const story = await getStory(id);
  return story ? { title: `${story.title} — EZAC`, description: story.summary } : { title: "Impact story — EZAC" };
}

export default async function ImpactStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();
  const image = mediaSrc(story.imageUrl);

  return (
    <SitePage eyebrow={[categoryLabel(story.category), story.region].filter(Boolean).join(" · ")} title={story.title} intro={story.summary}>
      <Section>
        <article className="mx-auto max-w-3xl space-y-8">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /bff/media
            <img src={image} alt="" className="aspect-16/9 w-full rounded-3xl object-cover" />
          ) : null}
          {/* Plain text from the admin; line breaks kept, never rendered as HTML. */}
          <p className="text-base leading-relaxed whitespace-pre-line sm:text-lg" style={{ color: "#3d3d3d" }}>
            {story.body}
          </p>
          {story.publishedAt ? (
            <p className="text-xs" style={{ color: "#6F6F6F" }}>
              Published {new Date(`${story.publishedAt.slice(0, 10)}T00:00:00`).toLocaleDateString("en", { dateStyle: "long" })}
            </p>
          ) : null}
        </article>
      </Section>
      <CtaBand
        title="More stories of impact"
        body="See what Zakat is changing across Ethiopia."
        primary={{ label: "All stories", href: "/transparency/stories" }}
        secondary={{ label: "Pay Zakat now", href: "/zakat/pay" }}
      />
    </SitePage>
  );
}
