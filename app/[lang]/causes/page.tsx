import type { Metadata } from "next";
import Link from "next/link";

import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { CauseCard } from "@/components/site/cause-card";
import { isPastLastPage, listPath, pageFromParam } from "@/components/site/list-page";
import { Pagination } from "@/components/site/pagination";
import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/messages";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getCauses } from "@/lib/zakat/impact";

const PATH = "/causes";
/** Causes per page: fills the 1-, 2- and 3-column grids evenly. */
const PAGE_SIZE = 24;

// Causes come from zakat-engine and refresh every 5 minutes.
export const revalidate = 300;

type Status = "active" | "closed";

function statusFrom(raw: string | string[] | undefined): Status {
  return raw === "closed" ? "closed" : "active";
}

/** The status filter as a query parameter; the active list is the bare path. */
const statusParam = (status: Status) => ({ status: status === "closed" ? "closed" : undefined });

function statusPath(status: Status, page = 1) {
  return listPath(PATH, page, statusParam(status));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/causes">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const query = await searchParams;
  const status = statusFrom(query.status);
  const page = pageFromParam(query.page);
  const { giving, common } = await getDictionary(locale);
  const { meta } = giving.causes;
  const title = status === "closed" ? meta.closedTitle : meta.title;
  return pageMetadata({
    locale,
    path: statusPath(status, page),
    title: page > 1 ? format(common.pagination.pageTitle, { title, page }) : title,
    description: status === "closed" ? meta.closedDescription : meta.description,
    keywords: meta.keywords,
  });
}

export default async function CausesPage({ params, searchParams }: PageProps<"/[lang]/causes">) {
  const locale = localeFromParam((await params).lang);
  const query = await searchParams;
  const status = statusFrom(query.status);
  const page = pageFromParam(query.page);
  const { giving, common } = await getDictionary(locale);
  const t = giving.causes;
  // null means none published. This page reads searchParams, so it renders per
  // request; the data itself is cached (lib/zakat/impact.ts), and an outage
  // with nothing cached shows the error page.
  const result = await getCauses({ status, page, limit: PAGE_SIZE, locale });
  const causes = result?.items ?? [];
  const totalPages = result?.pagination.totalPages ?? 0;
  // A page past the end (an old link after causes closed) is not a page.
  if (isPastLastPage(page, totalPages)) notFound();
  // Nothing open: point to the completed causes so the page is never a dead end.
  const closedCount =
    status === "active" && causes.length === 0
      ? ((await getCauses({ status: "closed", page: 1, limit: 1 }).catch(() => null))?.pagination.totalItems ?? 0)
      : 0;
  const primary = { label: t.cta.primary, href: localizedPath(locale, "/zakat/pay"), title: t.cta.primaryTitle };
  const secondary = {
    label: t.cta.secondary,
    href: localizedPath(locale, "/transparency/dashboard"),
    title: t.cta.secondaryTitle,
  };
  const filters = [
    { value: "active", label: t.filter.active, title: t.filter.activeTitle },
    { value: "closed", label: t.filter.closed, title: t.filter.closedTitle },
  ] as const;

  return (
    <>
      <SitePage eyebrow={t.hero.eyebrow} title={t.hero.title} accent={t.hero.accent} intro={t.hero.intro}>
        <Section>
          <nav className="flex justify-center gap-2" aria-label={t.filter.label}>
            {filters.map((filter) => (
              <Link
                key={filter.value}
                href={localizedPath(locale, statusPath(filter.value))}
                title={filter.title}
                aria-current={status === filter.value ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  status === filter.value
                    ? "border-navy bg-navy text-white"
                    : "border-black/12 text-navy hover:border-navy"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </nav>

          <h2 className="sr-only">{status === "active" ? t.listHeading.active : t.listHeading.closed}</h2>
          {causes.length === 0 ? (
            <p className="mx-auto mt-12 max-w-xl rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm text-muted-ink">
              {status === "active" ? t.empty.active : t.empty.closed}
              {closedCount > 0 ? (
                <Link
                  href={localizedPath(locale, statusPath("closed"))}
                  title={t.filter.seeClosed.title}
                  className="mt-4 block font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {format(t.filter.seeClosed.label, { count: closedCount })}
                </Link>
              ) : null}
            </p>
          ) : (
            <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {causes.map((cause) => (
                <CauseCard key={cause.id} cause={cause} locale={locale} closed={status === "closed"} />
              ))}
            </div>
          )}
          <Pagination
            locale={locale}
            t={common.pagination}
            path={PATH}
            page={page}
            totalPages={totalPages}
            params={statusParam(status)}
          />
        </Section>
        <CtaBand title={t.cta.title} body={t.cta.body} primary={primary} secondary={secondary} />
      </SitePage>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: giving.breadcrumbs.home, path: "/" },
          { name: t.breadcrumb, path: PATH },
        ])}
      />
    </>
  );
}
