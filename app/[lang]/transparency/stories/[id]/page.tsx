import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { foreignLang, imageSources, mediaSrc } from "@/lib/zakat/content";
import { formatDate, getStory } from "@/lib/zakat/impact";

export const revalidate = 300;

const storyPath = (id: string) => `/transparency/stories/${encodeURIComponent(id)}`;

/** The photo spans the max-w-3xl article column. */
const IMAGE_SIZES = "(min-width: 768px) 768px, 100vw";

export async function generateMetadata({ params }: PageProps<"/[lang]/transparency/stories/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const locale = localeFromParam(lang);
  const { transparency } = await getDictionary(locale);
  // getStory is cached per render, so the page below reuses this request.
  const story = await getStory(id, locale);
  if (!story) return { title: transparency.story.meta.fallbackTitle };
  const category = (transparency.categories as Record<string, string>)[story.category];
  return pageMetadata({
    locale,
    path: storyPath(story.id),
    title: story.title,
    description: story.summary,
    keywords: [category, story.region, transparency.story.meta.keywords].filter(Boolean).join(", "),
    image: mediaSrc(story.imageUrl),
    imageAlt: story.imageAltText || format(transparency.stories.imageAlt, { title: story.title }),
    type: "article",
    publishedTime: story.publishedAt,
    modifiedTime: story.updatedAt,
  });
}

export default async function ImpactStoryPage({ params }: PageProps<"/[lang]/transparency/stories/[id]">) {
  const { lang, id } = await params;
  const locale = localeFromParam(lang);
  const { transparency } = await getDictionary(locale);
  const t = transparency.story;
  // getStory throws when the zakat service is unavailable (the error page
  // offers Try again), so null here really means "no such public story".
  const story = await getStory(id, locale);
  if (!story) notFound();
  const image = imageSources(story.imageUrl, story.imageVariants);
  const imageAlt = story.imageAltText || format(transparency.stories.imageAlt, { title: story.title });
  const textLang = foreignLang(story.lang, locale);
  const categories: Record<string, string> = transparency.categories;
  const published = formatDate(story.publishedAt, locale, "long");
  const path = storyPath(story.id);

  return (
    <SitePage
      eyebrow={[categories[story.category] ?? story.category, story.region].filter(Boolean).join(" · ")}
      title={story.title}
      intro={story.summary}
      lang={textLang}
    >
      <Section>
        <article className="mx-auto max-w-3xl space-y-8">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /bff/media
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.srcSet ? IMAGE_SIZES : undefined}
              alt={imageAlt}
              width={1600}
              height={900}
              decoding="async"
              className="aspect-16/9 w-full rounded-3xl object-cover"
            />
          ) : null}
          {/* Plain text from the admin; line breaks kept, never rendered as HTML. */}
          <p lang={textLang} className="text-base leading-relaxed whitespace-pre-line text-[#3d3d3d] sm:text-lg">
            {story.body}
          </p>
          {published ? (
            <p className="text-xs text-muted-ink">
              <time dateTime={story.publishedAt?.slice(0, 10)}>{format(t.published, { date: published })}</time>
            </p>
          ) : null}
        </article>
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/transparency/stories", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/zakat/pay", title: t.cta.secondaryTitle }}
      />
      <JsonLd
        data={[
          articleJsonLd({
            locale,
            path,
            headline: story.title,
            description: story.summary,
            image: image?.src,
            datePublished: story.publishedAt,
            dateModified: story.updatedAt,
            inLanguage: textLang,
          }),
          breadcrumbJsonLd(locale, [
            { name: transparency.breadcrumbs.home, path: "/" },
            { name: transparency.breadcrumbs.stories, path: "/transparency/stories" },
            { name: story.title, path },
          ]),
        ]}
      />
    </SitePage>
  );
}
