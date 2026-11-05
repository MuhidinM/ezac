"use client";

import type * as React from "react";
import Link from "next/link";
import { Globe, LifeBuoy } from "lucide-react";

import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";
import { NAV_SECTIONS, canSee } from "@/components/dashboard/nav-config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarGroup,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { fetchSession, useSession } from "@/lib/auth/use-session";

const SECONDARY_ITEMS = [
  { title: "Help & FAQ", url: "/faq", icon: LifeBuoy },
  { title: "Public website", url: "/", icon: Globe },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { session, isLoading, unavailable } = useSession();
  const isBranch = session?.isBranch ?? false;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link href={isBranch ? "/dashboard/branch" : "/dashboard"}>
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-white shadow-xs ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- brand mark served as a static asset */}
                  <img src="/logo.svg" alt="" className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold tracking-tight text-[#001539]">
                    EZAC
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {isBranch ? "Branch portal" : "Operations console"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          // The menu depends on the roles; showing a guess first makes items flash in and out.
          <SidebarGroup>
            <SidebarMenu className="gap-0.5">
              {Array.from({ length: 6 }, (_, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : !session && unavailable ? (
          // Offline or the sign-in service is down: not the same as having no access.
          <div className="space-y-2 px-4 py-3 text-sm text-sidebar-foreground/70" role="status">
            <p>We couldn&apos;t load your account. Check your connection; we&apos;ll keep trying.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchSession({ force: true })}>
              Try again
            </Button>
          </div>
        ) : !session ? (
          // Signed in, but the account has no portal role.
          <p className="px-4 py-3 text-sm text-sidebar-foreground/70">
            Your account has no access to the staff portal. Ask an administrator to assign a role.
          </p>
        ) : (
          NAV_SECTIONS.map((section) => (
            <NavMain
              key={section.label}
              label={section.label}
              items={section.items.filter((item) => canSee(item.audience, session))}
            />
          ))
        )}
        <NavSecondary items={SECONDARY_ITEMS} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
