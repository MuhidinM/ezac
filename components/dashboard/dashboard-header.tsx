"use client";

import { Fragment, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SEGMENT_LABELS, SECTION_SEGMENT_LABELS, UNLINKED_SEGMENTS } from "@/components/dashboard/nav-config";
import { useSession } from "@/lib/auth/use-session";
import { useFallbackPageTitle } from "@/lib/hooks/use-page-title";

// A detail page can name its own crumb (the record's name) instead of "Details".
type PageLabel = { pathname: string; label: string } | null;
let pageLabel: PageLabel = null;
const listeners = new Set<() => void>();

function setPageLabel(next: PageLabel) {
  pageLabel = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Show `label` (e.g. the branch name) as the breadcrumb for `href` while this
 * page is open. `href` defaults to this page, so the last crumb is named; a
 * sub-page (an assessment's edit page, say) passes its record's path instead.
 */
export function useBreadcrumbLabel(label: string | null | undefined, href?: string) {
  const pathname = usePathname();
  const target = href ?? pathname;
  const text = label?.trim() || null;

  useEffect(() => {
    if (!text) return;
    setPageLabel({ pathname: target, label: text });
    return () => {
      if (pageLabel?.pathname === target && pageLabel.label === text) setPageLabel(null);
    };
  }, [target, text]);
}

/**
 * Crumbs that would lead back to a step already done. The registration form
 * before "Set password" opens blank, so going back to it can register the
 * same household twice.
 */
function isUnlinked(href: string, pathname: string) {
  if (UNLINKED_SEGMENTS.has(href)) return true;
  return /^\/dashboard\/register\/(manual|institution)$/.test(href) && pathname.startsWith(`${href}/`);
}

function formatSegment(segment: string, parent: string | undefined) {
  const scoped = parent ? SECTION_SEGMENT_LABELS[`${parent}/${segment}`] : undefined;
  if (scoped) return scoped;
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // Record ids (uuid / numeric) read as a detail view.
  if (/^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment)) return "Details";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardHeader() {
  const pathname = usePathname();
  const { session } = useSession();
  const named = useSyncExternalStore(subscribe, () => pageLabel, () => null);

  const homeHref = session?.isBranch ? "/dashboard/branch" : "/dashboard";
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs = segments.map((segment, index) => {
    const href = `/dashboard/${segments.slice(0, index + 1).join("/")}`;
    return {
      label: named && named.pathname === href ? named.label : formatSegment(segment, segments[index - 1]),
      href,
      // Section folders without a page of their own (e.g. Zakat) and finished
      // registration steps aren't links.
      linked: !isUnlinked(href, pathname),
    };
  });

  // The tab title when the page sets none (PageHeader does): the last crumb,
  // with its parent when the crumb alone says little ("Edit · Amina Yusuf").
  const last = crumbs[crumbs.length - 1];
  const parent = crumbs[crumbs.length - 2];
  const generic = last?.label === "Details" || last?.label === "Edit";
  useFallbackPageTitle(!last ? "Overview" : generic && parent ? `${last.label} · ${parent.label}` : last.label);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-black/[0.06] bg-(--dashboard-canvas)/85 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1.5 text-muted-foreground hover:text-navy" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className={crumbs.length > 0 ? "hidden md:block" : undefined}>
            {crumbs.length > 0 ? (
              <BreadcrumbLink asChild>
                <Link href={homeHref}>Dashboard</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="font-medium text-navy">Overview</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <Fragment key={crumb.href}>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className={isLast ? "min-w-0" : "hidden md:block"}>
                  {isLast ? (
                    <BreadcrumbPage className="truncate font-medium text-navy">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : crumb.linked ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
