import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { INTL_LOCALE, type Locale, localizedPath } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/messages";

import { listPath } from "./list-page";

type Strings = Dictionary["common"]["pagination"];

const LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-black/12 px-4 py-2 text-sm text-navy transition hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

/**
 * Previous / next links and "Page 2 of 5" under a public list. Nothing when
 * the whole list fits on one page. `params` are the list's other query
 * parameters (the causes status filter), kept on every link.
 */
export function Pagination({
  locale,
  t,
  path,
  page,
  totalPages,
  params,
}: {
  locale: Locale;
  t: Strings;
  path: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const number = new Intl.NumberFormat(INTL_LOCALE[locale]);
  const href = (target: number) => localizedPath(locale, listPath(path, target, params));
  const previous = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav aria-label={t.label} className="mt-12 flex flex-wrap items-center justify-center gap-3">
      {previous ? (
        <Link
          href={href(previous)}
          rel="prev"
          title={format(t.goTo, { page: number.format(previous) })}
          className={LINK_CLASS}
        >
          <ChevronLeftIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {t.previous}
        </Link>
      ) : null}
      <p className="px-2 text-sm text-muted-ink">
        {format(t.status, { page: number.format(page), pages: number.format(totalPages) })}
      </p>
      {next ? (
        <Link href={href(next)} rel="next" title={format(t.goTo, { page: number.format(next) })} className={LINK_CLASS}>
          {t.next}
          <ChevronRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
