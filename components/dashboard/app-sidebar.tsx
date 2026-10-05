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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth/use-session";

const SECONDARY_ITEMS = [
  { title: "Help & FAQ", url: "/faq", icon: LifeBuoy },
  { title: "Public website", url: "/", icon: Globe },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { session } = useSession();
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
        {NAV_SECTIONS.map((section) => (
          <NavMain
            key={section.label}
            label={section.label}
            items={section.items.filter((item) => canSee(item.audience, session))}
          />
        ))}
        <NavSecondary items={SECONDARY_ITEMS} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
