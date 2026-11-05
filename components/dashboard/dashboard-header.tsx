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

/** Show `label` (e.g. the branch name) as the last breadcrumb while this page is open. */
export function useBreadcrumbLabel(label: string | null | undefined) {
  const pathname = usePathname();
  const text = label?.trim() || null;

  useEffect(() => {
    if (!text) return;
    setPageLabel({ pathname, label: text });
    return () => {
      if (pageLabel?.pathname === pathname && pageLabel.label === text) setPageLabel(null);
    };
  }, [pathname, text]);
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
      // Section folders without a page of their own (e.g. Zakat) aren't links.
      linked: !UNLINKED_SEGMENTS.has(href),
    };
  });

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-black/[0.06] bg-(--dashboard-canvas)/85 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1.5 text-muted-foreground hover:text-[#001539]" />
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
              <BreadcrumbPage className="font-medium text-[#001539]">Overview</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <Fragment key={crumb.href}>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className={isLast ? "min-w-0" : "hidden md:block"}>
                  {isLast ? (
                    <BreadcrumbPage className="truncate font-medium text-[#001539]">
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
