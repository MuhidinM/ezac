import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { isPastLastPage, listPath, pageFromParam } from "@/components/site/list-page";
import { Pagination } from "@/components/site/pagination";
import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { mediaSrc } from "@/lib/zakat/content";
import { formatDate, getStories } from "@/lib/zakat/impact";

const PATH = "/transparency/stories";
/** Stories per page: fills the 1-, 2- and 3-column grids evenly. */
const PAGE_SIZE = 24;

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[lang]/transparency/stories">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const page = pageFromParam((await searchParams).page);
  const { transparency, common } = await getDictionary(locale);
  const { meta } = transparency.stories;
  return pageMetadata({
    locale,
    path: listPath(PATH, page),
    ...meta,
    title: page > 1 ? format(common.pagination.pageTitle, { title: meta.title, page }) : meta.title,
  });
}

export default async function ImpactStoriesPage({ params, searchParams }: PageProps<"/[lang]/transparency/stories">) {
  const locale = localeFromParam((await params).lang);
  const page = pageFromParam((await searchParams).page);
  const { transparency, common } = await getDictionary(locale);
  const t = transparency.stories;
  const categories: Record<string, string> = transparency.categories;
  // null means none published. The list is cached (lib/zakat/impact.ts): an
  // outage keeps the last good copy, and with none cached shows the error page.
  const result = await getStories(page, PAGE_SIZE);
  const stories = result?.items ?? [];
  const totalPages = result?.pagination.totalPages ?? 0;
  if (isPastLastPage(page, totalPages)) notFound();

  return (
    <SitePage {...t.header}>
      <Section>
        {stories.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm text-muted-ink">
            {t.empty}
          </p>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {stories.map((story) => {
              const image = mediaSrc(story.imageUrl);
              const published = formatDate(story.publishedAt, locale);
              return (
                <article
                  key={story.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xl shadow-black/5 has-focus-visible:ring-2 has-focus-visible:ring-brand has-focus-visible:ring-offset-2"
                >
                  <div className="aspect-16/10 w-full overflow-hidden bg-brand/[0.06]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- served by the zakat service via /bff/media
                      <img
                        src={image}
                        alt={format(t.imageAlt, { title: story.title })}
                        width={1600}
                        height={1000}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <p className="text-xs tracking-[0.14em] text-brand uppercase">
                      {[categories[story.category] ?? story.category, story.region].filter(Boolean).join(" · ")}
                    </p>
                    <h2 className="font-serif-display line-clamp-2 text-xl leading-tight tracking-[-0.5px] text-navy sm:text-2xl">
                      <Link
                        href={localizedPath(locale, `/transparency/stories/${encodeURIComponent(story.id)}`)}
                        title={format(t.readTitle, { title: story.title })}
                        className="outline-none after:absolute after:inset-0"
                      >
                        {story.title}
                      </Link>
                    </h2>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-ink">{story.summary}</p>
                    {published ? (
                      <p className="mt-auto text-xs text-muted-ink">
                        <time dateTime={story.publishedAt?.slice(0, 10)}>{published}</time>
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <Pagination locale={locale} t={common.pagination} path={PATH} page={page} totalPages={totalPages} />
      </Section>
      <CtaBand
        title={t.cta.title}
        body={t.cta.body}
        primary={{ label: t.cta.primary, href: "/zakat/pay", title: t.cta.primaryTitle }}
        secondary={{ label: t.cta.secondary, href: "/transparency/dashboard", title: t.cta.secondaryTitle }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: transparency.breadcrumbs.home, path: "/" },
          { name: transparency.breadcrumbs.stories, path: PATH },
        ])}
      />
    </SitePage>
  );
}
