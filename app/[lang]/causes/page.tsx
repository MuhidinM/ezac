import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { CauseCard } from "@/components/site/cause-card";
import { CtaBand, Section } from "@/components/site/sections";
import { SitePage } from "@/components/site/site-page";
import { localizedPath } from "@/lib/i18n/config";
import { getDictionary, localeFromParam } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getCauses } from "@/lib/zakat/impact";

const PATH = "/causes";

// Causes come from zakat-engine and refresh every 5 minutes.
export const revalidate = 300;

type Status = "active" | "closed";

function statusFrom(raw: string | string[] | undefined): Status {
  return raw === "closed" ? "closed" : "active";
}

function statusPath(status: Status) {
  return status === "closed" ? `${PATH}?status=closed` : PATH;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/causes">): Promise<Metadata> {
  const locale = localeFromParam((await params).lang);
  const status = statusFrom((await searchParams).status);
  const { giving } = await getDictionary(locale);
  const { meta } = giving.causes;
  return pageMetadata({
    locale,
    path: statusPath(status),
    title: status === "closed" ? meta.closedTitle : meta.title,
    description: status === "closed" ? meta.closedDescription : meta.description,
    keywords: meta.keywords,
  });
}

export default async function CausesPage({ params, searchParams }: PageProps<"/[lang]/causes">) {
  const locale = localeFromParam((await params).lang);
  const status = statusFrom((await searchParams).status);
  const { giving } = await getDictionary(locale);
  const t = giving.causes;
  // null means none published. An outage throws and shows the error page
  // (this page reads searchParams, so it renders per request, not from ISR).
  const causes = (await getCauses({ status, limit: 48 }))?.items ?? [];
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
            </p>
          ) : (
            <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {causes.map((cause) => (
                <CauseCard key={cause.id} cause={cause} locale={locale} closed={status === "closed"} />
              ))}
            </div>
          )}
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
