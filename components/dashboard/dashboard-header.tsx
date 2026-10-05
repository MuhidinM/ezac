"use client";

import { Fragment } from "react";
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
import { SEGMENT_LABELS } from "@/components/dashboard/nav-config";
import { useSession } from "@/lib/auth/use-session";

function formatSegment(segment: string) {
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

  const homeHref = session?.isBranch ? "/dashboard/branch" : "/dashboard";
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: `/dashboard/${segments.slice(0, index + 1).join("/")}`,
  }));

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
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
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
